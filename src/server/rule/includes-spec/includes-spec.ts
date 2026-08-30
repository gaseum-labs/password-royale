export type IncludesSpec = {
	id: string;
	words: (string | number)[];
	categoryName: string;
	pictureUrl?: string[] | undefined;
	description?: string | undefined;
};

export const includesSpecRegistry: IncludesSpec[] = [];

export const createIncludesSpec = (spec: IncludesSpec): IncludesSpec => {
	includesSpecRegistry.push(spec);
	return spec;
};

import { hawaiianIslands, hawaiianZipCodes } from './hawaii.js';
import {
	aespaMembers,
	itzyMembers,
	redVelvetMembers,
	twiceMembers,
} from './kpop.js';

export const hawaiianZipCodesSpec = createIncludesSpec({
	id: 'hawaiian_zip_codes',
	categoryName: 'a Hawaiian zip code',
	words: hawaiianZipCodes,
	pictureUrl: ['/rules/oahu-map.jpg', '/rules/maui-map.jpg'],
});

export const hawaiianIslandsSpec = createIncludesSpec({
	id: 'hawaiian_island',
	categoryName: 'a Hawaiian island',
	words: hawaiianIslands,
	pictureUrl: ['/rules/hawaii.png', '/rules/hawaii2.jpg'],
});

export const aespaMembersSpec = createIncludesSpec({
	id: 'aespa',
	words: aespaMembers,
	categoryName: 'the name of an aespa member',
	pictureUrl: ['/rules/aespa-members.png'],
});

export const twiceMembersSpec = createIncludesSpec({
	id: 'twice',
	words: twiceMembers,
	categoryName: 'the name of a Twice member',
	pictureUrl: ['/rules/twice-members.jpg'],
});

export const redVelvetMembersSpec = createIncludesSpec({
	id: 'red_velvet',
	words: redVelvetMembers,
	categoryName: 'the name of a Red Velvet member',
	pictureUrl: ['/rules/red-velvet-members.webp'],
});

export const itzyMembersSpec = createIncludesSpec({
	id: 'itzy',
	words: itzyMembers,
	categoryName: 'the name of an ITZY member',
	pictureUrl: ['/rules/itzy-members.jpg'],
});

import * as minecraft from './minecraft.js';

export const minecraftBiomesSpec = createIncludesSpec({
	id: 'minecraft_biome',
	words: minecraft.biomes,
	categoryName: 'a Minecraft biome',
	pictureUrl: [
		'/rules/minecraft-biomes.webp',
		'/rules/minecraft-biomes2.webp',
	],
});

export const minecraftPassiveMobsSpec = createIncludesSpec({
	id: 'minecraft_passive_mob',
	words: minecraft.passiveMobs,
	categoryName: 'a Minecraft passive mob',
	pictureUrl: ['/rules/minecraft-passive-mobs.jpg'],
});

export const minecraftNeutralMobsSpec = createIncludesSpec({
	id: 'minecraft_neutral_mob',
	words: minecraft.neutralMobs,
	categoryName: 'a Minecraft neutral mob',
	pictureUrl: ['/rules/enderman.webp'],
});

export const minecraftHostileMobsSpec = createIncludesSpec({
	id: 'minecraft_hostile_mob',
	words: minecraft.hostileMobs,
	categoryName: 'a Minecraft hostile mob',
	pictureUrl: ['/rules/nether.jpg'],
});

import * as misc from './misc.js';

export const funnyNumbersSpec = createIncludesSpec({
	id: 'funny_numbers',
	categoryName: 'a funny number',
	words: misc.funnyNumbers,
});
