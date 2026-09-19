import {
	APIGame,
	APIPlayer,
	Submission,
	SubmissionFail,
	User,
} from '../../shared/api.js';
import { bitScramble, intToGameCode } from '../game-code.js';
import { removeFromArray, spaceship } from '../util.js';
import {
	codeToGame,
	games,
	InternalGame,
	InternalPlayer,
	UserState,
} from './game-registry.js';
import { cleanupUserState, getUserState, notifyGame } from './game-socket.js';
import { Database } from '../database/index.js';
import { generateRuleScheme } from '../rule/rule-scheme.js';

export const INITIAL_TIME = 1 * 60 * 1000;
export const TIME_PER_RULE = 5 * 1000;
export const GAME_NUM_ROUNDS = 8;

export let numGames: number = Database.getGameCount();

export const createGame = (host: UserState): InternalGame => {
	const code = intToGameCode(bitScramble(numGames));
	const game: InternalGame = {
		code,
		host: undefined as unknown as InternalPlayer,
		phase: 'pregame',
		players: [],
		roundEndTime: null,
		roundNumber: 0,
		roundSubmissions: [],
		rules: [],
		winnerSnowflake: null,
		numRounds: GAME_NUM_ROUNDS,
		bannedUsers: [],
		timestamp: Date.now(),
		ruleScheme: generateRuleScheme(),
	};
	++numGames;
	Database.incrementGameCount();
	games.push(game);
	codeToGame.set(code, game);
	const hostPlayer = joinGame(game, host);
	game.host = hostPlayer;
	return game;
};

export const getGame = (code: string): InternalGame | undefined => {
	return codeToGame.get(code);
};

export const getGamePlayer = (
	game: InternalGame,
	snowflake: string,
): InternalPlayer | undefined => {
	return game.players.find(player => player.snowflake === snowflake);
};

export const getPlayerSubmission = (
	submissions: Submission[],
	player: InternalPlayer,
): Submission => {
	return submissions.find(
		({ userSnowflake }) => userSnowflake === player.snowflake,
	)!;
};

export const getCurrentSubmissions = (game: InternalGame): Submission[] => {
	return game.roundSubmissions[game.roundNumber];
};

export const joinGame = (
	game: InternalGame,
	userState: UserState,
): InternalPlayer => {
	const oldPlayer = userState.player;

	if (oldPlayer != null && oldPlayer.game === game) {
		leaveGame(oldPlayer);
	}

	let player = getGamePlayer(game, userState.user.snowflake);
	if (player == null) {
		player = {
			...userState.user,
			game,
			isAlive: true,
			joinTimestamp: Date.now(),
			isInGame: true,
			kills: 0,
		};
		game.players.push(player);
	}

	player.isInGame = true;
	userState.player = player;

	return player;
};

export const leaveGame = (player: InternalPlayer) => {
	player.isInGame = false;
	const userState = getUserState(player.snowflake);
	userState.player = undefined;
	cleanupUserState(userState);
	cleanupGame(player.game);
};

const cleanupGame = (game: InternalGame) => {
	if (
		game.players.isEmpty() ||
		game.players.every(player => !player.isInGame)
	) {
		deleteGame(game);
	} else if (!game.host.isInGame) {
		game.host = game.players
			.filter(player => player.isInGame)
			.toSorted((a, b) => spaceship(a.joinTimestamp, b.joinTimestamp))[0];
	}
};

export const banUser = (game: InternalGame, userState: UserState) => {
	const player = userState.player;
	if (player != null) {
		removeFromArray(game.players, player);
		cleanupPlayer(player);
	}

	userState.player = undefined;
	cleanupUserState(userState);

	game.bannedUsers.push(userState.user);

	cleanupGame(game);
};

export const kickUser = (game: InternalGame, kickUser: UserState): void => {
	const player = kickUser.player;

	if (player != null) {
		leaveGame(player);
		game.players.remove(player);
	}
};

export const deleteGame = (game: InternalGame): void => {
	for (const player of game.players) {
		cleanupPlayer(player);
	}
	games.remove(game);
	codeToGame.delete(game.code);
};

export const cleanupPlayer = (player: InternalPlayer) => {
	if (!player.isInGame) return;
	const userState = getUserState(player.snowflake);
	userState.player = undefined;
	cleanupUserState(userState);
};

