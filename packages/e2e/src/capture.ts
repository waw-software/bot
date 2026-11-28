// The visual capture command: `pnpm --filter @waw/e2e visual --out <git-ignored dir>
// [--screen <id>]... [--ios-device <UDID>]`. It writes <id>.actual.png beside <id>.mockup.png
// and prints one line per screen; a missing mockup is flagged, not an error.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { join, relative } from "node:path";
import { type FsChecks, parseArgs } from "./args.ts";
import { captureElectron } from "./capture-electron.ts";
import { captureIos } from "./capture-ios.ts";
import { missingSummary, publishMockup, resultLine } from "./mockup.ts";
import { type ElectronScreen, type IosScreen, screens } from "./screens.ts";

const DESKTOP_BUILD_STEPS = [
	["--filter", "@waw/bot-client", "run", "build"],
	["--filter", "@waw/bot-desktop", "run", "build"],
	["--filter", "@waw/bot-desktop", "exec", "install-electron"],
];

function buildDesktop(root: string): void {
	for (const step of DESKTOP_BUILD_STEPS) {
		// Build output goes to stderr: stdout carries the result lines.
		const result = spawnSync(join(root, "scripts/project/pnpm.sh"), step, {
			cwd: root,
			stdio: ["ignore", 2, 2],
		});
		if (result.status !== 0) {
			throw new Error(`build step failed: pnpm ${step.join(" ")}`);
		}
	}
}

async function main(argv: string[]): Promise<void> {
	const top = spawnSync("git", ["rev-parse", "--show-toplevel"], {
		encoding: "utf8",
	});
	if (top.status !== 0) throw new Error("not inside a git repository");
	const root = top.stdout.trim();

	const fs: FsChecks = {
		exists: (path) => existsSync(join(root, path)),
		isIgnored: (dir) =>
			spawnSync("git", ["check-ignore", "-q", dir], { cwd: root }).status === 0,
	};
	const request = parseArgs(argv, screens, fs, root);
	const { outDir } = request;
	mkdirSync(outDir, { recursive: true });

	const electron = request.screens.filter(
		(s): s is ElectronScreen => s.surface === "electron",
	);
	const ios = request.screens.filter(
		(s): s is IosScreen => s.surface === "ios",
	);

	const captured = new Map<string, string>();
	if (electron.length > 0) {
		buildDesktop(root);
		for (const screen of electron) {
			captured.set(screen.id, await captureElectron(screen, outDir, root));
		}
	}
	if (ios.length > 0) {
		const shots = await captureIos(request.iosDevice, ios, outDir, root);
		if (shots !== "unavailable") {
			for (const [id, path] of shots) captured.set(id, path);
		}
	}

	const missing: string[] = [];
	for (const screen of request.screens) {
		const actual = captured.get(screen.id);
		if (actual === undefined) {
			console.log(`SKIP ${screen.id}: simctl unavailable`);
			continue;
		}
		const mockup = publishMockup(root, outDir, screen);
		if (mockup === null) missing.push(screen.id);
		console.log(
			resultLine(
				screen.id,
				relative(root, actual),
				mockup && { ...mockup, copy: relative(root, mockup.copy) },
			),
		);
	}
	const summary = missingSummary(missing);
	if (summary !== null) console.log(summary);
}

const args = process.argv.slice(2);
try {
	await main(args[0] === "--" ? args.slice(1) : args);
} catch (error) {
	console.error(
		`capture: ${error instanceof Error ? error.message : String(error)}`,
	);
	process.exitCode = 1;
}
