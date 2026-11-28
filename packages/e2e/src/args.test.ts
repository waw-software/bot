import { describe, expect, it } from "vitest";
import { parseArgs, type FsChecks } from "./args.ts";
import { screens as realScreens, type Screen } from "./screens.ts";

const root = "/repo";
const desktopMockup = "docs/design/screens/desktop/a.png";
const electron: Screen = {
	id: "a.electron-1440",
	surface: "electron",
	size: { width: 1440, height: 900 },
	readyHeading: "H",
	mockup: desktopMockup,
};
const ios: Screen = {
	id: "b.ios-390",
	surface: "ios",
	launchPath: "",
	mockup: null,
};
const manifest: readonly Screen[] = [electron, ios];

function fakeFs(over: Partial<{ existing: string[]; ignored: boolean }> = {}) {
	const asked: string[] = [];
	const fs: FsChecks = {
		exists: (p) => (over.existing ?? [desktopMockup]).includes(p),
		isIgnored: (p) => {
			asked.push(p);
			return over.ignored ?? true;
		},
	};
	return { fs, asked };
}

const run = (argv: string[], fs: FsChecks = fakeFs().fs) =>
	parseArgs(argv, manifest, fs, root);

describe("parseArgs", () => {
	it("requires --out", () => {
		expect(() => run([])).toThrow("--out <dir> is required");
	});

	it("resolves a relative --out from the repository root", () => {
		expect(run(["--out", "out/visual/x"]).outDir).toBe("/repo/out/visual/x");
	});

	it("rejects an --out outside the repository", () => {
		for (const out of ["../x", "/elsewhere", "."]) {
			expect(() => run(["--out", out])).toThrow(
				"--out must be inside the repository",
			);
		}
	});

	it("rejects an --out that git does not ignore", () => {
		const { fs, asked } = fakeFs({ ignored: false });
		expect(() => run(["--out", "out/visual/x"], fs)).toThrow(
			"--out out/visual/x is not ignored by git; use a directory under out/ or .ship/",
		);
		expect(asked).toEqual(["out/visual/x/"]);
	});

	it("rejects an unknown screen and lists the known ones", () => {
		expect(() => run(["--out", "out/x", "--screen", "nope"])).toThrow(
			"unknown screen: nope; known: a.electron-1440, b.ios-390",
		);
	});

	it("rejects a screen given twice", () => {
		expect(() =>
			run(["--out", "out/x", "--screen", "b.ios-390", "--screen", "b.ios-390"]),
		).toThrow("screen given twice: b.ios-390");
	});

	it("rejects an unknown option and an option without a value", () => {
		expect(() => run(["--out", "out/x", "--bogus"])).toThrow(
			"unknown option: --bogus",
		);
		expect(() => run(["--out"])).toThrow("--out needs a value");
		expect(() => run(["--out", "out/x", "--screen"])).toThrow(
			"--screen needs a value",
		);
		expect(() => run(["--out", "out/x", "--ios-device"])).toThrow(
			"--ios-device needs a value",
		);
	});

	it("rejects --out or --ios-device given twice", () => {
		expect(() => run(["--out", "out/x", "--out", "out/y"])).toThrow(
			"--out given twice",
		);
		expect(() =>
			run(["--out", "out/x", "--ios-device", "A", "--ios-device", "B"]),
		).toThrow("--ios-device given twice");
	});

	it("selects every screen when none is given, in manifest order", () => {
		expect(run(["--out", "out/x"]).screens.map((s) => s.id)).toEqual([
			"a.electron-1440",
			"b.ios-390",
		]);
	});

	it("keeps the given order of --screen", () => {
		const request = run([
			"--out",
			"out/x",
			"--screen",
			"b.ios-390",
			"--screen",
			"a.electron-1440",
		]);
		expect(request.screens.map((s) => s.id)).toEqual([
			"b.ios-390",
			"a.electron-1440",
		]);
	});

	it("rejects a selected screen whose mockup is missing", () => {
		const { fs } = fakeFs({ existing: [] });
		expect(() =>
			run(["--out", "out/x", "--screen", "a.electron-1440"], fs),
		).toThrow(
			"mockup missing for a.electron-1440: docs/design/screens/desktop/a.png",
		);
		expect(
			run(["--out", "out/x", "--screen", "b.ios-390"], fs).screens,
		).toEqual([ios]);
	});

	it("rejects a mockup outside docs/design/screens/ or not ending in .png", () => {
		for (const mockup of [
			"docs/design/a.png",
			"docs/design/screens/../a.png",
			"docs/design/screens/desktop/a.jpg",
		]) {
			// The file exists, so only its location or extension can reject it.
			const { fs } = fakeFs({ existing: [mockup] });
			expect(() =>
				parseArgs(["--out", "out/x"], [{ ...ios, mockup }], fs, root),
			).toThrow(
				`mockup of b.ios-390 must be a .png under docs/design/screens/: ${mockup}`,
			);
		}
	});

	it("accepts a mockup path with spaces and a middle dot", () => {
		const mockup = "docs/design/screens/mobile/1 · Connect.png";
		const { fs } = fakeFs({ existing: [mockup] });
		const request = parseArgs(
			["--out", "out/x"],
			[{ ...ios, mockup }],
			fs,
			root,
		);
		expect(request.screens.map((s) => s.mockup)).toEqual([mockup]);
	});

	it("reads --ios-device", () => {
		expect(run(["--out", "out/x", "--ios-device", "UDID-1"]).iosDevice).toBe(
			"UDID-1",
		);
		expect(run(["--out", "out/x"]).iosDevice).toBeUndefined();
	});
});

describe("manifest", () => {
	it("the manifest has shell.electron-1440 at 1440x900 and shell.ios-390, unique ids, every mockup null or a .png under docs/design/screens/", () => {
		const ids = realScreens.map((s) => s.id);
		expect(ids).toEqual(["shell.electron-1440", "shell.ios-390"]);
		expect(new Set(ids).size).toBe(ids.length);
		expect(
			realScreens.flatMap((s) => (s.surface === "electron" ? [s.size] : [])),
		).toEqual([{ width: 1440, height: 900 }]);
		for (const { mockup } of realScreens) {
			if (mockup !== null) {
				expect(mockup).toMatch(/^docs\/design\/screens\/.+\.png$/);
			}
		}
	});
});