export const advanceGame = (game: InternalGame): void => {
	game.roundNumber = game.phase === 'pregame' ? 0 : game.roundNumber + 1;
	game.phase = 'submitting';

	const { roundNumber } = game;
	const lastRound = game.roundSubmissions.at(roundNumber - 1);

	game.roundSubmissions[roundNumber] = game.players.map(player => {
		const lastSubmission = lastRound?.find(
			submission => submission.userSnowflake === player.snowflake,
		);
		const deadSubmission =
			lastSubmission?.status === 'invalid' ? lastSubmission : undefined;

		return {
			fail: deadSubmission?.fail ?? null,
			status: deadSubmission?.status ?? 'pending',
			length: lastSubmission?.password.length ?? 0,
			password: lastSubmission?.password ?? '',
			rank: 0,
			timestamp: Date.now(),
			userSnowflake: player.snowflake,
			maxRound: deadSubmission?.maxRound ?? roundNumber,
		};
	});
	rankSubmissions(game.roundSubmissions[game.roundNumber]);

	const roundCreatedRules = game.ruleScheme[game.roundNumber];
	game.rules.push(
		...roundCreatedRules.map(createdRule => ({
			...createdRule,
			kills: 0,
			roundNumber: game.roundNumber,
			uuid: crypto.randomUUID(),
		})),
	);

	const roundTime = INITIAL_TIME + TIME_PER_RULE * game.rules.length;

	game.roundEndTime = Date.now() + roundTime;
	setTimeout(() => {
		if (game.roundNumber !== roundNumber || game.phase !== 'submitting')
			return;

		moveToReveal(game);
		notifyGame(game);
	}, roundTime);
};

const statusToOrder = {
	valid: 0,
	pending: 1,
	invalid: 2,
};

const rankSubmissions = (submissions: Submission[]) => {
	submissions.sort(
		(a, b) =>
			spaceship(statusToOrder[a.status], statusToOrder[b.status]) * 16 +
			spaceship(b.maxRound, a.maxRound) * 8 +
			spaceship(b.fail?.value ?? 0, a.fail?.value ?? 0) * 4 +
			spaceship(a.length, b.length) * 2 +
			spaceship(a.timestamp, b.timestamp),
	);
	for (let i = 0; i < submissions.length; ++i) {
		submissions[i].rank = i + 1;
	}
};

const updateSubmission = (
	game: InternalGame,
	player: InternalPlayer,
	password: string,
	notOnTime: boolean,
) => {
	const submissions = game.roundSubmissions[game.roundNumber];

	const addSubmission = (
		input: Omit<Submission, 'rank' | 'length' | 'maxRound' | 'timestamp'>,
	) => {
		const submission = getPlayerSubmission(submissions, player);

		submission.fail = input.fail;
		submission.length = input.password.length;
		submission.maxRound = game.roundNumber;
		submission.password = input.password;
		submission.status = input.status;
		submission.timestamp = Date.now();

		rankSubmissions(submissions);

		if (input.status === 'invalid') {
			player.isAlive = false;
		}
	};

	if (notOnTime) {
		return addSubmission({
			fail: {
				reason: 'late',
				message: 'Did not submit a password on time',
				value: 0,
			},
			status: 'invalid',
			password,
			userSnowflake: player.snowflake,
		});
	}

	const dupeSubmission = game.roundSubmissions
		.flatMap(round =>
			round.filter(
				({ userSnowflake }) => userSnowflake !== player.snowflake,
			),
		)
		.find(submission => submission.password === password);
	if (dupeSubmission != null) {
		const killerPlayer = getGamePlayer(game, dupeSubmission.userSnowflake)!;

		++killerPlayer.kills;

		return addSubmission({
			fail: {
				reason: 'dupe',
				message: `Submitted a duplicate password of ${killerPlayer.username}`,
				value: 1,
			},
			status: 'invalid',
			password,
			userSnowflake: player.snowflake,
		});
	}

	let numRulesPassed = 0;
	let fail: SubmissionFail | undefined = undefined;
	for (const rule of game.rules) {
		const failMessage = rule.validator({ password, player });
		if (failMessage != null) {
			if (fail == null) {
				++rule.kills;
			}
			fail ??= {
				message: failMessage,
				reason: 'rule',
				value: 0,
			};
		} else {
			++numRulesPassed;
		}
	}
	if (fail != null) {
		fail.value = numRulesPassed;
		return addSubmission({
			fail,
			status: 'invalid',
			password,
			userSnowflake: player.snowflake,
		});
	}

	addSubmission({
		fail: null,
		status: 'valid',
		password,
		userSnowflake: player.snowflake,
	});
};

export const receiveSubmission = (
	game: InternalGame,
	player: InternalPlayer,
	password: string,
) => {
	if (player == null) return;

	updateSubmission(game, player, password, false);

	const submissions = game.roundSubmissions[game.roundNumber];
	const allSubmitted = submissions.every(
		({ status }) => status !== 'pending',
	);

	if (allSubmitted) {
		moveToReveal(game);
	}
};

