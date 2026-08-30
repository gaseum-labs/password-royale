import React, { useEffect } from 'react';
import {
	APIGame,
	DEFAULT_AVATAR_PATH,
	MAX_PASSWORD_LENGTH,
	User,
} from '../../shared/api.js';
import { useImmer } from 'use-immer';
import { TopBar } from './top-bar.js';
import skull from '../assets/skull.svg?raw';
import { Icon } from '../icon.js';
import * as style from './game-page.css.js';
import clsx from 'clsx';
import * as themeStyle from '../theme.css.js';
import * as generalStyle from '../util.css.js';
import { storeActions } from '../store.js';
import { sendSocketMessage } from '../socket.js';
import startRoundSrc from '../assets/start-round.wav?url';
import endRoundSrc from '../assets/end-round.wav?url';
import endGameSrc from '../assets/end-game.wav?url';
import validSubmissionSrc from '../assets/valid-submission.wav?url';
import invalidSubmissionSrc from '../assets/invalid-submission.wav?url';
import { createGameSound } from '../audio.js';

type State = {
	password: string;
	timeLeft: number | undefined;
};

const findPassword = (game: APIGame, userSnowflake: string): string => {
	return (
		game.submissions.find(
			submission => submission.userSnowflake === userSnowflake,
		)?.password ?? ''
	);
};

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

export const GamePage = ({ game, user }: { game: APIGame; user: User }) => {
	const isHost = game.hostSnowflake === user.snowflake;
	const canAdvance =
		isHost && (game.phase === 'pregame' || game.phase === 'reveal');

	const oldGameRef = React.useRef(game);
	React.useEffect(() => {
		const oldGame = oldGameRef.current;
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
		oldGameRef.current = game;
	}, [game]);

	const [state, setState] = useImmer<State>({
		password: findPassword(game, user.snowflake),
		timeLeft: undefined,
	});

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
			sendSocketMessage({
				type: 'submit',
				password: state.password,
			}).catch(storeActions.receiveError);
		}
	};

	const onClickNext = () => {
		sendSocketMessage({ type: 'advance' }).catch(storeActions.receiveError);
	};

	const onClickSubmit = () => {
		sendSocketMessage({ type: 'submit', password: state.password }).catch(
			storeActions.receiveError,
		);
	};

	const playerSubmission = game.submissions.find(
		submission => submission.userSnowflake === user.snowflake,
	);

	const hasSubmitted = playerSubmission?.status !== 'pending';

	const canSubmit =
		game.phase === 'submitting' &&
		!hasSubmitted &&
		state.password.length > 0;

	const winner = game.players.find(
		player => player.snowflake === game.winnerSnowflake,
	);

	const timer = React.useRef<number | undefined>(undefined);
	useEffect(() => {
		window.clearInterval(timer.current);

		const roundEndTime = game.roundEndTime;
		if (roundEndTime == null) {
			return setState(state => {
				state.timeLeft = undefined;
			});
		}

		timer.current = window.setInterval(() => {
			const now = Date.now();
			setState(state => {
				state.timeLeft = Math.max(roundEndTime - now, 0);
			});
		}, 100);
	}, [game.roundEndTime]);

	const timeString =
		state.timeLeft == null ? undefined : getTimeString(state.timeLeft);

	return (
		<div className={clsx(style.gamePage, themeStyle.darkTheme)}>
			<TopBar user={user} gameCode={game.code} />
			<div className={style.contentGrid}>
				<div className={style.gameBar}>
					<span>
						{game.phase === 'pregame' ? (
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
						{game.rules.map(rule => (
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
						{game.submissions.map(submission => {
							const user = game.players.find(
								player =>
									player.snowflake ===
									submission.userSnowflake,
							);

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
									<div className={style.userRow}>
										<img
											className={style.avatar}
											src={
												user?.avatarUrl ??
												DEFAULT_AVATAR_PATH
											}
										/>
										<span className={style.username}>
											{user?.username}
										</span>
										<span className={style.kills}>
											<Icon icon={skull} />{' '}
											{user?.kills ?? 0}
										</span>
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
					className={style.passwordInput}
					value={state.password}
					onChange={onChangePassword}
					placeholder="Enter password..."
					onKeyDown={onPressEnter}
					spellCheck={false}
				/>
				<span className={style.passwordLength}>
					{state.password.length}
				</span>
				<button
					disabled={!canSubmit}
					className={generalStyle.button}
					onClick={onClickSubmit}
				>
					Submit
				</button>
				{game.hostSnowflake === user.snowflake && (
					<button
						disabled={!canAdvance}
						className={generalStyle.button}
						onClick={onClickNext}
					>
						Next
					</button>
				)}
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
