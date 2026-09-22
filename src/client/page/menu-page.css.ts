import { style } from '@vanilla-extract/css';
import { page } from '../util.css.js';

export const menuPage = style([
	page,
	{
		display: 'grid',

		gridTemplateRows: 'max-content minmax(0, 1fr)',
		gridTemplateColumns: '100%',
		alignItems: 'center',
		justifyItems: 'center',
	},
]);

export const menu = style({
	display: 'grid',
	width: '20rem',
	height: 'max-content',
	gap: '1.0rem',
	gridTemplateColumns: '100%',
	gridTemplateRows: 'max-content max-content',
});

export const inputRow = style({
	display: 'grid',
	gridTemplateColumns: 'minmax(0,1fr) max-content',
	gridTemplateRows: '100%',
	gap: '1.0rem',
});

export const resumeButton = style({
	display: 'grid',
	gridTemplateRows: 'max-content max-content',
	gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
	justifyItems: 'center',
	alignContent: 'center',
	gridTemplateAreas: `"a a"
	"b c"`,
});

export const a = style({
	gridArea: 'a',
});
