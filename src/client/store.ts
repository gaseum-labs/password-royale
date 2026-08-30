import { combine } from 'zustand/middleware';
import { create } from 'zustand';
import { APIGame, User } from '../shared/api.js';
import { enableMapSet, produce } from 'immer';
import { getErrorMessage } from './socket.js';

enableMapSet();

export const LOGGING_IN = Symbol();
export type LoggingIn = typeof LOGGING_IN;

export type StoreState = {
	game: APIGame | null | undefined;
	user: User | LoggingIn | undefined;
	errorMessage: string | undefined;
};

const initialState: StoreState = {
	game: undefined,
	user: LOGGING_IN,
	errorMessage: undefined,
};

export const useStore = create(
	combine(initialState, set => {
		const immSet = (producer: (state: StoreState) => void) =>
			set(produce(producer));

		return {
			receiveMe: (user: User | undefined) =>
				immSet(state => {
					state.user = user;
				}),
			setGame: (game: APIGame | null) =>
				immSet(state => {
					state.game = game;
				}),
			clearError: () =>
				immSet(state => {
					state.errorMessage = undefined;
				}),
			receiveError: (error: unknown) => {
				console.error(error);
				const message = getErrorMessage(error);
				immSet(state => {
					state.errorMessage = message;
				});
			},
		};
	}),
);

export const storeActions = useStore.getState();
