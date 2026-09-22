import React from 'react';
import * as themeStyle from '../theme.css.js';
import * as style from './login-page.css.js';
import clsx from 'clsx';
import { useMainStore } from '../store.js';
import { navigate } from '../nav.js';

export const LoadingPage = () => {
	const user = useMainStore(state => state.user);

	React.useEffect(() => {
		if (user == null) {
			navigate('/login');
		}
	}, [user]);

	return (
		<div className={clsx(themeStyle.darkTheme, style.loginPage)}>
			<span className={style.text}>Loading...</span>
		</div>
	);
};
