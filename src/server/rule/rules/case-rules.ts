import { ALL_WORD_CASE, CASE_ALTERNATING } from '../partition.js';
import { createRuleFactory, createRuleTitle } from '../rule-registry.js';
import {
	vowelModeParam,
	letterCaseParam,
	randElement,
	VOWEL_MODES,
	LETTER_CASES,
	CONSONANTS,
	VOWELS,
	toCase,
	getMatches,
	createWordExpr,
	SIDES,
	getCount,
	splitPassword,
	otherCase,
	otherSide,
	filterLettersByCount,
	LENGTHS,
} from '../rule-util.js';

export const createVowelCasedRule = createRuleFactory({
	title: createRuleTitle`All ${vowelModeParam}s in your password must be ${letterCaseParam}`,
	genParameters: () =>
		[randElement(VOWEL_MODES), randElement(LETTER_CASES)] as const,
	validator:
		(vowelMode, letterCase) =>
		({ password }) => {
			let badLetters = vowelMode === 'consonant' ? CONSONANTS : VOWELS;
			if (letterCase === 'lowercase') {
				badLetters = badLetters.toUpperCase();
			}

			const badRegex = new RegExp(`[${badLetters}]`);
			if (badRegex.test(password)) {
				return `Password contains a ${vowelMode} that's not ${letterCase}`;
			}
		},
});

export const createAllWordContainCaseRule = createRuleFactory({
	title: createRuleTitle`All words must contain a ${letterCaseParam} letter`,
	genParameters: () => [randElement(LETTER_CASES)] as const,
	validator:
		letterCase =>
		({ password }) => {
			const mustIncludeExpr = new RegExp(
				`[${toCase('a-z', letterCase)}]`,
			);

			for (const word of getMatches(createWordExpr(), password)) {
				if (!mustIncludeExpr.test(word))
					return `"${word}" does not include a ${letterCase} letter`;
			}
		},
	partitions: ALL_WORD_CASE('all'),
});

export const createContainsAllCasedWordRule = createRuleFactory({
	title: createRuleTitle`Must contain a word with all ${letterCaseParam} letters`,
	genParameters: () => [randElement(LETTER_CASES)] as const,
	validator:
		letterCase =>
		({ password }) => {
			const mustIncludeExpr = new RegExp(
				`^[${toCase('a-z', letterCase)}]+$`,
			);

			for (const word of getMatches(createWordExpr(), password)) {
				if (mustIncludeExpr.test(word)) return undefined;
			}

			return `Does not contain a word with all ${letterCase} letters`;
		},
	partitions: [ALL_WORD_CASE('some'), CASE_ALTERNATING('touching')],
});

export const createAllSideCasedRule = createRuleFactory({
	title: createRuleTitle`The ${{ type: SIDES }} letter of each word must be ${letterCaseParam}`,
	genParameters: () =>
		[randElement(SIDES), randElement(LETTER_CASES)] as const,
	validator:
		(side, letterCase) =>
		({ password }) => {
			const startExpr = new RegExp(
				`^[${toCase('a-z', letterCase)}][a-zA-Z]*$`,
			);
			const endExpr = new RegExp(
				`^[a-zA-Z]*[${toCase('a-z', letterCase)}]$`,
			);
			const expr = side === 'first' ? startExpr : endExpr;

			for (const word of getMatches(createWordExpr(), password)) {
				if (!expr.test(word))
					return `The ${side} letter of "${word}" is not ${letterCase}`;
			}
		},
	partitions: ALL_WORD_CASE('all'),
});

export const createHalfLettersCasedRule = createRuleFactory({
	title: createRuleTitle`At least half of all letters must be ${letterCaseParam}`,
	genParameters: () => [randElement(LETTER_CASES)] as const,
	validator:
		letterCase =>
		({ password }) => {
			const counts = {
				lowercase: getCount(password, /[a-z]/g),
				uppercase: getCount(password, /[A-Z]/g),
			};
			const totalCount = counts.lowercase + counts.uppercase;

			if (counts[letterCase] < totalCount / 2)
				return `Less then half of all letters are ${letterCase}`;
		},
});

export const createCasedHalfRule = createRuleFactory({
	title: createRuleTitle`All ${{ type: LETTER_CASES }} letters must be in the ${{ type: SIDES }} half`,
	genParameters: () =>
		[randElement(LETTER_CASES), randElement(SIDES)] as const,
	validator:
		(letterCase, side) =>
		({ password }) => {
			const { otherHalf } = splitPassword(side, password);
			const badCaseExpr = new RegExp(`[${toCase('a-z', letterCase)}]`);

			if (badCaseExpr.test(otherHalf)) {
				return `${otherSide(side)} half contains a ${letterCase} letter`;
			}
		},
});

