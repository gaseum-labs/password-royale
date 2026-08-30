import { spaceship } from '../../util.js';
import { SPECIFIC_NUMBER, DUPE_NUMBER, ALL_PRIME } from '../partition.js';
import { createRuleFactory, createRuleTitle } from '../rule-registry.js';
import {
	getMatches,
	createNumberExpr,
	getIntegerPart,
	isPrime,
	createWordExpr,
	directionsParam,
} from '../rule-util.js';

export const sumRule = createRuleFactory({
	title: createRuleTitle`The sum of digits must equal ${{ type: 'number', range: [25, 30] }}`,
	validator:
		requiredSum =>
		({ password }) => {
			let sum = 0;
			for (const digit of getMatches(/\d/g, password)) {
				sum += Number(digit);
			}

			if (sum !== requiredSum) return `The sum of digits is ${sum}`;
		},
	partitions: SPECIFIC_NUMBER('no'),
});

export const createBanDigitRule = createRuleFactory({
	title: createRuleTitle`Cannot contain the digit **${{ type: 'digit' }}**`,
	validator:
		digit =>
		({ password }) => {
			if (password.toLowerCase().includes(digit)) {
				return `Contains the digit ${digit}`;
			}
		},
	partitions: SPECIFIC_NUMBER('no'),
});

export const createNumberUniqueLengthRule = createRuleFactory({
	title: createRuleTitle`Each number must have a unique length`,
	validator:
		() =>
		({ password }) => {
			const lengths = new Set<number>();
			for (const number of getMatches(createNumberExpr(), password)) {
				const length = number.length;
				if (lengths.has(length)) {
					return `Contains two numbers of length ${length}`;
				}
				lengths.add(length);
			}
		},
	partitions: DUPE_NUMBER('unique'),
});

export const createNumberUniqueRule = createRuleFactory({
	title: createRuleTitle`Each number must be unique`,
	validator:
		() =>
		({ password }) => {
			const numbers = new Set<number>();
			for (const numberString of getMatches(
				createNumberExpr(),
				password,
			)) {
				const number = Number(numberString);
				if (numbers.has(number)) {
					return `Contains the number ${number} twice`;
				}
				numbers.add(number);
			}
		},
	partitions: DUPE_NUMBER('unique'),
});

export const primeNumberRule = createRuleFactory({
	title: createRuleTitle`The integer part of each number must be prime`,
	validator:
		() =>
		({ password }) => {
			for (const numberStr of getMatches(createNumberExpr(), password)) {
				const integer = Number(getIntegerPart(numberStr));

				if (!isPrime(integer)) {
					return `${integer} is not prime`;
				}
			}
		},
	partitions: ALL_PRIME('prime'),
});

export const createDupeNumberRule = createRuleFactory({
	title: createRuleTitle`Must have at least ${{ type: 'number', range: [2, 3] }} of the same number`,
	validator:
		requiredCount =>
		({ password }) => {
			const numberToCount = new Map<string, number>();
			for (const number of getMatches(createWordExpr(), password)) {
				const count = numberToCount.get(number) ?? 0;
				if (count + 1 >= requiredCount) return undefined;
				numberToCount.set(number, count + 1);
			}
			return `Does not have at least ${requiredCount} of the same number`;
		},
	partitions: DUPE_NUMBER('dupe'),
});

export const createFloatNumbersRule = createRuleFactory({
	title: createRuleTitle`All numbers must have a **decimal** part`,
	validator:
		() =>
		({ password }) => {
			for (const numberStr of getMatches(createNumberExpr(), password)) {
				if (!numberStr.includes('.')) {
					return `${numberStr} is an integer`;
				}
			}
		},
});

export const createNumbersIncreasingRule = createRuleFactory({
	title: createRuleTitle`Numbers must be strictly ${directionsParam}`,
	validator:
		direction =>
		({ password }) => {
			const [startValue, mustCompare, failText] = (
				{
					increasing: [-Infinity, -1, 'is less than'],
					decreasing: [Infinity, 1, 'is greater than'],
				} as const
			)[direction];

			let lastNumber = startValue;
			for (const match of getMatches(createNumberExpr(), password)) {
				const value = Number(match);
				if (spaceship(lastNumber, value) !== mustCompare) {
					return `${value} ${failText} ${lastNumber}`;
				}
				lastNumber = value;
			}
		},
	partitions: DUPE_NUMBER('unique'),
});
