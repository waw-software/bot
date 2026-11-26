// Copies the client's web export into the desktop build output, which the shell serves.
import { cpSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const desktopRoot = fileURLToPath(new URL("..", import.meta.url));
const source = join(desktopRoot, "..", "waw-bot-client", "dist");
const target = join(desktopRoot, "out", "renderer");

if (!existsSync(join(source, "index.html"))) {
	console.error(
		"stage-renderer: ../waw-bot-client/dist/index.html not found; run pnpm --filter @waw/bot-client build",
	);
	process.exit(1);
}

rmSync(target, { recursive: true, force: true });
cpSync(source, target, { recursive: true });
