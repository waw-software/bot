import { statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { app, BrowserWindow, net, protocol, type WebContents } from "electron";
import { SMOKE_TIMEOUT_MS, smokeVerdict } from "./smoke";
import { APP_SCHEME, APP_URL, resolveExportFile } from "./web-export";

const SMOKE_POLL_MS = 250;

// Reports whether the page rendered the heading, then ends the app.
function watchSmoke(contents: WebContents): void {
	let lastLine = smokeVerdict("").line;

	setTimeout(() => {
		console.log("SMOKE FAIL: timeout");
		console.log(lastLine);
		app.exit(1);
	}, SMOKE_TIMEOUT_MS);

	contents.once("did-fail-load", (_event, code, description) => {
		console.log(`SMOKE FAIL: load ${code} ${description}`);
		app.exit(1);
	});

	// The page may render after the load event, so read it until the heading shows.
	const poll = async (): Promise<void> => {
		const pageText: string = await contents.executeJavaScript(
			"document.body.innerText",
		);
		const verdict = smokeVerdict(pageText);
		lastLine = verdict.line;
		if (verdict.ok) {
			console.log(verdict.line);
			app.exit(0);
			return;
		}
		setTimeout(poll, SMOKE_POLL_MS);
	};

	contents.once("did-finish-load", poll);
}

function createWindow(): void {
	const mainWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		webPreferences: {
			sandbox: true,
			contextIsolation: true,
			nodeIntegration: false,
		},
	});

	if (process.env.WAW_BOT_SMOKE === "1") watchSmoke(mainWindow.webContents);

	mainWindow.loadURL(APP_URL);
}

// The web export uses root-relative asset URLs, which need an origin that file: lacks.
protocol.registerSchemesAsPrivileged([
	{
		scheme: APP_SCHEME,
		privileges: { standard: true, secure: true, supportFetchAPI: true },
	},
]);

app.whenReady().then(() => {
	// The build stages the client's web export next to the main process output.
	const exportRoot = join(app.getAppPath(), "out", "renderer");

	protocol.handle(APP_SCHEME, (request) => {
		const file = resolveExportFile(exportRoot, request.url);
		if (!file || !statSync(file, { throwIfNoEntry: false })?.isFile()) {
			return new Response("Not found", { status: 404 });
		}
		return net.fetch(pathToFileURL(file).toString());
	});

	createWindow();

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});
