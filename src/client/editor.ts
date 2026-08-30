export type Placeholder = { paramName: string };

export type RuleParameter = {
	name: string;
	type: 'string' | 'number' | 'boolean';
	values?: { name: string; value: string }[];
};

export type EditorRule = {
	codeName: string;
	title: (string | Placeholder)[];
};

export type PlacedRule = {
	rule: EditorRule;
	parameters: Record<string, number | string | boolean>;
	x: number;
	y: number;
};

export type RuleGraph = {
	rounds: PlacedRule[];
};

export type EditorState = {
	allRules: EditorRule[];
	placedRules: PlacedRule[];
};
