# Roadmap

The milestones come in order; each is one or more pull requests, in vertical slices as in [SPEC §7](SPEC.md#7-build-order-proposed).

## Milestone 0: Base documentation

- The [spec](SPEC.md), the [design reference](DESIGN.md) and the [mockups](design/README.md).
- The [requirements](requirements.md).
- [ADR-0001](decisions/0001-typescript-monorepo-stack.md) for the stack.
- The [review criteria](review-criteria.md) and this roadmap.

Serves: none directly.

## Milestone 1: Scaffold and checks

- Scaffold the pnpm monorepo with each stack's own generator.
- Pin the toolchain, commit the lockfile and add `.env.example`.
- Checks for the starting stage (format, lint, type check, unit tests), wired into scripts/checks.d/ and `.claude/harness.conf`, each proven to fail.
- API end-to-end tests against the compose stack with a fake model behind the adapter.
- Design tokens, the avatar component and the thread theme (see [DESIGN.md](DESIGN.md)).
- Server skeleton: `/health`, auth, migrations, Docker image and compose file.

Serves: REQ-001, REQ-003, REQ-005, REQ-018. The scaffold and the checks serve none directly.

## Milestone 2: Connect

- Connect flow.
- Its error states.

Serves: REQ-001, REQ-002, REQ-003, REQ-004.

## Milestone 3: First thread

- One bot, one thread.
- The loop with the model adapter and streaming, no tools.

Serves: REQ-006, REQ-015, REQ-016, REQ-017, REQ-022.

## Milestone 4: Bots and threads

- Bots list.
- Threads list.
- New thread.
- Archive and restore a bot.

Serves: REQ-005, REQ-006, REQ-021.

## Milestone 5: Memory

- Memory: loading into context.
- The background pass.
- The memory screens.

Serves: REQ-007, REQ-022.

## Milestone 6: Tools

- Tools over MCP with levels.
- First connector: connect by MCP URL.

Serves: REQ-006, REQ-008, REQ-009, REQ-016, REQ-017.

## Milestone 7: Approvals

- The card in a thread.
- Needs you.
- The full list.
- Review draft.

Serves: REQ-010.

## Milestone 8: Commander

- Commander: `delegate`.
- Then `create-bot` and customize.

Serves: REQ-005, REQ-011, REQ-012.

## Milestone 9: Calling a bot

- Calling a bot with `@`.

Serves: REQ-013.

## Milestone 10: Built-in connectors

- Built-in connectors with OAuth: Gmail and Calendar.

Serves: REQ-008, REQ-016.

## Milestone 11: Routines

- Routines.
- The scheduler.

Serves: REQ-006, REQ-014.

## Milestone 12: Push

- Push through the relay.
- Decide how the relay authenticates a user's server, in an ADR.

Serves: REQ-010, REQ-020.

## Milestone 13: Desktop

- Desktop: the three-column layout.
- Then the Electron shell and tray.
- "Ask any bot".

Serves: REQ-018, REQ-019.
