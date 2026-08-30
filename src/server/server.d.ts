import type { Session } from './auth/auth-cookie.ts';

declare global {
	namespace Express {
		export interface Request {
			session: Session;
			isCookieUpdated?: boolean;
		}
	}
}
