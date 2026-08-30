import { DUPE_WORD } from '../partition.js';
import { createRuleFactory, createRuleTitle } from '../rule-registry.js';
import {
	getCount,
	getMatches,
	createWordExpr,
	SIDES,
	randElement,
	DIRECTIONS,
} from '../rule-util.js';

export const createIncludeNOfLetterRule = createRuleFactory({
	title: createRuleTitle`Must have **exactly** ${{ type: 'number', range: [4, 6] }} of the letter ${{ type: 'letter' }}`,
	description: 'Not case sensitive',
	validator:
		(numLetters, letter) =>
		({ password }) => {
			const count = getCount(password, new RegExp(letter, 'gi'));

			if (count > numLetters)
				return `Has more than ${numLetters} of the letter ${letter.toUpperCase()}`;
			if (count < numLetters)
				return `Has fewer than ${numLetters} of the letter ${letter.toUpperCase()}`;
		},
});

export const crateBanLetterRule = createRuleFactory({
	title: createRuleTitle`Cannot contain the letter **${{ type: 'letter' }}**`,
	description: 'Not case sensitive',
	validator:
		letter =>
		({ password }) => {
			if (password.toLowerCase().includes(letter.toLowerCase())) {
				return `Contains the letter ${letter.toUpperCase()}`;
			}
		},
});

export const createNoTwoInRow = createRuleFactory({
	title: createRuleTitle`Two of the same character cannot be next to each other`,
	validator:
		() =>
		({ password }) => {
			for (let i = 0; i < password.length - 1; ++i) {
				const c0 = password[i];
				const c1 = password[i + 1];
				if (c0 === c1) return `Repeat of character ${c0}`;
			}
		},
});

export const createWordUniqueCharacterRule = createRuleFactory({
	title: createRuleTitle`Words must contain unique letters`,
	validator:
		() =>
		({ password }) => {
			for (const word of getMatches(createWordExpr(), password)) {
				const letterSet = new Set([...word.toLowerCase()]);
				if (letterSet.size !== word.length)
					return `"${word}" contains duplicate letters`;
			}
		},
});

export const createWordUniqueLengthRule = createRuleFactory({
	title: createRuleTitle`Each word must have a unique length`,
	validator:
		() =>
		({ password }) => {
			const lengths = new Set<number>();
			for (const word of getMatches(createWordExpr(), password)) {
				const length = word.length;
				if (lengths.has(length)) {
					return `Contains two words of length ${length}`;
				}
				lengths.add(length);
			}
		},
	partitions: DUPE_WORD('unique'),
});

export const createWordUniqueRule = createRuleFactory({
	title: createRuleTitle`Each word must be unique`,
	validator:
		() =>
		({ password }) => {
			const words = new Set<string>();
			for (const word of getMatches(createWordExpr(), password)) {
				const normalWord = word.toLowerCase();
				if (words.has(normalWord)) {
					return `Contains two of the word "${word}"`;
				}
				words.add(normalWord);
			}
		},
	partitions: DUPE_WORD('unique'),
});

export const createDupeWordRule = createRuleFactory({
	title: createRuleTitle`Must have at least ${{ type: 'number', range: [2, 3] }} of the **same word**`,
	validator:
		requiredCount =>
		({ password }) => {
			const wordToCount = new Map<string, number>();
			for (const word of getMatches(createWordExpr(), password)) {
				const normalWord = word.toLowerCase();
				const count = wordToCount.get(normalWord) ?? 0;
				if (count + 1 >= requiredCount) return undefined;
				wordToCount.set(normalWord, count + 1);
			}
			return `Does not have at least ${requiredCount} of the same word`;
		},
	partitions: DUPE_WORD('dupe'),
});

export const createAllSameWordRule = createRuleFactory({
	title: createRuleTitle`Each word in your password must be the same`,
	description: 'Not case sensitive',
	validator:
		() =>
		({ password }) => {
			const set = new Set(
				[...getMatches(createWordExpr(), password)].map(word =>
					word.toLowerCase(),
				),
			);
			if (set.size > 1) {
				return 'Password contains two words that are different';
			}
		},
	partitions: DUPE_WORD('dupe'),
});

export const uniqueWordFirstLetterRule = createRuleFactory({
	title: createRuleTitle`The ${{ type: SIDES }} letter of each word must be unique`,
	genParameters: () => [randElement(SIDES)] as const,
	validator:
		position =>
		({ password }) => {
			let letters: string = '';
			for (const word of getMatches(createWordExpr(), password)) {
				const letter =
					word[
						position === 'first' ? 0 : word.length - 1
					].toLowerCase();
				if (letters.includes(letter)) {
					return `Password contains 2 words that ${position} with ${letter.toUpperCase()}`;
				}
				letters += letter;
			}
		},
	partitions: DUPE_WORD('unique'),
});

export const alphabeticalOrderRule = createRuleFactory({
	title: createRuleTitle`Words must be in strictly ${{ type: DIRECTIONS }} alphabetical order`,
	genParameters: () => [randElement(DIRECTIONS)] as const,
	validator:
		direction =>
		({ password }) => {
			const [mustCompare, failText] = (
				{
					increasing: [-1, 'comes after'],
					decreasing: [1, 'comes before'],
				} as const
			)[direction];

			const words = [...getMatches(createWordExpr(), password)];

			for (let i = 1; i < words.length; ++i) {
				const previousWord = words[i - 1].toLowerCase();
				const nextWord = words[i].toLowerCase();

				if (previousWord.localeCompare(nextWord) !== mustCompare) {
					return `${words[i - 1]} ${failText} "${words[i]}" alphabetically`;
				}
			}
		},
	partitions: DUPE_WORD('unique'),
});

export const numMinUniqueWordsRule = createRuleFactory({
	title: createRuleTitle`Must include at least ${{ type: 'number', range: [2, 4] }} unqiue words`,
	validator:
		numWords =>
		({ password }) => {
			const words = [...getMatches(createWordExpr(), password)].map(
				word => word.toLowerCase(),
			);
			const uniqueWords = new Set(words);

			if (uniqueWords.size < numWords) {
				return `Has only ${uniqueWords.size} unique words`;
			}
		},
});

export const numMaxUniqueWordsRule = createRuleFactory({
	title: createRuleTitle`Must include at most ${{ type: 'number', range: [2, 4] }} unqiue words`,
	validator:
		numWords =>
		({ password }) => {
			const words = [...getMatches(createWordExpr(), password)].map(
				word => word.toLowerCase(),
			);
			const uniqueWords = new Set(words);

			if (uniqueWords.size > numWords) {
				return `Has ${uniqueWords.size} unique words`;
			}
		},
});
