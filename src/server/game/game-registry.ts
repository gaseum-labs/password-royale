import { APIGame, Submission } from '../../shared/api.js';
import { InternalRule, RuleScheme } from '../rule/rule-registry.js';
import { WebSocket } from 'ws';

export type Connection = {
	webSocket: WebSocket;
	game: InternalGame | null;
	user: InternalUser;
};

export type InternalUser = {
	snowflake: string;
	username: string;
	avatarPath: string | null;
	isAdmin: boolean;
	connections: Connection[];
};

export type InternalPlayer = {
	user: InternalUser;
	game: InternalGame;
	joinTimestamp: number;
	isAlive: boolean;
	kills: number;
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
	bannedUserSnowflakes: Set<string>;
};

export const userMap = new Map<string, InternalUser>();

export const games: InternalGame[] = [];
export const codeToGame = new Map<string, InternalGame>();
