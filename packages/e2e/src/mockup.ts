// Puts a screen's reference PNG beside its capture, and formats the capture command's output.
import { copyFileSync } from "node:fs";
import { join } from "node:path";

export type PublishedMockup = { copy: string; source: string };

export function publishMockup(
	repoRoot: string,
	outDir: string,
	screen: { id: string; mockup: string | null },
): PublishedMockup | null {
	if (screen.mockup === null) return null;
	const copy = join(outDir, `${screen.id}.mockup.png`);
	copyFileSync(join(repoRoot, screen.mockup), copy);
	return { copy, source: screen.mockup };
}

export function resultLine(
	id: string,
	actual: string,
	mockup: PublishedMockup | null,
): string {
	return `${id}\t${actual}\t${mockup?.copy ?? "no mockup"}\t${mockup?.source ?? "-"}`;
}

export function missingSummary(ids: readonly string[]): string | null {
	return ids.length === 0 ? null : `MISSING MOCKUP: ${ids.join(", ")}`;
}
