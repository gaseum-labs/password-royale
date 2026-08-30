import crypto from 'crypto';
import { RuleParameter } from './rule-registry.js';

export const containsCase = (str: string, isUpperCase: boolean): boolean => {
	const expr = isUpperCase ? /[A-Z]/ : /[a-z]/;
	return expr.test(str);
};

export const createWordExpr = () => /[a-z]+/gi;

export const createNumberExpr = () => /-?\d+(?:\.\d+)?/g;

export function* getMatches(expr: RegExp, str: string): Generator<string> {
	let match: RegExpExecArray | null = null;
	while ((match = expr.exec(str)) != null) {
		yield match[0];
	}
}

export function* getMatchesIndex(
	expr: RegExp,
	str: string,
): Generator<[string, number]> {
	let match: RegExpExecArray | null = null;
	while ((match = expr.exec(str)) != null) {
		yield [match[0], match.index];
	}
}

export function* getMatchesFull(
	expr: RegExp,
	str: string,
): Generator<RegExpMatchArray> {
	let match: RegExpExecArray | null = null;
	while ((match = expr.exec(str)) != null) {
		yield match;
	}
}

export const escapeRegexBlock = (str: string): string => {
	return str.replace(/-/, '\\-').replace(/-/, '\\-');
};

export const createSpecialExpr = () => /[~!@#$%^&*()_+{}|:"<>?`\-=[\]\\;',./]/;

export const splitPassword = (
	side: Side,
	str: string,
): { half: string; otherHalf: string } => {
	const isEven = str.length % 2 === 0;
	const midPoint = Math.floor(str.length / 2);

	return side === 'first'
		? { half: str.slice(0, midPoint), otherHalf: str.slice(midPoint) }
		: isEven
			? { otherHalf: str.slice(0, midPoint), half: str.slice(midPoint) }
			: {
					otherHalf: str.slice(0, midPoint + 1),
					half: str.slice(midPoint + 1),
				};
};

export const isPrime = (num: number) => {
	for (let i = 2, s = Math.sqrt(num); i <= s; i++) {
		if (num % i === 0) return false;
	}
	return num > 1;
};

export const countInstances = (expr: RegExp, str: string): number => {
	let count = 0;
	let match: RegExpExecArray | null = null;
	while ((match = expr.exec(str)) != null) {
		++count;
	}
	return count;
};

export const wordListToWordExprList = (words: (string | number)[]) => {
	return words.map(
		word =>
			new RegExp(
				word
					.toString()
					.replaceAll('.', '\\.')
					.replaceAll(' ', '[^a-z]?')
					.replaceAll("'", "'?"),
				'i',
			),
	);
};

export const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';
export const CONSONANTS = 'bcdfghjklmnpqrstvwxyz';
export const VOWELS = 'aeiou';
export const DIGITS = '0123456789';
export const SPECIALS = '`~!@#$%^&*()-=_+[]\\{}|;:\'",./><?';

export const numberPostfix = (num: number): string =>
	num % 10 === 1
		? 'st'
		: num % 10 === 2
			? 'nd'
			: num % 10 === 3
				? 'rd'
				: 'th';

export const getIntegerPart = (numberStr: string): string => {
	const dotIndex = numberStr.indexOf('.');
	if (dotIndex === -1) return numberStr;
	return numberStr.slice(0, dotIndex);
};

export const randElement = <E>(array: readonly E[] | E[]): E => {
	return array[crypto.randomInt(array.length)];
};

export const characterTypeParam = {
	type: ['letter', 'digit', 'special character'] as const,
} satisfies RuleParameter;

export const VOWEL_MODES = ['consonant', 'vowel'] as const;
export type VowelMode = (typeof VOWEL_MODES)[number];
export const vowelModeParam = {
	type: VOWEL_MODES,
} satisfies RuleParameter;

export const LETTER_CASES = ['uppercase', 'lowercase'] as const;
export type LetterCase = (typeof LETTER_CASES)[number];
export const letterCaseParam = {
	type: LETTER_CASES,
} satisfies RuleParameter;

export const DIRECTIONS = ['increasing', 'decreasing'] as const;
export type Direciton = (typeof DIRECTIONS)[number];
export const directionsParam = { type: DIRECTIONS } satisfies RuleParameter;

export const AFFIX_TYPES = ['pre', 'post'] as const;
export type AffixType = (typeof AFFIX_TYPES)[number];
export const affixTypeParam = { type: AFFIX_TYPES } satisfies RuleParameter;

export const PARITIES = ['even', 'odd'] as const;
export const SIDES = ['first', 'last'] as const;
export type Side = (typeof SIDES)[number];

export const LENGTHS = ['short', 'long'] as const;

export const randRange = (low: number, high: number) =>
	crypto.randomInt(low, high + 1);

export const randChar = (str: string) => str[crypto.randomInt(str.length)];

export const getCount = (password: string, expr: RegExp): number => {
	if (!expr.global) throw Error('Requires global expression');

	let count = 0;

	while (expr.test(password)) {
		++count;
	}

	return count;
};

export const createLetterExpr = () => /[a-z]/gi;
export const createDigitExpr = () => /[0-9]/g;

export const toCase = (str: string, letterCase: LetterCase): string => {
	return letterCase === 'lowercase' ? str.toLowerCase() : str.toUpperCase();
};

export const otherCase = (letterCase: LetterCase): LetterCase => {
	return letterCase === 'lowercase' ? 'uppercase' : 'lowercase';
};

export const otherSide = (side: Side): Side => {
	return side === 'first' ? 'last' : 'first';
};

export const filterLettersByCount = (
	word: string,
	predicate: (count: number) => boolean,
): Set<string> => {
	const letterToCount = new Map<string, number>();
	for (const letter of word) {
		letterToCount.set(letter, (letterToCount.get(letter) ?? 0) + 1);
	}
	return new Set(
		letterToCount
			.entries()
			.filter(([, count]) => predicate(count))
			.map(([letter]) => letter),
	);
};

export const createRunExpr = () =>
	/[a-z]+|\d+|[~!@#$%^&*()_+{}|:"<>?`\-=[\]\\;',./]+/gi;

const numberToWord: { [key: number]: string } = {
	0: 'zero',
	1: 'one',
	2: 'two',
	3: 'three',
	4: 'four',
	5: 'five',
	6: 'six',
	7: 'seven',
	8: 'eight',
	9: 'nine',
	10: 'ten',
	11: 'eleven',
	12: 'twelve',
	13: 'thirteen',
	14: 'fourteen',
	15: 'fifteen',
	16: 'sixteen',
	17: 'seventeen',
	18: 'eighteen',
	19: 'nineteen',
	20: 'twenty',
	30: 'thirty',
	40: 'forty',
	50: 'fifty',
	60: 'sixty',
	70: 'seventy',
	80: 'eighty',
	90: 'ninety',
};

const getThousandsName = (num: number) => {
	const tens = num % 100;
	const oneDigit = num % 10;
	const tenDigit = Math.floor(num / 10) % 10;
	const hundredDigit = Math.floor(num / 100) % 10;

	const hundredsName =
		hundredDigit === 0
			? undefined
			: numberToWord[hundredDigit] + ' hundred';

	return [
		hundredsName,
		tens < 20
			? tens === 0 && hundredsName != null
				? null
				: numberToWord[tens]
			: numberToWord[tenDigit * 10] +
				(oneDigit === 0 ? '' : ` ${numberToWord[oneDigit]}`),
	]
		.filter(name => name != null)
		.join(' ');
};

export const getNumberName = (num: number): string => {
	const ones = num % 1000;
	const onesName = getThousandsName(ones);

	const thousands = Math.floor(num / 1000) % 1000;
	const thousandsName = getThousandsName(thousands);

	const millions = Math.floor(num / 1000000) % 1000;
	const millionsName = getThousandsName(millions);

	return [
		millions === 0 ? null : `${millionsName} million`,
		thousands === 0 ? null : `${thousandsName} thousand`,
		(millions !== 0 || thousands !== 0) && ones === 0 ? null : onesName,
	]
		.filter(name => name != null)
		.join(' ');
};

export const shuffleArray = <E>(array: E[]): void => {
	for (let i = array.length - 1; i > 0; i--) {
		const j = crypto.randomInt(i + 1);
		[array[i], array[j]] = [array[j], array[i]];
	}
};

export const takeRandomElement = <E>(array: E[]): E => {
	const index = crypto.randomInt(array.length);
	return array.splice(index, 1)[0];
};
