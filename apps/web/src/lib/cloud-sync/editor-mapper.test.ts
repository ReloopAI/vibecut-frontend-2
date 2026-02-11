import { describe, expect, test } from "bun:test";
import {
	extractAssetFileIds,
	extractCloudAssetFileIds,
	extractCloudAssetFileIdsForTimeline,
} from "@/lib/cloud-sync/editor-mapper";
import type { TProject } from "@/types/project";

function buildProjectWithMediaElements(): TProject {
	return {
		metadata: {
			id: "project-1",
			name: "Project",
			duration: 12,
			createdAt: new Date("2026-02-10T00:00:00.000Z"),
			updatedAt: new Date("2026-02-10T00:00:00.000Z"),
		},
		currentSceneId: "scene-1",
		version: 3,
		settings: {
			fps: 30,
			canvasSize: { width: 1920, height: 1080 },
			background: { type: "color", color: "#000000" },
			originalCanvasSize: null,
		},
		scenes: [
			{
				id: "scene-1",
				name: "Main",
				isMain: true,
				bookmarks: [],
				createdAt: new Date("2026-02-10T00:00:00.000Z"),
				updatedAt: new Date("2026-02-10T00:00:00.000Z"),
				tracks: [
					{
						id: "track-1",
						name: "Video",
						type: "video",
						isMain: true,
						muted: false,
						hidden: false,
						elements: [
							{
								id: "el-1",
								type: "video",
								name: "Clip",
								startTime: 0,
								duration: 5,
								trimStart: 0,
								trimEnd: 0,
								mediaId: "media-a",
								transform: { scale: 1, position: { x: 0, y: 0 }, rotate: 0 },
								opacity: 1,
							},
							{
								id: "el-2",
								type: "image",
								name: "Image",
								startTime: 6,
								duration: 4,
								trimStart: 0,
								trimEnd: 0,
								mediaId: "media-b",
								transform: { scale: 1, position: { x: 0, y: 0 }, rotate: 0 },
								opacity: 1,
							},
						],
					},
				],
			},
		],
	};
}

describe("extractCloudAssetFileIds", () => {
	test("returns cloud file ids for all assets by default", () => {
		const project = buildProjectWithMediaElements();
		const mediaAssets = [
			{ id: "media-a", cloudFileId: "file-1" },
			{ id: "media-b", cloudFileId: undefined },
			{ id: "media-c", cloudFileId: "file-3" },
		];

		expect(
			extractCloudAssetFileIds({
				mediaAssets,
			}),
		).toEqual(["file-1", "file-3"]);
		expect(
			extractCloudAssetFileIdsForTimeline({
				project,
				mediaAssets,
			}),
		).toEqual(["file-1"]);
	});

	test("keeps extractAssetFileIds behavior unchanged", () => {
		const project = buildProjectWithMediaElements();
		expect(extractAssetFileIds({ project }).sort()).toEqual([
			"media-a",
			"media-b",
		]);
	});
});
