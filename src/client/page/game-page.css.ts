import { style } from '@vanilla-extract/css';
import { input, page } from '../util.css.js';
import { themeContract } from '../theme.css.js';

export const gamePage = style([
	page,
	{
		display: 'grid',
		gridTemplateRows: 'max-content minmax(0,1fr) max-content',
		gridTemplateColumns: '100%',
	},
]);

export const contentGrid = style({
	display: 'grid',
	gridTemplateRows: 'max-content minmax(0,1fr)',
	gridTemplateColumns: 'minmax(15rem,3fr) minmax(15rem,2fr)',
	gap: '0.5rem',
	padding: '0.5rem',
	gridTemplateAreas: `"game-bar game-bar"	
	"rules passwords"`,
});

export const gameBar = style({
	gridArea: 'game-bar',
	fontSize: '1.0rem',
	height: '2rem',
	display: 'grid',
	gridTemplateColumns: '100%',
	gridTemplateRows: '100%',
	alignItems: 'center',
	justifyItems: 'center',
});

export const emphasis = style({
	fontWeight: 'bold',
});

export const panel = style({
	display: 'grid',
	gridTemplateColumns: '100%',
	gap: '0.5rem',
	gridTemplateRows: 'max-content minmax(0,1fr)',
	justifyItems: 'center',
	overflowY: 'auto',
	overflowX: 'hidden',
});

export const panelHeader = style({
	fontSize: '1.0rem',
	fontWeight: 'bold',
});

export const rulesContainer = style({
	display: 'grid',
	gridAutoFlow: 'row',
	gridTemplateColumns: 'repeat(auto-fit, minmax(20rem, 25rem))',
	gridAutoRows: 'max-content',
	gap: '0.5rem',
	flexWrap: 'wrap',
	justifyContent: 'center',
	width: '100%',
});

export const rule = style({
	display: 'grid',
	padding: '0.5rem',
	gridAutoRows: 'max-content',
	height: '100%',
	width: '100%',
	gap: '0.5rem',
	alignItems: 'center',
	backgroundColor: themeContract.colors.container,
	borderRadius: '0.25rem',
	boxSizing: 'border-box',
});

export const ruleTitle = style({
	justifySelf: 'center',
	fontWeight: 'bold',
	fontSize: '1.25rem',
	textAlign: 'center',
});

export const ruleEmphasis = style({
	color: themeContract.colors.accentText,
	fontSize: '1.25em',
	textShadow: `0 0 0.5ch ${themeContract.colors.darker}`,
});

export const ruleDescription = style({
	justifySelf: 'center',
	fontSize: '1.0rem',
});

export const ruleImage = style({
	width: '100%',
	height: 'auto',
});

export const kills = style({
	opacity: 0.75,
});

export const resultsList = style({
	width: '100%',
	display: 'grid',
	gridTemplateColumns: '100%',
	gap: '0.5rem',
	gridAutoRows: 'max-content',
});

export const submission = style({
	width: '100%',
	padding: '1.0rem',
	boxSizing: 'border-box',
	backgroundColor: themeContract.colors.container,
	color: themeContract.colors.text,
	display: 'grid',
	gridTemplateColumns: '100%',
	gridAutoRows: 'max-content',
	gap: '0.5rem',
	borderRadius: '0.25rem',
});

export const failedSubmission = style({
	backgroundColor: themeContract.colors.errorBackground,
	color: themeContract.colors.text,
});

export const goodSubmission = style({
	backgroundColor: themeContract.colors.successBackground,
	color: themeContract.colors.successText,
});

export const userRow = style({
	display: 'grid',
	gridTemplateColumns: 'max-content max-content max-content',
	gridTemplateRows: 'max-content',
	gap: '0.5rem',
	alignItems: 'center',
	justifyContent: 'start',
});

export const avatar = style({
	width: '2rem',
	height: '2rem',
	borderRadius: '50%',
});

export const username = style({
	fontSize: '1.0rem',
});

export const password = style({
	fontSize: '1.25rem',
	wordBreak: 'break-all',
	fontFamily: 'monospace',
});

export const passwordSpace = style({
	opacity: 0.5,
	display: 'inline-block',
	width: '1ch',
});

export const length = style({
	justifySelf: 'end',
	fontSize: '1rem',
});

export const failMessage = style({});

export const bottomBar = style({
	height: '4rem',
	display: 'grid',
	backgroundColor: themeContract.colors.darker,
	justifyContent: 'center',
	gap: '1.0rem',
	gridTemplateColumns: 'minmax(0, 50rem) max-content max-content max-content',
	gridTemplateRows: '100%',
	alignItems: 'center',
	paddingInline: '1.0rem',
});

export const passwordLength = style({
	fontFamily: 'monospace',
	fontSize: '1rem',
	width: '3ch',
	textAlign: 'center',
});

export const passwordInput = style([
	input,
	{
		lineHeight: '1.5rem',
		height: '3.0rem',
		resize: 'none',
		overflowY: 'auto',
		scrollbarGutter: 'stable',
		overflowWrap: 'break-word',
		wordBreak: 'break-all',
		paddingInline: '0.5ch',
	},
]);
