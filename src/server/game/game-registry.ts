import { APIGame, APIPlayer, Submission, User } from '../../shared/api.js';
import { InternalRule, RuleScheme } from '../rule/rule-registry.js';
import { WebSocket } from 'ws';

export type InternalPlayer = APIPlayer & {
	game: InternalGame;
	joinTimestamp: number;
	isInGame: boolean;
};
export type InternalGame = Omit<
	APIGame,
	'players' | 'rules' | 'hostSnowflake' | 'submissions'
> & {
	roundSubmissions: Submission[][];
	players: InternalPlayer[];
	rules: InternalRule[];
	host: InternalPlayer;
	ruleScheme: RuleScheme;
};

export type UserState = {
	user: User;
	webSockets: WebSocket[];
	player?: InternalPlayer | undefined;
};

export const userMap = new Map<string, UserState>();

export const games: InternalGame[] = [];
export const codeToGame = new Map<string, InternalGame>();
