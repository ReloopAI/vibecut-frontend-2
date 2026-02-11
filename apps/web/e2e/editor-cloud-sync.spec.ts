import { expect, test, type Page, type Route } from "@playwright/test";

const PROJECT_ID = "5e9bd215-7891-4c94-90c5-b87a6f3ddc50";

const CLOUD_PROJECT_RESPONSE = {
	id: PROJECT_ID,
	workspaceId: "ws-1",
	ownerId: 1,
	name: "Cloud Synced Project",
	version: 3,
	updatedAt: "2026-02-09T12:00:00.000Z",
	createdAt: "2026-02-08T12:00:00.000Z",
	state: {
		schemaVersion: 3,
		currentSceneId: "scene-main",
		metadata: {
			id: PROJECT_ID,
			name: "Cloud Synced Project",
			duration: 30,
			updatedAt: "2026-02-09T12:00:00.000Z",
		},
		settings: {
			fps: 30,
			canvasSize: { width: 1920, height: 1080 },
			background: { type: "color", color: "#000000" },
		},
		scenes: [
			{
				id: "scene-main",
				name: "Main scene",
				isMain: true,
				bookmarks: [],
				createdAt: "2026-02-08T12:00:00.000Z",
				updatedAt: "2026-02-09T12:00:00.000Z",
				tracks: [
					{
						id: "track-video-main",
						name: "Main Track",
						type: "video",
						elements: [],
						muted: false,
						hidden: false,
						isMain: true,
					},
				],
			},
		],
	},
};

const CLOUD_UPLOAD_URL = "https://presigned-upload.example.com/upload";

async function mockAuthAndCloudEditorApis({
	page,
	withPutRoute = false,
}: {
	page: Page;
	withPutRoute?: boolean;
}) {
	await page.route("**/api/auth/user/refresh", async (route: Route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				token: "backend-jwt-token",
				user: {
					id: "u-1",
					username: "john",
					email: "john@example.com",
				},
			}),
		});
	});

	await page.route("**/api/editor/projects/*", async (route: Route) => {
		const workspaceHeader = route.request().headers()["x-workspace-id"];
		if (!workspaceHeader) {
			await route.fulfill({
				status: 400,
				contentType: "application/json",
				body: JSON.stringify({
					message: "x-workspace-id header is required",
					error: "Bad Request",
					statusCode: 400,
				}),
			});
			return;
		}

		if (route.request().method() === "GET") {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(CLOUD_PROJECT_RESPONSE),
			});
			return;
		}

		if (route.request().method() === "PUT" && withPutRoute) {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					id: PROJECT_ID,
					version: 4,
					updatedAt: new Date().toISOString(),
				}),
			});
			return;
		}

		await route.fulfill({ status: 405 });
	});

	await page.route("**/api/files/upload", async (route: Route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				id: "file-1",
				workspaceId: "ws-1",
				ownerId: 1,
				key: `workspaces/ws-1/files/${PROJECT_ID}__media-1__test.png`,
				bucket: "bucket",
				region: "us-east-1",
				fileName: `${PROJECT_ID}__media-1__test.png`,
				contentType: "image/png",
				size: 100,
				createdAt: "2026-02-11T00:00:00.000Z",
				deletedAt: null,
				uploadUrl: CLOUD_UPLOAD_URL,
			}),
		});
	});

	await page.route("**/api/files?**", async (route: Route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				items: [],
				total: 0,
			}),
		});
	});

	await page.route("**/api/files/sign?**", async (route: Route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				url: "https://download.example.com/file.png",
			}),
		});
	});

	await page.route("https://presigned-upload.example.com/**", async (route: Route) => {
		await route.fulfill({
			status: 200,
			body: "",
		});
	});
}

test.beforeEach(async ({ context, page }) => {
	await context.addCookies([
		{
			name: "refresh_token",
			value: "e2e-refresh-token",
			domain: "127.0.0.1",
			path: "/",
			httpOnly: false,
			secure: false,
			sameSite: "Lax",
		},
	]);

	await page.addInitScript(() => {
		window.localStorage.setItem("opencut_workspace_id", "ws-1");
	});
});

test("editor loads project from cloud when local project is missing", async ({
	page,
}) => {
	await mockAuthAndCloudEditorApis({ page });

	await page.goto(`/editor/${PROJECT_ID}`);

	await expect(page.getByText("Cloud Synced Project")).toBeVisible();
});

test("editor restores cloud assets even when not used on timeline", async ({
	page,
}) => {
	await mockAuthAndCloudEditorApis({ page });

	await page.route("**/api/files?**", async (route: Route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				items: [
					{
						id: "file-asset-1",
						workspaceId: "ws-1",
						ownerId: 1,
						key: `workspaces/ws-1/files/${PROJECT_ID}__media-asset-1__asset-only.png`,
						bucket: "bucket",
						region: "ap-southeast-1",
						fileName: `${PROJECT_ID}__media-asset-1__asset-only.png`,
						contentType: "image/png",
						size: 95,
						createdAt: "2026-02-11T00:00:00.000Z",
						deletedAt: null,
					},
				],
				total: 1,
			}),
		});
	});

	await page.route("https://download.example.com/file.png", async (route: Route) => {
		const pngBuffer = Buffer.from(
			"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WlqvNQAAAAASUVORK5CYII=",
			"base64",
		);
		await route.fulfill({
			status: 200,
			contentType: "image/png",
			body: pngBuffer,
		});
	});

	await page.goto(`/editor/${PROJECT_ID}`);

	await expect(page.getByText("Cloud Synced Project")).toBeVisible();
	await expect(
		page.locator("div", { hasText: "asset-only.png" }).first(),
	).toBeVisible();
});

test("adding media to assets triggers cloud sync PUT", async ({ page }) => {
	await mockAuthAndCloudEditorApis({ page, withPutRoute: true });

	const putRequestPromise = page.waitForRequest(
		(request) =>
			request.method() === "PUT" &&
			request.url().includes(`/api/editor/projects/${PROJECT_ID}`),
	);

	await page.goto(`/editor/${PROJECT_ID}`);
	await expect(page.getByText("Cloud Synced Project")).toBeVisible();

	const pngBuffer = Buffer.from(
		"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WlqvNQAAAAASUVORK5CYII=",
		"base64",
	);

	await page.locator('input[type="file"]').setInputFiles({
		name: "test.png",
		mimeType: "image/png",
		buffer: pngBuffer,
	});

	const uploadedMediaCard = page.locator("div", { hasText: "test.png" }).first();
	await expect(uploadedMediaCard).toBeVisible();

	const putRequest = await putRequestPromise;
	const putPayload = putRequest.postDataJSON() as Record<string, unknown>;
	expect(putPayload).toHaveProperty("state");
	expect(putPayload).toHaveProperty("assetFileIds");
	expect(Array.isArray(putPayload.assetFileIds)).toBe(true);
	expect(putPayload.assetFileIds).toContain("file-1");
});
