import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

describe("API app", () => {
	let app: ReturnType<typeof createApp> | undefined;

	afterEach(async () => {
		await app?.close();
	});

	it("REQ-003 AC-07: GET /health returns the API version and the capabilities", async () => {
		app = createApp();
		const res = await app.inject({ method: "GET", url: "/health" });

		expect(res.statusCode).toBe(200);
		expect(res.headers["content-type"]).toMatch(/^application\/json/);
		expect(res.json()).toEqual({ apiVersion: 1, capabilities: [] });
	});

	it.each(["/", "/index.html", "/_expo/static/js/web/index.js"])(
		"REQ-018 AC-57: GET %s serves no client file",
		async (url) => {
			app = createApp();
			const res = await app.inject({ method: "GET", url });

			expect(res.statusCode).toBe(404);
			expect(res.headers["content-type"]).not.toMatch(/text\/html/);
		},
	);
});
