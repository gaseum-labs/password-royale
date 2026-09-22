import React from 'react';
import { APIUser, leaveMessage } from '../../shared/api.js';
import * as style from './top-bar.css.js';
import { sendSocketMessage } from '../client-socket.js';
import { mainActions, useMainStore } from '../store.js';
import clsx from 'clsx';
import { getAvatarPath } from '../avatar.js';
import { navigate } from '../nav.js';

export type TopBarProps = {
	user: APIUser;
	gameCode?: string | undefined;
	className?: string;
};

export const TopBar = ({ user, gameCode, className }: TopBarProps) => {
	const errorMessage = useMainStore(state => state.errorMessage);

	const onLeave = () => {
		navigate('/');
		sendSocketMessage(leaveMessage).catch(mainActions.receiveError);
	};

	const onDismissError = () => {
		mainActions.clearError();
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
				<a href="/auth/logout" className={style.textButton}>
					Log out
				</a>
				<img src={getAvatarPath(user)} className={style.avatar} />
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
