import { InternalGame, InternalPlayer } from './game/game-registry.js';
import { getMostImportantLetters } from './rule/includes-spec/includes-spec-util.js';
import {
	itzyMembers,
	twiceMembers,
	twiceSongs,
} from './rule/includes-spec/kpop.js';
import { hostileMobs, neutralMobs } from './rule/includes-spec/minecraft.js';
import { ValidatorParams } from './rule/rule-registry.js';
import { getNumberName } from './rule/rule-util.js';
import { createAllSideCasedRule } from './rule/rules/case-rules.js';
import { createDupeNumberRule } from './rule/rules/number-rules.js';
import { createEquationRule } from './rule/rules/ties-rules.js';
import { newRandomSnowflake } from './snowflake.js';

//for (let i = 0; i < 1000; ++i) {
//	console.log(i, getNumberName(i));
//}
//console.log(0, getNumberName(0));
//console.log(10, getNumberName(10));
//console.log(100, getNumberName(100));
//console.log(1000, getNumberName(1000));
//console.log(10000, getNumberName(10000));
//console.log(100000, getNumberName(100000));
//console.log(1000000, getNumberName(1000000));
//console.log(10000000, getNumberName(10000000));
//console.log(100000000, getNumberName(100000000));
//console.log(103003000, getNumberName(103003000));
//
//console.log(927403722, getNumberName(927403722));

const result = createEquationRule
	.create()
	.validator({ password: 'D_DBf000+78*4/2=156', player: '' as any });

console.log(result);

console.log(getMostImportantLetters(twiceSongs));
console.log(getMostImportantLetters(twiceMembers));
console.log(getMostImportantLetters(itzyMembers));
console.log(getMostImportantLetters(hostileMobs));
console.log(getMostImportantLetters(neutralMobs));

const testPlayer: InternalPlayer = {
	game: undefined as any,
	isAlive: true,
	joinTimestamp: 0,
	kills: 0,
	user: {
		avatarPath: null,
		connections: [],
		isAdmin: false,
		snowflake: newRandomSnowflake(),
		username: 'balduvian',
	},
};
const testGame: InternalGame = {
	bannedUserSnowflakes: new Set(),
	code: 'ABCD123',
	host: testPlayer,
	numRounds: 8,
	phase: 'submitting',
	players: [testPlayer],
	roundEndTime: null,
	roundNumber: 0,
	roundSubmissions: [],
	rules: [],
	ruleScheme: [],
	timestamp: 0,
	winnerSnowflake: null,
};
testPlayer.game = testGame;

const cp = (password: string): ValidatorParams => ({
	password,
	player: testPlayer,
});

type Expector = {
	good: () => void;
	bad: () => void;
};

const expect = (value: string | undefined): Expector => {
	return {
		good:
			value == null
				? () => {}
				: () => {
						throw Error(`expected good, got "${value}" instead`);
					},
		bad:
			value == null
				? () => {
						throw Error(`Expected bad, got good instead`);
					}
				: () => {},
	};
};

const firstUppercase = createAllSideCasedRule.create('first', 'uppercase');

expect(firstUppercase.validator(cp('Fh  89892 8 J Jdjfew'))).good();
expect(firstUppercase.validator(cp('Fh  89892 8 f Jdjfew'))).bad();
expect(firstUppercase.validator(cp('Fh  89892 8 J ldjfew'))).bad();

const lastLowercase = createAllSideCasedRule.create('last', 'lowercase');
expect(lastLowercase.validator(cp('Saaaaa f EFWSi fiuhDuiw few'))).good();
expect(lastLowercase.validator(cp('Saaaaa f EFWSi fiuhDuiw feD'))).bad();
expect(lastLowercase.validator(cp('Saaaaa F EFWSi fiuhDuiw few'))).bad();

const dupeNumber = createDupeNumberRule.create(3);
expect(dupeNumber.validator(cp('34 kjiosad 34iojioa oo34_@'))).good();
expect(dupeNumber.validator(cp('34 kjiosad 34iojioa oo34.0_@'))).good();
expect(dupeNumber.validator(cp('34 kjiosad 34iojioa oo35_@'))).bad();
expect(dupeNumber.validator(cp('34 kjiosad iojioa oo34_@'))).bad();
expect(dupeNumber.validator(cp('34 kjiosad 34iojioa oo345_@'))).bad();
expect(dupeNumber.validator(cp('34 kjiosad -34iojioa oo34_@'))).bad();
