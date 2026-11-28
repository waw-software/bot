import { expect, test } from "@playwright/test";
import { launchDesktop, repoRoot, SHELL_HEADING } from "../src/electron.ts";

const API = process.env.WAW_BOT_E2E_API_URL ?? "http://127.0.0.1:3100";

test("REQ-003 AC-07: GET /health returns the API version and the capabilities", async ({
	request,
}) => {
	const response = await request.get(`${API}/health`);
	expect(response.status()).toBe(200);
	expect(response.headers()["content-type"]).toContain("application/json");
	const body = await response.json();
	expect(body.apiVersion).toBe(1);
	expect(Array.isArray(body.capabilities)).toBe(true);
	for (const capability of body.capabilities) {
		expect(typeof capability).toBe("string");
	}
});

test("REQ-018 AC-56: the Electron shell shows the WAW Bot heading", async () => {
	const { app, window } = await launchDesktop(repoRoot());
	try {
		await expect(
			window.getByRole("heading", {
				level: 1,
				name: SHELL_HEADING,
				exact: true,
			}),
		).toBeVisible();
	} finally {
		await app.close();
	}
});