export const createAlternatingCaseRule = createRuleFactory({
	title: createRuleTitle`Two letters of the same case cannot touch each other`,
	validator:
		() =>
		({ password }) => {
			const badExpr = /[a-z][a-z]|[A-Z][A-Z]/;
			if (badExpr.test(password))
				return `Contains two upppercase or lowercase letters in a row`;
		},
	partitions: CASE_ALTERNATING('alternating'),
});

export const createAtMostNCasedPerWordRule = createRuleFactory({
	title: createRuleTitle`At most ${{ type: 'number', range: [2, 4] }} letters per word may be ${{ type: LETTER_CASES }}`,
	validator:
		(maxCount, letterCase) =>
		({ password }) => {
			for (const word of getMatches(createWordExpr(), password)) {
				const caseCount = getCount(
					word,
					new RegExp(`[${toCase('a-z', letterCase)}]`, 'g'),
				);
				if (caseCount > maxCount)
					return `word "${word}" has more than ${maxCount} ${letterCase} letters`;
			}
		},
});

export const createAllWordAllCaseRule = createRuleFactory({
	title: createRuleTitle`All words must be either all uppercase or all lowercase`,
	validator:
		() =>
		({ password }) => {
			const expr = /^[a-z]+$|^[A-Z]+$/;
			for (const word of getMatches(createWordExpr(), password)) {
				if (!expr.test(word))
					return `"${word}" contains a mix of lowercase and uppercase letters`;
			}
		},
	partitions: [ALL_WORD_CASE('some'), CASE_ALTERNATING('touching')],
});

export const createUniqueLettersCaseRule = createRuleFactory({
	title: createRuleTitle`All unique letters per word must be ${{ type: LETTER_CASES }}`,
	validator:
		letterCase =>
		({ password }) => {
			const caseExpr = { lowercase: /[a-z]/, uppercase: /[A-Z]/ }[
				letterCase
			];

			for (const word of getMatches(createWordExpr(), password)) {
				const uniqueLetters = filterLettersByCount(
					word,
					count => count === 1,
				);

				for (const letter of word) {
					if (uniqueLetters.has(letter) && !caseExpr.test(letter)) {
						return `${letter} in ${word} is not ${letterCase}`;
					}
				}
			}
		},
});

export const createRepeatLettersCaseRule = createRuleFactory({
	title: createRuleTitle`All repeat letters per word must be ${{ type: LETTER_CASES }}`,
	validator:
		letterCase =>
		({ password }) => {
			const caseExpr = { lowercase: /[a-z]/, uppercase: /[A-Z]/ }[
				letterCase
			];

			for (const word of getMatches(createWordExpr(), password)) {
				const uniqueLetters = filterLettersByCount(
					word,
					count => count > 1,
				);

				for (const letter of word) {
					if (uniqueLetters.has(letter) && !caseExpr.test(letter)) {
						return `${letter} in ${word} is not ${letterCase}`;
					}
				}
			}
		},
});

export const createLetterCaseRule = createRuleFactory({
	title: createRuleTitle`The letter ${{ type: 'letter' }} must be ${{ type: LETTER_CASES }}`,
	validator:
		(letter, letterCase) =>
		({ password }) => {
			const badExpr = new RegExp(toCase(letter, otherCase(letterCase)));
			if (badExpr.test(password)) {
				return `Contains a ${otherCase(letterCase)} ${letter.toUpperCase()}`;
			}
		},
});

export const createExtremeLengthWordCaseRule = createRuleFactory({
	title: createRuleTitle`The ${{ type: LENGTHS }}est word must be all ${{ type: LETTER_CASES }}`,
	description: 'In the case of ties, at least one must be',
	validator:
		(length, letterCase) =>
		({ password }) => {
			const words = [...getMatches(createWordExpr(), password)];
			if (words.isEmpty()) return;
			words.sort((a, b) => a.length - b.length);
			const wordLength =
				words[length === 'short' ? 0 : words.length - 1].length;
			const maxWords = words.filter(word => word.length === wordLength);
			const goodExpr = new RegExp(toCase('^[a-z]+$', letterCase));
			if (!maxWords.some(word => goodExpr.test(word))) {
				return `None of ${maxWords.map(word => `"${word}"`).join(', ')} are all ${letterCase}`;
			}
		},
	partitions: [CASE_ALTERNATING('touching'), ALL_WORD_CASE('some')],
});
