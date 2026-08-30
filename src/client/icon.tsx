import React from 'react';
import * as style from './icon.css.js';

export const Icon = ({ icon }: { icon: string }) => {
	return (
		<div
			dangerouslySetInnerHTML={{ __html: icon }}
			className={style.icon}
		></div>
	);
};
