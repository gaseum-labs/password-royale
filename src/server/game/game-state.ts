import {
	APIGame,
	GameHeader,
	Submission,
	SubmissionFail,
} from '../../shared/api.js';
import { bitScramble, intToGameCode } from '../game-code.js';
import { spaceship } from '../../shared/util.js';
import {
	codeToGame,
	games,
	InternalGame,
	InternalPlayer,
	InternalUser,
} from './game-registry.js';
import { notifyGame, RequestError } from './game-socket.js';
import { Database } from '../database/index.js';
import { generateRuleScheme } from '../rule/rule-scheme.js';

export const INITIAL_TIME = 1 * 60 * 1000;
export const TIME_PER_RULE = 5 * 1000;
export const GAME_NUM_ROUNDS = 8;

export let numGames: number = Database.getGameCount();

export const getGame = (code: string): InternalGame | undefined => {
	return codeToGame.get(code);
};

export const getGamePlayer = (
	game: InternalGame,
	snowflake: string,
): InternalPlayer | undefined => {
	return game.players.find(player => player.user.snowflake === snowflake);
};

export const getPlayerSubmission = (
	submissions: Submission[],
	player: InternalPlayer,
): Submission => {
	return submissions.find(
		({ userSnowflake }) => userSnowflake === player.user.snowflake,
	)!;
};

export const maybeGetPlayerSubmission = (
	submissions: Submission[] | undefined,
	player: InternalPlayer,
): Submission | undefined => {
	return submissions?.find(
		({ userSnowflake }) => userSnowflake === player.user.snowflake,
	);
};

export const getCurrentSubmissions = (game: InternalGame): Submission[] => {
	return game.roundSubmissions[game.roundNumber];
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
			userSnowflake: player.user.snowflake,
		});
	}

	const dupeSubmission = game.roundSubmissions
		.flatMap(round =>
			round.filter(
				({ userSnowflake }) => userSnowflake !== player.user.snowflake,
			),
		)
		.find(submission => submission.password === password);
	if (dupeSubmission != null) {
		const killerPlayer = getGamePlayer(game, dupeSubmission.userSnowflake)!;

		++killerPlayer.kills;

		return addSubmission({
			fail: {
				reason: 'dupe',
				message: `Submitted a duplicate password of ${killerPlayer.user.username}`,
				value: 1,
			},
			status: 'invalid',
			password,
			userSnowflake: player.user.snowflake,
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
			userSnowflake: player.user.snowflake,
		});
	}

	addSubmission({
		fail: null,
		status: 'valid',
		password,
		userSnowflake: player.user.snowflake,
	});
};

