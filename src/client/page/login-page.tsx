import React from 'react';
import { LOGGING_IN, LoggingIn, useMainStore } from '../store.js';
import * as themeStyle from '../theme.css.js';
import * as style from './login-page.css.js';
import clsx from 'clsx';
import { Link } from '../nav.js';

export const LoginPage = () => {
	const user = useMainStore(state => state.user);

	const content =
		user == null ? (
			<a href="/auth/login" className={style.text}>
				Log in using Discord
			</a>
		) : user === LOGGING_IN ? (
			<span className={style.text}>Loading...</span>
		) : (
			<>
				<span className={style.text}>
					Logged in as <b>{user.username}</b>
				</span>
				<Link to="/">Go to menu</Link>
				<a href="/auth/logout">Logout</a>
			</>
		);

	return (
		<div className={clsx(themeStyle.darkTheme, style.loginPage)}>
			{content}
		</div>
	);
};
