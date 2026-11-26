import { describe, expect, it } from "vitest";
import { smokeVerdict } from "./smoke";

describe("smoke verdict", () => {
	it("REQ-018 AC-56: smokeVerdict passes when the page text contains WAW Bot", () => {
		expect(smokeVerdict("Hello\nWAW Bot")).toEqual({
			ok: true,
			line: "SMOKE OK: WAW Bot",
		});
	});

	it.each(["", "WAW Notes"])(
		"REQ-018 AC-56: smokeVerdict fails when the page text has no WAW Bot",
		(pageText) => {
			expect(smokeVerdict(pageText)).toEqual({
				ok: false,
				line: "SMOKE FAIL: page text has no WAW Bot",
			});
		},
	);
});
