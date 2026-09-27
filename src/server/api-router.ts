import express from 'express';
import { Database } from './database/index.js';
import {
	BINARY_PAYLOAD_LIMIT,
	CustomIncludesRule,
	customIncludesRuleUploadSchema,
	MeResult,
	ruleApprovedBodySchema,
} from '../shared/api.js';
import fs from 'node:fs/promises';
import { getContentType } from './content-type.js';
import path from 'node:path';
import Sharp from 'sharp';
import { newRandomSnowflake, parseSnowflake } from './snowflake.js';
import {
	decodeBinary,
	DecodedPart,
	getOnlyJsonPart,
	getPartAsBinary,
} from '../shared/protocol.js';
import { saveUploadImage } from './database/database.js';
import { getUserInfo } from './auth/auth-util.js';
import { RequestError } from './error.js';

const router = express.Router();

router.get('/auth/me', (req, res) => {
	const { userSnowflake } = req.session;
	if (userSnowflake == null) {
		res.json({} satisfies MeResult);
		return;
	}

	const user = Database.getUser(userSnowflake);
	res.json({
		user:
			user == null
				? undefined
				: {
						username: user.username,
						snowflake: user.snowflake,
						isAdmin: user.isAdmin,
					},
	} satisfies MeResult);
});

router.get('/avatar/:snowflake', async (req, res) => {
	const { snowflake } = req.params;
	const user = Database.getUser(snowflake);
	if (user == null) throw new RequestError('User not found', 404);

	try {
		if (user.avatarPath == null) {
			const [timestamp] = parseSnowflake(snowflake);
			const rotation = timestamp % 360;

			const file = await fs.readFile('dist/public/default-avatar.webp');
			const buffer = await new Sharp(file.buffer)
				.modulate({
					hue: rotation,
				})
				.toBuffer();

			res.setHeader('Cache-Control', 'max-age=6000, public');
			res.contentType(getContentType('webp'));
			res.send(buffer);
		} else {
			const file = await fs.readFile(`db/avatars/${user.avatarPath}`);
			const extension = path.extname(user.avatarPath);

			res.setHeader('Cache-Control', 'max-age=6000, public');
			res.contentType(getContentType(extension));
			res.send(file);
		}
	} catch {
		throw new RequestError('Avatar not found', 404);
	}
});

router.get('/picture/:filePath', async (req, res) => {
	const { filePath } = req.params;
	try {
		const buffer = await fs.readFile(path.join('db/uploads/', filePath));
		const extension = path.extname(filePath);

		res.setHeader('Cache-Control', 'max-age=6000, public');
		res.contentType(getContentType(extension));
		res.send(buffer);
	} catch {
		throw new RequestError('Picture not found', 404);
	}
});

router.get('/custom-includes-rule/me', async (req, res) => {
	const user = getUserInfo(req);

	res.json(Database.getCustomIncludesRules(user.snowflake, user.isAdmin));
});

const SUPPORTED_FORMATS = {
	jpeg: 'jpg',
	webp: 'webp',
	png: 'png',
} as const;

const getExtension = (format: string): string => {
	if (format in SUPPORTED_FORMATS)
		return SUPPORTED_FORMATS[format as keyof typeof SUPPORTED_FORMATS];
	throw Error(`Unsupported image format ${format}`);
};

const getPicturePath = async (
	parts: DecodedPart[],
	pictureIndex: number | null | undefined,
): Promise<string | null | undefined> => {
	if (pictureIndex === undefined) return undefined;
	if (pictureIndex === null) return null;
	const buffer = getPartAsBinary(parts, pictureIndex);
	const sharp = new Sharp(buffer);
	const { data, info } = await sharp.toBuffer({
		resolveWithObject: true,
	});
	const format = info.format;
	const extension = getExtension(format);

	return saveUploadImage(data, newRandomSnowflake(), extension);
};

router.put(
	'/custom-includes-rule',
	express.raw({ limit: BINARY_PAYLOAD_LIMIT }),
	async (req, res) => {
		const user = getUserInfo(req);

		const buffer = req.body as Uint8Array;

		const parts = decodeBinary(buffer);

		const header = customIncludesRuleUploadSchema.parse(
			getOnlyJsonPart(parts),
		);
		const snowflake = header.snowflake ?? newRandomSnowflake();

		const owner = Database.getCustomIncludesRuleOwner(snowflake);
		if (
			!user.isAdmin &&
			owner != null &&
			owner.snowflake !== user.snowflake
		) {
			throw new RequestError("You can't alter this rule", 403);
		}

		const picture0Path = await getPicturePath(parts, header.picture0);
		const picture1Path = await getPicturePath(parts, header.picture1);

		const isApproved = Database.upsertCustomIncludesRule(
			snowflake,
			header,
			user.snowflake,
			user.isAdmin,
		);
		Database.setRulePictures(snowflake, picture0Path, picture1Path);

		res.json({
			user: owner ?? user,
			snowflake,
			categoryName: header.categoryName,
			description: header.description,
			optionsCode: header.optionsCode,
			isEnabled: header.isEnabled,
			isApproved: isApproved,
			picture0Path: picture0Path ?? null,
			picture1Path: picture1Path ?? null,
		} satisfies CustomIncludesRule);
	},
);

router.put(
	'/custom-includes-rule/approved',
	express.json(),
	async (req, res) => {
		getUserInfo(req, { needsAdmin: true });

		const { snowflake, isApproved } = ruleApprovedBodySchema.parse(
			req.body,
		);

		Database.setCustomIncludesRuleApproved(snowflake, isApproved);

		res.json(isApproved);
	},
);

router.use((_req, res) => {
	res.sendStatus(404);
});

export { router as apiRouter };
