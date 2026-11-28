import { describe, expect, it } from "vitest";
import {
	type Clock,
	expoUrl,
	hasAppTarget,
	iosWidthProblem,
	pngSize,
	waitFor,
} from "./capture-ios.ts";

// Signature, IHDR length and type, width 1170, height 2532.
const HEADER = Uint8Array.from([
	0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49,
	0x48, 0x44, 0x52, 0x00, 0x00, 0x04, 0x92, 0x00, 0x00, 0x09, 0xe4,
]);

function fakeClock(): Clock & { elapsed(): number } {
	let time = 0;
	return {
		now: () => time,
		sleep: async (ms) => {
			time += ms;
		},
		elapsed: () => time,
	};
}

describe("pngSize", () => {
	it("pngSize reads width and height from the IHDR", () => {
		expect(pngSize(HEADER)).toEqual({ width: 1170, height: 2532 });
	});

	it("pngSize rejects a buffer without the PNG signature", () => {
		const broken = HEADER.slice();
		broken[0] = 0;
		expect(() => pngSize(broken)).toThrow("not a PNG");
	});
});

describe("iosWidthProblem", () => {
	it("iosWidthProblem accepts 780 and 1170", () => {
		expect(iosWidthProblem(780)).toBeNull();
		expect(iosWidthProblem(1170)).toBeNull();
	});

	it("iosWidthProblem rejects 1206 with the 390 pt message", () => {
		expect(iosWidthProblem(1206)).toBe(
			"1206 px is not 390 pt wide at @2x or @3x; use a 390-pt simulator (iPhone 17e)",
		);
	});
});

describe("expoUrl", () => {
	it("expoUrl without a launch path", () => {
		expect(expoUrl(8081, "")).toBe("exp://127.0.0.1:8081");
	});

	it("expoUrl with launch path connect", () => {
		expect(expoUrl(8081, "connect")).toBe("exp://127.0.0.1:8081/--/connect");
	});
});

describe("hasAppTarget", () => {
	it("hasAppTarget is false for [] and invalid JSON, true for one target", () => {
		expect(hasAppTarget("[]")).toBe(false);
		expect(hasAppTarget("not json")).toBe(false);
		expect(hasAppTarget('[{"id":"1"}]')).toBe(true);
	});
});

describe("waitFor", () => {
	it("waitFor returns the first value", async () => {
		const clock = fakeClock();
		const values = [undefined, undefined, "first", "second"];
		await expect(
			waitFor(async () => values.shift(), "a value", 10_000, 500, clock),
		).resolves.toBe("first");
		expect(clock.elapsed()).toBe(1000);
	});

	it("waitFor times out after the bound with the message", async () => {
		const clock = fakeClock();
		await expect(
			waitFor(async () => undefined, "the thing", 3000, 500, clock),
		).rejects.toThrow("timed out after 3 s waiting for the thing");
		expect(clock.elapsed()).toBe(3000);
	});

	it("waitFor rejects a value that arrives after the deadline", async () => {
		const clock = fakeClock();
		const slowProbe = async () => {
			await clock.sleep(1900);
			return "late";
		};
		await expect(
			waitFor(slowProbe, "the thing", 1000, 500, clock),
		).rejects.toThrow("timed out after 1 s waiting for the thing");
	});

	it("waitFor does not start a probe after the deadline", async () => {
		const clock = fakeClock();
		let calls = 0;
		const probe = async () => {
			calls++;
			return undefined;
		};
		await expect(waitFor(probe, "the thing", 1000, 500, clock)).rejects.toThrow(
			"timed out after 1 s waiting for the thing",
		);
		expect(calls).toBe(2);
	});
});
