import { createRuleFactory, createRuleTitle } from '../rule-registry.js';

export const createBanSpecialRule = createRuleFactory({
	title: createRuleTitle`Cannot contain the special character **${{ type: 'special' }}**`,
	validator:
		character =>
		({ password }) => {
			if (password.toLowerCase().includes(character)) {
				return `Contains the special character ${character}`;
			}
		},
});

export const createCuteFaceRule = createRuleFactory({
	title: createRuleTitle`Must contain a cute face`,
	description:
		'Various choices for left side, left eye, mout, right eye, right side',
	validator:
		() =>
		({ password }) => {
			const faceLeftToRight = {
				'(': ')',
				'[': ']',
				'{': '}',
				'\\': '/',
				'/': '\\',
				'|': '|',
			};
			const eyeLeftToEyeRight = {
				'+': '+',
				'*': '*',
				'@': '@',
				'0': '0',
				o: 'o',
				'^': '^',
				'-': '-',
				'|': '|',
				'>': '<',
				'~': '~',
				'=': '=',
				'#': '#',
			};

			const leftExpr = /([(\[{\\/|])([+*@0oO^\-|>~=#])[_\-=3wW.]/g;

			let match: RegExpExecArray | null = null;
			while ((match = leftExpr.exec(password)) != null) {
				const faceLeft = match[1];
				const eyeLeft = match[2];

				const eyeRight = password[leftExpr.lastIndex];
				const faceRight = password[leftExpr.lastIndex + 1];

				if (
					eyeRight ===
						eyeLeftToEyeRight[
							eyeLeft as keyof typeof eyeLeftToEyeRight
						] &&
					faceRight ===
						faceLeftToRight[
							faceLeft as keyof typeof faceLeftToRight
						]
				) {
					return undefined;
				}
			}
			return 'Password does not contain a face';
		},
});

export const createSmileyRule = createRuleFactory({
	title: createRuleTitle`Must contain a text smiley`,
	description: 'Can be backwards',
	validator:
		() =>
		({ password }) => {
			const regex = /[:;][)(Dc|/[\]3\\><]|[)(Dc|/[\]3\\><][:;]/;
			if (!regex.test(password)) return 'Does not contain a text smiley';
		},
});
