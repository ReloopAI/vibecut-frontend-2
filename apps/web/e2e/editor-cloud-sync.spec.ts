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

async function mockAuthAndCloudEditorApis({
	page,
	withPutRoute = false,
}: {
	page: Page;
	withPutRoute?: boolean;
}) {
	await page.route("**/api/auth/refresh", async (route: Route) => {
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

test("adding media to timeline triggers cloud sync PUT", async ({ page }) => {
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
	await uploadedMediaCard.hover();
	await uploadedMediaCard.locator("button").first().click({ force: true });

	const putRequest = await putRequestPromise;
	const putPayload = putRequest.postDataJSON() as Record<string, unknown>;
	expect(putPayload).toHaveProperty("state");
	expect(putPayload).toHaveProperty("assetFileIds");
});
