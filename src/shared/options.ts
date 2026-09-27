export const parseOptionsCode = (code: string): string[] => {
	return [
		...new Set(
			code
				.split('\n')
				.map(line => line.trim().toLowerCase())
				.filter(line => line.length > 0),
		),
	];
};

export const normalizeOptionsCode = (code: string): string => {
	return parseOptionsCode(code).join('\n');
};
