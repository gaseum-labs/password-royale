import { globalStyle, style } from '@vanilla-extract/css';

export const icon = style({
	display: 'inline-block',
	width: '1.25rem',
	height: '1.25rem',
	verticalAlign: 'bottom',
});

globalStyle(`.${icon} > svg`, {
	overflow: 'visible',
});
