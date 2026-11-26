import { describe, expect, it } from "vitest";
import { resolveExportFile } from "./web-export";

describe("web export", () => {
	it.each([
		["waw-bot://app/", "/export/index.html"],
		[
			"waw-bot://app/_expo/static/js/web/index-abc123.js",
			"/export/_expo/static/js/web/index-abc123.js",
		],
		["waw-bot://app/a%20b.css", "/export/a b.css"],
		["waw-bot://app/..%2F..%2Fsecret", null],
		["waw-bot://other/index.html", null],
		["https://app/index.html", null],
		["not a url", null],
		["waw-bot://app/%E0%A4%A", null],
	])(
		"REQ-018 AC-56: resolveExportFile maps app URLs inside the export root: %s -> %s",
		(requestUrl, expected) => {
			expect(resolveExportFile("/export", requestUrl)).toBe(expected);
		},
	);
});
