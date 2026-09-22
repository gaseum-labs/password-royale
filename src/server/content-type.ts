export const contentTypeMap = {
	'.webp': 'image/webp',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
};

export const getContentType = (extension: string | undefined): string => {
	if (extension != null && extension in contentTypeMap) {
		return contentTypeMap[extension as keyof typeof contentTypeMap];
	}
	return 'text/plain';
};
