import React from 'react';
import { TopBar } from './top-bar.js';
import { User } from '../../shared/api.js';
import { useImmer } from 'use-immer';
import { EditorState } from '../editor.js';

export const EditorPage = ({ user }: { user: User }) => {
	const [editorState, setEditorState] = useImmer<EditorState>({
		allRules: [],
		placedRules: [],
	});

	return (
		<div>
			<TopBar user={user} />
			<div></div>
			<div></div>
		</div>
	);
};
