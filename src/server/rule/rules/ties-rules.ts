import {
	WORD_NUMBER_COUNT,
	LETTER_DIGIT_COUNT,
	WORD_NUMBER_TOUCH,
} from '../partition.js';
import { createRuleFactory, createRuleTitle } from '../rule-registry.js';
import {
	getCount,
	createWordExpr,
	createNumberExpr,
	createLetterExpr,
	createDigitExpr,
	affixTypeParam,
	createSpecialExpr,
	getMatchesIndex,
	getMatches,
	createRunExpr,
	getIntegerPart,
	getNumberName,
} from '../rule-util.js';

export const createMoreNumWordsNumbersRule = createRuleFactory({
	title: createRuleTitle`Must have **more** words than numbers`,
	validator:
		() =>
		({ password }) => {
			const numWords = getCount(password, createWordExpr());
			const numNumbers = getCount(password, createNumberExpr());
			if (numWords < numNumbers) return 'Has fewer words than numbers';
		},
	partitions: WORD_NUMBER_COUNT('more_word'),
});

export const createFewerNumWordsNumbersRule = createRuleFactory({
	title: createRuleTitle`Must have **more** numbers than words`,
	validator:
		() =>
		({ password }) => {
			const numWords = getCount(password, createWordExpr());
			const numNumbers = getCount(password, createNumberExpr());
			if (numNumbers < numWords) return 'Has fewer numbers than words';
		},
	partitions: WORD_NUMBER_COUNT('more_number'),
});

export const createMatchNumWordsNumbersRule = createRuleFactory({
	title: createRuleTitle`Must have the **same** number of words and numbers`,
	validator:
		() =>
		({ password }) => {
			const numWords = getCount(password, createWordExpr());
			const numNumbers = getCount(password, createNumberExpr());
			if (numWords > numNumbers) return 'Has more words than numbers';
			if (numNumbers > numWords) return 'Has more numbers than words';
		},
	partitions: WORD_NUMBER_COUNT('same'),
});

export const createFewerNumLettersDigitsRule = createRuleFactory({
	title: createRuleTitle`Must have **more** digits than letters`,
	validator:
		() =>
		({ password }) => {
			const numLetters = getCount(password, createLetterExpr());
			const numDigits = getCount(password, createDigitExpr());
			if (numDigits < numLetters) return 'Has fewer digits than letters';
		},
	partitions: LETTER_DIGIT_COUNT('more_digit'),
});

export const createMoreNumLettersDigitsRule = createRuleFactory({
	title: createRuleTitle`Must have **more** letters than digits`,
	validator:
		() =>
		({ password }) => {
			const numLetters = getCount(password, createLetterExpr());
			const numDigits = getCount(password, createDigitExpr());
			if (numLetters < numDigits) return 'Has fewer letters than digits';
		},
	partitions: LETTER_DIGIT_COUNT('more_letter'),
});

export const creatematchNumLettersDigitsRule = createRuleFactory({
	title: createRuleTitle`Must have the **same** number of letters and digits`,
	validator:
		() =>
		({ password }) => {
			const numLetters = getCount(password, createLetterExpr());
			const numDigits = getCount(password, createDigitExpr());
			if (numLetters > numDigits) return 'Has more letters than digits';
			if (numDigits > numLetters) return 'Has more digits than letters';
		},
	partitions: LETTER_DIGIT_COUNT('same'),
});

export const createLetterPairCountRule = createRuleFactory({
	title: createRuleTitle`Must have the same number of ${{ type: 'letter' }} and ${{ type: 'letter' }}`,
	validator:
		(letter0, letter1) =>
		({ password }) => {
			const epxr0 = new RegExp(letter0, 'ig');
			const epxr1 = new RegExp(letter1, 'ig');
			const count0 = getCount(password, epxr0);
			const count1 = getCount(password, epxr1);
			if (count0 !== count1) {
				return `Does not have the same number of ${letter0} and ${letter1}`;
			}
		},
});

export const affixWordRule = createRuleFactory({
	title: createRuleTitle`All words must be ${affixTypeParam}fixed by a unique special character`,
	validator:
		affixType =>
		({ password }) => {
			const specialExpr = createSpecialExpr();
			let specialCharacters = '';

			for (const [word, index] of getMatchesIndex(
				createWordExpr(),
				password,
			)) {
				const checkIndex =
					affixType === 'pre' ? index - 1 : index + word.length;

				const affix = password.at(checkIndex);
				if (
					affix == null ||
					specialCharacters.includes(affix) ||
					!specialExpr.test(affix)
				) {
					return `Not every word is ${affixType}fixed by a unique special character`;
				}

				specialCharacters += affix;
			}
		},
});

