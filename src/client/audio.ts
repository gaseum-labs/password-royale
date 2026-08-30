export type GameSound = {
	play: () => void;
};

export const createGameSound = (
	context: AudioContext,
	src: string,
): GameSound => {
	const audio = new Audio();
	audio.src = src;
	const track = context.createMediaElementSource(audio);
	track.connect(context.destination);
	return {
		play: () => {
			if (context.state === 'suspended') {
				context.resume();
			}
			audio.play();
		},
	};
};
