import {
	ClientMessage,
	ClientMessagePayload,
	serverMessageSchema,
} from '../shared/api.js';
import { storeActions } from './store.js';

export type Connection = {
	webSocket: WebSocket;
	numRequests: number;
	pendingRequests: Map<number, (error: Error) => void>;
};

let connection: Connection | undefined = undefined;

export const openConnection = (): Connection => {
	if (connection != null && !isClosed(connection.webSocket))
		return connection;

	const webSocket = new WebSocket('/game-socket');

	const pendingRequests: Map<number, (error: Error) => void> = new Map();

	webSocket.binaryType = 'arraybuffer';

	webSocket.onmessage = event => {
		const dataString =
			typeof event.data === 'string' ? event.data : undefined;
		if (dataString == null) return;

		let json: unknown;
		try {
			json = JSON.parse(dataString);
		} catch {
			return;
		}

		const message = serverMessageSchema.safeParse(json).data;
		if (message == null) return;

		if ('requestId' in message) {
			const rejector = pendingRequests.get(message.requestId);
			if (rejector == null) return;
			rejector(Error(message.errorMessage));
		} else {
			storeActions.setGame(message.game);
		}
	};

	webSocket.onclose = () => {
		connection = undefined;
	};

	connection = {
		webSocket,
		pendingRequests,
		numRequests: 0,
	};

	return connection;
};

export const waitForSocketReady = async (
	webSocket: WebSocket,
): Promise<void> => {
	if (webSocket.readyState === 1) {
		return;
	}

	if (isClosed(webSocket)) {
		throw Error('Websocket is closed');
	}

	if (webSocket.readyState === 0) {
		const { promise, resolve, reject } = Promise.withResolvers<void>();
		promise.catch();
		setTimeout(
			() => waitForSocketReady(webSocket).then(resolve).catch(reject),
			100,
		);
		return promise;
	}
};

const isClosed = (webSocket: WebSocket): boolean => {
	return webSocket.readyState === 2 || webSocket.readyState === 3;
};

export const sendSocketMessage = async (
	payload: ClientMessagePayload,
): Promise<void> => {
	const connection = openConnection();

	if (connection == null) throw Error('No active connection');
	const requestId = connection.numRequests++;

	const { webSocket, pendingRequests } = connection;
	await waitForSocketReady(webSocket);

	webSocket.send(
		JSON.stringify({ requestId, payload } satisfies ClientMessage),
	);

	const { promise, reject } = Promise.withResolvers<void>();

	promise.finally(() => {
		pendingRequests.delete(requestId);
	});

	pendingRequests.set(requestId, reject);

	return promise;
};

export const getErrorMessage = (error: unknown): string => {
	return error instanceof Error ? error.message : 'Unknown error';
};
