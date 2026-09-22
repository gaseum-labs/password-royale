import express from 'express';
import { Database } from './database/index.js';
import { MeResult } from '../shared/api.js';
import fs from 'node:fs/promises';
import { getContentType } from './content-type.js';
import path from 'node:path';
import Sharp from 'sharp';
import { parseSnowflake } from './snowflake.js';

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
	if (user == null) return res.sendStatus(404);

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
		res.sendStatus(404);
	}
});

router.use((req, res) => {
	res.sendStatus(404);
});

export { router as apiRouter };
