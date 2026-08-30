import { style } from '@vanilla-extract/css';
import { linkReset, page } from '../util.css.js';

export const loginPage = style([
	page,
	{
		display: 'grid',
		gridTemplateColumns: 'max-content',
		gridTemplateRows: 'max-content',
		justifyContent: 'center',
		alignContent: 'center',
	},
]);

export const text = style([
	linkReset,
	{
		fontSize: '1rem',
	},
]);
