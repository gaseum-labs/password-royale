import { style } from '@vanilla-extract/css';
import { themeContract } from './theme.css.js';

export const linkReset = style({
	textDecoration: 'none',
	color: themeContract.colors.accentText,
});

export const page = style({
	width: '100dvw',
	height: '100dvh',
	position: 'relative',

	background: themeContract.colors.background,
	color: themeContract.colors.text,
	fontFamily: themeContract.fontFamily,
});

export const input = style({
	fontFamily: 'monospace',

	display: 'grid',
	gridTemplateColumns: '100%',
	gridTemplateRows: '100%',
	alignItems: 'center',
	justifyItems: 'start',
	position: 'relative',
	backgroundColor: themeContract.colors.container,
	color: themeContract.colors.text,
	paddingBlock: 0,
	paddingInline: '0.5rem',
	fontSize: '1.0rem',
	boxSizing: 'border-box',
	border: '1px solid transparent',

	':focus-visible': {
		outline: 'none',
		border: `1px solid ${themeContract.colors.accentText}`,
	},

	height: '2.0rem',
	width: '100%',
});

export const button = style({
	display: 'grid',
	gridTemplateColumns: '100%',
	gridTemplateRows: '100%',
	alignItems: 'center',
	justifyItems: 'center',
	paddingInline: '0.5rem',
	boxSizing: 'border-box',
	borderRadius: 0,
	border: 'none',
	cursor: 'pointer',
	fontSize: '1.0rem',

	backgroundColor: themeContract.colors.container,
	color: themeContract.colors.text,

	':active': {
		backgroundColor: themeContract.colors.text,
		color: themeContract.colors.container,
	},

	':disabled': {
		opacity: 0.75,
		cursor: 'unset',
		backgroundColor: themeContract.colors.container,
		color: themeContract.colors.text,
	},

	height: '2.0rem',
	width: '100%',
});

export const suggestButton = style({
	backgroundColor: themeContract.colors.accentText,
	color: themeContract.colors.background,

	':active': {
		backgroundColor: themeContract.colors.background,
		color: themeContract.colors.accentText,
	},
});

export const titleText = style({
	fontFamily: themeContract.titleFontFamily,
	letterSpacing: 2.0,
});
