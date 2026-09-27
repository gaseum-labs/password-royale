import React from 'react';
import {
	APIUser,
	BINARY_PAYLOAD_LIMIT,
	CustomIncludesRule,
	CustomIncludesRuleUpload,
	RuleApprovedBody,
} from '../../shared/api.js';
import { Updater, useImmer } from 'use-immer';
import { mainActions } from '../store.js';
import { getAvatarPath, getPicturePath } from '../../shared/asset-path.js';
import { original } from 'immer';
import * as generalStyle from '../util.css.js';
import * as style from './editor-page.css.js';
import { TopBar } from './top-bar.js';
import clsx from 'clsx';
import * as themeStyle from '../theme.css.js';
import { encodeBinary } from '../../shared/protocol.js';
import { parseOptionsCode } from '../../shared/options.js';
import { navigate } from '../nav.js';

type UploadedFile = {
	file: File;
	dataUrl: string | undefined;
};

type Form = {
	snowflake: string | undefined;
	user: APIUser;
	images: [UploadedFile | string | null, UploadedFile | string | null];
	categoryName: string;
	isEnabled: boolean;
	description: string;
	optionsCode: string;
	isApproved: boolean;
};

type EditorState = {
	isLoading: boolean;
	rules: CustomIncludesRule[] | undefined;
	form: Form | undefined;
};

export const EditorPage = ({ user }: { user: APIUser }) => {
	const [{ form, isLoading, rules }, setEditorState] = useImmer<EditorState>({
		isLoading: false,
		rules: undefined,
		form: undefined,
	});

	return (
		<div
			className={clsx(
				themeStyle.darkTheme,
				generalStyle.page,
				style.editorPage,
			)}
		>
			<TopBar user={user} className={style.topBar} />

			{form == null ? (
				<ListView
					rules={rules}
					setEditorState={setEditorState}
					user={user}
				/>
			) : (
				<FormView
					form={form}
					user={user}
					isLoading={isLoading}
					setEditorState={setEditorState}
				/>
			)}
		</div>
	);
};

export const ListView = ({
	rules,
	setEditorState,
	user,
}: {
	rules: CustomIncludesRule[] | undefined;
	setEditorState: Updater<EditorState>;
	user: APIUser;
}) => {
	React.useEffect(() => {
		fetch('/api/custom-includes-rule/me')
			.then(response => response.json())
			.then(rules =>
				setEditorState(state => {
					state.rules = rules;
				}),
			)
			.catch(mainActions.receiveError);
	}, []);

	const onClickListItem = (snowflake: string) => {
		setEditorState(state => {
			const rule = original(state)?.rules?.find(
				rule => rule.snowflake === snowflake,
			);
			if (rule == null) return;

			state.form = {
				snowflake,
				images: [rule.picture0Path, rule.picture1Path],
				user: rule.user,
				categoryName: rule.categoryName,
				isEnabled: rule.isEnabled,
				description: rule.description ?? '',
				optionsCode: rule.optionsCode,
				isApproved: rule.isApproved,
			};
		});
	};

	const onClickNew = () => {
		setEditorState(state => {
			state.form = {
				snowflake: undefined,
				categoryName: '',
				images: [null, null],
				user: user,
				isEnabled: false,
				description: '',
				optionsCode: '',
				isApproved: false,
			};
		});
	};

	const onBack = () => {
		navigate('/');
	};

	return (
		<div className={style.listContent}>
			<button className={style.backButton} onClick={onBack}>
				Back
			</button>
			{rules == null && <span>Loading...</span>}
			{rules?.map(rule => (
				<div
					key={rule.snowflake}
					onClick={() => onClickListItem(rule.snowflake)}
					className={style.listItem}
				>
					<div className={style.listRow}>
						<img
							src={getAvatarPath(rule.user.snowflake)}
							className={style.avatar}
						/>
						<span className={style.listFit}>
							{rule.user.username}
						</span>
						<span className={style.listFit}>
							{rule.categoryName}
						</span>
						<input
							type="checkbox"
							value={rule.isEnabled.toString()}
							readOnly
							className={style.listFit}
						/>
						<div className={style.rightBox}>
							<span
								className={clsx(
									rule.isApproved && style.approvedText,
								)}
							>
								{rule.isApproved ? 'Approved' : 'Not Approved'}
							</span>
						</div>
					</div>
					<div className={style.listRow}>
						{rule.picture0Path == null ? (
							<div className={style.listFlex} />
						) : (
							<img
								src={getPicturePath(rule.picture0Path)}
								className={style.listImg}
							/>
						)}
						{rule.picture1Path == null ? (
							<div className={style.listFlex} />
						) : (
							<img
								src={getPicturePath(rule.picture1Path)}
								className={style.listImg}
							/>
						)}
					</div>
				</div>
			))}
			{rules?.isEmpty() && (
				<span className={style.splashText}>
					You have no custom rules yet. Press the button to get
					started.
				</span>
			)}
			<button onClick={onClickNew} className={style.createRule}>
				Create new Rule +
			</button>
		</div>
	);
};

