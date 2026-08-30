import { MeResult } from '../shared/api.js';
import { openConnection } from './socket.js';
import { storeActions } from './store.js';

export const tryGetMe = async () => {
	try {
		const meResponse = await fetch('/api/auth/me', {
			method: 'GET',
		});
		const MeResult = (await meResponse.json()) as MeResult;

		storeActions.receiveMe(MeResult.user);
		openConnection();
	} catch {
		storeActions.receiveMe(undefined);
	}
};
