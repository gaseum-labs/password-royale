import { MeResult } from '../shared/api.js';
import { openConnection } from './client-socket.js';
import { mainActions } from './store.js';

export const tryGetMe = async () => {
	try {
		const meResponse = await fetch('/api/auth/me', {
			method: 'GET',
		});
		const MeResult = (await meResponse.json()) as MeResult;

		mainActions.receiveMe(MeResult.user);
		openConnection();
	} catch (error) {
		console.error(error);
		mainActions.receiveMe(undefined);
	}
};