export const FormView = ({
	form,
	user,
	setEditorState,
	isLoading,
}: {
	form: Form;
	user: APIUser;
	isLoading: boolean;
	setEditorState: Updater<EditorState>;
}) => {
	const onUploadFile = (event: React.ChangeEvent<HTMLInputElement>) => {
		const fileIndex = Number(event.currentTarget.dataset.fileIndex);
		const file = event.currentTarget.files?.item(0) ?? null;

		setEditorState(state => {
			if (state.form == null) return;
			state.form.images[fileIndex] =
				file == null
					? null
					: {
							dataUrl: '',
							file,
						};
		});

		if (file != null) {
			const reader = new FileReader();
			reader.onloadend = event => {
				setEditorState(state => {
					if (state.form == null) return;
					const uploadedFile = state.form.images[fileIndex];
					if (
						uploadedFile == null ||
						typeof uploadedFile === 'string'
					)
						return;
					uploadedFile.dataUrl =
						(event.target?.result as string | undefined) ??
						undefined;
				});
			};
			reader.readAsDataURL(file);
		}
	};

	const onClearFile = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation();
		const fileIndex = Number(event.currentTarget.dataset.fileIndex);
		setEditorState(state => {
			if (state.form == null) return;
			state.form.images[fileIndex] = null;
		});
	};

	const onChangeCategoryName = (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const { value } = event.currentTarget;
		setEditorState(state => {
			if (state.form == null) return;
			state.form.categoryName = value;
		});
	};

	const onChangeOptionsCode = (
		event: React.ChangeEvent<HTMLTextAreaElement>,
	) => {
		const { value: rawValue } = event.currentTarget;
		const value = rawValue.replace(/[^\n -~]/g, '');
		setEditorState(state => {
			if (state.form == null) return;
			state.form.optionsCode = value;
		});
	};

	const onChangeDescription = (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const { value } = event.currentTarget;
		setEditorState(state => {
			if (state.form == null) return;
			state.form.description = value;
		});
	};

	const onClickSave = async () => {
		if (form == null) return;

		setEditorState(state => {
			state.isLoading = true;
		});

		const parts: (Uint8Array | unknown)[] = [];

		const picture0 = await encodePicture(parts, form.images[0]);
		const picture1 = await encodePicture(parts, form.images[1]);
		parts.push({
			snowflake: form.snowflake,
			categoryName: form.categoryName,
			description: form.description,
			isEnabled: form.isEnabled,
			optionsCode: form.optionsCode,
			picture0,
			picture1,
		} satisfies CustomIncludesRuleUpload);

		fetch('/api/custom-includes-rule', {
			method: 'PUT',
			body: encodeBinary(parts) as BodyInit,
			headers: {
				'Content-Type': 'application/octet-stream',
			},
		})
			.then(result => result.json())
			.then((newRule: CustomIncludesRule) =>
				setEditorState(state => {
					state.form = {
						categoryName: newRule.categoryName,
						description: newRule.description ?? '',
						images: [newRule.picture0Path, newRule.picture1Path],
						isEnabled: newRule.isEnabled,
						optionsCode: newRule.optionsCode,
						snowflake: newRule.snowflake,
						user: newRule.user,
						isApproved: newRule.isApproved,
					};
				}),
			)
			.catch(mainActions.receiveError)
			.finally(() => {
				setEditorState(state => {
					state.isLoading = false;
				});
			});
	};

	const onClickDiscard = async () => {
		setEditorState(state => {
			state.form = undefined;
		});
	};

	const canApprove = form.snowflake != null && user.isAdmin;
	const onClickApproved = async () => {
		if (form.snowflake == null) return;
		setEditorState(draft => {
			draft.isLoading = true;
		});
		fetch('/api/custom-includes-rule/approved', {
			method: 'PUT',
			body: JSON.stringify({
				snowflake: form.snowflake,
				isApproved: !form.isApproved,
			} satisfies RuleApprovedBody),
			headers: {
				'Content-Type': 'application/json',
			},
		})
			.then(result => result.json())
			.then((isApproved: boolean) =>
				setEditorState(draft => {
					if (draft.form == null) return;
					draft.form.isApproved = isApproved;
				}),
			)
			.catch(mainActions.receiveError)
			.finally(() =>
				setEditorState(draft => {
					draft.isLoading = false;
				}),
			);
	};

	const parsedOptions =
		form == null ? [] : parseOptionsCode(form.optionsCode);

	const totalUploadSize =
		(asUploadFile(form?.images[0])?.file.size ?? 0) +
		(asUploadFile(form?.images[1])?.file.size ?? 0);

	const uploadTooBig = totalUploadSize > BINARY_PAYLOAD_LIMIT;

	const canUpload =
		!isLoading &&
		form != null &&
		form.categoryName.trim().length > 0 &&
		parsedOptions.length > 0 &&
		form.description != null &&
		!uploadTooBig;

	return (
		<div className={style.formContent}>
			<div className={style.formRow}>
				<img
					src={getAvatarPath(form.user.snowflake)}
					className={style.avatar}
				/>
				<b>{form.user.username}</b>
				<span className={style.wide}>
					Must include
					<input
						className={style.wideInput}
						value={form.categoryName}
						onChange={onChangeCategoryName}
					/>
				</span>
				<button
					className={clsx(generalStyle.button, style.discardButton)}
					onClick={onClickDiscard}
				>
					Back to list
				</button>
			</div>

			<div className={style.formRow}>
				<span className={style.wide}>
					Description
					<input
						className={style.wideInput}
						value={form.description}
						onChange={onChangeDescription}
					/>
				</span>
				<span className={style.inlineInput}>
					Ready to show in games
					<input
						type="checkbox"
						className={style.checkbox}
						value={form.isEnabled.toString()}
					/>
				</span>
				<span
					className={clsx(
						canApprove && style.clickable,
						form.isApproved && style.approvedText,
					)}
					onClick={canApprove ? onClickApproved : undefined}
				>
					{form.isApproved ? 'Approved' : 'Not Approved'}
				</span>
			</div>

			<div className={style.formRow}>
				<ImageBox
					fileIndex={0}
					picture={form.images[0]}
					onClickDelete={onClearFile}
					onUploadFile={onUploadFile}
				/>
				<ImageBox
					fileIndex={1}
					picture={form.images[1]}
					onClickDelete={onClearFile}
					onUploadFile={onUploadFile}
				/>
			</div>

			<div className={style.formRow}>
				<span>
					Options Code{' '}
					<i className={style.explainer}>
						Enter options separated by newlines. " " and "'" are
						optional characters. Not case sensitive.
					</i>
				</span>
				<div className={clsx(style.rightBox, style.counter)}>
					<span>
						{parsedOptions.length} option
						{parsedOptions.length === 1 ? (
							<span className={style.invisChar}>_</span>
						) : (
							's'
						)}
					</span>
				</div>
			</div>
			<textarea
				value={form.optionsCode}
				onChange={onChangeOptionsCode}
				className={style.textArea}
				rows={24}
			/>
			<div className={style.bottomRow}>
				<button
					className={clsx(
						generalStyle.button,
						generalStyle.suggestButton,
					)}
					disabled={!canUpload}
					onClick={onClickSave}
				>
					{uploadTooBig
						? `Uploaded files too big ${Math.floor(totalUploadSize / 1000000)}kb > ${Math.floor(BINARY_PAYLOAD_LIMIT / 1000000)}kb`
						: 'Save'}
				</button>
			</div>
		</div>
	);
};

