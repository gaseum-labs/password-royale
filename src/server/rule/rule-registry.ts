import { APIRule } from '../../shared/api.js';
import { InternalPlayer } from '../game/game-registry.js';
import { Partition } from './partition.js';
import {
	IncludesSpec,
	includesSpecRegistry,
} from './includes-spec/includes-spec.js';
import {
	ALPHABET,
	DIGITS,
	randChar,
	randElement,
	randRange,
	SPECIALS,
} from './rule-util.js';

export type ValidatorParams = { password: string; player: InternalPlayer };
export type ValidatorFunction = (params: ValidatorParams) => string | undefined;

export type CreatedRule = Omit<APIRule, 'roundNumber' | 'kills' | 'uuid'> & {
	factory: RuleFactory<RuleParameter[]>;
	parameters: ParametersToValues<RuleParameter[]>;
	validator: ValidatorFunction;
	partitions: Partition<string>[];
};

export type InternalRule = APIRule & {
	validator: ValidatorFunction;
	partitions: Partition<string>[];
};

export type NumberParameter = {
	type: 'number';
	range: [number, number];
};

export type RuleParameter =
	| NumberParameter
	| {
			type:
				| 'includesSpec'
				| 'letter'
				| 'digit'
				| 'special'
				| readonly string[];
	  };

export type RuleTitle<D extends RuleParameter[]> = {
	name: (string | RuleParameter)[];
	parameters: D;
};

type TypeToValue = {
	number: number;
	letter: string;
	digit: string;
	special: string;
	includesSpec: IncludesSpec;
};

export type ParameterToValue<P> = P extends RuleParameter
	? P['type'] extends keyof TypeToValue
		? TypeToValue[P['type']]
		: P['type'] extends readonly string[]
			? P['type'][number]
			: TypeToValue[keyof TypeToValue]
	: never;

export type ParametersToValues<Ps> = Ps extends []
	? []
	: Ps extends [infer First]
		? [ParameterToValue<First>]
		: Ps extends [infer First, ...infer Rest]
			? Rest extends RuleParameter[]
				? [ParameterToValue<First>, ...ParametersToValues<Rest>]
				: never
			: Ps extends RuleParameter[]
				? ParameterToValue<RuleParameter>[]
				: never;

export const createDefaultGenParameters = <Ps extends RuleParameter[]>(
	parameters: Ps,
): (() => ParametersToValues<Ps>) => {
	return () => {
		let arr: ParameterToValue<RuleParameter>[] = [];
		for (const parameter of parameters) {
			if (parameter.type === 'number') {
				arr.push(randRange(parameter.range[0], parameter.range[1]));
			} else if (parameter.type === 'digit') {
				arr.push(randChar(DIGITS));
			} else if (parameter.type === 'letter') {
				arr.push(randChar(ALPHABET));
			} else if (parameter.type === 'includesSpec') {
				arr.push(randElement(includesSpecRegistry));
			} else if (parameter.type === 'special') {
				arr.push(randChar(SPECIALS));
			} else {
				arr.push(randElement(parameter.type));
			}
		}
		return arr as ParametersToValues<Ps>;
	};
};

export const createRuleTitle = <Ps extends Array<RuleParameter>>(
	strings: TemplateStringsArray,
	...a: Ps
): RuleTitle<Ps> => {
	let name: (string | RuleParameter)[] = [];
	for (let i = 0; i < strings.length; ++i) {
		name.push(strings[i]);
		if (a.length > i) name.push(a[i]);
	}
	return {
		name,
		parameters: a,
	};
};

export const renderRuleTitle = <Ps extends RuleParameter[]>(
	ruleName: RuleTitle<Ps>,
	...parameters: ParametersToValues<Ps>
): string => {
	let str: string = '';
	for (let i = 0; i < ruleName.name.length; i += 2) {
		const stringPart = ruleName.name[i];
		str += stringPart;

		if (i + 1 >= ruleName.name.length) continue;

		const value = parameters[i / 2];
		const parameter = ruleName.parameters[i / 2];
		str +=
			typeof value === 'object'
				? value.categoryName
				: parameter.type === 'letter'
					? String(value).toUpperCase()
					: String(value);
	}

	return str;
};

export type RuleFactory<Ps extends RuleParameter[]> = {
	create: (...parameters: ParametersToValues<Ps>) => CreatedRule;
	createAuto: () => CreatedRule;
	partitions: Partition<string>[];
};

export const createRuleFactory = <Ps extends RuleParameter[]>({
	title,
	validator,
	genParameters,
	description,
	imageUrl,
	partitions,
}: {
	title: RuleTitle<Ps>;
	validator: (...parameters: ParametersToValues<Ps>) => ValidatorFunction;
	description?:
		| string
		| ((...parameters: ParametersToValues<Ps>) => string | undefined)
		| undefined;
	imageUrl?:
		| string
		| ((...parameters: ParametersToValues<Ps>) => string | undefined)
		| undefined;
	partitions?: Partition<string> | Partition<string>[] | undefined;
	genParameters?: () => ParametersToValues<Ps>;
}): RuleFactory<Ps> => {
	const partitionsArray =
		partitions == null
			? []
			: Array.isArray(partitions)
				? partitions
				: [partitions];

	function create(
		this: RuleFactory<Ps>,
		...parameters: ParametersToValues<Ps>
	): CreatedRule {
		return {
			factory: this,
			parameters,
			title: renderRuleTitle(title, ...parameters),
			description:
				(typeof description === 'function'
					? description(...parameters)
					: description) ?? null,
			imageUrl:
				(typeof imageUrl === 'function'
					? imageUrl(...parameters)
					: imageUrl) ?? null,
			validator: validator(...parameters),
			partitions: partitionsArray,
		};
	}

	return {
		create,
		createAuto() {
			return this.create(
				...(
					genParameters ??
					createDefaultGenParameters(title.parameters)
				)(),
			);
		},
		partitions: partitionsArray,
	};
};

export type RuleScheme = CreatedRule[][];
