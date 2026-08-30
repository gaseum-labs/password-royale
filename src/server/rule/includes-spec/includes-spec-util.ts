import { ALPHABET } from '../rule-util.js';

const getEffectiveWord = (word: string): string => {
	return word.replace(/[ ']/g, '');
};

export const getMostImportantLetters = (words: string[]): string[] => {
	const effectiveWords = words.map(getEffectiveWord);
	const sorted = effectiveWords.toSorted((a, b) => a.length - b.length);
	const minLength = sorted[0].length;
	const maxLength = minLength + 2;
	const sample = effectiveWords.filter(word => word.length <= maxLength);

	const letters: { letter: string; count: number }[] = [...ALPHABET].map(
		letter => ({ letter, count: 0 }),
	);

	for (const word of sample) {
		for (let i = 0; i < word.length; ++i) {
			const code = word.charCodeAt(i);
			if (code >= 97 && code <= 122) {
				++letters[code - 97].count;
			}
		}
	}

	return letters
		.sort((a, b) => b.count - a.count)
		.map(({ letter }) => letter);
};