export const createStartAndEndNumberRule = createRuleFactory({
	title: createRuleTitle`Must start and end with a number`,
	validator:
		() =>
		({ password }) => {
			const numberExpr = createNumberExpr().source;
			const startExpr = new RegExp(`^${numberExpr}`);
			const endExpr = new RegExp(`${numberExpr}$`);

			if (!startExpr.test(password))
				return 'Does not start with a number';
			if (!endExpr.test(password)) return 'Does not end with a number';
		},
});

export const createMinRunRule = createRuleFactory({
	title: createRuleTitle`Any run of letters, digits, or special characters must be **at minimum** ${{ type: 'number', range: [4, 6] }} characters long`,
	validator:
		limit =>
		({ password }) => {
			for (const run of getMatches(createRunExpr(), password)) {
				if (run.length < limit) {
					return `"${run}" is ${run.length} characters long`;
				}
			}
		},
});

export const createMaxRunRule = createRuleFactory({
	title: createRuleTitle`Any run of letters, digits, or special characters must be **at most** ${{ type: 'number', range: [5, 9] }} characters long`,
	validator:
		limit =>
		({ password }) => {
			for (const run of getMatches(createRunExpr(), password)) {
				if (run.length > limit) {
					return `"${run}" is ${run.length} characters long`;
				}
			}
		},
});

export const createEquationRule = createRuleFactory({
	title: createRuleTitle`Must contain a valid equation with at least one artithmetic operator in **+-\*/** and **=**`,
	validator:
		() =>
		({ password }) => {
			const numberExpr = createNumberExpr().source;
			const equationRegex = new RegExp(
				`(${numberExpr}(?:\\s*[+\\-*/]\\s*${numberExpr}){1,})=\\s*(${numberExpr})`,
				'g',
			);

			let hasEquation = false;

			let match: RegExpExecArray | null = null;
			while ((match = equationRegex.exec(password)) != null) {
				hasEquation = true;

				const leftSide = match[1];
				const expectedResult = Number(match[2]);

				const parseExpr = /(-?\d+(?:\.\d+)?)|([+\-/*])/g;

				let parts: (number | string)[] = [];

				let match2: RegExpMatchArray | null = null;
				while ((match2 = parseExpr.exec(leftSide)) != null) {
					if (match2[1] != null) {
						parts.push(Number(match2[1]));
					} else {
						parts.push(match2[2]);
					}
				}

				const expression = parts.join(' ');

				let result: number;
				try {
					result = eval(expression) as number;
				} catch {
					continue;
				}

				if (result === expectedResult) return undefined;
			}

			return hasEquation
				? 'Equation is not valid'
				: 'Does not contain an equation';
		},
});

export const createNumberPairedNumberWordRule = createRuleFactory({
	title: createRuleTitle`Must contain the name of the integer part of each number`,
	description: 'All numbers must be less than one billion',
	validator:
		() =>
		({ password }) => {
			const numbers = [...getMatches(createNumberExpr(), password)];

			for (const number of numbers) {
				const integer = Number(getIntegerPart(number));
				if (integer >= 1000000000) {
					return `${number} is one billion or greater`;
				}

				const numberName = getNumberName(integer);
				const expr = new RegExp(
					numberName.replaceAll(' ', '[^a-z]?'),
					'i',
				);

				if (!expr.test(password)) {
					return `password does not include ${numberName}`;
				}
			}
		},
});

export const createWordNumberSeparateRule = createRuleFactory({
	title: createRuleTitle`Words and numbers can't touch`,
	validator:
		() =>
		({ password }) => {
			const expr = /[a-z][0-9]|[0-9][a-z]/i;
			if (expr.test(password)) {
				return 'Contains a word and number that touch';
			}
		},
	partitions: WORD_NUMBER_TOUCH('separate'),
});

export const createWordNumberTogetherRule = createRuleFactory({
	title: createRuleTitle`All numbers must be touching words and all words must be touching numbers`,
	validator:
		() =>
		({ password }) => {
			const wordExpr = createWordExpr();
			const numberExpr = createNumberExpr();
			const startNumberExpr = /-\d|\d/;
			const endNumberExpr = /\d/;
			const letterExpr = /[a-z]/i;

			for (const [word, index] of getMatchesIndex(wordExpr, password)) {
				const before = password.slice(index - 1, index);
				const after = password.slice(
					index + word.length,
					index + word.length + 2,
				);
				if (!endNumberExpr.test(before) && !startNumberExpr.test(after))
					return `Word "${word}" is not next to a number`;
			}

			for (const [numberStr, index] of getMatchesIndex(
				numberExpr,
				password,
			)) {
				const before = password.slice(index - 1, index);
				const after = password.slice(
					index + numberStr.length,
					index + numberStr.length + 2,
				);
				if (!letterExpr.test(before) && !letterExpr.test(after))
					return `Number "${numberStr}" is not next to a word`;
			}
		},
	partitions: WORD_NUMBER_TOUCH('touch'),
});
