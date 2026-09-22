import React, { useEffect } from 'react';
import {
	APIGame,
	MAX_PASSWORD_LENGTH,
	UNKNOWN_AVATAR_PATH,
	APIUser,
	kickMessage,
	banMessage,
	submitMessage,
	newGameMessage,
	advanceMessage,
	joinMessage,
} from '../../shared/api.js';
import { Updater, useImmer } from 'use-immer';
import { TopBar } from './top-bar.js';
import skull from '../assets/skull.svg?raw';
import boot from '../assets/boot.svg?raw';
import hammer from '../assets/hammer.svg?raw';
import { Icon } from '../icon.js';
import * as style from './game-page.css.js';
import clsx from 'clsx';
import * as themeStyle from '../theme.css.js';
import * as generalStyle from '../util.css.js';
import { mainActions } from '../store.js';
import {
	registerGameListener,
	removeGameListener,
	sendSocketMessage,
} from '../client-socket.js';
import startRoundSrc from '../assets/start-round.wav?url';
import endRoundSrc from '../assets/end-round.wav?url';
import endGameSrc from '../assets/end-game.wav?url';
import validSubmissionSrc from '../assets/valid-submission.wav?url';
import invalidSubmissionSrc from '../assets/invalid-submission.wav?url';
import { createGameSound } from '../audio.js';
import { Link, navigate } from '../nav.js';
import { getAvatarPath } from '../avatar.js';

export const cleanPassword = (input: string): string => {
	let str = '';
	for (let i = 0; i < input.length && i < MAX_PASSWORD_LENGTH; ++i) {
		const code = input.charCodeAt(i);
		if (code >= 32 && code <= 126) str += input[i];
	}
	return str;
};

const audioContext = new AudioContext();

const startRoundSound = createGameSound(audioContext, startRoundSrc);
const endRoundSound = createGameSound(audioContext, endRoundSrc);
const endGameSound = createGameSound(audioContext, endGameSrc);
const validSubmissionSound = createGameSound(audioContext, validSubmissionSrc);
const invalidSubmissionSound = createGameSound(
	audioContext,
	invalidSubmissionSrc,
);

const GAME_NOT_FOUND = Symbol();

type GameState = {
	game: APIGame | typeof GAME_NOT_FOUND | undefined;
	password: string;
};

export const GamePage = ({ user, code }: { user: APIUser; code: string }) => {
	const [state, setState] = useImmer<GameState>({
		game: undefined,
		password: '',
	});

	React.useEffect(() => {
		sendSocketMessage(joinMessage, { gameCode: code })
			.catch(() => {
				setState(state => {
					state.game = GAME_NOT_FOUND;
				});
			})
			.then(game => {
				if (game == null) {
					return setState(state => {
						state.game = GAME_NOT_FOUND;
					});
				}
				navigate(`/game/${game.code}`);
				setState(state => {
					state.game = game;
				});
			});
	}, []);

	return state.game === GAME_NOT_FOUND ? (
		<NonExistGame user={user} />
	) : (
		<FoundGame
			game={state.game}
			password={state.password}
			setState={setState}
			user={user}
		/>
	);
};

