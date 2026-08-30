export type Partition<P extends string> = {
	partitionId: string;
	state: P;
};

export type Partitioner<P extends string> = ((state: P) => Partition<P>) & {
	partitionId: string;
	states: P[];
};

export const partitionerRegistry: Partitioner<string>[] = [];

export const createPartitioner = <P extends string>(
	partitionId: string,
	...states: P[]
): Partitioner<P> => {
	const create = (state: P) => {
		return {
			partitionId,
			state,
		};
	};
	const partitioner = Object.assign(create, { partitionId, states });
	partitionerRegistry.push(partitioner as unknown as Partitioner<string>);
	return partitioner;
};

export const DUPE_WORD = createPartitioner('dupe_word', 'dupe', 'unique');
export const DUPE_NUMBER = createPartitioner('dupe_number', 'dupe', 'unique');
export const SPECIFIC_NUMBER = createPartitioner(
	'specific_number',
	'yes',
	'no',
);
export const LETTER_DIGIT_COUNT = createPartitioner(
	'letter_digit_count',
	'same',
	'more_letter',
	'more_digit',
);
export const WORD_NUMBER_COUNT = createPartitioner(
	'word_number_count',
	'same',
	'more_word',
	'more_number',
);
export const ALL_WORD_CASE = createPartitioner('all_word_case', 'all', 'some');
export const CASE_ALTERNATING = createPartitioner(
	'case_alternating',
	'alternating',
	'touching',
);
export const WORD_NUMBER_TOUCH = createPartitioner(
	'word_number_touch',
	'touch',
	'separate',
);
export const ALL_PRIME = createPartitioner('all_prime', 'prime', 'any');
