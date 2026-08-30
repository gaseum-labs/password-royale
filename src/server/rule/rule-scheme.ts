import {
	CreatedRule,
	RuleFactory,
	RuleParameter,
	RuleScheme,
} from './rule-registry.js';
import { partitionerRegistry } from './partition.js';
import { randElement, shuffleArray, takeRandomElement } from './rule-util.js';
import {
	IncludesSpec,
	includesSpecRegistry,
} from './includes-spec/includes-spec.js';
import * as mainRules from './rules/main-rules.js';
import * as specialRules from './rules/special-rules.js';
import * as numberRules from './rules/number-rules.js';
import * as caseRules from './rules/case-rules.js';
import * as includesRules from './rules/includes-rules.js';
import * as lengthRules from './rules/length-rules.js';
import * as tiesRules from './rules/ties-rules.js';
import * as timeRules from './rules/time-rules.js';
import * as wordRules from './rules/word-rules.js';
import crypto from 'node:crypto';

const filterPartitionedRules = (
	partitionState: Map<string, string>,
	ruleFactories: RuleFactory<RuleParameter[]>[],
) =>
	ruleFactories.filter(
		factory =>
			factory.partitions.isEmpty() ||
			factory.partitions.every(
				partition =>
					partitionState.get(partition.partitionId) ===
					partition.state,
			),
	);

const pickIncludesRule = (
	includesList: (RuleFactory<RuleParameter[]> | IncludesSpec)[],
): CreatedRule => {
	const choice = takeRandomElement(includesList);

	if ('createAuto' in choice) return choice.createAuto();
	return mainRules.createIncludesRule.create(choice);
};

const isIncludesSpec = (obj: unknown): obj is IncludesSpec => {
	return obj != null && typeof obj === 'object' && 'id' in obj;
};

const insertIncludesAnother = (scheme: RuleScheme) => {
	const includeRulePerRound: [spec: IncludesSpec, number, number][] = [];

	for (let r = 0; r < scheme.length; ++r) {
		const round = scheme[r];
		const includesRules = round.map((rule, i) => {
			const { factory } = rule;
			const parameter = rule.parameters.at(0);
			if (
				factory === mainRules.createIncludesRule &&
				isIncludesSpec(parameter)
			) {
				return { includesSpec: parameter, index: i };
			}
		});

		const includesRule = includesRules.at(0);
		if (includesRule == null) continue;

		includeRulePerRound.push([
			includesRule.includesSpec,
			r,
			includesRule.index,
		]);
	}

	if (includeRulePerRound.length < 2) return;

	const baseRuleIndex = crypto.randomInt(0, includeRulePerRound.length - 1);
	const replaceRule =
		includeRulePerRound[
			crypto.randomInt(baseRuleIndex + 1, includeRulePerRound.length)
		];

	const includesSpec = includeRulePerRound[baseRuleIndex][0];

	scheme[replaceRule[1]][replaceRule[2]] =
		mainRules.createIncludesAnotherRule.create(includesSpec);
};

type SpotType =
	| 'special'
	| 'number'
	| 'case'
	| 'includes'
	| 'length'
	| 'ties'
	| 'time'
	| 'word';
type Spot = SpotType | SpotType[];

const unwrapSpots = (spots: Spot[]): SpotType[] => {
	const spotTypes = spots.map(spot =>
		typeof spot === 'string' ? spot : randElement(spot),
	);
	shuffleArray(spotTypes);
	return spotTypes;
};

export const generateRuleScheme = (): RuleScheme => {
	const partitionToState = new Map<string, string>();
	for (const partition of partitionerRegistry) {
		const state = randElement(partition.states);
		partitionToState.set(partition.partitionId, state);
	}

	const allSpecialRules = filterPartitionedRules(
		partitionToState,
		Object.values(specialRules),
	);
	const allNumberRules = filterPartitionedRules(
		partitionToState,
		Object.values(numberRules),
	);
	const allCaseRules = filterPartitionedRules(
		partitionToState,
		Object.values(caseRules),
	);
	const allIncludesRules = filterPartitionedRules(
		partitionToState,
		Object.values(includesRules),
	);
	const allLengthRules = filterPartitionedRules(
		partitionToState,
		Object.values(lengthRules),
	);
	const allTiesRules = filterPartitionedRules(
		partitionToState,
		Object.values(tiesRules),
	);
	const allTimeRules = filterPartitionedRules(
		partitionToState,
		Object.values(timeRules),
	);
	const allWordRules = filterPartitionedRules(
		partitionToState,
		Object.values(wordRules),
	);

	const includesList = [...allIncludesRules, ...includesSpecRegistry];

	const spots: Spot[] = [
		'word',
		'number',
		'number',
		'ties',
		'length',
		'time',
		'case',
		'includes',
		'includes',
		'includes',
		'includes',
		['word', 'case'],
		['ties', 'includes'],
		['special', 'includes'],
	];

	const spotTypes = unwrapSpots(spots);

	const spotTypeToRuleFactory = (spotType: SpotType): CreatedRule => {
		if (spotType === 'includes') {
			return pickIncludesRule(includesList);
		}

		const list =
			spotType === 'case'
				? allCaseRules
				: spotType === 'length'
					? allLengthRules
					: spotType === 'number'
						? allNumberRules
						: spotType === 'special'
							? allSpecialRules
							: spotType === 'ties'
								? allTiesRules
								: spotType === 'time'
									? allTimeRules
									: allWordRules;

		return takeRandomElement(list).createAuto();
	};

	const scheme: RuleScheme = [
		[
			mainRules.createLengthRule.createAuto(),
			mainRules.createCharacterTypeRule.createAuto(),
		],
	];
	for (let i = 0; i < 7; ++i) {
		const round: CreatedRule[] = [];
		round.push(spotTypeToRuleFactory(spotTypes[i * 2]));
		round.push(spotTypeToRuleFactory(spotTypes[i * 2 + 1]));
		scheme.push(round);
	}

	insertIncludesAnother(scheme);

	return scheme;
};
