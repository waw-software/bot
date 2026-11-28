// Finds and launches the built desktop app, for the smoke spec and the capture command.
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
	_electron,
	type ElectronApplication,
	type Page,
} from "@playwright/test";

// Mirrors APP_URL in apps/waw-bot-desktop/src/main/web-export.ts.
export const DESKTOP_URL = "waw-bot://app/";
export const SHELL_HEADING = "WAW Bot";
export const MISSING_ELECTRON =
	"Electron binary missing: run pnpm --filter @waw/bot-desktop exec install-electron";

const URL_TIMEOUT_MS = 15_000;
const BUILD_COMMAND =
	"pnpm --filter @waw/bot-client run build && pnpm --filter @waw/bot-desktop run build";

export type FileProbe = {
	exists(path: string): boolean;
	read(path: string): string;
};

const realFs: FileProbe = {
	exists: existsSync,
	read: (path) => readFileSync(path, "utf8"),
};

export function electronExecutable(electronDir: string, fs: FileProbe): string {
	const pathFile = join(electronDir, "path.txt");
	if (!fs.exists(pathFile)) {
		throw new Error(MISSING_ELECTRON);
	}
	const executable = join(electronDir, "dist", fs.read(pathFile).trim());
	if (!fs.exists(executable)) {
		throw new Error(MISSING_ELECTRON);
	}
	return executable;
}

export function desktopBuildProblem(
	repoRoot: string,
	fs: Pick<FileProbe, "exists">,
): string | null {
	const missing = [
		"apps/waw-bot-desktop/out/main/index.js",
		"apps/waw-bot-desktop/out/renderer/index.html",
	].find((path) => !fs.exists(join(repoRoot, path)));
	return missing
		? `desktop build missing: ${missing}; run ${BUILD_COMMAND}`
		: null;
}

export function repoRoot(): string {
	return fileURLToPath(new URL("../../..", import.meta.url)).replace(/\/$/, "");
}

export function electronArgs(
	desktopDir: string,
	platform: NodeJS.Platform,
	ci: boolean,
): string[] {
	return platform === "linux" && ci
		? [desktopDir, "--no-sandbox"]
		: [desktopDir];
}

// The caller owns app.close() once this returns.
export async function launchDesktop(
	root: string,
): Promise<{ app: ElectronApplication; window: Page }> {
	const problem = desktopBuildProblem(root, realFs);
	if (problem) {
		throw new Error(problem);
	}
	const desktopDir = join(root, "apps/waw-bot-desktop");
	const require = createRequire(join(desktopDir, "package.json"));
	const electronDir = dirname(require.resolve("electron/package.json"));

	const app = await _electron.launch({
		executablePath: electronExecutable(electronDir, realFs),
		args: electronArgs(desktopDir, process.platform, Boolean(process.env.CI)),
		cwd: desktopDir,
	});
	try {
		const window = await app.firstWindow();
		try {
			await window.waitForURL(DESKTOP_URL, { timeout: URL_TIMEOUT_MS });
		} catch (cause) {
			throw new Error(
				`desktop window loaded ${window.url()}, expected ${DESKTOP_URL}`,
				{ cause },
			);
		}
		return { app, window };
	} catch (error) {
		await app.close();
		throw error;
	}
}