const FoundGame = ({
	game,
	user,
	password,
	setState,
}: {
	user: APIUser;
	game: APIGame | undefined;
	password: string;
	setState: Updater<GameState>;
}) => {
	React.useEffect(() => {
		const listener = (game: APIGame | null) => {
			if (game == null) {
				navigate('/');
			} else {
				setState(state => {
					if (
						state.game == null ||
						(typeof state.game === 'object' &&
							game.roundNumber < state.game?.roundNumber)
					) {
						state.password = findUserPassword(game, user.snowflake);
					}
					state.game = game;
				});
			}
		};
		registerGameListener(listener);
		return () => removeGameListener(listener);
	}, []);

	const isHost = game?.hostSnowflake === user.snowflake;
	const canAdvance =
		isHost && (game.phase === 'pregame' || game.phase === 'reveal');

	const oldGameRef = React.useRef(game);
	React.useEffect(() => {
		const oldGame = oldGameRef.current;
		oldGameRef.current = game;
		if (oldGame == null || game == null) return;

		if (oldGame.phase !== 'submitting' && game.phase === 'submitting') {
			startRoundSound.play();
		} else if (oldGame.phase === 'submitting' && game.phase === 'reveal') {
			endRoundSound.play();
		} else if (oldGame.phase === 'submitting' && game.phase === 'end') {
			endGameSound.play();
		} else {
			let numOldValid = 0;
			let numOldInvalid = 0;
			for (const submission of oldGame.submissions) {
				if (submission.status === 'valid') ++numOldValid;
				else if (submission.status === 'invalid') ++numOldInvalid;
			}
			let numNewValid = 0;
			let numNewInvalid = 0;
			for (const submission of game.submissions) {
				if (submission.status === 'valid') ++numNewValid;
				else if (submission.status === 'invalid') ++numNewInvalid;
			}
			if (numNewValid > numOldValid) {
				validSubmissionSound.play();
			} else if (numNewInvalid > numOldInvalid) {
				invalidSubmissionSound.play();
			}
		}
	}, [game]);

	const onChangePassword = (
		event: React.ChangeEvent<HTMLTextAreaElement>,
	) => {
		const cleaned = cleanPassword(event.currentTarget.value);
		setState(state => {
			state.password = cleaned;
		});
	};

	const onPressEnter = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (event.key == 'Enter') {
			event.preventDefault();
		}

		if (event.key == 'Enter' && canSubmit) {
			sendSocketMessage(submitMessage, {
				password,
			}).catch(mainActions.receiveError);
		}
	};

	const onClickNext = () => {
		sendSocketMessage(advanceMessage, {}).catch(mainActions.receiveError);
	};

	const onClickNewGame = () => {
		sendSocketMessage(newGameMessage, {}).catch(mainActions.receiveError);
	};

	const onClickSubmit = () => {
		sendSocketMessage(submitMessage, { password }).catch(
			mainActions.receiveError,
		);
	};

	const userSubmission = game?.submissions.find(
		submission => submission.userSnowflake === user.snowflake,
	);
	const hasSubmitted =
		userSubmission != null && userSubmission.status !== 'pending';

	const canSubmit =
		game != null &&
		game.phase === 'submitting' &&
		!hasSubmitted &&
		password.length > 0;
	const canNewGame =
		game != null &&
		game.phase === 'end' &&
		game.hostSnowflake === user.snowflake;
	const canKickOrBan =
		game != null &&
		game.phase === 'pregame' &&
		game.hostSnowflake === user.snowflake;

	const winner = game?.players.find(
		player => player.snowflake === game.winnerSnowflake,
	);

	const onKickPlayer = (userSnowflake: string) => {
		sendSocketMessage(kickMessage, { userSnowflake }).catch(
			mainActions.receiveError,
		);
	};

	const onBanPlayer = (userSnowflake: string) => {
		sendSocketMessage(banMessage, { userSnowflake }).catch(
			mainActions.receiveError,
		);
	};

	const [timeLeft, setTimeLeft] = useImmer<number | undefined>(undefined);
	const timer = React.useRef<number | undefined>(undefined);
	const roundEndTime = game?.roundEndTime ?? undefined;
	useEffect(() => {
		window.clearInterval(timer.current);

		if (roundEndTime == null) {
			return setTimeLeft(undefined);
		}

		timer.current = window.setInterval(() => {
			const now = Date.now();
			setTimeLeft(Math.max(roundEndTime - now, 0));
		}, 100);
	}, [roundEndTime]);
	const timeString = timeLeft == null ? undefined : getTimeString(timeLeft);

	return (
		<div className={clsx(style.gamePage, themeStyle.darkTheme)}>
			<TopBar user={user} gameCode={game?.code} />
			<div className={style.contentGrid}>
				<div className={style.gameBar}>
					<span>
						{game == null ? (
							'Loading...'
						) : game.phase === 'pregame' ? (
							'Waiting for players'
						) : game.phase === 'submitting' ? (
							<>
								{hasSubmitted
									? 'Submitted '
									: 'Submit your password now '}
								<span className={style.emphasis}>
									{timeString}
								</span>
								{` Round ${game.roundNumber + 1} of ${game.numRounds}`}
							</>
						) : game.phase === 'end' ? (
							winner != null ? (
								<>
									<span className={style.emphasis}>
										{winner.username}
									</span>
									{' wins'}
								</>
							) : (
								'Everyone loses'
							)
						) : (
							`End of round ${game.roundNumber + 1} of ${game.numRounds}`
						)}
					</span>
				</div>
				<div className={style.panel}>
					<span className={style.panelHeader}>Rules</span>
					<div className={style.rulesContainer}>
						{game?.rules.map(rule => (
							<div key={rule.uuid} className={style.rule}>
								<RuleTitle title={rule.title} />
								{rule.description != null && (
									<span className={style.ruleDescription}>
										{rule.description}
									</span>
								)}
								{rule.imageUrl != null && (
									<img
										src={rule.imageUrl}
										className={style.ruleImage}
									/>
								)}
								{
									<span className={style.kills}>
										<Icon icon={skull} /> {rule.kills}
									</span>
								}
							</div>
						))}
					</div>
				</div>
				<div className={style.panel}>
					<span className={style.panelHeader}>Passwords</span>
					<div className={style.resultsList}>
						{game?.submissions.map(submission => {
							const submissionPlayer = game.players.find(
								player =>
									player.snowflake ===
									submission.userSnowflake,
							);

							const rowKickBan =
								canKickOrBan &&
								submission.userSnowflake !== user.snowflake;

							return (
								<div
									key={submission.userSnowflake}
									className={clsx(
										style.submission,
										submission.status === 'invalid' &&
											style.failedSubmission,
										submission.status === 'valid' &&
											style.goodSubmission,
									)}
								>
									<div
										className={clsx(
											style.userRow,
											rowKickBan && style.userRowadmin,
										)}
									>
										<img
											className={style.avatar}
											src={
												submissionPlayer == null
													? UNKNOWN_AVATAR_PATH
													: getAvatarPath(
															submissionPlayer,
														)
											}
										/>
										<span className={style.username}>
											{submissionPlayer?.username}
										</span>
										<span className={style.kills}>
											<Icon icon={skull} />{' '}
											{submissionPlayer?.kills ?? 0}
										</span>

										{rowKickBan && (
											<span
												className={style.iconButton}
												onClick={() =>
													onKickPlayer(
														submission.userSnowflake,
													)
												}
											>
												<Icon icon={boot} />
											</span>
										)}
										{rowKickBan && (
											<span
												className={style.iconButton}
												onClick={() =>
													onBanPlayer(
														submission.userSnowflake,
													)
												}
											>
												<Icon icon={hammer} />
											</span>
										)}
									</div>
									{submission.status !== 'pending' && (
										<Password
											password={submission.password}
										/>
									)}
									{submission.status !== 'pending' && (
										<span className={style.length}>
											{submission.length}
										</span>
									)}
									{submission.fail != null && (
										<span className={style.failMessage}>
											{submission.fail.message}
										</span>
									)}
								</div>
							);
						})}
					</div>
				</div>
			</div>
			<div className={style.bottomBar}>
				<textarea
					disabled={game == null}
					className={style.passwordInput}
					value={password}
					onChange={onChangePassword}
					placeholder="Enter password..."
					onKeyDown={onPressEnter}
					spellCheck={false}
				/>
				<span className={style.passwordLength}>
					{password.length ?? 0}
				</span>
				<button
					disabled={!canSubmit}
					className={clsx(
						generalStyle.button,
						canSubmit && generalStyle.suggestButton,
					)}
					onClick={onClickSubmit}
				>
					Submit
				</button>
				{game?.hostSnowflake === user.snowflake && (
					<button
						disabled={!canAdvance && !canNewGame}
						className={clsx(
							generalStyle.button,
							(canAdvance || canNewGame) &&
								generalStyle.suggestButton,
						)}
						onClick={canNewGame ? onClickNewGame : onClickNext}
					>
						{canNewGame
							? 'New Game'
							: game.phase === 'pregame'
								? 'Start'
								: 'Next'}
					</button>
				)}
			</div>
		</div>
	);
};

