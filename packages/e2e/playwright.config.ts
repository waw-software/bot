import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";

const root = fileURLToPath(new URL("../..", import.meta.url));

export default defineConfig({
	testDir: "tests",
	testMatch: "smoke.spec.ts",
	retries: 0,
	workers: 1,
	forbidOnly: true,
	timeout: 60_000,
	outputDir: "out/playwright/smoke",
	reporter: [
		["list"],
		["html", { outputFolder: "out/playwright/smoke-report", open: "never" }],
	],
	projects: [{ name: "electron" }],
	// M4 sets WAW_BOT_E2E_API_URL to the compose server; no local API starts then.
	...(process.env.WAW_BOT_E2E_API_URL
		? {}
		: {
				webServer: {
					command: "node apps/waw-bot-server/dist/api.js",
					env: { HOST: "127.0.0.1", PORT: "3100" },
					url: "http://127.0.0.1:3100/health",
					cwd: root,
					reuseExistingServer: false,
					timeout: 60_000,
				},
			}),
});
