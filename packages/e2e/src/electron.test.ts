import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
	DESKTOP_URL,
	desktopBuildProblem,
	electronArgs,
	electronExecutable,
	type FileProbe,
	MISSING_ELECTRON,
	repoRoot,
} from "./electron.ts";

function fakeFs(files: Record<string, string>): FileProbe {
	return {
		exists: (path) => path in files,
		read: (path) => {
			const content = files[path];
			if (content === undefined) throw new Error(`no such file: ${path}`);
			return content;
		},
	};
}

const BUILD_COMMAND =
	"pnpm --filter @waw/bot-client run build && pnpm --filter @waw/bot-desktop run build";
const MAIN_FILE = "/repo/apps/waw-bot-desktop/out/main/index.js";
const RENDERER_FILE = "/repo/apps/waw-bot-desktop/out/renderer/index.html";

describe("electronExecutable", () => {
	it("electronExecutable returns dist/<path.txt> when both exist", () => {
		const fs = fakeFs({
			"/electron/path.txt": "Electron.app/Contents/MacOS/Electron\n",
			"/electron/dist/Electron.app/Contents/MacOS/Electron": "",
		});
		expect(electronExecutable("/electron", fs)).toBe(
			"/electron/dist/Electron.app/Contents/MacOS/Electron",
		);
	});

	it("electronExecutable throws MISSING_ELECTRON without path.txt", () => {
		const fs = fakeFs({ "/electron/dist/electron": "" });
		expect(() => electronExecutable("/electron", fs)).toThrow(MISSING_ELECTRON);
	});

	it("electronExecutable throws MISSING_ELECTRON when the executable named by path.txt is missing", () => {
		const fs = fakeFs({ "/electron/path.txt": "electron" });
		expect(() => electronExecutable("/electron", fs)).toThrow(MISSING_ELECTRON);
	});
});

describe("desktopBuildProblem", () => {
	it("desktopBuildProblem names out/main/index.js when the desktop is not built", () => {
		const problem = desktopBuildProblem("/repo", fakeFs({}));
		expect(problem).toContain("apps/waw-bot-desktop/out/main/index.js");
		expect(problem).toContain(BUILD_COMMAND);
		expect(problem).not.toContain("/repo/");
	});

	it("desktopBuildProblem names out/renderer/index.html when the client export is not staged", () => {
		const problem = desktopBuildProblem("/repo", fakeFs({ [MAIN_FILE]: "" }));
		expect(problem).toContain("apps/waw-bot-desktop/out/renderer/index.html");
		expect(problem).toContain(BUILD_COMMAND);
		expect(problem).not.toContain("/repo/");
	});

	it("desktopBuildProblem returns null when both exist", () => {
		const fs = fakeFs({ [MAIN_FILE]: "", [RENDERER_FILE]: "" });
		expect(desktopBuildProblem("/repo", fs)).toBeNull();
	});
});

describe("electronArgs", () => {
	it("electronArgs adds --no-sandbox only on Linux CI", () => {
		expect(electronArgs("/desktop", "linux", true)).toEqual([
			"/desktop",
			"--no-sandbox",
		]);
		expect(electronArgs("/desktop", "linux", false)).toEqual(["/desktop"]);
		expect(electronArgs("/desktop", "darwin", true)).toEqual(["/desktop"]);
	});
});

describe("DESKTOP_URL", () => {
	it("DESKTOP_URL matches the desktop app's APP_URL", () => {
		const source = readFileSync(
			join(repoRoot(), "apps/waw-bot-desktop/src/main/web-export.ts"),
			"utf8",
		);
		expect(DESKTOP_URL).toBe("waw-bot://app/");
		expect(source).toContain('APP_URL = "waw-bot://app/"');
	});
});
