import { APIUser } from '../shared/api.js';

export const getAvatarPath = (user: APIUser) => {
	return `/api/avatar/${user.snowflake}`;
};
