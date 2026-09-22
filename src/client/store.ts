import { combine } from 'zustand/middleware';
import { create } from 'zustand';
import { APIUser } from '../shared/api.js';
import { enableMapSet, produce } from 'immer';
import { getErrorMessage } from './client-socket.js';

enableMapSet();

export const LOGGING_IN = Symbol();
export type LoggingIn = typeof LOGGING_IN;

export type StoreState = {
	user: APIUser | LoggingIn | undefined;
	errorMessage: string | undefined;
};

const initialState: StoreState = {
	user: LOGGING_IN,
	errorMessage: undefined,
};

export const useMainStore = create(
	combine(initialState, set => {
		const immSet = (producer: (state: StoreState) => void) =>
			set(produce(producer));

		return {
			receiveMe: (user: APIUser | undefined) =>
				immSet(state => {
					state.user = user;
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

export const mainActions = useMainStore.getState();
