import type { TProject } from "@/types/project";
import type { TimelineTrack } from "@/types/timeline";
import { hasMediaId } from "@/lib/timeline/element-utils";
import type { EditorProjectState } from "./editor-api";
import type { TScene } from "@/types/timeline";

const stripAudioBuffers = ({ tracks }: { tracks: TimelineTrack[] }): TimelineTrack[] =>
	tracks.map((track) => {
		if (track.type !== "audio") return track;
		return {
			...track,
			elements: track.elements.map((element) => {
				const { buffer: _buffer, ...rest } = element;
				return rest;
			}),
		};
	});

const toPlainJson = <T,>(value: T): T =>
	JSON.parse(
		JSON.stringify(value, (_key, item) => {
			if (item instanceof Date) {
				return item.toISOString();
			}
			return item;
		}),
	) as T;

export const buildEditorProjectState = ({
	project,
}: {
	project: TProject;
}): EditorProjectState => {
	const scenes = project.scenes.map((scene) => ({
		...scene,
		tracks: stripAudioBuffers({ tracks: scene.tracks }),
	}));

	return toPlainJson({
		schemaVersion: project.version,
		currentSceneId: project.currentSceneId,
		metadata: {
			id: project.metadata.id,
			name: project.metadata.name,
			duration: project.metadata.duration,
			updatedAt: project.metadata.updatedAt.toISOString(),
		},
		settings: project.settings as unknown as Record<string, unknown>,
		scenes: scenes as unknown as Array<Record<string, unknown>>,
	}) as EditorProjectState;
};

export const extractAssetFileIds = ({ project }: { project: TProject }): string[] => {
	const ids = new Set<string>();

	for (const scene of project.scenes) {
		for (const track of scene.tracks) {
			for (const element of track.elements) {
				if (hasMediaId(element)) {
					ids.add(element.mediaId);
				}
			}
		}
	}

	return Array.from(ids);
};

export const buildLocalProjectFromCloudState = ({
	projectId,
	version,
	state,
	updatedAt,
	createdAt,
}: {
	projectId: string;
	version: number;
	state: EditorProjectState;
	updatedAt: string;
	createdAt: string;
}): TProject => {
	const now = new Date();
	const scenes = (state.scenes as unknown as TScene[]).map((scene) => ({
		...scene,
		createdAt:
			scene.createdAt instanceof Date
				? scene.createdAt
				: new Date((scene.createdAt as unknown as string) ?? now),
		updatedAt:
			scene.updatedAt instanceof Date
				? scene.updatedAt
				: new Date((scene.updatedAt as unknown as string) ?? now),
		bookmarks: Array.isArray(scene.bookmarks) ? scene.bookmarks : [],
	}));

	return {
		metadata: {
			id: projectId,
			name: state.metadata.name,
			duration: state.metadata.duration,
			createdAt: new Date(createdAt),
			updatedAt: new Date(updatedAt),
		},
		currentSceneId: state.currentSceneId,
		settings: state.settings as unknown as TProject["settings"],
		scenes,
		version: Math.max(1, version),
	};
};
