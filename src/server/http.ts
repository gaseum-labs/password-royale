import express from 'express';
import http from 'http';
import https from 'https';
import { WebSocketServer } from 'ws';
import { garbageCollectorLoop, onConnection } from './game/game-socket.js';
import fs from 'fs/promises';
import { HTTPS_CERT_FILE_PATH, HTTPS_KEY_FILE_PATH } from './variables.js';

export const app = express();
export const httpServer = http.createServer(app);
export const httpsServer =
	HTTPS_CERT_FILE_PATH != null && HTTPS_KEY_FILE_PATH != null
		? https.createServer(
				{
					cert: await fs.readFile(HTTPS_CERT_FILE_PATH),
					key: await fs.readFile(HTTPS_KEY_FILE_PATH),
				},
				app,
			)
		: undefined;

const httpWebSocketServer = new WebSocketServer({ server: httpServer });
httpWebSocketServer.on('connection', onConnection);

if (httpServer != null) {
	const httpsWebSocketServer = new WebSocketServer({
		server: httpsServer,
	});
	httpsWebSocketServer.on('connection', onConnection);
}

setInterval(garbageCollectorLoop, 10000);
