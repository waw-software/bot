export const SMOKE_TEXT = "WAW Bot";
export const SMOKE_TIMEOUT_MS = 30_000;

export function smokeVerdict(pageText: string): { ok: boolean; line: string } {
	if (pageText.includes(SMOKE_TEXT)) {
		return { ok: true, line: `SMOKE OK: ${SMOKE_TEXT}` };
	}
	return { ok: false, line: `SMOKE FAIL: page text has no ${SMOKE_TEXT}` };
}
