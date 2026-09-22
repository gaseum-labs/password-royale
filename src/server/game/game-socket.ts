import {
	advanceMessage,
	banMessage,
	ClientMessageDefinition,
	clientMessageSchema,
	establishMessage,
	fetchGamesMessage,
	GameHeader,
	joinMessage,
	kickMessage,
	leaveMessage,
	MODIFIES_GAME,
	newGameMessage,
	ServerMessage,
	submitMessage,
} from '../../shared/api.js';
import {
	parseCookieHeader,
	verifyAuthCookieValue,
} from '../auth/auth-cookie.js';
import { COOKIE_NAME } from '../variables.js';
import { WebSocket } from 'ws';
import {
	codeToGame,
	Connection,
	games,
	InternalGame,
	InternalPlayer,
	InternalUser,
	userMap,
} from './game-registry.js';
import {
	advanceGame,
	canAdvance,
	canBoot,
	canCreateNewGame,
	canJoinGame,
	canSubmit,
	createGame,
	getGame,
	getGamePlayer,
	joinGame,
	leaveGame,
	receiveSubmission,
	resetGame,
	toAPIGame,
	bootPlayer,
	getAllGameHeaders,
} from './game-state.js';
import { Database } from '../database/index.js';
import crypto from 'node:crypto';
import { IncomingMessage } from 'node:http';

export class RequestError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'RequestError';
	}
}

export const getUser = (snowflake: string): InternalUser => {
	return userMap.getOrSet(snowflake, () => {
		let databaseUser = Database.getUser(snowflake);
		if (databaseUser == null) {
			databaseUser = {
				avatarPath: null,
				snowflake,
				username: `Rando${crypto.randomInt(1, 50)}`,
				isAdmin: false,
			};
			Database.upsertUser(databaseUser);
		}
		return {
			...databaseUser,
			connections: [],
		};
	});
};

export const cleanupUser = (user: InternalUser) => {
	if (user.connections.isEmpty()) {
		userMap.delete(user.snowflake);
	}
};

const attachConnection = (user: InternalUser, connection: Connection) => {
	user.connections.push(connection);
};

const removeConnection = (user: InternalUser, connection: Connection) => {
	user.connections.remove(connection);
	cleanupUser(user);
};

const sendMessage = (webSocket: WebSocket, message: ServerMessage) => {
	webSocket.send(JSON.stringify(message));
};

const dirtyConnections = new Set<Connection>();

const removeConnectionGame = (user: InternalUser, game: InternalGame) => {
	for (const connection of user.connections) {
		if (connection.game === game) {
			connection.game = null;
			dirtyConnections.add(connection);
		}
	}
};

export const onConnection = (
	webSocket: WebSocket,
	request: IncomingMessage,
) => {
	let isAlive: boolean = true;

	const userSnowflake = verifyUserSnowflake(request.headers.cookie);
	if (userSnowflake == null) {
		webSocket.close(1008, 'Unauthorized');
		return;
	}
	const user = getUser(userSnowflake);

	const connection: Connection = {
		webSocket,
		game: null,
		user,
	};
	user.connections.push(connection);

	webSocket.on('message', data => {
		let jsonData: unknown;
		try {
			const stringData = data.toString('utf-8');
			jsonData = JSON.parse(stringData);
		} catch {
			return webSocket.close(1007);
		}

		const parseResult = clientMessageSchema.safeParse(jsonData);
		if (!parseResult.success) {
			return webSocket.close(1003);
		}

		const { type, payload, requestId } = parseResult.data;

		const [message, handler] = messageHandlers.get(type) ?? [];

		const beforeGame = connection.game ?? undefined;

		let errorMessage: string | undefined = undefined;
		let result: any | undefined = undefined;
		const params = {
			payload,
			user,
			connection,
			isReset: false,
		};
		if (handler == null) {
			errorMessage = `Invalid message type "${type}"`;
		} else {
			try {
				result = handler(params);
			} catch (error) {
				errorMessage =
					error instanceof Error ? error.message : String(error);
			}
		}

		const afterGame = connection.game ?? undefined;

		if (errorMessage != null) {
			sendMessage(webSocket, {
				type: 'error',
				requestId,
				errorMessage,
			});
		} else {
			if (message?.resultSchema === MODIFIES_GAME) {
				notifyGame({
					request: { user, requestId },
					games: [beforeGame, afterGame],
					dirtyConnections: [...dirtyConnections],
					isReset: params.isReset,
				});
			} else {
				sendMessage(connection.webSocket, {
					type: 'data',
					requestId,
					data: result,
				});
			}
		}

		dirtyConnections.clear();
	});

	webSocket.on('pong', () => {
		isAlive = true;
	});

	const interval = setInterval(() => {
		if (!isAlive) {
			return void webSocket.terminate();
		}
		isAlive = false;
		webSocket.ping();
	}, 30000);

	webSocket.on('close', () => {
		clearInterval(interval);
		removeConnection(user, connection);
	});

	attachConnection(user, connection);
};

