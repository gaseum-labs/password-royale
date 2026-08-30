import React from 'react';
import { DEFAULT_AVATAR_PATH, User } from '../../shared/api.js';
import * as style from './top-bar.css.js';
import { sendSocketMessage } from '../socket.js';
import { storeActions, useStore } from '../store.js';
import clsx from 'clsx';

export type TopBarProps = {
	user: User;
	gameCode?: string | undefined;
	className?: string;
};

export const TopBar = ({ user, gameCode, className }: TopBarProps) => {
	const errorMessage = useStore(state => state.errorMessage);

	const onLeave = () => {
		window.history.pushState({}, '', '/');
		sendSocketMessage({ type: 'leave' }).catch(storeActions.receiveError);
	};

	const onDismissError = () => {
		storeActions.clearError();
	};

	const onClickGameCode = () => {
		if (gameCode == null) return;
		const origin = window.location.origin;
		window.navigator.clipboard.write([
			new ClipboardItem({
				'text/plain': `${origin}/game/${gameCode.toLowerCase()}`,
			}),
		]);
	};

	return (
		<div className={clsx(style.topBar, className)}>
			<div />
			<div className={style.titlePart}>
				<span className={style.title}>Password Royale</span>
				<span className={style.subtitle} onClick={onClickGameCode}>
					{gameCode != null && (
						<>
							Game code:{' '}
							<span className={style.boldPart}>{gameCode}</span>
						</>
					)}
				</span>
			</div>
			<div className={style.rightPart}>
				{gameCode != null && (
					<span className={style.textButton} onClick={onLeave}>
						Leave
					</span>
				)}
				<a href="/logout" className={style.textButton}>
					Log out
				</a>
				<img
					src={user.avatarUrl ?? DEFAULT_AVATAR_PATH}
					className={style.avatar}
				/>
			</div>
			{errorMessage != null && (
				<div className={style.errorBanner}>
					{errorMessage}
					<span
						className={style.errorBannerX}
						onClick={onDismissError}
					>
						×
					</span>
				</div>
			)}
		</div>
	);
};