export const moveToReveal = (game: InternalGame) => {
	game.phase = 'reveal';
	game.roundEndTime = null;

	for (const player of game.players) {
		const playerSubmission = getPlayerSubmission(
			game.roundSubmissions[game.roundNumber],
			player,
		);
		if (playerSubmission.status === 'pending') {
			updateSubmission(game, player, playerSubmission.password, true);
		}
	}

	let aliveCount = 0;
	for (const player of game.players) {
		if (player.isAlive) ++aliveCount;
	}

	const isEnd =
		aliveCount === 0 ||
		(game.players.length > 1 && aliveCount === 1) ||
		game.roundNumber === game.numRounds - 1;
	if (isEnd) {
		const firstSubmission = game.roundSubmissions[game.roundNumber][0];
		if (firstSubmission.status === 'valid') {
			game.winnerSnowflake = firstSubmission.userSnowflake;
		}
		game.phase = 'end';
	}
};

export const createNewGame = (host: UserState): InternalGame => {
	const oldPlayer = host.player;
	const oldGame = oldPlayer?.game;

	const newGame = createGame(host);
	newGame.bannedUsers = oldGame?.bannedUsers ?? [];

	if (oldGame != null) {
		for (const player of oldGame.players) {
			joinGame(newGame, getUserState(player.snowflake));
		}
	}

	return newGame;
};

export const canCreateNewGame = (host: UserState): string | undefined => {
	const oldPlayer = host.player;
	const oldGame = oldPlayer?.game;

	if (oldGame == null) return 'You are not in a game already';
	if (oldGame.host !== oldPlayer) return 'You are not the host';
	if (oldGame.phase !== 'end') return 'Game is still going';

	return undefined;
};

export const canSubmit = (
	userState: UserState,
): [InternalGame, InternalPlayer] | [undefined, undefined] => {
	const player = userState.player;
	if (player == null) return [, ,];
	const { game } = player;
	if (game.phase !== 'submitting') return [, ,];
	const submissions = getCurrentSubmissions(game);
	const playerSubmission = getPlayerSubmission(submissions, player);
	return playerSubmission.status === 'pending' ? [game, player] : [, ,];
};

export const canAdvance = (userState: UserState): InternalGame | undefined => {
	const player = userState.player;
	if (player == null) return undefined;
	const { game } = player;
	if (player !== game.host) return undefined;
	return game.phase === 'pregame' || game.phase === 'reveal'
		? game
		: undefined;
};

export const canJoinGame = (
	userState: UserState,
	game: InternalGame,
): boolean => {
	if (userState.player != null) return false;
	if (game.bannedUsers.includes(userState.user)) return false;
	return (
		game.phase === 'pregame' ||
		game.players.some(
			player => player.snowflake === userState.user.snowflake,
		)
	);
};

export const canBanOrKick = (
	userState: UserState,
	banUserSnowflake: string,
): [InternalGame, UserState] | [undefined, undefined] => {
	const { player } = userState;
	if (player == null) return [, ,];
	const { game } = player;
	if (game.phase !== 'pregame') return [, ,];
	if (game.host !== player) return [, ,];
	const banUser = getUserState(banUserSnowflake);
	return [game, banUser];
};

export const toAPIGame = (player: InternalPlayer): APIGame => {
	const { game } = player;
	const submissions = game.roundSubmissions.at(game.roundNumber) ?? [];

	return {
		bannedUsers: game.bannedUsers,
		code: game.code,
		hostSnowflake: game.host.snowflake,
		numRounds: game.numRounds,
		phase: game.phase,
		players: game.players.map(player => ({
			avatarUrl: player.avatarUrl,
			isAlive: player.isAlive,
			snowflake: player.snowflake,
			username: player.username,
			kills: player.kills,
		})),
		roundEndTime: game.roundEndTime,
		roundNumber: game.roundNumber,
		rules: game.rules.map(rule => ({
			uuid: rule.uuid,
			description: rule.description,
			imageUrl: rule.imageUrl,
			kills: rule.kills,
			roundNumber: rule.roundNumber,
			title: rule.title,
		})),
		winnerSnowflake: game.winnerSnowflake,
		timestamp: game.timestamp,
		submissions:
			game.phase === 'pregame'
				? game.players.map((player, index) => ({
						fail: null,
						status: 'pending',
						length: 0,
						password: '',
						rank: index,
						timestamp: game.timestamp,
						userSnowflake: player.snowflake,
						maxRound: 0,
					}))
				: submissions.map(submission => {
						const isObfuscated =
							game.phase === 'submitting' &&
							submission.status === 'valid' &&
							submission.userSnowflake !== player.snowflake;

						return {
							fail: submission.fail,
							status: submission.status,
							length: submission.length,
							password: isObfuscated
								? '*'.repeat(submission.length)
								: submission.password,
							rank: submission.rank,
							timestamp: submission.timestamp,
							userSnowflake: submission.userSnowflake,
							maxRound: submission.maxRound,
						};
					}),
	};
};
