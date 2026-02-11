import {
	getBackendApiBaseUrl,
	getSelectedWorkspaceId,
	setSelectedWorkspaceId,
} from "@/lib/backend-api";
import { backendAuthApi } from "@/lib/auth/api-client";
import { authSession } from "@/lib/auth/session";

export type ISODateString = string;
export type UUID = string;

export interface EditorProjectState {
	schemaVersion: number;
	currentSceneId: string;
	metadata: {
		id: string;
		name: string;
		duration: number;
		updatedAt: ISODateString;
	};
	settings: Record<string, unknown>;
	scenes: Array<Record<string, unknown>>;
}

export interface PutEditorProjectRequest {
	name: string;
	baseVersion: number;
	state: EditorProjectState;
	assetFileIds: UUID[];
	clientRequestId?: string;
}

export interface PutEditorProjectResponse {
	id: UUID;
	version: number;
	updatedAt: ISODateString;
}

export interface EditorProjectListItem {
	id: UUID;
	workspaceId: string;
	ownerId: number;
	name: string;
	version: number;
	updatedAt: ISODateString;
	createdAt: ISODateString;
}

export interface ListEditorProjectsResponse {
	items: EditorProjectListItem[];
	total: number;
}

export interface GetEditorProjectResponse {
	id: UUID;
	workspaceId: string;
	ownerId: number;
	name: string;
	version: number;
	state: EditorProjectState;
	updatedAt: ISODateString;
	createdAt: ISODateString;
}

export class EditorSyncError extends Error {
	public readonly statusCode: number;

	constructor({ message, statusCode }: { message: string; statusCode: number }) {
		super(message);
		this.name = "EditorSyncError";
		this.statusCode = statusCode;
	}
}

export class EditorVersionConflictError extends Error {
	public readonly serverVersion: number;
	public readonly serverUpdatedAt: string;

	constructor({
		message,
		serverVersion,
		serverUpdatedAt,
	}: {
		message: string;
		serverVersion: number;
		serverUpdatedAt: string;
	}) {
		super(message);
		this.name = "EditorVersionConflictError";
		this.serverVersion = serverVersion;
		this.serverUpdatedAt = serverUpdatedAt;
	}
}

const requestWithAuthRetry = async <T>({
	path,
	method,
	token,
	body,
}: {
	path: string;
	method: "GET" | "PUT";
	token: string;
	body?: unknown;
}): Promise<T> => {
	const resolveWorkspaceId = async ({
		currentToken,
	}: {
		currentToken: string;
	}): Promise<string> => {
		const selectedWorkspaceId = getSelectedWorkspaceId();
		if (selectedWorkspaceId) {
			return selectedWorkspaceId;
		}

		const workspaces = await backendAuthApi.getWorkspaces({ token: currentToken });
		const firstWorkspace = workspaces[0];
		if (!firstWorkspace) {
			throw new EditorSyncError({
				message: "No workspace available for this account.",
				statusCode: 400,
			});
		}
		setSelectedWorkspaceId({ workspaceId: firstWorkspace.id });
		return firstWorkspace.id;
	};

	const runRequest = async ({
		currentToken,
	}: {
		currentToken: string;
	}): Promise<Response> => {
		const workspaceId = await resolveWorkspaceId({ currentToken });
		return fetch(`${getBackendApiBaseUrl()}${path}`, {
			method,
			credentials: "include",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${currentToken}`,
				"x-workspace-id": workspaceId,
			},
			body: body ? JSON.stringify(body) : undefined,
		});
	};

	let response = await runRequest({ currentToken: token });
	if (response.status === 401) {
		try {
			const refreshed = await backendAuthApi.refresh();
			authSession.setToken({ token: refreshed.token });
			response = await runRequest({ currentToken: refreshed.token });
		} catch {
			throw new EditorSyncError({
				message: "Session expired",
				statusCode: 401,
			});
		}
	}

	const responseJson = (await response.json().catch(() => null)) as
		| Record<string, unknown>
		| null;

	if (!response.ok) {
		if (response.status === 409 && responseJson?.error === "VERSION_CONFLICT") {
			throw new EditorVersionConflictError({
				message:
					typeof responseJson.message === "string"
						? responseJson.message
						: "Project has a newer version on server",
				serverVersion:
					typeof responseJson.serverVersion === "number"
						? responseJson.serverVersion
						: 0,
				serverUpdatedAt:
					typeof responseJson.serverUpdatedAt === "string"
						? responseJson.serverUpdatedAt
						: "",
			});
		}

		throw new EditorSyncError({
			message:
				typeof responseJson?.message === "string"
					? responseJson.message
					: `Editor API request failed (${response.status})`,
			statusCode: response.status,
		});
	}

	return responseJson as T;
};

export const editorCloudApi = {
	listProjects: ({
		token,
		offset = 0,
		limit = 50,
		search,
	}: {
		token: string;
		offset?: number;
		limit?: number;
		search?: string;
	}) => {
		const params = new URLSearchParams({
			offset: String(offset),
			limit: String(limit),
		});
		if (search) {
			params.set("search", search);
		}
		return requestWithAuthRetry<ListEditorProjectsResponse>({
			path: `/editor/projects?${params.toString()}`,
			method: "GET",
			token,
		});
	},
	getProject: ({
		projectId,
		token,
	}: {
		projectId: string;
		token: string;
	}) =>
		requestWithAuthRetry<GetEditorProjectResponse>({
			path: `/editor/projects/${projectId}`,
			method: "GET",
			token,
		}),
	putProject: ({
		projectId,
		token,
		payload,
	}: {
		projectId: string;
		token: string;
		payload: PutEditorProjectRequest;
	}) =>
		requestWithAuthRetry<PutEditorProjectResponse>({
			path: `/editor/projects/${projectId}`,
			method: "PUT",
			token,
			body: payload,
		}),
};
