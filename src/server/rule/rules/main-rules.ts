import { createRuleFactory, createRuleTitle } from '../rule-registry.js';
import { createSpecialExpr, wordListToWordExprList } from '../rule-util.js';

export const createLengthRule = createRuleFactory({
	title: createRuleTitle`Must be at least **${{ type: 'number', range: [5, 8] }}** characters long`,
	validator:
		length =>
		({ password }) => {
			if (password.length < length) return `Under ${length} characters`;
		},
});

export const createCharacterTypeRule = createRuleFactory({
	title: createRuleTitle`Must contain a lowercase letter, an uppercase letter, a digit, and a special character`,
	validator:
		() =>
		({ password }) => {
			if (/[a-z]/.test(password) === false)
				return 'Does not contain a lowercase letter';

			if (!/[A-Z]/.test(password))
				return 'Does not contain an uppercase letter';

			if (!/[0-9]/.test(password)) return 'Does not contain a digit';

			if (!createSpecialExpr().test(password))
				return 'Does not contain a special character';
		},
});

export const createIncludesAnotherRule = createRuleFactory({
	title: createRuleTitle`Must include **another** ${{ type: 'includesSpec' }}`,
	imageUrl: spec =>
		spec.pictureUrl == null
			? undefined
			: spec.pictureUrl[spec.pictureUrl.length - 1],
	description: spec => spec.description,
	validator:
		spec =>
		({ password }) => {
			const exprList = wordListToWordExprList(spec.words);
			let count = 0;

			for (let i = 0; i < exprList.length; ++i) {
				const expr = exprList[i];
				if (expr.test(password)) {
					if (++count === 2) return undefined;
					exprList.splice(i--, 1);
				}
			}

			return count === 0
				? `Does not include ${spec.categoryName}`
				: `Only includes one ${spec.categoryName}`;
		},
});

export const createIncludesRule = createRuleFactory({
	title: createRuleTitle`Must include **${{ type: 'includesSpec' }}**`,
	imageUrl: spec => spec.pictureUrl?.at(0),
	description: spec => spec.description,
	validator:
		spec =>
		({ password }) => {
			const exprList = wordListToWordExprList(spec.words);

			for (const expr of exprList) {
				if (expr.test(password)) return undefined;
			}

			return `Password does not include ${spec.categoryName}`;
		},
});
