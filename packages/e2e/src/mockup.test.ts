import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { repoRoot } from "./electron.ts";
import { missingSummary, publishMockup, resultLine } from "./mockup.ts";

const SOURCE = "docs/design/screens/mobile/1 · Connect.png";

describe("publishMockup", () => {
	let outDir: string;
	beforeEach(() => {
		outDir = mkdtempSync(join(tmpdir(), "waw-mockup-"));
	});
	afterEach(() => {
		rmSync(outDir, { recursive: true, force: true });
	});

	it("publishMockup copies the reference PNG byte for byte beside the capture", () => {
		const root = repoRoot();
		const published = publishMockup(root, outDir, {
			id: "fixture.ios-390",
			mockup: SOURCE,
		});
		const copy = join(outDir, "fixture.ios-390.mockup.png");
		expect(published).toEqual({ copy, source: SOURCE });
		expect(readFileSync(copy).equals(readFileSync(join(root, SOURCE)))).toBe(
			true,
		);
	});

	it("publishMockup returns null and writes nothing without a mockup", () => {
		expect(
			publishMockup(repoRoot(), outDir, {
				id: "fixture.ios-390",
				mockup: null,
			}),
		).toBeNull();
		expect(readdirSync(outDir)).toEqual([]);
	});
});

describe("resultLine", () => {
	it("resultLine prints no mockup and a dash without one", () => {
		expect(resultLine("a", "out/a.actual.png", null)).toBe(
			"a\tout/a.actual.png\tno mockup\t-",
		);
	});

	it("resultLine prints the copy and source paths with a mockup", () => {
		expect(
			resultLine("a", "out/a.actual.png", {
				copy: "out/a.mockup.png",
				source: SOURCE,
			}),
		).toBe(`a\tout/a.actual.png\tout/a.mockup.png\t${SOURCE}`);
	});
});

describe("missingSummary", () => {
	it("missingSummary lists the ids, and is null when none are missing", () => {
		expect(missingSummary(["a", "b"])).toBe("MISSING MOCKUP: a, b");
		expect(missingSummary([])).toBeNull();
	});
});
