import {
	elementCodes,
	usStateCodes,
	adobeProductCodes,
} from '../includes-spec/two-codes.js';
import { ALL_PRIME, SPECIFIC_NUMBER, WORD_NUMBER_TOUCH } from '../partition.js';
import { createRuleFactory, createRuleTitle } from '../rule-registry.js';

export const createPiRule = createRuleFactory({
	title: createRuleTitle`Must include pi to ${{ type: 'number', range: [3, 6] }} digits after the decimal`,
	validator:
		digitCount =>
		({ password }) => {
			const piString = '3.141592'.slice(0, digitCount + 2);
			if (!password.includes(piString)) {
				return `Does not include pi to ${digitCount} digits after the decimal`;
			}
		},
	partitions: SPECIFIC_NUMBER('yes'),
});

export const twoLetterCodeRule = createRuleFactory({
	title: createRuleTitle`Must include a two-letter abrreviation for an **element** on the periodic table a **U.S. state** and an **Adobe product**`,
	description:
		'Some abbreviations account for more than one category. Not case sensitive',
	imageUrl: '/rules/two-codes.webp',
	validator:
		() =>
		({ password }) => {
			const hasElement = elementCodes.some(code =>
				password.toLowerCase().includes(code),
			);
			if (!hasElement) {
				return 'Does not contain the abbreviation for an element on the periodic table';
			}
			const hasState = usStateCodes.some(code =>
				password.toLowerCase().includes(code),
			);
			if (!hasState) {
				return 'Does not contain the abbreviation for a U.S. state';
			}
			const hasProduct = adobeProductCodes.some(code =>
				password.toLowerCase().includes(code),
			);
			if (!hasProduct) {
				return 'Does not contain the abbreviation for an adobe product';
			}
		},
});

export const phoneNumberRule = createRuleFactory({
	title: createRuleTitle`Must include a phone number`,
	validator:
		() =>
		({ password }) => {
			const regex =
				/\(\d{3}\) \d{3}-\d{4}|\d{3}-\d{3}-\d{4}|\d{10}|\d{3} \d{3} \d{4}/;
			if (!regex.test(password)) {
				return 'Does not include a phone number';
			}
		},
	partitions: WORD_NUMBER_TOUCH('separate'),
});

export const createEmailRule = createRuleFactory({
	title: createRuleTitle`Must include a valid email address`,
	validator:
		() =>
		({ password }) => {
			const regex =
				/(?:[a-z0-9!#$%&'*+\x2f=?^_`\x7b-\x7d~\x2d]+(?:\.[a-z0-9!#$%&'*+\x2f=?^_`\x7b-\x7d~\x2d]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9\x2d]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9\x2d]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9\x2d]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
			if (!regex.test(password))
				return 'Password does not contain an email';
		},
});

export const createUsernameRule = createRuleFactory({
	title: createRuleTitle`Password must include your **username**`,
	validator:
		() =>
		({ password, player }) => {
			const username = player.username;
			if (!password.toLowerCase().includes(username.toLowerCase())) {
				return `Password does not include "${username}"`;
			}
		},
	partitions: [WORD_NUMBER_TOUCH('touch'), SPECIFIC_NUMBER('yes')],
});

export const createGameCodeRule = createRuleFactory({
	title: createRuleTitle`Must include the game code`,
	validator:
		() =>
		({ password, player }) => {
			if (!password.includes(player.game.code))
				return 'Does not contain the game code';
		},
	partitions: [
		WORD_NUMBER_TOUCH('touch'),
		ALL_PRIME('any'),
		SPECIFIC_NUMBER('yes'),
	],
});
