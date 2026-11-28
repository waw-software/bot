// Captures the client on a booted iOS simulator: starts its own Metro on a free port, opens the
// app in Expo Go with `simctl openurl`, waits until the screen settles and takes a screenshot.
//
// Prerequisites:
// - macOS with Xcode, so that `xcrun simctl` works;
// - a booted simulator 390 pt wide (iPhone 17e), passed as `--ios-device <UDID>`
//   (`xcrun simctl list devices booted`);
// - Expo Go 58 installed on that simulator.
import { type ChildProcess, spawn, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createServer } from "node:net";
import { join } from "node:path";

export const IOS_WIDTH_PT = 390;

const SCALES = [2, 3];
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const PNG_HEADER_BYTES = 24;
const METRO_TIMEOUT_MS = 120_000;
const METRO_POLL_MS = 500;
const APP_TIMEOUT_MS = 120_000;
const SETTLE_TIMEOUT_MS = 30_000;
const POLL_MS = 1000;
const REQUEST_TIMEOUT_MS = 5000;
const SIMCTL_TIMEOUT_MS = 30_000;
const STOP_TIMEOUT_MS = 5000;
const STOP_POLL_MS = 100;
const KEPT_LINES = 20;
const SIGNALS = { SIGINT: 130, SIGTERM: 143 } as const;

export function pngSize(png: Uint8Array): { width: number; height: number } {
	if (
		png.length < PNG_HEADER_BYTES ||
		PNG_SIGNATURE.some((byte, i) => png[i] !== byte)
	) {
		throw new Error("not a PNG");
	}
	const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
	return { width: view.getUint32(16), height: view.getUint32(20) };
}

export function iosWidthProblem(pngWidthPx: number): string | null {
	return SCALES.some((scale) => pngWidthPx === IOS_WIDTH_PT * scale)
		? null
		: `${pngWidthPx} px is not ${IOS_WIDTH_PT} pt wide at @2x or @3x; use a ${IOS_WIDTH_PT}-pt simulator (iPhone 17e)`;
}

export function expoUrl(port: number, launchPath: string): string {
	const base = `exp://127.0.0.1:${port}`;
	return launchPath === "" ? base : `${base}/--/${launchPath}`;
}

export function hasAppTarget(jsonListBody: string): boolean {
	let targets: unknown;
	try {
		targets = JSON.parse(jsonListBody);
	} catch (error) {
		if (error instanceof SyntaxError) return false;
		throw error;
	}
	return Array.isArray(targets) && targets.length > 0;
}

export type Clock = { now(): number; sleep(ms: number): Promise<void> };

