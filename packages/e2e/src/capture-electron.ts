// Captures one screen of the built desktop app at a fixed content size.
import { join } from "node:path";
import { type CDPSession, expect, type Page } from "@playwright/test";
import { launchDesktop } from "./electron.ts";

const RESIZE_TIMEOUT_MS = 5000;
const HEADING_TIMEOUT_MS = 15_000;

export async function captureElectron(
	item: {
		id: string;
		size: { width: number; height: number };
		readyHeading: string;
	},
	outDir: string,
	repoRoot: string,
): Promise<string> {
	const { app, window: page } = await launchDesktop(repoRoot);
	let cdp: CDPSession | undefined;
	try {
		await app.evaluate(({ BrowserWindow }, size) => {
			BrowserWindow.getAllWindows()[0]?.setContentSize(size.width, size.height);
		}, item.size);
		// The display clamps the window; the viewport set through CDP is not limited by it.
		cdp = await page.context().newCDPSession(page);
		await cdp.send("Emulation.setDeviceMetricsOverride", {
			width: item.size.width,
			height: item.size.height,
			deviceScaleFactor: 0,
			mobile: false,
		});
		const innerSize = () =>
			page.evaluate(() => ({
				width: window.innerWidth,
				height: window.innerHeight,
			}));
		try {
			await expect
				.poll(innerSize, { timeout: RESIZE_TIMEOUT_MS })
				.toEqual(item.size);
		} catch (cause) {
			const { width, height } = await innerSize();
			throw new Error(
				`window is ${width}x${height} px, expected ${item.size.width}x${item.size.height}`,
				{ cause },
			);
		}
		await page
			.getByRole("heading", { level: 1, name: item.readyHeading, exact: true })
			.waitFor({ state: "visible", timeout: HEADING_TIMEOUT_MS });
		const path = join(outDir, `${item.id}.actual.png`);
		await page.screenshot({ path, animations: "disabled" });
		return path;
	} finally {
		try {
			if (cdp) await detach(cdp, page);
		} finally {
			await app.close();
		}
	}
}

async function detach(cdp: CDPSession, page: Page): Promise<void> {
	try {
		await cdp.detach();
	} catch (error) {
		// A closed app has already dropped the session.
		if (!page.isClosed()) throw error;
	}
}
