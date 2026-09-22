import '../shared/util.js';
import express, { ErrorRequestHandler, Router } from 'express';
import cookieParser from 'cookie-parser';
import fs from 'node:fs/promises';
import { app, httpsServer, httpServer } from './http.js';
import { COOKIE_NAME, NODE_ENV, PORT } from './variables.js';
import {
	encodeAuthCookieValue,
	verifyAuthCookieValue,
} from './auth/auth-cookie.js';
import { createServer } from 'vite';
import { authRouter } from './auth/auth-router.js';
import { apiRouter } from './api-router.js';

app.enable('trust-proxy');

app.use(cookieParser());

app.use((req, res, next) => {
	const cookieValue = req.cookies[COOKIE_NAME] as string | undefined;
	if (cookieValue == null) {
		req.session = {};
		return next();
	}
	const parsedSession = verifyAuthCookieValue(cookieValue);
	req.session = parsedSession ?? {};
	next();
});

app.use((req, res, next) => {
	const originalWriteHead = res.writeHead;
	let fired = false;
	res.writeHead = function (...args) {
		if (!fired) {
			fired = true;
			if (req.isCookieUpdated) {
				const { session } = req;
				if (session == null) {
					res.clearCookie(COOKIE_NAME, {
						secure: true,
						httpOnly: true,
						sameSite: 'lax',
						maxAge: 2592000000,
					});
				} else {
					res.cookie(COOKIE_NAME, encodeAuthCookieValue(session), {
						secure: true,
						httpOnly: true,
						sameSite: 'lax',
						maxAge: 2592000000,
					});
				}
			}
		}
		return originalWriteHead.apply(res, args as any);
	};
	next();
});

app.use('/api', apiRouter);

app.use('/auth', authRouter);

if (NODE_ENV === 'development') {
	const viteApp = await createServer({
		configFile: 'vite.config.js',
		server: { middlewareMode: true },
	});
	app.use(viteApp.middlewares);
} else {
	app.use(express.static('dist/public', { index: false }));

	app.get('/{*path}.{:ext}', (req, res) => res.sendStatus(404));

	app.get('/{*path}', async (req, res) => {
		const htmlFile = await fs.readFile('dist/public/index.html');
		res.contentType('text/html');
		res.send(htmlFile);
	});

	app.use((req, res) => res.sendStatus(404));
}

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
	const message = err instanceof Error ? err.message : 'Unknown error';
	res.status(500).json({ message });
};

app.use(errorHandler);

httpServer.listen(PORT);
httpsServer.listen(443);

console.log(`app listening on ${PORT}, https on 443`);
