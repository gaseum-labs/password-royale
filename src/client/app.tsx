import React from 'react';
import { LOGGING_IN, useMainStore } from './store.js';
import { MenuPage } from './page/menu-page.js';
import { GamePage } from './page/game-page.js';
import { LoginPage } from './page/login-page.js';
import { useNav } from './nav.js';
import { UnknownPage } from './page/unknown-page.js';
import { EditorPage } from './page/editor-page.js';
import { LoadingPage } from './page/loading-page.js';

export const App = () => {
	const user = useMainStore(state => state.user);

	const path = useNav();
	const firstPart = path[0];
	const secondPart = path.at(1);

	if (user === LOGGING_IN) {
		return <LoadingPage />;
	}

	if (firstPart === '') {
		if (user == null) return <LoadingPage />;
		return <MenuPage user={user} />;
	} else if (firstPart === 'login') {
		return <LoginPage />;
	} else if (firstPart === 'game' && secondPart?.length === 7) {
		if (user == null) return <LoadingPage />;
		return <GamePage user={user} code={secondPart.toUpperCase()} />;
	} else if (firstPart === 'editor') {
		if (user == null) return <LoadingPage />;
		return <EditorPage user={user} />;
	} else {
		return <UnknownPage />;
	}
};
