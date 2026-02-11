import { expect, test } from "@playwright/test";

test("login loads backend projects list on /projects", async ({ context, page }) => {
	await page.addInitScript(() => {
		window.localStorage.setItem("opencut_workspace_id", "ws-1");
	});

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

	await page.route("**/api/auth/user/refresh", async (route) => {
		await route.fulfill({
			status: 401,
			contentType: "application/json",
			body: JSON.stringify({
				status: "error",
				message: "Invalid refresh token",
				statusCode: 401,
			}),
		});
	});

	await page.route("**/api/auth/user/login", async (route) => {
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

	await page.route("**/api/editor/projects**", async (route) => {
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

		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				items: [
					{
						id: "proj-remote-1",
						workspaceId: "ws-1",
						ownerId: 1,
						name: "Backend Project Alpha",
						version: 4,
						updatedAt: "2026-02-09T12:00:00.000Z",
						createdAt: "2026-02-08T12:00:00.000Z",
					},
				],
				total: 1,
			}),
		});
	});

	await page.goto("/auth/login");

	await page.getByLabel("Username").fill("john");
	await page.getByLabel("Password").fill("12345678");
	await page.getByRole("button", { name: "Sign in" }).click();

	await expect(page).toHaveURL(/\/projects/);
	await page.waitForResponse((response) =>
		response.url().includes("/api/editor/projects"),
	);
	await expect(page.getByText("Backend Project Alpha")).toBeVisible();
});
