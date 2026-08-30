import crypto from 'node:crypto';
import { COOKIE_SECRET } from '../variables.js';

export type Session = {
	userSnowflake?: string | undefined;
};

export const parseCookieHeader = (cookie: string): Record<string, string> => {
	const cookies: Record<string, string> = {};
	const parts = cookie.split('; ');
	for (const part of parts) {
		const equalsIndex = part.indexOf('=');
		if (equalsIndex === -1) continue;
		const name = decodeURIComponent(part.slice(0, equalsIndex));
		const value = decodeURIComponent(part.slice(equalsIndex + 1));
		cookies[name] = value;
	}
	return cookies;
};

const makeHash = (textValue: string): string => {
	const hash = crypto.createHash('SHA-256');
	hash.update(textValue, 'ascii');
	hash.update(COOKIE_SECRET, 'base64');
	return hash.digest('base64url');
};

export const encodeAuthCookieValue = (session: Session): string => {
	const textValue = JSON.stringify(session);
	return `${makeHash(textValue)}.${textValue}`;
};

export const verifyAuthCookieValue = (
	cookieValue: string,
): Session | undefined => {
	const dotIndex = cookieValue.indexOf('.');
	const hashPart = cookieValue.slice(0, dotIndex);
	const valuePart = cookieValue.slice(dotIndex + 1);
	const realHash = makeHash(valuePart);
	if (hashPart !== realHash) return undefined;
	try {
		return JSON.parse(valuePart);
	} catch {
		return undefined;
	}
};
