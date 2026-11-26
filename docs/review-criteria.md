# Review criteria

A reviewer of this project checks the following besides the template's rubric.

## Product and safety

- No Decided item of [the spec](SPEC.md) changes without the owner being asked.
- Every Proposed spec item the change builds on is listed in the PR description, so it can be confirmed.
- Nothing the spec lists as [out of scope](SPEC.md#2-scope) is built; in particular, there is no web client and the server serves no client files.
- A tool call at level Ask never runs before the user approves it ([approvals](SPEC.md#56-approvals)); this safety property is covered by tests, including the "Approve all" and "Do not ask again" paths.
- Keys and tokens stay on the server; clients never see model keys or connector tokens.
- Something the documents do not cover is listed as an open question in the PR description; where the slice cannot wait, the change takes the simplest option that fits the documents and lists it as Proposed, never as decided.

## Design

- App red and the bot's colour stay apart: app red is for the app and for attention, and the bot's colour applies in its threads only where [DESIGN.md section 3](DESIGN.md#3-the-bot-colour-in-a-thread) lists it.
- Avatar and colour are [separate settings](SPEC.md#59-bot-identity); neither is derived from the other.
- Colours, type and sizes come from the [design tokens](DESIGN.md#2-tokens); components hard-code no values and no new colour is invented.
- A screen is built from its mockup: the PR names the mockup file the screen follows.
- The [mockups](design/README.md) are a visual reference; their HTML and inline styles are not copied into the app.
- Where a mockup disagrees with [the spec](SPEC.md) or [DESIGN.md](DESIGN.md), the documents win; the [known gaps](DESIGN.md#8-known-gaps-in-the-mockups) are followed as listed.
- UI copy is in English and uses the wording of the mockups; memory entries are called [files, never notes](SPEC.md#54-memory).

## Architecture and API

- Client and server share request and response types through one contract package; the contract changes first, then both sides.
- API changes follow the [versioning rules](SPEC.md#32-versioning-between-client-and-server): within a major version they only add, and new client features are gated on the capabilities from `GET /health`.
- All model calls go through the [adapter](SPEC.md#3-architecture); no code outside it depends on one provider's format.

## Slices

- The work follows the order of the [roadmap](roadmap.md), one vertical slice per PR: API, screen and tests together.
- Each slice runs end to end against a real server started from the compose file; tests use a fake model behind the adapter.
- After each slice, the built screen is compared with its mockup at 390 px wide (mobile) and 1440 px wide (desktop), and the differences left are noted.
