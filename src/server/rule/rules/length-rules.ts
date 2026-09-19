import { createRuleFactory, createRuleTitle } from '../rule-registry.js';
import {
	PARITIES,
	isPrime,
	getMatches,
	createNumberExpr,
} from '../rule-util.js';

export const createLengthParityRule = createRuleFactory({
	title: createRuleTitle`Length must be an ${{ type: PARITIES }} number of characters`,
	validator:
		parity =>
		({ password }) => {
			const remainder = parity === 'even' ? 0 : 1;
			if (password.length % 2 !== remainder) {
				return `Length is not ${parity}`;
			}
		},
});

export const createLengthParityExtRule = createRuleFactory({
	title: createRuleTitle`Length must be a multiple of ${{ type: 'number', range: [3, 4] }} characters`,
	validator:
		multiple =>
		({ password }) => {
			if (password.length % multiple !== 0) {
				return `Length is not a multiple of ${multiple} characters`;
			}
		},
});

export const createLengthPrimeRule = createRuleFactory({
	title: createRuleTitle`Length must be a prime number of characters`,
	validator:
		() =>
		({ password }) => {
			if (!isPrime(password.length)) {
				return `Length is not a prime number`;
			}
		},
});

export const lengthIncludeRule = createRuleFactory({
	title: createRuleTitle`Your password must contain its length`,
	validator:
		() =>
		({ password }) => {
			const length = password.length.toString();
			if (!password.includes(length)) {
				return 'Password does not include its length';
			}
		},
});

export const createNumbersUnderLengthRule = createRuleFactory({
	title: createRuleTitle`All numbers must be less than the length`,
	validator:
		() =>
		({ password }) => {
			const length = password.length;
			for (const numberStr of getMatches(createNumberExpr(), password)) {
				const number = Number(numberStr);
				if (number >= length) return `${number} >= ${length}`;
			}
		},
});