const moveToReveal = (game: InternalGame) => {
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

const statusToOrder = {
	valid: 0,
	pending: 1,
	invalid: 2,
};

/* ========================================== actions ========================================== */

export const createGame = (host: InternalUser): InternalGame => {
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
		bannedUserSnowflakes: new Set(),
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

export const resetGame = (game: InternalGame): void => {
	game.phase = 'pregame';
	game.roundEndTime = null;
	game.roundNumber = 0;
	game.roundSubmissions = [];
	game.rules = [];
	game.winnerSnowflake = null;
	game.numRounds = GAME_NUM_ROUNDS;
	game.ruleScheme = generateRuleScheme();
	for (const player of game.players) {
		player.isAlive = true;
		player.kills = 0;
	}
};

export const joinGame = (
	game: InternalGame,
	user: InternalUser,
): InternalPlayer => {
	let player = getGamePlayer(game, user.snowflake);
	if (player == null) {
		player = {
			user,
			game,
			isAlive: true,
			joinTimestamp: Date.now(),
			kills: 0,
		};
		game.players.push(player);
	}

	return player;
};

export const leaveGame = (player: InternalPlayer): void => {
	const { game } = player;
	if (game.phase === 'pregame') {
		game.players.remove(player);
		if (game.host === player && !game.players.isEmpty()) {
			game.host = game.players.toSorted((a, b) =>
				spaceship(a.joinTimestamp, b.joinTimestamp),
			)[0];
		}

		if (game.players.isEmpty()) {
			games.remove(game);
			codeToGame.delete(game.code);
		}
	}
};

export const bootPlayer = (
	game: InternalGame,
	player: InternalPlayer,
	ban: boolean,
) => {
	if (ban) {
		game.bannedUserSnowflakes.add(player.user.snowflake);
	}
	leaveGame(player);
};

export const advanceGame = (game: InternalGame): void => {
	game.roundNumber = game.phase === 'pregame' ? 0 : game.roundNumber + 1;
	game.phase = 'submitting';

	const { roundNumber } = game;
	const lastRound = game.roundSubmissions.at(roundNumber - 1);

	game.roundSubmissions[roundNumber] = game.players.map(player => {
		const lastSubmission = maybeGetPlayerSubmission(lastRound, player);
		const deadSubmission =
			lastSubmission?.status === 'invalid' ? lastSubmission : undefined;

		return {
			fail: deadSubmission?.fail ?? null,
			status: deadSubmission?.status ?? 'pending',
			length: lastSubmission?.password.length ?? 0,
			password: lastSubmission?.password ?? '',
			rank: 0,
			timestamp: Date.now(),
			userSnowflake: player.user.snowflake,
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
		notifyGame({ games: [game], isReset: false });
	}, roundTime);
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

export const getAllGameHeaders = (user: InternalUser): GameHeader[] => {
	const headers: GameHeader[] = [];
	for (const game of games) {
		if (game.players.some(player => player.user === user)) {
			headers.push({
				code: game.code,
				numPlayers: game.players.length,
				phase: game.phase,
				roundNumber: game.roundNumber,
				numRounds: game.numRounds,
				timestamp: game.timestamp,
			});
		}
	}
	headers.sort((a, b) => b.timestamp - a.timestamp);
	return headers;
};

/* ========================================== guards ========================================== */

export const canCreateNewGame = (
	game: InternalGame,
	host: InternalUser,
): void => {
	const player = getGamePlayer(game, host.snowflake);

	if (game == null) throw new RequestError('You are not in this game');
	if (game.host !== player) throw new RequestError('You are not the host');
	if (game.phase !== 'end') throw new RequestError('Game is still going');
};

export const canSubmit = (game: InternalGame, player: InternalPlayer): void => {
	if (game.phase !== 'submitting')
		throw new RequestError("It's not time to submit");
	const submissions = getCurrentSubmissions(game);
	const playerSubmission = getPlayerSubmission(submissions, player);
	if (playerSubmission.status !== 'pending')
		throw new RequestError("You've already submitted");
};

export const canAdvance = (
	game: InternalGame,
	player: InternalPlayer,
): void => {
	if (player !== game.host) throw new RequestError('You are not the host');
	if (game.phase === 'end' || game.phase === 'submitting')
		throw new RequestError("It's not time to advance");
};

export const canJoinGame = (game: InternalGame, user: InternalUser): void => {
	if (game.bannedUserSnowflakes.has(user.snowflake))
		throw new RequestError('You are banned');
	if (game.phase !== 'pregame' && getGamePlayer(game, user.snowflake) == null)
		throw new RequestError("It's too late to join");
};

export const canBoot = (game: InternalGame, player: InternalPlayer): void => {
	if (game.host !== player) throw new RequestError('You are not the host');
	if (game.phase !== 'pregame')
		throw new RequestError('Game has already started');
};

/* ========================================== to api game ========================================== */

export const toAPIGame = (
	game: InternalGame,
	user: InternalUser,
	isReset: boolean,
): APIGame => {
	const player = getGamePlayer(game, user.snowflake);
	const submissions = game.roundSubmissions.at(game.roundNumber) ?? [];

	return {
		code: game.code,
		hostSnowflake: game.host.user.snowflake,
		numRounds: game.numRounds,
		phase: game.phase,
		players: game.players.map(player => ({
			isAlive: player.isAlive,
			snowflake: player.user.snowflake,
			username: player.user.username,
			kills: player.kills,
			isAdmin: player.user.isAdmin,
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
		isReset: isReset ?? undefined,
		submissions:
			game.phase === 'pregame'
				? game.players.map((player, index) => ({
						fail: null,
						status: 'pending',
						length: 0,
						password: '',
						rank: index,
						timestamp: game.timestamp,
						userSnowflake: player.user.snowflake,
						maxRound: 0,
					}))
				: submissions.map(submission => {
						const isObfuscated =
							game.phase === 'submitting' &&
							submission.status === 'valid' &&
							submission.userSnowflake !== player?.user.snowflake;

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
