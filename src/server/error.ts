export class RequestError extends Error {
	code: number;
	constructor(message: string, code: number = 500) {
		super(message);
		this.name = 'RequestError';
		this.code = code;
	}
}
