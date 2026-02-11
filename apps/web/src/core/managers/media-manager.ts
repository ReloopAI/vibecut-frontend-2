import type { EditorCore } from "@/core";
import type { MediaAsset } from "@/types/assets";
import { storageService } from "@/services/storage/service";
import { generateUUID } from "@/utils/id";
import { videoCache } from "@/services/video-cache/service";
import { hasMediaId } from "@/lib/timeline/element-utils";
import { authSession } from "@/lib/auth/session";
import { editorCloudApi } from "@/lib/cloud-sync/editor-api";

export class MediaManager {
	private assets: MediaAsset[] = [];
	private isLoading = false;
	private listeners = new Set<() => void>();

	constructor(private editor: EditorCore) {}

	async addMediaAsset({
		projectId,
		asset,
	}: {
		projectId: string;
		asset: Omit<MediaAsset, "id">;
	}): Promise<void> {
		const newAsset: MediaAsset = {
			...asset,
			id: generateUUID(),
		};

		this.assets = [...this.assets, newAsset];
		this.notify();

		try {
			await storageService.saveMediaAsset({ projectId, mediaAsset: newAsset });
			void this.syncMediaAssetToCloud({ projectId, mediaId: newAsset.id });
		} catch (error) {
			console.error("Failed to save media asset:", error);
			this.assets = this.assets.filter((asset) => asset.id !== newAsset.id);
			this.notify();
		}
	}

	async removeMediaAsset({
		projectId,
		id,
	}: {
		projectId: string;
		id: string;
	}): Promise<void> {
		const asset = this.assets.find((asset) => asset.id === id);

		videoCache.clearVideo({ mediaId: id });

		if (asset?.url) {
			URL.revokeObjectURL(asset.url);
			if (asset.thumbnailUrl) {
				URL.revokeObjectURL(asset.thumbnailUrl);
			}
		}

		this.assets = this.assets.filter((asset) => asset.id !== id);
		this.notify();
		this.editor.save.markDirty();

		const tracks = this.editor.timeline.getTracks();
		const elementsToRemove: Array<{ trackId: string; elementId: string }> = [];

		for (const track of tracks) {
			for (const element of track.elements) {
				if (hasMediaId(element) && element.mediaId === id) {
					elementsToRemove.push({ trackId: track.id, elementId: element.id });
				}
			}
		}

		if (elementsToRemove.length > 0) {
			this.editor.timeline.deleteElements({ elements: elementsToRemove });
		}

		try {
			await storageService.deleteMediaAsset({ projectId, id });
		} catch (error) {
			console.error("Failed to delete media asset:", error);
		}
	}

	async loadProjectMedia({ projectId }: { projectId: string }): Promise<void> {
		this.isLoading = true;
		this.notify();

		try {
			const mediaAssets = await storageService.loadAllMediaAssets({
				projectId,
			});
			this.assets = mediaAssets;
			this.notify();
		} catch (error) {
			console.error("Failed to load media assets:", error);
		} finally {
			this.isLoading = false;
			this.notify();
		}
	}

	async clearProjectMedia({ projectId }: { projectId: string }): Promise<void> {
		this.assets.forEach((asset) => {
			if (asset.url) {
				URL.revokeObjectURL(asset.url);
			}
			if (asset.thumbnailUrl) {
				URL.revokeObjectURL(asset.thumbnailUrl);
			}
		});

		const mediaIds = this.assets.map((asset) => asset.id);
		this.assets = [];
		this.notify();

		try {
			await Promise.all(
				mediaIds.map((id) =>
					storageService.deleteMediaAsset({ projectId, id }),
				),
			);
		} catch (error) {
			console.error("Failed to clear media assets from storage:", error);
		}
	}

	clearAllAssets(): void {
		videoCache.clearAll();

		this.assets.forEach((asset) => {
			if (asset.url) {
				URL.revokeObjectURL(asset.url);
			}
			if (asset.thumbnailUrl) {
				URL.revokeObjectURL(asset.thumbnailUrl);
			}
		});

		this.assets = [];
		this.notify();
	}

	getAssets(): MediaAsset[] {
		return this.assets;
	}

	setAssets({ assets }: { assets: MediaAsset[] }): void {
		this.assets = assets;
		this.notify();
	}

	isLoadingMedia(): boolean {
		return this.isLoading;
	}

	subscribe(listener: () => void): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	private notify(): void {
		this.listeners.forEach((fn) => fn());
	}

	private async syncMediaAssetToCloud({
		projectId,
		mediaId,
	}: {
		projectId: string;
		mediaId: string;
	}): Promise<void> {
		const token = authSession.getToken();
		if (!token) return;

		const asset = this.assets.find((item) => item.id === mediaId);
		if (!asset || asset.cloudFileId || asset.cloudFileKey) {
			return;
		}

		const uploadFileName = `${projectId}__${mediaId}__${asset.name}`;

		try {
			const uploadResponse = await editorCloudApi.createFileUpload({
				token,
				payload: {
					fileName: uploadFileName,
					contentType: asset.file.type || "application/octet-stream",
					size: asset.file.size,
				},
			});

			await editorCloudApi.uploadFileToPresignedUrl({
				uploadUrl: uploadResponse.uploadUrl,
				file: asset.file,
				contentType: asset.file.type || "application/octet-stream",
			});

			let cloudFileId = uploadResponse.id;
			if (!cloudFileId) {
				const listResponse = await editorCloudApi.listFiles({
					token,
					limit: 100,
					search: uploadFileName,
				});
				const matchedFile = listResponse.items.find(
					(file) => file.key === uploadResponse.key,
				);
				cloudFileId = matchedFile?.id ?? "";
			}

			const latestAsset = this.assets.find((item) => item.id === mediaId);
			if (!latestAsset) return;

			const syncedAsset: MediaAsset = {
				...latestAsset,
				cloudFileId: cloudFileId || undefined,
				cloudFileKey: uploadResponse.key,
				cloudSyncedAt: new Date().toISOString(),
			};

			this.assets = this.assets.map((item) =>
				item.id === mediaId ? syncedAsset : item,
			);
			this.notify();
			this.editor.save.markDirty();

			await storageService.saveMediaAsset({
				projectId,
				mediaAsset: syncedAsset,
			});
		} catch (error) {
			console.error("Failed to sync media asset to cloud:", error);
		}
	}
}