const NonExistGame = ({ user }: { user: APIUser }) => {
	return (
		<div className={clsx(style.gamePage, themeStyle.darkTheme)}>
			<TopBar user={user} gameCode={undefined} />
			<div className={style.nonExistGrid}>
				<span>The game you are looking for does not exist</span>
				<Link to="/" className={style.linkText}>
					Back to menu
				</Link>
			</div>
		</div>
	);
};

const Password = ({ password }: { password: string }) => {
	const parts = password.split(' ');
	const array: React.ReactNode[] = [];
	for (let i = 0; i < parts.length; ++i) {
		const part = parts[i];
		if (part.length > 0) {
			array.push(<span key={i * 2}>{part}</span>);
		}
		if (i !== parts.length - 1) {
			array.push(
				<span key={i * 2 + 1} className={style.passwordSpace}>
					ˍ
				</span>,
			);
		}
	}

	return <span className={style.password}>{array}</span>;
};

const formatNumber = (value: number): string => {
	const clampedValue = value > 99 ? 99 : value < 0 ? 0 : value;
	if (clampedValue < 10) return `0${clampedValue}`;
	return `${clampedValue}`;
};

const getTimeString = (timeLeft: number): string => {
	const totalSeconds = Math.ceil(timeLeft / 1000);

	const numSeconds = totalSeconds % 60;
	const numMinutes = Math.floor(totalSeconds / 60);

	return `${formatNumber(numMinutes)}:${formatNumber(numSeconds)}`;
};

const RuleTitle = ({ title }: { title: string }) => {
	const parts: React.ReactNode[] = [];

	const emphasisExpr = /\*\*((?:[^*]|\*[^*])+)\*\*/g;

	let lastIndex: number = 0;
	let match: RegExpExecArray | null;
	while ((match = emphasisExpr.exec(title)) != null) {
		const beforePart = title.slice(lastIndex, match.index);
		if (beforePart.length > 0) parts.push(beforePart);
		const emphasisPart = match[1];
		parts.push(
			<span className={style.ruleEmphasis} key={parts.length}>
				{emphasisPart}
			</span>,
		);
		lastIndex = emphasisExpr.lastIndex;
	}
	const trailing = title.slice(lastIndex);
	if (trailing.length > 0) parts.push(trailing);

	return <span className={style.ruleTitle}>{parts}</span>;
};

const findUserPassword = (game: APIGame, userSnowflake: string): string => {
	for (const submission of game.submissions) {
		if (submission.userSnowflake === userSnowflake) {
			return submission.password;
		}
	}
	return '';
};
