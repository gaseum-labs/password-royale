import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs/promises';
import { InternalUser } from '../game/game-registry.js';

await fs.mkdir('db/avatars', { recursive: true });

export const database = new DatabaseSync('db/password-royale.db');
export const tagStore = database.createTagStore();

export type DatabaseUser = {
	snowflake: string;
	username: string;
	avatarPath: string | null;
	isAdmin: boolean;
};

database.exec(/*sql*/ `CREATE TABLE IF NOT EXISTS user (
	id			INTEGER PRIMARY KEY,
	snowflake	TEXT,
	username	TEXT,
	avatarPath	TEXT,
	isAdmin		BOOL
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_user_snowflake ON user (snowflake ASC);

CREATE TABLE IF NOT EXISTS gameCount (
	id		INTEGER PRIMARY KEY,
	count	INT
);

INSERT INTO gameCount (id, count)
VALUES (0, 0)
ON CONFLICT (id) DO NOTHING;
`);

export const getGameCount = (): number => {
	const result = tagStore.get /*sql*/ `SELECT count FROM gameCount`;
	if (result == null) return 0;
	return result.count as number;
};

export const incrementGameCount = () => {
	tagStore.run /*sql*/ `UPDATE gameCount SET count = count + 1`;
};

export const upsertUser = (user: DatabaseUser) => {
	tagStore.run /*sql*/ `INSERT INTO user (snowflake, username, avatarPath, isAdmin)
	VALUES (${user.snowflake}, ${user.username}, ${user.avatarPath ?? null}, ${user.isAdmin ? 1 : 0})
	ON CONFLICT (snowflake) DO
	UPDATE SET username = excluded.username, avatarPath = excluded.avatarPath`;
};

export const getUser = (snowflake: string): DatabaseUser | undefined => {
	const result = tagStore.get /*sql*/ `SELECT snowflake, username, avatarPath, isAdmin
	FROM user u
	WHERE u.snowflake = ${snowflake}`;

	if (result == null) return undefined;

	return {
		snowflake: result.snowflake as string,
		username: result.username as string,
		avatarPath: result.avatarPath as string | null,
		isAdmin: (result.isAdmin as number) === 1,
	};
};

export const saveAvatar = async (
	bytes: Uint8Array,
	hash: string,
): Promise<string> => {
	fs.writeFile(`db/avatars/${hash}.webp`, bytes);
	return `${hash}.webp`;
};
