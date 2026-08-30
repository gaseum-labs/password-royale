import React from 'react';
import { LOGGING_IN, LoggingIn } from '../store.js';
import * as themeStyle from '../theme.css.js';
import * as style from './login-page.css.js';
import clsx from 'clsx';

export const LoginPage = ({ user }: { user: LoggingIn | undefined }) => {
	const content =
		user === LOGGING_IN ? (
			<span className={style.text}>Loading...</span>
		) : (
			<a href="/login" className={style.text}>
				Log in using Discord
			</a>
		);

	return (
		<div className={clsx(themeStyle.darkTheme, style.loginPage)}>
			{content}
		</div>
	);
};
