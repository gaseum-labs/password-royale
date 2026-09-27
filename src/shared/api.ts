import z from 'zod';
import { asciiStringSchema, asciiStringWithNewlineSchema } from './util.js';
import { normalizeOptionsCode } from './options.js';

export const UNKNOWN_AVATAR_PATH = '/unkown-avatar.webp';
export const MAX_PASSWORD_LENGTH = 255;

export type MeResult = { user?: APIUser | undefined };

export const apiUserSchema = z.object({
	snowflake: z.string(),
	username: z.string(),
	isAdmin: z.boolean(),
});

export type APIUser = z.infer<typeof apiUserSchema>;

export type APIPlayer = APIUser & {
	isAlive: boolean;
	kills: number;
};

export const phaseSchema = z.union([
	z.literal('pregame'),
	z.literal('submitting'),
	z.literal('reveal'),
	z.literal('end'),
]);
export type Phase = z.infer<typeof phaseSchema>;

export type APIRule = {
	uuid: string;
	roundNumber: number;
	title: string;
	description: string | null;
	imageUrl: string | null;
	kills: number;
};

export type APIGame = {
	code: string;
	players: APIPlayer[];
	rules: APIRule[];
	phase: Phase;
	roundNumber: number;
	winnerSnowflake: string | null;
	roundEndTime: number | null;
	hostSnowflake: string;
	submissions: Submission[];
	numRounds: number;
	timestamp: number;
	isReset?: boolean | undefined;
};

export const gameHeaderSchema = z.object({
	code: z.string(),
	numPlayers: z.number(),
	phase: phaseSchema,
	roundNumber: z.number(),
	numRounds: z.number(),
	timestamp: z.number(),
});

export type GameHeader = z.infer<typeof gameHeaderSchema>;

export type FailReason = 'dupe' | 'rule' | 'late';

export type SubmissionStatus = 'pending' | 'valid' | 'invalid';

export type SubmissionFail = {
	reason: FailReason;
	message: string;
	value: number;
};

export type Submission = {
	userSnowflake: string;
	password: string;
	length: number;
	rank: number;
	status: SubmissionStatus;
	fail: SubmissionFail | null;
	timestamp: number;
	maxRound: number;
};

export const serverResponseMessageSchema = z.object({
	type: z.literal('error'),
	requestId: z.number(),
	errorMessage: z.string(),
});

export const serverGameMessageSchema = z.object({
	type: z.literal('game'),
	requestId: z.number().optional(),
	game: z.custom<APIGame>().nullable(),
});

export const serverDataMessageSchema = z.object({
	type: z.literal('data'),
	requestId: z.number().optional(),
	data: z.any(),
});

export const serverMessageSchema = z.discriminatedUnion('type', [
	serverResponseMessageSchema,
	serverGameMessageSchema,
	serverDataMessageSchema,
]);

export type ServerResponseMessage = z.infer<typeof serverResponseMessageSchema>;
export type ServerGameMessage = z.infer<typeof serverGameMessageSchema>;
export type ServerDataMessage = z.infer<typeof serverDataMessageSchema>;
export type ServerMessage =
	| ServerResponseMessage
	| ServerGameMessage
	| ServerDataMessage;

export const passwordSchema = asciiStringSchema()
	.min(1)
	.max(MAX_PASSWORD_LENGTH);

export const MODIFIES_GAME = Symbol();

export type ClientMessageDefinition<Payload, Result> = {
	type: string;
	payloadSchema: z.ZodType<Payload>;
	resultSchema: typeof MODIFIES_GAME | z.ZodType<Result>;
};

const ClientMessageDefinitions: ClientMessageDefinition<any, any>[] = [];

const registerClientMessageDefinition = <Payload, Result>(definition: {
	type: string;
	payloadSchema: z.ZodType<Payload>;
	resultSchema: Result;
}): Result extends typeof MODIFIES_GAME
	? ClientMessageDefinition<Payload, undefined>
	: ClientMessageDefinition<Payload, z.infer<Result>> => {
	ClientMessageDefinitions.push(definition as any);
	return definition as any;
};

