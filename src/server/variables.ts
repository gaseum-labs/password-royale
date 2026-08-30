export const PORT = Number(process.env.PORT);
export const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID as string;
export const DISCORD_CLIENT_SECRET = process.env
	.DISCORD_CLIENT_SECRET as string;
export const DISCORD_API_URL = process.env.DISCORD_API_URL as string;
export const DISCORD_CDN_URL = process.env.DISCORD_CDN_URL as string;
export const COOKIE_NAME = process.env.COOKIE_NAME as string;
export const COOKIE_SECRET = process.env.COOKIE_SECRET as string;
export const NODE_ENV = process.env.NODE_ENV as string;
export const HTTPS_CERT_FILE_PATH = process.env.HTTPS_CERT_FILE_PATH as string;
export const HTTPS_KEY_FILE_PATH = process.env.HTTPS_KEY_FILE_PATH as string;

console.log({
	PORT,
	DISCORD_CLIENT_ID,
	DISCORD_CLIENT_SECRET,
	DISCORD_API_URL,
	DISCORD_CDN_URL,
	COOKIE_NAME,
	COOKIE_SECRET,
	NODE_ENV,
	HTTPS_CERT_FILE_PATH,
	HTTPS_KEY_FILE_PATH,
});
