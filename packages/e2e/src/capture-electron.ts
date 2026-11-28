// Captures one screen of the built desktop app at a fixed content size.
import { join } from "node:path";
import { expect } from "@playwright/test";
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
	try {
		await app.evaluate(({ BrowserWindow }, size) => {
			BrowserWindow.getAllWindows()[0]?.setContentSize(size.width, size.height);
		}, item.size);
		const innerWidth = () => page.evaluate(() => window.innerWidth);
		try {
			await expect
				.poll(innerWidth, { timeout: RESIZE_TIMEOUT_MS })
				.toBe(item.size.width);
		} catch (cause) {
			throw new Error(
				`window is ${await innerWidth()} px wide, expected ${item.size.width} (display too small?)`,
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
		await app.close();
	}
}