const encodePicture = async (
	parts: unknown[],
	formPicture: string | UploadedFile | null,
): Promise<number | null | undefined> => {
	if (formPicture === null) return null;
	if (typeof formPicture === 'string') return undefined;
	const index = parts.length;
	parts.push(await formPicture.file.bytes());
	return index;
};

const ImageBox = ({
	fileIndex,
	picture,
	onClickDelete,
	onUploadFile,
}: {
	fileIndex: number;
	picture: string | UploadedFile | null;
	onClickDelete: (event: React.MouseEvent<HTMLButtonElement>) => void;
	onUploadFile: React.ChangeEventHandler<HTMLInputElement>;
}) => {
	const source =
		picture == null
			? undefined
			: typeof picture === 'string'
				? getPicturePath(picture)
				: picture.dataUrl;

	const inputRef = React.useRef<HTMLInputElement>(null);

	const onClick = () => {
		inputRef.current?.click();
	};

	return (
		<div className={style.pictureSuper}>
			<span>Image {fileIndex}</span>
			<div onClick={onClick} className={style.pictureBox}>
				<input
					type="file"
					accept="image/png,image/jpeg/image/webp"
					data-file-index={fileIndex}
					onChange={onUploadFile}
					ref={inputRef}
					className={style.hiddenInput}
				/>
				{source == null ? (
					<img
						src={'/image-upload.webp'}
						className={style.placeholderImg}
					/>
				) : (
					<img src={source} className={style.displayImg} />
				)}
				{source != null && (
					<button
						data-file-index={fileIndex}
						onClick={onClickDelete}
						className={style.xBtn}
					>
						X
					</button>
				)}
			</div>
		</div>
	);
};

const asUploadFile = (
	file: UploadedFile | string | null | undefined,
): UploadedFile | undefined => {
	return file == null
		? undefined
		: typeof file === 'object'
			? file
			: undefined;
};
