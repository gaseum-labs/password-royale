import React, { HTMLAttributes, useSyncExternalStore } from 'react';
import * as style from './nav.css.js';
import clsx from 'clsx';

export const useNav = (): string[] => {
	return React.useContext(navContext);
};

const navContext = React.createContext<string[]>([]);

const pathnameToParts = (pathname: string): string[] => {
	pathname = pathname.toLowerCase();
	if (pathname.endsWith('/')) {
		pathname = pathname.slice(0, pathname.length - 1);
	}
	if (pathname.startsWith('/')) {
		pathname = pathname.slice(1);
	}
	return pathname.split('/');
};

let globalPath: string[] = pathnameToParts(window.location.pathname);

let pathListeners: (() => void)[] = [];

const subscribePath = (listener: () => void) => {
	pathListeners.push(listener);
	return () => {
		pathListeners = pathListeners.filter(l => l !== listener);
	};
};

export const getPath = () => globalPath;

const setPath = (path: string[]) => {
	globalPath = path;
	for (const listener of pathListeners) {
		listener();
	}
};

export const navigate = (pathname: string) => {
	window.history.replaceState({}, '', pathname);
	setPath(pathnameToParts(pathname));
};

export const NavProvider = ({ children }: { children?: React.ReactNode }) => {
	const path = useSyncExternalStore(subscribePath, getPath);

	React.useEffect(() => {
		const onPopState = () => {
			setPath(pathnameToParts(window.location.pathname));
		};

		window.addEventListener('popstate', onPopState);

		return () => window.removeEventListener('popstate', onPopState);
	}, []);

	return <navContext.Provider value={path}>{children}</navContext.Provider>;
};

export const Link = ({
	children,
	to,
	className,
	...rest
}: {
	children?: React.ReactNode;
	to: string;
} & HTMLAttributes<HTMLSpanElement>) => {
	const onClick = () => {
		navigate(to);
	};

	return (
		<span
			onClick={onClick}
			className={clsx(style.link, className)}
			{...rest}
		>
			{children}
		</span>
	);
};
