import React from 'react';
import { useImmer } from 'use-immer';
import {
	APIUser,
	establishMessage,
	fetchGamesMessage,
	GameHeader,
	joinMessage,
} from '../../shared/api.js';
import { sendSocketMessage } from '../client-socket.js';
import { TopBar } from './top-bar.js';
import * as style from './menu-page.css.js';
import * as generalStyle from '../util.css.js';
import * as themeStyle from '../theme.css.js';
import clsx from 'clsx';
import { mainActions } from '../store.js';
import { navigate } from '../nav.js';

type State = { gameCode: string; isActionLoading: boolean };

export const MenuPage = ({ user }: { user: APIUser }) => {
	const [gameHeaders, setGameHeaders] = useImmer<GameHeader[] | undefined>(
		undefined,
	);

	const [{ gameCode, isActionLoading }, setState] = useImmer<State>({
		gameCode: '',
		isActionLoading: false,
	});

	React.useEffect(() => {
		sendSocketMessage(fetchGamesMessage)
			.then(games => setGameHeaders(games))
			.catch(mainActions.receiveError);
	}, []);

	const isLoading = isActionLoading || gameHeaders == null;

	const onChangeGameCode = (event: React.ChangeEvent<HTMLInputElement>) => {
		let { value } = event.currentTarget;
		setState(state => {
			state.gameCode = normalizeGameCode(value);
		});
	};

	const onCreateGame = () => {
		setState(state => {
			state.isActionLoading = true;
		});
		sendSocketMessage(establishMessage)
			.then(game => {
				if (game == null) return;
				navigate(`/game/${game.code}`);
			})
			.catch(mainActions.receiveError)
			.finally(() =>
				setState(state => {
					state.isActionLoading = false;
				}),
			);
	};

	const onJoinGame = (gameCode: string) => {
		setState(state => {
			state.isActionLoading = true;
		});
		sendSocketMessage(joinMessage, { gameCode })
			.then(game => {
				if (game == null) return;
				navigate(`/game/${game.code}`);
			})
			.catch(mainActions.receiveError)
			.finally(() =>
				setState(state => {
					state.isActionLoading = false;
				}),
			);
	};

	const onResumeGame = (code: string) => {
		navigate(`/game/${code}`);
	};

	const canSubmitGameCode = !isLoading && gameCode.length === 7;

	return (
		<div className={clsx(style.menuPage, themeStyle.darkTheme)}>
			<TopBar user={user} />
			<div className={style.menu}>
				<div className={style.inputRow}>
					<input
						disabled={isLoading}
						className={generalStyle.input}
						value={gameCode}
						onChange={onChangeGameCode}
						placeholder="Enter Game Code"
					/>
					<button
						className={generalStyle.button}
						disabled={!canSubmitGameCode}
						onClick={() => onJoinGame(gameCode)}
					>
						Join Game
					</button>
				</div>
				{isLoading ? (
					<button disabled className={generalStyle.button}>
						Loading...
					</button>
				) : (
					<button
						onClick={onCreateGame}
						className={generalStyle.button}
					>
						Create Game
					</button>
				)}
				{gameHeaders?.map(gameHeader => (
					<button
						key={gameHeader.code}
						onClick={() => onResumeGame(gameHeader.code)}
						className={clsx(
							generalStyle.button,
							generalStyle.suggestButton,
							style.resumeButton,
						)}
					>
						<span className={style.a}>
							Resume Game {gameHeader.code}
						</span>
						<span>
							Round {gameHeader.roundNumber} /{' '}
							{gameHeader.numRounds} {gameHeader.phase}
						</span>
						<span>
							{gameHeader.numPlayers} Player
							{gameHeader.numPlayers === 1 ? '' : 's'}
						</span>
					</button>
				))}
			</div>
		</div>
	);
};

const normalizeGameCode = (str: string): string => {
	str = str.toUpperCase();
	str = str.replace(/[^A-Z0-9]/, '');
	if (str.length > 7) str = str.slice(0, 7);
	return str;
};
