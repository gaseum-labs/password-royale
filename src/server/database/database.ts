import { DatabaseSync, SQLOutputValue } from 'node:sqlite';
import fs from 'node:fs/promises';
import {
	APIUser,
	CustomIncludesRule,
	CustomIncludesRuleUpload,
} from '../../shared/api.js';

await fs.mkdir('db/avatars', { recursive: true });
await fs.mkdir('db/uploads', { recursive: true });

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

CREATE TABLE IF NOT EXISTS custom_includes_rule (
	id				INTEGER PRIMARY KEY,
	userId			INT,
	snowflake		TEXT,
	categoryName	TEXT,
	picture0Path	TEXT,
	picture1Path	TEXT,
	description		TEXT,
	optionsCode		TEXT,
	isEnabled		BOOL,
	isApproved		BOOL,
	FOREIGN KEY (userId) REFERENCES user(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_custom_includes_rule_snowflake ON custom_includes_rule (snowflake ASC);
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

export const getCustomIncludesRuleOwner = (
	snowflake: string,
): APIUser | undefined => {
	const result = tagStore.get /*sql*/ `SELECT
		u.snowflake,
		u.username,
		u.isAdmin
	FROM user u
	JOIN custom_includes_rule r ON r.userId = u.id AND r.snowflake = ${snowflake}`;

	if (result == null) return undefined;
	return {
		snowflake: result.snowflake as string,
		username: result.username as string,
		isAdmin: result.isAdmin === 1,
	};
};

const dbRowToIncludesRule = (
	row: Record<string, SQLOutputValue>,
): CustomIncludesRule => {
	return {
		user: {
			snowflake: row.userSnowflake as string,
			username: row.username as string,
			isAdmin: row.userIsAdmin === 1,
		},
		categoryName: row.categoryName as string,
		picture0Path: row.picture0Path as string | null,
		picture1Path: row.picture1Path as string | null,
		description: row.description as string | null,
		optionsCode: row.optionsCode as string,
		snowflake: row.snowflake as string,
		isEnabled: row.isEnabled === 1,
		isApproved: row.isApproved === 1,
	};
};

export const getCustomIncludesRules = (
	userSnowflake: string,
	isAdmin: boolean,
): CustomIncludesRule[] => {
	const result = tagStore.all /*sql*/ `SELECT
		u.snowflake		userSnowflake,
		u.username		username,
		u.isAdmin		userIsAdmin,
		r.snowflake		snowflake,
		r.categoryName	categoryName,
		r.picture0Path	picture0Path,
		r.picture1Path	picture1Path,
		r.description	description,
		r.optionsCode	optionsCode,
		r.isEnabled		isEnabled,
		r.isApproved	isApproved
	FROM custom_includes_rule r
	JOIN user u ON u.id = r.userId
	WHERE u.snowflake = ${userSnowflake} OR ${isAdmin ? 1 : 0}`;

	return result.map(dbRowToIncludesRule);
};

export const getReadyIncludesRules = (): CustomIncludesRule[] => {
	const result = tagStore.all /*sql*/ `SELECT
		u.snowflake		userSnowflake,
		u.username		username,
		u.isAdmin		userIsAdmin,
		r.snowflake		snowflake,
		r.categoryName	categoryName,
		r.picture0Path	picture0Path,
		r.picture1Path	picture1Path,
		r.description	description,
		r.optionsCode	optionsCode,
		r.isEnabled		isEnabled,
		r.isApproved	isApproved
	FROM custom_includes_rule r
	JOIN user u ON u.id = r.userId
	WHERE r.isEnabled AND r.isApproved`;

	return result.map(dbRowToIncludesRule);
};

export const upsertCustomIncludesRule = (
	snowflake: string,
	rule: CustomIncludesRuleUpload,
	userSnowflake: string,
	isAdmin: boolean,
): boolean => {
	tagStore.run /*sql*/ `INSERT INTO custom_includes_rule (userId, snowflake, categoryName, picture0Path, picture1Path, description, optionsCode, isEnabled, isApproved)
	SELECT u.id, ${snowflake}, ${rule.categoryName}, NULL, NULL, ${rule.description}, ${rule.optionsCode}, ${rule.isEnabled ? 1 : 0}, ${isAdmin ? 1 : 0}
	FROM user u
	WHERE u.snowflake = ${userSnowflake}
	ON CONFLICT (snowflake) DO
	UPDATE SET
		categoryName = excluded.categoryName,
		description = excluded.description,
		optionsCode = excluded.optionsCode,
		isEnabled = excluded.isEnabled,
		isApproved = excluded.isApproved	
	`;

	return isAdmin;
};

export const setRulePictures = (
	snowflake: string,
	picture0Path: string | null | undefined,
	picture1Path: string | null | undefined,
) => {
	if (picture0Path !== undefined)
		tagStore.run /*sql*/ `UPDATE custom_includes_rule SET picture0Path = ${picture0Path} WHERE snowflake = ${snowflake}`;
	if (picture1Path !== undefined)
		tagStore.run /*sql*/ `UPDATE custom_includes_rule SET picture1Path = ${picture1Path} WHERE snowflake = ${snowflake}`;
};

export const setCustomIncludesRuleApproved = (
	ruleSnowflake: string,
	isApproved: boolean,
) => {
	tagStore.run /*sql*/ `UPDATE custom_includes_rule SET isApproved = ${isApproved ? 1 : 0} WHERE snowflake = ${ruleSnowflake}`;
};

export const saveAvatar = async (
	buffer: Uint8Array,
	hash: string,
): Promise<string> => {
	fs.writeFile(`db/avatars/${hash}.webp`, buffer);
	return `${hash}.webp`;
};

export const saveUploadImage = async (
	buffer: Uint8Array,
	snowflake: string,
	extension: string,
): Promise<string> => {
	fs.writeFile(`db/uploads/${snowflake}.${extension}`, buffer);
	return `${snowflake}.${extension}`;
};
