import z from 'zod';

export const DEFAULT_AVATAR_PATH = '/default-avatar.webp';
export const MAX_PASSWORD_LENGTH = 255;

export type MeResult = { user?: User | undefined };

export type User = {
	snowflake: string;
	username: string;
	avatarUrl: string | null;
};

export type APIPlayer = User & {
	isAlive: boolean;
	kills: number;
};

export type Phase = 'pregame' | 'submitting' | 'reveal' | 'end';

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
	bannedUsers: User[];
	timestamp: number;
};

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
	requestId: z.number(),
	errorMessage: z.string(),
});

export const serverGameMessageSchema = z.object({
	game: z.custom<APIGame>().nullable(),
});

export const serverMessageSchema = z.union([
	serverResponseMessageSchema,
	serverGameMessageSchema,
]);

export type ServerResponseMessage = z.infer<typeof serverResponseMessageSchema>;
export type ServerGameMessage = z.infer<typeof serverGameMessageSchema>;
export type ServerMessage = ServerResponseMessage | ServerGameMessage;

export const passwordSchema = z
	.string()
	.refine(
		password =>
			password.length > 0 &&
			password.length <= MAX_PASSWORD_LENGTH &&
			/^[ !"#$%&'()*+,\-./0-9:;<=>?@A-Z[\\\]^_`a-z{|}~]+$/.test(password),
	);

export const clientMessageSchema = z.object({
	requestId: z.number(),
	payload: z.discriminatedUnion('type', [
		z.object({
			type: z.literal('establish'),
		}),
		z.object({
			type: z.literal('join'),
			gameCode: z.string(),
		}),
		z.object({
			type: z.literal('leave'),
		}),
		z.object({
			type: z.literal('submit'),
			password: passwordSchema,
		}),
		z.object({
			type: z.literal('advance'),
		}),
		z.object({
			type: z.literal('ban'),
			userSnowflake: z.string(),
		}),
		z.object({
			type: z.literal('new_game'),
		}),
		z.object({
			type: z.literal('kick'),
			userSnowflake: z.string(),
		}),
	]),
});

export type ClientMessage = z.infer<typeof clientMessageSchema>;
export type ClientMessagePayload = ClientMessage['payload'];
export type ClientMessagePayloadOf<Type> = ClientMessage['payload'] & {
	type: Type;
};
export type ClientMessageType = ClientMessage['payload']['type'];
