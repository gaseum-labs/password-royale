import {
	createTheme,
	createThemeContract,
	fontFace,
} from '@vanilla-extract/css';
import regularFontFamily from './assets/ScoutieSans-VariableFont_wght.ttf?url';
import titleFontFamily from './assets/BebasNeue-Regular.ttf?url';

export const regularFontFace = fontFace({
	src: `url(${regularFontFamily})`,
});

export const titleFontFace = fontFace({
	src: `url(${titleFontFamily})`,
});

export const themeContract = createThemeContract({
	colors: {
		background: '',
		container: '',
		text: '',
		accentText: '',
		darker: '',
		errorBackground: '',
		errorText: '',
		successBackground: '',
		successText: '',
	},
	fontFamily: '',
	titleFontFamily: '',
});

export const darkTheme = createTheme(themeContract, {
	colors: {
		background: '#141414',
		container: '#424242',
		text: '#f4f4f4',
		accentText: '#559cff',
		darker: '#0a0a0a',
		errorBackground: '#612a27',
		errorText: '#ff4949',
		successBackground: '#084908',
		successText: '#4bed43',
	},
	fontFamily: `${regularFontFace}, Arial, Helvetica, sans-serif`,
	titleFontFamily: `${titleFontFace}, Arial, Helvetica, sans-serif`,
});
