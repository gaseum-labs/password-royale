export const getAvatarPath = (userSnowflake: string) => {
	return `/api/avatar/${userSnowflake}`;
};

export const getPicturePath = (picturePath: string) => {
	return `/api/picture/${picturePath}`;
};
