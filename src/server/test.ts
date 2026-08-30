import { getMostImportantLetters } from './rule/includes-spec/includes-spec-util.js';
import {
	itzyMembers,
	twiceMembers,
	twiceSongs,
} from './rule/includes-spec/kpop.js';
import { hostileMobs, neutralMobs } from './rule/includes-spec/minecraft.js';
import { getNumberName } from './rule/rule-util.js';
import { createEquationRule } from './rule/rules/ties-rules.js';

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
