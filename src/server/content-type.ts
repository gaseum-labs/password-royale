export const contentTypeMap = {
	webp: 'image/webp',
	png: 'image/png',
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
};

export const getExtension = (segments: string[]): string | undefined => {
	const lastSegment = segments[segments.length - 1];
	const dotIndex = lastSegment.lastIndexOf('.');
	if (dotIndex === -1) return undefined;
	return lastSegment.slice(dotIndex + 1);
};

export const getContentType = (extension: string | undefined): string => {
	if (extension != null && extension in contentTypeMap) {
		return contentTypeMap[extension as keyof typeof contentTypeMap];
	}
	return 'text/plain';
};