const realClock: Clock = {
	now: Date.now,
	sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

export async function waitFor<T>(
	probe: () => Promise<T | undefined>,
	what: string,
	timeoutMs: number,
	intervalMs: number,
	clock: Clock,
): Promise<T> {
	const deadline = clock.now() + timeoutMs;
	for (;;) {
		const value = await probe();
		if (value !== undefined) return value;
		if (clock.now() >= deadline) {
			throw new Error(
				`timed out after ${timeoutMs / 1000} s waiting for ${what}`,
			);
		}
		await clock.sleep(intervalMs);
	}
}

function freePort(): Promise<number> {
	return new Promise((resolve, reject) => {
		const server = createServer();
		server.once("error", reject);
		server.listen(0, "127.0.0.1", () => {
			const address = server.address();
			server.close(() => {
				if (address === null || typeof address === "string") {
					reject(new Error("no free port found"));
				} else {
					resolve(address.port);
				}
			});
		});
	});
}

function simctl(args: string[]): void {
	const result = spawnSync("xcrun", ["simctl", ...args], {
		encoding: "utf8",
		timeout: SIMCTL_TIMEOUT_MS,
	});
	if (result.status !== 0) {
		throw new Error(
			`simctl ${args[0]} failed: ${result.error?.message ?? result.stderr.trim()}`,
		);
	}
}

// False when no process of the group is left to receive the signal.
function signalGroup(pid: number, signal: NodeJS.Signals | 0): boolean {
	try {
		process.kill(-pid, signal);
		return true;
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ESRCH") return false;
		throw error;
	}
}

// Metro runs in its own process group, so that its children stop with it.
async function stopGroup(child: ChildProcess): Promise<void> {
	const { pid } = child;
	if (pid === undefined || !signalGroup(pid, "SIGTERM")) return;
	try {
		await waitFor(
			async () => (signalGroup(pid, 0) ? undefined : true),
			"Metro to stop",
			STOP_TIMEOUT_MS,
			STOP_POLL_MS,
			realClock,
		);
	} catch {
		// Still running after the bound: force it.
		signalGroup(pid, "SIGKILL");
	}
}

function startMetro(
	repoRoot: string,
	port: number,
): { assertRunning(): void; stop(): Promise<void> } {
	const child = spawn(
		"scripts/project/pnpm.sh",
		[
			"--filter",
			"@waw/bot-client",
			"exec",
			"expo",
			"start",
			"--localhost",
			"--port",
			String(port),
		],
		{
			cwd: repoRoot,
			detached: true,
			env: {
				...process.env,
				CI: "1",
				EXPO_OFFLINE: "1",
				EXPO_NO_TELEMETRY: "1",
			},
			stdio: ["ignore", "pipe", "pipe"],
		},
	);
	const lines: string[] = [];
	const keep = (chunk: Buffer) => {
		lines.push(...chunk.toString("utf8").split("\n").filter(Boolean));
		lines.splice(0, lines.length - KEPT_LINES);
	};
	child.stdout?.on("data", keep);
	child.stderr?.on("data", keep);
	let spawnError: Error | undefined;
	child.on("error", (error) => {
		spawnError = error;
	});

	let stopped: Promise<void> | undefined;
	return {
		assertRunning() {
			if (spawnError) {
				throw new Error(`Metro did not start: ${spawnError.message}`);
			}
			const code = child.exitCode ?? child.signalCode;
			if (code !== null) {
				throw new Error(`Metro exited (${code}): ${lines.join("\n")}`);
			}
		},
		stop() {
			stopped ??= stopGroup(child);
			return stopped;
		},
	};
}

// undefined while Metro does not answer yet.
async function metroBody(
	port: number,
	path: string,
): Promise<string | undefined> {
	try {
		const response = await fetch(`http://127.0.0.1:${port}${path}`, {
			signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
		});
		return await response.text();
	} catch {
		return undefined;
	}
}

// Returns id -> absolute path of <id>.actual.png.
export async function captureIos(
	device: string | undefined,
	items: readonly { id: string; launchPath: string }[],
	outDir: string,
	repoRoot: string,
): Promise<Map<string, string> | "unavailable"> {
	if (
		process.platform !== "darwin" ||
		spawnSync("xcrun", ["--find", "simctl"], { stdio: "ignore" }).status !== 0
	) {
		return "unavailable";
	}
	if (device === undefined) {
		throw new Error(
			"--ios-device <UDID> is required for iOS screens; find it with: xcrun simctl list devices booted",
		);
	}

	const port = await freePort();
	const metro = startMetro(repoRoot, port);
	const onSignal = (signal: keyof typeof SIGNALS) => {
		void metro.stop().finally(() => process.exit(SIGNALS[signal]));
	};
	process.on("SIGINT", onSignal);
	process.on("SIGTERM", onSignal);
	try {
		await waitFor(
			async () => {
				metro.assertRunning();
				const body = await metroBody(port, "/status");
				return body === "packager-status:running" ? true : undefined;
			},
			"Metro to start",
			METRO_TIMEOUT_MS,
			METRO_POLL_MS,
			realClock,
		);

		const captured = new Map<string, string>();
		for (const { id, launchPath } of items) {
			metro.assertRunning();
			simctl(["openurl", device, expoUrl(port, launchPath)]);
			await waitFor(
				async () => {
					metro.assertRunning();
					const body = await metroBody(port, "/json/list");
					return body !== undefined && hasAppTarget(body) ? true : undefined;
				},
				`the app of ${id} to connect to Metro`,
				APP_TIMEOUT_MS,
				POLL_MS,
				realClock,
			);

			const path = join(outDir, `${id}.actual.png`);
			let previous: Buffer | undefined;
			const png = await waitFor(
				async () => {
					metro.assertRunning();
					simctl(["io", device, "screenshot", path]);
					const current = readFileSync(path);
					if (previous?.equals(current)) return current;
					previous = current;
					return undefined;
				},
				`the iOS screen of ${id} to settle`,
				SETTLE_TIMEOUT_MS,
				POLL_MS,
				realClock,
			);
			const problem = iosWidthProblem(pngSize(png).width);
			if (problem) throw new Error(problem);
			captured.set(id, path);
		}
		return captured;
	} finally {
		await metro.stop();
		process.off("SIGINT", onSignal);
		process.off("SIGTERM", onSignal);
	}
}
