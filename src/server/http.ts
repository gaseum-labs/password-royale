import express from 'express';
import http from 'http';
import https from 'https';
import { WebSocketServer } from 'ws';
import { onConnection } from './game/game-socket.js';
import fs from 'fs/promises';
import { HTTPS_CERT_FILE_PATH, HTTPS_KEY_FILE_PATH } from './variables.js';

export const app = express();
export const httpServer = http.createServer(app);
export const httpsServer = https.createServer(
	{
		cert: await fs.readFile(HTTPS_CERT_FILE_PATH),
		key: await fs.readFile(HTTPS_KEY_FILE_PATH),
	},
	app,
);
export const httpWebSocketServer = new WebSocketServer({ server: httpServer });
export const httpsWebSocketServer = new WebSocketServer({
	server: httpsServer,
});
httpWebSocketServer.on('connection', onConnection);
httpsWebSocketServer.on('connection', onConnection);
