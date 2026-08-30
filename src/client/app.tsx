import React from 'react';
import { LOGGING_IN, useStore } from './store.js';
import { useShallow } from 'zustand/shallow';
import { GameSelector } from './page/menu-page.js';
import { GamePage } from './page/game-page.js';
import { LoginPage } from './page/login-page.js';

export const App = () => {
	const [game, user] = useStore(
		useShallow(state => [state.game, state.user] as const),
	);

	if (user === LOGGING_IN || user == null || game === undefined) {
		return (
			<LoginPage user={typeof user === 'object' ? LOGGING_IN : user} />
		);
	} else if (game === null) {
		return <GameSelector user={user} />;
	} else {
		return <GamePage game={game} user={user} />;
	}
};