export const fetchGamesMessage = registerClientMessageDefinition({
	type: 'fetch_games',
	payloadSchema: z.object({}),
	resultSchema: z.array(gameHeaderSchema),
} as const);

export const establishMessage = registerClientMessageDefinition({
	type: 'establish',
	payloadSchema: z.object({}),
	resultSchema: MODIFIES_GAME,
} as const);

export const joinMessage = registerClientMessageDefinition({
	type: 'join',
	payloadSchema: z.object({ gameCode: z.string() }),
	resultSchema: MODIFIES_GAME,
} as const);

export const leaveMessage = registerClientMessageDefinition({
	type: 'leave',
	payloadSchema: z.object({}),
	resultSchema: MODIFIES_GAME,
} as const);

export const submitMessage = registerClientMessageDefinition({
	type: 'submit',
	payloadSchema: z.object({ password: passwordSchema }),
	resultSchema: MODIFIES_GAME,
} as const);

export const advanceMessage = registerClientMessageDefinition({
	type: 'advance',
	payloadSchema: z.object({}),
	resultSchema: MODIFIES_GAME,
} as const);

export const banMessage = registerClientMessageDefinition({
	type: 'ban',
	payloadSchema: z.object({ userSnowflake: z.string() }),
	resultSchema: MODIFIES_GAME,
} as const);

export const kickMessage = registerClientMessageDefinition({
	type: 'kick',
	payloadSchema: z.object({ userSnowflake: z.string() }),
	resultSchema: MODIFIES_GAME,
} as const);

export const newGameMessage = registerClientMessageDefinition({
	type: 'new_game',
	payloadSchema: z.object({}),
	resultSchema: MODIFIES_GAME,
} as const);

export type ClientMessageResults = {
	establish: APIGame | null;
	join: APIGame | null;
	leave: APIGame | null;
	submit: APIGame | null;
	advance: APIGame | null;
	ban: APIGame | null;
	new_game: APIGame | null;
	kick: APIGame | null;
	fetch_games: GameHeader[];
};

export const clientMessageSchema = z.object({
	requestId: z.number(),
	type: z.string(),
	payload: z.record(z.string(), z.unknown()),
});

export type ClientMessage = z.infer<typeof clientMessageSchema>;

export const ruleApprovedBodySchema = z.object({
	snowflake: z.string(),
	isApproved: z.boolean(),
});

export type RuleApprovedBody = z.infer<typeof ruleApprovedBodySchema>;

export const customIncludesRuleSchema = z.object({
	user: apiUserSchema,
	snowflake: z.string(),
	categoryName: z.string(),
	picture0Path: z.string().nullable(),
	picture1Path: z.string().nullable(),
	description: z.string().nullable(),
	optionsCode: z.string(),
	isEnabled: z.boolean(),
	isApproved: z.boolean(),
});

export const customIncludesRuleUploadSchema = z.object({
	snowflake: z.string().optional(),
	categoryName: asciiStringSchema().transform(str => {
		const trimmed = str.trim();
		if (trimmed.length === 0) throw Error('Category name cannot be empty');
		return trimmed;
	}),
	picture0: z.number().nullable().optional(),
	picture1: z.number().nullable().optional(),
	description: asciiStringSchema()
		.nullable()
		.transform(str => {
			if (str == null) return null;
			const trimmed = str.trim();
			return trimmed.length === 0 ? null : trimmed;
		}),
	optionsCode: asciiStringWithNewlineSchema().transform(str =>
		normalizeOptionsCode(str),
	),
	isEnabled: z.boolean(),
});

export type CustomIncludesRule = z.infer<typeof customIncludesRuleSchema>;
export type CustomIncludesRuleUpload = z.infer<
	typeof customIncludesRuleUploadSchema
>;

export const BINARY_PAYLOAD_LIMIT = 56000000;
