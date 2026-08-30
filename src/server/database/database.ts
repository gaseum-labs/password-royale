import { DatabaseSync } from 'node:sqlite';
import { User } from '../../shared/api.js';
import fs from 'node:fs/promises';

await fs.mkdir('db/avatars', { recursive: true });

export const database = new DatabaseSync('db/password-royale.db');
export const tagStore = database.createTagStore();

database.exec(/*sql*/ `CREATE TABLE IF NOT EXISTS user (
	id			INTEGER PRIMARY KEY,
	snowflake	TEXT,
	username	TEXT,
	avatarUrl	TEXT
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

export const upsertUser = (user: User) => {
	tagStore.run /*sql*/ `INSERT INTO user (snowflake, username, avatarUrl)
	VALUES (${user.snowflake}, ${user.username}, ${user.avatarUrl ?? null})
	ON CONFLICT (snowflake) DO
	UPDATE SET username = excluded.username, avatarUrl = excluded.avatarUrl`;
};

export const getUser = (snowflake: string): User | undefined => {
	const result = tagStore.get /*sql*/ `SELECT snowflake, username, avatarUrl
	FROM user u
	WHERE u.snowflake = ${snowflake}`;

	if (result == null) return undefined;

	return {
		snowflake: result.snowflake as string,
		username: result.username as string,
		avatarUrl: result.avatarUrl as string | null,
	};
};

export const saveAvatar = async (
	bytes: Uint8Array,
	hash: string,
): Promise<string> => {
	fs.writeFile(`db/avatars/${hash}.webp`, bytes);
	return `/avatars/${hash}.webp`;
};
