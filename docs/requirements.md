# Requirements

REQ-001: The user deploys the server as one Docker image with a compose file for the server and Postgres, configures it by environment variables, pairs a client from the first-run setup page, and updates it by pulling a newer image. ([SPEC §3](SPEC.md#3-architecture), [SPEC §3.1](SPEC.md#31-deployment-and-first-run))
AC-01: Given the compose file and the configuration in environment variables, when the user runs `docker compose up -d` or deploys the same compose file from Coolify, then two services start, the server and Postgres.
AC-02: Given a new server, when it runs for the first time, then a setup page shows the server address, an access token, a pairing link and a QR code that carries the address and a one-time token.
AC-03: Given a running server, when the user runs `docker compose pull && docker compose up -d` for a newer image, then migrations run automatically on start, after a database dump.

REQ-002: The user connects a client to their server by server URL and token, pairing link, or QR code. ([SPEC §3.1](SPEC.md#31-deployment-and-first-run))
AC-04: Given a running server, when the user enters its URL and a token in the client, then the client connects to that server.
AC-05: Given a pairing link from the server, when the user uses it in the client, then the client connects to that server.
AC-06: Given a QR code from the server that carries the address and a one-time token, when the user scans it with the client, then the client connects to that server.

REQ-003: The client and the server stay compatible through the API version and capabilities that `GET /health` returns, and the client tells the user when the server is too old. ([SPEC §3.2](SPEC.md#32-versioning-between-client-and-server), [SPEC §5.11](SPEC.md#511-connection-states))
AC-07: Given a running server, when a client calls `GET /health`, then the response gives the API version and a list of capabilities.
AC-08: Given a feature that depends on a capability, when the server lists that capability, then the client turns the feature on without comparing version numbers.
AC-09: Given a server that is too old, when the client connects to it, then the client says so, shows the update commands and lets the user continue with limited features.

REQ-004: The app tells the user when the server is unreachable. ([SPEC §5.11](SPEC.md#511-connection-states))
AC-10: Given a connected app, when the server is unreachable, then the app says the bots keep working on the server and suggests checking that the machine is on, that the tunnel is running and whether the address changed.

REQ-005: Each bot has a name, a unique handle, an avatar and one of ten colours that is independent of the avatar. ([SPEC §5.9](SPEC.md#59-bot-identity))
AC-11: Given the bot form, when the user enters a handle, then the form shows whether it is free.
AC-12: Given the bot form, when the user chooses an avatar, then it can be an icon from a fixed set, an emoji or an uploaded image cropped to a square.
AC-13: Given a bot with any kind of avatar, when the user chooses one of the ten colours, then the bot takes that colour and keeps its avatar.

REQ-006: Each bot has its own threads, in which replies stream and the bot uses tools until the model ends its turn. ([SPEC §5.1](SPEC.md#51-the-message-loop), [SPEC §5.3](SPEC.md#53-threads-and-calling-another-bot))
AC-14: Given several bots, when the user opens a bot's list of threads, then it holds that bot's threads, and a thread started by a routine is marked as such.
AC-15: Given a thread, when the user sends a message, then the reply is saved and streamed to the client.
AC-16: Given the model asks for a tool that may run, when the server has run it, then the server feeds the result back to the model and repeats this until the model ends its turn.

REQ-007: Bot memory is a tree of Markdown files, shared or private to a bot, with descriptions and origin marks, that updates automatically and that the user can read and edit. ([SPEC §5.4](SPEC.md#54-memory))
AC-17: Given shared files and files of one bot, when a bot reads memory, then it sees the shared files and its own files, not another bot's own files, and reads their one-line descriptions to decide which files to open.
AC-18: Given a conversation, when it is over, then memory updates automatically, and its lines are marked by origin as "You said" or "Bot noticed".
AC-19: Given a bot's memory, when the user works with it, then the user can open a file, add or edit a line, edit the file as text, add a file and delete a file.
AC-20: Given a bot with memory, when the user starts a new thread, then the thread shows what memory was loaded.

REQ-008: The user connects tools through built-in connectors with OAuth, and WAW apps and any other MCP server by MCP URL with a token, OAuth or nothing. ([SPEC §5.5](SPEC.md#55-connectors-and-tools))
AC-21: Given a built-in connector, when the user connects it, then the user signs in on the provider's own page and the token stays on the user's server.
AC-22: Given the form for an MCP URL, when the user enters a server with a token, OAuth or nothing, then the form tests the server and lists the tools it found.
AC-23: Given WAW Notes or WAW Tasks, when the user enters the app's `/mcp` address and the "Token for bots" from that app's Settings, then the app is connected.

REQ-009: Each bot has its own set of tools, each at level Off, Ask or Auto, set per action of a connector. ([SPEC §5.5](SPEC.md#55-connectors-and-tools))
AC-24: Given a bot, when the user sets a tool to Off, Ask or Auto, then that level applies to that bot.
AC-25: Given a connector with several actions, when the user opens the bot's tools on desktop, then the level is set per action.
AC-26: Given levels set per action, when the user opens the bot's tools on mobile, then one level covers the connector and shows a summary of the per-action levels.

REQ-010: A tool call at level Ask never runs before the user approves it, and the user is notified and handles approvals from the card in the thread, from Needs you, from the full list grouped by bot with the longest wait first (with Approve all and Decline all) or from a draft review, and can add "Do not ask again" exceptions that are listed and removable. ([SPEC §5.1](SPEC.md#51-the-message-loop), [SPEC §5.6](SPEC.md#56-approvals))
AC-27: Given an action at level Ask, when the model asks for it, then it does not run before the user approves it, an "Approval needed" card in the thread shows what will happen with Decline and Approve, the turn waits and the user is notified.
AC-28: Given a bot with several waiting requests, when the user chooses "Approve all", then that bot's requests are approved.
AC-29: Given a waiting request, when the user declines it, then the action does not run.
AC-30: Given an exception added with "Do not ask again", which is listed under the tool as "Allowed without asking" until removed, when the bot makes the next matching call, then it runs without asking.

REQ-011: Commander delegates a job to another bot with `delegate`. ([SPEC §5.2](SPEC.md#52-commander))
AC-31: Given a thread with Commander, when Commander delegates a brief to another bot, then the same loop runs for that bot and its result returns to Commander as a tool result.
AC-32: Given a delegated job, when the user looks at Commander's thread, then a card for the job shows its state and a link to the other bot's thread.

REQ-012: Commander creates a bot with `create-bot` after the user confirms it, and the user can skip Commander and talk to a bot directly. ([SPEC §5.2](SPEC.md#52-commander))
AC-33: Given a request to Commander for a new bot, when Commander has asked its questions, then it shows the bot it would create, with role, model, tools and what it must ask before doing.
AC-34: Given the shown bot, when the user confirms, then Commander creates it.
AC-35: Given the shown bot, when the user has not yet created it, then the user can edit it first.
AC-36: Given several bots, when the user wants one of them, then the user can talk to it directly without Commander.

REQ-013: The user calls another bot into a thread with `@handle` for one reply. ([SPEC §5.3](SPEC.md#53-threads-and-calling-another-bot))
AC-37: Given a thread, when the user types `@`, then a list of bots opens.
AC-38: Given a bot called into a thread, when it replies, then it has read the thread, uses its own memory and tools, joins for that one reply only, and the thread stays with its owner.
AC-39: Given a called bot's reply, when it is shown, then it appears under that bot's own name, avatar and colour.

REQ-014: A routine starts a bot's work on a schedule or an event, with an instruction and an option to notify the user, writes into a thread of that bot and can be paused. ([SPEC §5.7](SPEC.md#57-routines))
AC-40: Given the routine settings, when the user defines a routine, then it has a name, a bot, a schedule with days and time or an event as its trigger, an instruction and "notify me when it finishes".
AC-41: Given a routine, when its trigger occurs, then the scheduler writes into a thread of that bot by itself, and the routine can stay quiet unless it finds something.
AC-42: Given a routine, when the user pauses it, then the routine is paused.
AC-43: Given a thread with a bot, when the user tells it "do this every morning", then a routine is created.

REQ-015: Each bot uses Server default, Fast, Balanced, Most capable or a specific model ID. ([SPEC §3.1](SPEC.md#31-deployment-and-first-run), [SPEC §5.8](SPEC.md#58-models))
AC-44: Given a bot, when the user picks its model, then the choice is Server default, Fast, Balanced, Most capable or a specific model ID that the server's keys can reach.
AC-45: Given a bot set to a tier, when the server's environment variables map that tier to another real model, then the bot's setting keeps working.

REQ-016: Keys and tokens stay on the server, and clients never receive model keys or connector tokens. ([SPEC §1](SPEC.md#1-what-it-is), [SPEC §5.5](SPEC.md#55-connectors-and-tools))
AC-46: Given a server with model keys and connected connectors, when a client uses the server, then the client receives no model key and no connector token.

REQ-017: Models are called through one adapter for Anthropic `/v1/messages` and OpenRouter `/chat/completions`, and the Worker has its own MCP client. ([SPEC §3](SPEC.md#3-architecture))
AC-47: Given Anthropic or OpenRouter as the provider, when the Worker calls a model, then the call goes through the adapter, which uses one internal format and hides the differences between the providers.
AC-48: Given a server without an Anthropic key, when it calls a model, then the call goes through OpenRouter.
AC-49: Given a connector tool, when the Worker runs it, then it uses its own MCP client and does not rely on a provider-side MCP feature.

REQ-018: The clients are an iOS app and an Electron desktop app, with no web client. ([SPEC §1](SPEC.md#1-what-it-is), [SPEC §2](SPEC.md#2-scope))
AC-50: Given a deployed server, when the user wants to use it, then the user does so with the iOS app or the Electron desktop app.
AC-51: Given a deployed server, when a browser requests a web client from it, then it serves no client files.

REQ-019: The desktop app has an "Ask any bot" window opened by a global shortcut, and desktop settings. ([SPEC §5.10](SPEC.md#510-desktop-app))
AC-52: Given the desktop app, when the user presses the global shortcut in any app or the shortcut inside the app, then a small "Ask any bot" window opens that offers a new thread or continuing a recent one.
AC-53: Given the "Ask any bot" window, when the user sends a message, then it goes to the bot of the leading `@handle`, or to Commander when there is no handle.
AC-54: Given the desktop settings, when the user opens them, then they cover open at login, keep running in the menu bar or tray, the Needs you count on the app icon, the global shortcut and pairing a phone with a QR code.

REQ-020: Push notifications reach the phone through the product owner's relay to APNs, and the server holds no APNs keys. ([SPEC §3](SPEC.md#3-architecture), [SPEC §5.6](SPEC.md#56-approvals))
AC-55: Given a phone connected to the server, when the server sends a push notification, then it goes from the server to the relay and from the relay to APNs.
AC-56: Given a deployed server, when it is configured to run, then it holds no APNs keys.
