import { style } from '@vanilla-extract/css';
import * as general from '../util.css.js';
import { themeContract } from '../theme.css.js';

export const editorPage = style({
	display: 'grid',
	gridTemplateColumns: 'minmax(0,1fr) minmax(30rem, 60rem) minmax(0,1fr)',
	gridTemplateRows: 'max-content minmax(0,1fr)',
});

export const topBar = style({
	gridColumn: '1 / 4',
});

export const listContent = style({
	gridColumn: '2 / 3',

	width: '100%',
	height: '100%',

	display: 'grid',

	padding: '1rem',
	gridTemplateColumns: '100%',
	gridAutoRows: 'max-content',
	gap: '1rem',
	boxSizing: 'border-box',
	overflowY: 'auto',
});

export const listItem = style({
	display: 'grid',
	gridTemplateColumns: '100%',
	gridTemplateRows: '2rem 4rem',
	gap: '0.5rem',
	padding: '0.5rem',
	cursor: 'pointer',
	background: themeContract.colors.container,
	borderRadius: '0.25rem',
});
export const listRow = style({
	display: 'flex',
	gap: '1ch',
	alignItems: 'center',
});
export const listFlex = style({
	flex: 1,
});
export const listFit = style({
	width: 'max-content',
});
export const listImg = style([
	listFlex,
	{
		objectFit: 'contain',
		width: '100%',
		height: '100%',
	},
]);

export const formContent = style({
	gridColumn: '2 / 3',
	display: 'grid',
	gridTemplateColumns: '100%',
	gridAutoRows: 'max-content',
	padding: '1rem',
	gap: '1rem',
	overflowY: 'auto',
});

export const formRow = style({
	display: 'flex',
	height: 'max-content',
	gap: '1rem',
	alignItems: 'center',
});

export const checkbox = style({
	verticalAlign: 'middle',
});

export const inlineInput = style({
	width: 'max-content',
});

export const rightBox = style({
	display: 'flex',
	justifyContent: 'end',
	flex: 1,
});

export const discardButton = style({
	width: 'max-content',
});

export const avatar = style({
	width: '2rem',
	height: '2rem',
	borderRadius: '50%',
});

export const bottomRow = style({});

export const textArea = style({
	resize: 'vertical',
});

export const explainer = style({
	fontSize: '0.8em',
	opacity: 0.8,
	fontFamily: 'monospace',
});

export const counter = style({
	fontFamily: 'monospace',
});

export const invisChar = style({
	opacity: 0,
});

export const createRule = style([
	general.button,
	{
		width: 'max-content',
		justifySelf: 'center',
	},
]);

export const splashText = style({
	fontWeight: 'bold',
	fontSize: '1.2rem',
	textAlign: 'center',
	paddingBlock: '1.5rem',
});

export const wide = style({
	flex: 1,
	display: 'inline-flex',
	gap: '1ch',
	alignItems: 'center',
});

export const wideInput = style([
	general.inlineInput,
	{
		flex: 1,
	},
]);

export const pictureBox = style({
	display: 'grid',
	gridTemplateColumns: '100%',
	gridTemplateRows: '100%',
	height: '10rem',
	borderRadius: '0.25rem',
	backgroundColor: themeContract.colors.container,
	cursor: 'pointer',
	position: 'relative',
});

export const xBtn = style({
	position: 'absolute',
	opacity: 0.8,
	top: '0.5rem',
	right: '0.5rem',
});

export const displayImg = style({
	objectFit: 'contain',
	width: '100%',
	height: '100%',
});

export const placeholderImg = style({
	objectFit: 'scale-down',
	width: '100%',
	height: '100%',
	imageRendering: 'pixelated',
	opacity: 0.5,
});

export const hiddenInput = style({
	display: 'none',
});

export const pictureSuper = style({
	flex: 1,
	display: 'grid',
	gridTemplateColumns: '100%',
	gridTemplateRows: 'max-content max-content',
	gap: '0.5rem',
});

export const approvedText = style({
	color: themeContract.colors.accentText,
});

export const clickable = style({
	cursor: 'pointer',
});
