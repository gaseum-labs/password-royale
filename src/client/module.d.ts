export {};

declare global {
	declare module '*.svg?raw' {
		declare const content: string;
		export default content;
	}

	declare module '*.svg?url' {
		declare const content: string;
		export default content;
	}

	declare module '*.ttf?url' {
		declare const content: string;
		export default content;
	}

	declare module '*.wav?url' {
		declare const content: string;
		export default content;
	}
}
