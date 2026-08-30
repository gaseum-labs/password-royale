import {
	ClientMessage,
	ClientMessagePayloadOf,
	clientMessageSchema,
	ClientMessageType,
	ServerMessage,
} from '../../shared/api.js';
import {
	parseCookieHeader,
	verifyAuthCookieValue,
} from '../auth/auth-cookie.js';
import { COOKIE_NAME } from '../variables.js';
import { WebSocket, WebSocketServer } from 'ws';
import {
	InternalGame,
	InternalPlayer,
	userMap,
	UserState,
} from './game-registry.js';
import {
	advanceGame,
	banUser,
	canAdvance,
	canBan,
	canJoinGame,
	canSubmit,
	createGame,
	getGame,
	joinGame,
	leaveGame,
	receiveSubmission,
	toAPIGame,
} from './game-state.js';
import { Database } from '../database/index.js';
import crypto from 'node:crypto';
import { IncomingMessage } from 'node:http';

export const getUserState = (snowflake: string): UserState => {
	return userMap.getOrSet(snowflake, () => {
		let user = Database.getUser(snowflake);
		if (user == null) {
			user = {
				avatarUrl: null,
				snowflake,
				username: `Rando${crypto.randomInt(1, 50)}`,
			};
			Database.upsertUser(user);
		}
		return {
			user,
			webSockets: [],
			player: undefined,
		};
	});
};

export const cleanupUserState = (userState: UserState) => {
	if (userState.webSockets.length === 0 && userState.player == null) {
		userMap.delete(userState.user.snowflake);
	}
};

const attachSocket = (userState: UserState, webSocket: WebSocket) => {
	userState.webSockets.push(webSocket);
};

const removeSocket = (userState: UserState, webSocket: WebSocket) => {
	userState.webSockets.remove(webSocket);
	cleanupUserState(userState);
};

const sendMessage = (webSocket: WebSocket, message: ServerMessage) => {
	webSocket.send(JSON.stringify(message));
};

export const onConnection = (
	websocket: WebSocket,
	request: IncomingMessage,
) => {
	let isAlive: boolean = true;

	const userSnowflake = verifyUserSnowflake(request.headers.cookie);
	if (userSnowflake == null) {
		websocket.close(1008, 'Unauthorized');
		return;
	}
	const userState = getUserState(userSnowflake);

	websocket.on('message', data => {
		let jsonData: unknown;
		try {
			const stringData = data.toString('utf-8');
			jsonData = JSON.parse(stringData);
		} catch {
			return websocket.close(1007);
		}

		const parseResult = clientMessageSchema.safeParse(jsonData);
		if (!parseResult.success) {
			return websocket.close(1003);
		}

		const { payload, requestId } = parseResult.data;

		const handler = getMessageHandler(payload);

		const { errorMessage, updatedUserStates, updatedGame } = handler({
			payload,
			userState,
		});

		if (errorMessage != null) {
			sendMessage(websocket, {
				requestId,
				errorMessage,
			});
		}

		notifyGame(updatedGame, updatedUserStates);
	});

	websocket.on('pong', () => {
		isAlive = true;
	});

	const interval = setInterval(() => {
		if (!isAlive) {
			return void websocket.terminate();
		}
		isAlive = false;
		websocket.ping();
	}, 30000);

	websocket.on('close', () => {
		clearInterval(interval);
		removeSocket(userState, websocket);
	});

	const player = userState.player;
	sendMessage(websocket, {
		game: player != null ? toAPIGame(player) : null,
	});

	attachSocket(userState, websocket);
};

export const notifyGame = (
	game: InternalGame | undefined,
	userStates?: (UserState | undefined)[] | undefined | UserState,
) => {
	for (const { player, webSocket } of getSockets(
		game,
		Array.isArray(userStates) ? userStates : [userStates],
	)) {
		sendMessage(webSocket, {
			game: player == null ? null : toAPIGame(player),
		});
	}
};

type MessageHandlerResult = {
	errorMessage?: string | undefined;
	updatedGame?: InternalGame | undefined;
	updatedUserStates?: (UserState | undefined)[] | undefined | UserState;
};

type MessageHandlerFunc<Type> = (options: {
	payload: (ClientMessage & { payload: { type: Type } })['payload'];
	userState: UserState;
}) => MessageHandlerResult;

const joinHandler: MessageHandlerFunc<'join'> = ({
	payload: { gameCode },
	userState,
}) => {
	const game = getGame(gameCode);
	if (game == null) {
		return {
			errorMessage: 'That game does not exist',
		};
	}
	if (!canJoinGame(userState, game)) {
		return {
			errorMessage: "You can't join this game right now",
		};
	}

	joinGame(game, userState.user);

	return {
		updatedGame: game,
	};
};

const leaveHandler: MessageHandlerFunc<'leave'> = ({ userState }) => {
	const player = userState.player;
	if (player == null) return { errorMessage: 'You are not in a game' };

	const { game } = player;

	leaveGame(player);

	return {
		updatedGame: game,
		updatedUserStates: userState,
	};
};

const establishHandler: MessageHandlerFunc<'establish'> = ({ userState }) => {
	const player = userState.player;
	if (player != null) {
		return {
			errorMessage: 'You are already in a game',
		};
	}

	const game = createGame(userState.user);

	return { updatedGame: game };
};

const submitHandler: MessageHandlerFunc<'submit'> = ({
	payload: { password },
	userState,
}) => {
	const [game, player] = canSubmit(userState);
	if (game == null) {
		return {
			errorMessage: "You can't submit now",
		};
	}

	receiveSubmission(game, player, password);

	return {
		updatedGame: game,
	};
};

const advanceHandler: MessageHandlerFunc<'advance'> = ({ userState }) => {
	const game = canAdvance(userState);
	if (game == null) {
		return { errorMessage: 'You cannot advance now' };
	}

	advanceGame(game);

	return {
		updatedGame: game,
	};
};

const banHandler: MessageHandlerFunc<'ban'> = ({
	payload: { userSnowflake },
	userState,
}) => {
	const [game, banUserState] = canBan(userState, userSnowflake);
	if (game == null) {
		return { errorMessage: "You can't ban this user" };
	}

	banUser(game, banUserState);

	return {
		updatedGame: game,
		updatedUserStates: banUserState,
	};
};

const messageHandlers: {
	[Type in ClientMessageType]: MessageHandlerFunc<Type>;
} = {
	join: joinHandler,
	leave: leaveHandler,
	establish: establishHandler,
	submit: submitHandler,
	advance: advanceHandler,
	ban: banHandler,
};

const getMessageHandler = <Type>(
	payload: ClientMessagePayloadOf<Type>,
): MessageHandlerFunc<Type> => {
	payload.type;
	return messageHandlers[payload.type] as any;
};

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

function* getSockets(
	game: InternalGame | undefined,
	userStates: (UserState | undefined)[] | undefined,
): Generator<{ webSocket: WebSocket; player: InternalPlayer | undefined }> {
	const userStateSet = new Set([
		...(game?.players
			?.filter(player => player.isInGame)
			?.map(player => getUserState(player.snowflake)) ?? []),
		...(userStates?.filter(userState => userState != null) ?? []),
	]);

	for (const userState of userStateSet) {
		for (const webSocket of userState.webSockets) {
			const player = userState.player;
			yield { webSocket, player };
		}
	}
}
