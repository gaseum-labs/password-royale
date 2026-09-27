import { Request, Response } from 'express';
import { Database } from '../database/index.js';
import { DatabaseUser } from '../database/database.js';
import { RequestError } from '../error.js';

export const getUserInfo = (
	req: Request,
	{ needsAdmin }: { needsAdmin?: boolean } = {},
): DatabaseUser => {
	const { userSnowflake } = req.session;
	if (userSnowflake == null) throw new RequestError('Not logged in', 401);

	const user = Database.getUser(userSnowflake);
	if (user == null) throw new RequestError('Invalid user', 401);

	if (needsAdmin === true && !user.isAdmin)
		throw new RequestError('You are not an admin', 403);

	return user;
};