export const notifyGame = ({
	request,
	games,
	dirtyConnections,
	isReset,
}: {
	request?:
		| {
				requestId: number;
				user: InternalUser;
		  }
		| undefined;
	games?: (InternalGame | undefined)[] | undefined;
	dirtyConnections?: Connection[];
	isReset: boolean;
}) => {
	const connections = new Set<Connection>();

	for (const connection of dirtyConnections ?? []) {
		connections.add(connection);
	}

	const gameSet = new Set(games?.filter(game => game != null) ?? []);
	for (const game of gameSet) {
		if (game == null) continue;
		for (const player of game.players) {
			const user = getUser(player.user.snowflake);
			for (const connection of user.connections) {
				if (connection.game === game) {
					connections.add(connection);
				}
			}
		}
	}

	for (const sendConnection of connections) {
		sendMessage(sendConnection.webSocket, {
			type: 'game',
			requestId:
				sendConnection.user === request?.user
					? request.requestId
					: undefined,
			game:
				sendConnection.game == null
					? null
					: toAPIGame(
							sendConnection.game,
							sendConnection.user,
							isReset,
						),
		});
	}
};

const getContext = (
	user: InternalUser,
	connection: Connection,
): { game: InternalGame; player: InternalPlayer } => {
	const { game } = connection;
	if (game == null) throw new RequestError('You are not in a game');

	const player = getGamePlayer(game, user.snowflake);
	if (player == null) throw new RequestError('You are not in this game');

	return { game, player };
};

type MessageHandlerFunc<Payload, Result> = (options: {
	payload: Payload;
	user: InternalUser;
	connection: Connection;
	isReset: boolean;
}) => Result;

const messageHandlers = new Map<
	string,
	[ClientMessageDefinition<any, any>, MessageHandlerFunc<any, any>]
>();

const registerMessageHandlerFunc = <Payload, Result>(
	message: ClientMessageDefinition<Payload, Result>,
	handler: MessageHandlerFunc<Payload, Result>,
): MessageHandlerFunc<Payload, Result> => {
	messageHandlers.set(message.type, [message, handler]);
	return handler;
};

registerMessageHandlerFunc(
	joinMessage,
	({ payload: { gameCode }, user, connection }) => {
		const game = getGame(gameCode);
		if (game == null) {
			throw new RequestError('That game does not exist');
		}
		canJoinGame(game, user);

		joinGame(game, user);

		connection.game = game;
	},
);

registerMessageHandlerFunc(leaveMessage, ({ user, connection }) => {
	const { player } = getContext(user, connection);

	leaveGame(player);
});

registerMessageHandlerFunc(establishMessage, ({ user, connection }) => {
	const game = createGame(user);

	connection.game = game;
});

registerMessageHandlerFunc(
	submitMessage,
	({ payload: { password }, user, connection }) => {
		const { game, player } = getContext(user, connection);

		canSubmit(game, player);

		receiveSubmission(game, player, password);
	},
);

registerMessageHandlerFunc(advanceMessage, ({ user, connection }) => {
	const { game, player } = getContext(user, connection);

	canAdvance(game, player);

	advanceGame(game);
});

registerMessageHandlerFunc(
	banMessage,
	({ payload: { userSnowflake }, user, connection }) => {
		const { game, player } = getContext(user, connection);

		canBoot(game, player);

		const bannedPlayer = getGamePlayer(
			game,
			getUser(userSnowflake).snowflake,
		);
		if (bannedPlayer == null)
			throw new RequestError('That player is not in the game');

		bootPlayer(game, bannedPlayer, true);

		removeConnectionGame(bannedPlayer.user, game);
	},
);

registerMessageHandlerFunc(
	kickMessage,
	({ payload: { userSnowflake }, user, connection }) => {
		const { game, player } = getContext(user, connection);

		canBoot(game, player);

		const kickedPlayer = getGamePlayer(
			game,
			getUser(userSnowflake).snowflake,
		);
		if (kickedPlayer == null)
			throw new RequestError('That player is not in the game');

		bootPlayer(game, kickedPlayer, false);

		removeConnectionGame(kickedPlayer.user, game);
	},
);

registerMessageHandlerFunc(newGameMessage, params => {
	const { game, player } = getContext(params.user, params.connection);

	canCreateNewGame(game, params.user);

	resetGame(game);

	params.isReset = true;
});

registerMessageHandlerFunc(fetchGamesMessage, ({ user }): GameHeader[] => {
	return getAllGameHeaders(user);
});

const verifyUserSnowflake = (
	cookieHeader: string | undefined,
): string | undefined => {
	if (cookieHeader == null) return undefined;
	const cookies = parseCookieHeader(cookieHeader);
	const authCookieValue = cookies[COOKIE_NAME];
	if (authCookieValue == null) return undefined;
	const session = verifyAuthCookieValue(authCookieValue);
	if (session == null) return undefined;
	return session.userSnowflake;
};

export const garbageCollectorLoop = () => {
	for (let i = 0; i < games.length; ++i) {
		const game = games[i];
		let isGood = false;
		superLoop: for (const player of game.players) {
			for (const connection of player.user.connections) {
				if (connection.game === game) {
					isGood = true;
					break superLoop;
				}
			}
		}
		if (!isGood) {
			games.splice(i, 1);
			--i;
			codeToGame.delete(game.code);
		}
	}
};
