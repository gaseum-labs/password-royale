import { Router, Request } from 'express';
import { Database } from '../database/index.js';
import {
	DISCORD_API_URL,
	DISCORD_CDN_URL,
	DISCORD_CLIENT_ID,
	DISCORD_CLIENT_SECRET,
} from '../variables.js';
import crypto from 'node:crypto';
import { newRandomSnowflake } from '../snowflake.js';

const router = Router();

type DiscordTokenResult = {
	access_token: string;
	token_type: 'Bearer';
	expires_in: number;
	refresh_token: string;
	scope: string;
};

type DiscordUserResult = {
	id: string;
	username: string;
	discriminator: string;
	avatar?: string | undefined;
	accent_color?: string | undefined;
};

router.get('/login-callback', async (req, res) => {
	const code = req.query.code;
	if (typeof code !== 'string') throw Error('Bad login response (no code)');

	const apiUrl = new URL('oauth2/token', DISCORD_API_URL);
	const apiBody = new FormData();
	apiBody.append('grant_type', 'authorization_code');
	apiBody.append('code', code);
	apiBody.append('redirect_uri', getLoginRedirectUrl(req));
	const apiResponse = await fetch(apiUrl, {
		method: 'POST',
		body: apiBody,
		headers: {
			Authorization: `Basic ${Buffer.from(
				`${DISCORD_CLIENT_ID}:${DISCORD_CLIENT_SECRET}`,
				'ascii',
			).toString('base64')}`,
		},
	});
	const tokenResult = (await apiResponse.json()) as DiscordTokenResult;

	console.log(apiResponse.status, apiResponse.statusText, tokenResult);

	const userResponse = await fetch(new URL('users/@me', DISCORD_API_URL), {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${tokenResult.access_token}`,
		},
	});
	const userResult = (await userResponse.json()) as DiscordUserResult;

	console.log(userResult);

	let avatarUrl: string | undefined = undefined;
	if (userResult.avatar != null) {
		const avatarResponse = await fetch(
			new URL(
				`avatars/${userResult.id}/${userResult.avatar}.webp`,
				DISCORD_CDN_URL,
			),
		);
		const blob = await avatarResponse.blob();
		const bytes = await blob.bytes();
		avatarUrl = await Database.saveAvatar(bytes, userResult.avatar);
	}

	Database.upsertUser({
		avatarPath: avatarUrl ?? null,
		snowflake: userResult.id,
		username: userResult.username,
		isAdmin: false,
	});

	req.session.userSnowflake = userResult.id;
	req.isCookieUpdated = true;
	res.redirect('/');
});

router.get('/login', (req, res) => {
	res.redirect(
		`https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(getLoginRedirectUrl(req))}&scope=identify`,
	);
});

router.get('/logout', (req, res) => {
	req.session = {};
	req.isCookieUpdated = true;
	res.redirect('/');
});

router.get('/spoof', (req, res) => {
	const { userSnowflake } = req.session;
	if (userSnowflake == null) return res.sendStatus(401);
	const user = Database.getUser(userSnowflake);
	if (!user?.isAdmin) return res.sendStatus(403);

	req.session = { userSnowflake: newRandomSnowflake() };
	req.isCookieUpdated = true;
	res.redirect('/');
});

const getRequestOrigin = (req: Request): string => {
	return req.protocol + '://' + req.host;
};

const getLoginRedirectUrl = (req: Request) =>
	new URL('auth/login-callback', getRequestOrigin(req)).href;

export { router as authRouter };
