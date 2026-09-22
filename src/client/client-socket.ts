import {
	APIGame,
	ClientMessage,
	ClientMessageDefinition,
	serverMessageSchema,
} from '../shared/api.js';

export type PendingRequest = {
	resolve: (game: any) => void;
	reject: (error: Error) => void;
};

export type Connection = {
	webSocket: WebSocket;
	numRequests: number;
	pendingRequests: Map<number, PendingRequest>;
};

let connection: Connection | undefined = undefined;

export type OnGameListener = (game: APIGame | null) => void;
const onGameListeners: OnGameListener[] = [];

export const registerGameListener = (listener: OnGameListener) => {
	onGameListeners.push(listener);
};
export const removeGameListener = (listener: OnGameListener) => {
	onGameListeners.remove(listener);
};

export const openConnection = (): Connection => {
	if (connection != null && !isClosed(connection.webSocket))
		return connection;

	const webSocket = new WebSocket('/game-socket');

	const pendingRequests = new Map<number, PendingRequest>();

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

		const { resolve, reject } =
			pendingRequests.get(message.requestId ?? -999) ?? {};

		if (message.type === 'error') {
			reject?.(Error(message.errorMessage));
		} else if ('game' in message) {
			for (const listener of onGameListeners) {
				listener(message.game);
			}

			resolve?.(message.game);
		} else {
			resolve?.(message.data);
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

type ResultToYield<T> = T extends undefined ? APIGame | null : T;

export const sendSocketMessage = async <Payload, Result>(
	message: ClientMessageDefinition<Payload, Result>,
	payload?: Payload | undefined,
): Promise<ResultToYield<Result>> => {
	const connection = openConnection();

	if (connection == null) throw Error('No active connection');
	const requestId = connection.numRequests++;

	const { webSocket, pendingRequests } = connection;
	await waitForSocketReady(webSocket);

	webSocket.send(
		JSON.stringify({
			type: message.type,
			requestId,
			payload: payload ?? ({} as any),
		} satisfies ClientMessage),
	);

	let isResolved: boolean = false;
	const { promise, resolve, reject } =
		Promise.withResolvers<ResultToYield<Result>>();

	setTimeout(() => {
		if (isResolved) return;
		reject(Error(`Request ${JSON.stringify(payload)} timed out`));
	}, 10000);

	promise.finally(() => {
		isResolved = true;
		pendingRequests.delete(requestId);
	});

	pendingRequests.set(requestId, { resolve, reject });

	return promise;
};

export const getErrorMessage = (error: unknown): string => {
	return error instanceof Error ? error.message : 'Unknown error';
};
