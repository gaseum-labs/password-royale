import React from 'react';
import { useImmer } from 'use-immer';
import { User } from '../../shared/api.js';
import { sendSocketMessage } from '../socket.js';
import { TopBar } from './top-bar.js';
import * as style from './menu-page.css.js';
import * as generalStyle from '../util.css.js';
import * as themeStyle from '../theme.css.js';
import clsx from 'clsx';
import { storeActions } from '../store.js';

type State = { gameCode: string };

export const GameSelector = ({ user }: { user: User }) => {
	const [state, setState] = useImmer<State>({
		gameCode: '',
	});

	React.useEffect(() => {
		let pathname = window.location.pathname;
		if (pathname.endsWith('/'))
			pathname = pathname.slice(0, pathname.length - 1);
		const path = pathname.slice(1).split('/');
		if (path.length === 2 && path[0] === 'game') {
			const gameCode = normalizeGameCode(path[1]);
			setState(state => {
				state.gameCode = gameCode;
			});
			submitGameCode(gameCode);
		}
	}, []);

	const onChangeGameCode = (event: React.ChangeEvent<HTMLInputElement>) => {
		let { value } = event.currentTarget;
		setState(state => {
			state.gameCode = normalizeGameCode(value);
		});
	};

	const onCreateGame = () => {
		sendSocketMessage({ type: 'establish' }).catch(
			storeActions.receiveError,
		);
	};

	const canSubmitGameCode = state.gameCode.length === 7;

	return (
		<div className={clsx(style.menuPage, themeStyle.darkTheme)}>
			<TopBar user={user} />
			<div className={style.menu}>
				<div className={style.inputRow}>
					<input
						className={generalStyle.input}
						value={state.gameCode}
						onChange={onChangeGameCode}
						placeholder="Enter Game Code"
					/>
					<button
						className={generalStyle.button}
						disabled={!canSubmitGameCode}
						onClick={() => submitGameCode(state.gameCode)}
					>
						Join Game
					</button>
				</div>
				<button onClick={onCreateGame} className={generalStyle.button}>
					Create Game
				</button>
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

const submitGameCode = (gameCode: string) => {
	sendSocketMessage({ type: 'join', gameCode }).catch(
		storeActions.receiveError,
	);
};
