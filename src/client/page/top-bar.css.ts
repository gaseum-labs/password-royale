import { style } from '@vanilla-extract/css';
import { linkReset, titleText } from '../util.css.js';
import { themeContract } from '../theme.css.js';

export const topBar = style({
	position: 'relative',
	height: '4rem',
	display: 'grid',
	gridTemplateColumns: 'minmax(0, 1fr) max-content minmax(0, 1fr)',
	gridTemplateRows: '100%',
	gap: '1.0rem',
	paddingInline: '1.0rem',
	width: '100%',
	boxSizing: 'border-box',

	backgroundColor: themeContract.colors.container,
	color: themeContract.colors.text,
});

export const titlePart = style({
	display: 'grid',
	gridTemplateColumns: '100%',
	gridTemplateRows: 'minmax(0,1fr) max-content minmax(0,1fr)',
	alignContent: 'center',
	justifyItems: 'center',
});

export const rightPart = style({
	display: 'flex',
	gap: '1.0rem',
	flexDirection: 'row',
	justifyContent: 'end',
	alignItems: 'center',
});

export const title = style([
	titleText,
	{
		fontSize: '2.0rem',
		fontWeight: 'bold',
		gridRow: 2,
		lineHeight: '2.0rem',
	},
]);

export const subtitle = style({
	fontSize: '0.75rem',
	gridRow: 3,
	cursor: 'pointer',
});

export const boldPart = style({
	fontWeight: 'bold',
});

export const avatar = style({
	width: '2.0rem',
	height: '2.0rem',
	borderRadius: '50%',
});

export const textButton = style([
	linkReset,
	{
		cursor: 'pointer',
		fontSize: '1.0rem',
	},
]);

export const errorBanner = style({
	position: 'absolute',
	backgroundColor: themeContract.colors.errorBackground,
	color: themeContract.colors.errorText,
	padding: '1.0rem',
	top: 'calc(100% + 1rem)',
	left: '50%',
	transform: 'translateX(-50%)',
	fontSize: '1.0rem',
	width: 'max-content',
	height: 'max-content',
	boxSizing: 'content-box',
	display: 'grid',
	gap: '1.0rem',
	gridTemplateColumns: 'max-content max-content',
	gridTemplateRows: '100%',
	alignItems: 'center',
});

export const errorBannerX = style({
	cursor: 'pointer',
	color: themeContract.colors.text,
});
