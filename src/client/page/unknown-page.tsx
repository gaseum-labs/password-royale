import React from 'react';
import { Link } from '../nav.js';
import * as style from './login-page.css.js';
import clsx from 'clsx';
import * as themeStyle from '../theme.css.js';

export const UnknownPage = () => {
	return (
		<div className={clsx(themeStyle.darkTheme, style.loginPage)}>
			<span>You navigated somewhere unknown</span>
			<Link to="/">Back to main menu</Link>
		</div>
	);
};
