# WAW Bot: product and technical spec

Status: first version, written from the design sessions of 22 to 26 Nov 2026.
This file is the source of truth for behaviour. `DESIGN.md` is the source of truth for look.

Every item below is marked one of two ways:

- **Decided**: agreed with the product owner, in words or by approving the design and the whiteboard. Do not change without asking.
- **Proposed**: a sensible default that was never explicitly confirmed. You may build on it, but flag it in your PR so it can be confirmed or changed.

## 1. What it is

WAW Bot is a self-hosted home for personal AI bots, in the spirit of Grok's bots: several named bots, each with a role, its own memory, its own tools and its own threads. (Decided)

The user installs the app, deploys the server on a machine they control, for example with Coolify, and connects the app to it. (Decided)

It is the first app in the WAW family. WAW Tasks and WAW Notes plug into it as connectors. (Decided)

What a bot is (Decided):

- A bot is a row in the database, not a chat. It is the same language model with a role prompt, a memory, a set of tools and, optionally, triggers.
- A thread is one conversation with one bot. A new thread starts clean and still knows what the bot saved to memory.
- Commander is a built-in bot. It routes requests to other bots and creates new ones.

Principles (Decided):

- The server belongs to the user. Keys, tokens, memory and files stay on it.
- A bot never does something risky silently. Actions set to "Ask" wait for the user's approval.
- The interface is minimal but not empty.
- Each bot is recognisable at a glance: a name, a handle, an avatar and a colour.

## 2. Scope

The v1 scope is the requirements in [requirements.md](requirements.md). (Decided)

Explicitly out of scope (Decided). Do not build these:

- A web version. There is no web client and the server does not serve one. (Decided 26 Nov. An earlier plan to ship a web client inside the server image is cancelled.)
- A hosted cloud version. The focus is self-hosted.
- Multiple users on one server, sharing, teams.

Out of scope, Proposed:

- A browser the bot drives (Chrome with Playwright on the server). It is on the whiteboard as optional. Leave a place for it; do not build it in v1.
- Voice.
- An Android app.

## 3. Architecture

```
iOS app / Electron  --HTTPS-->  reverse proxy
                                     |
                                    API (REST + SSE)  --queue-->  Worker  -->  model: Anthropic or OpenRouter
                                     |                               |    -->  MCP servers: Gmail, WAW Notes, WAW Tasks
                                   Postgres  <-----------------------+    -->  push relay --> APNs --> phone
                                   files on a volume
```

Decided:

- The server is one multi-arch Docker image plus a `docker-compose.yml` with two services: the server and Postgres.
- API and Worker live in the same image. The API speaks REST and streams replies over SSE.
- The Worker runs the bot loop and the scheduler.
- Postgres holds everything, including the job queue. There is no Redis.
- Files live on a volume. Postgres holds their metadata.
- Models are reached through an adapter with one internal format. Anthropic is called at `/v1/messages`; OpenRouter at `/chat/completions`. The adapter hides the differences, for example `stop_reason: tool_use` against `finish_reason: tool_calls`.
- Tools reach connectors over MCP. Because requests may go through OpenRouter, the Worker has its own MCP client and does not rely on a provider-side MCP feature.
- Push notifications to the phone go through a push relay run by the product owner: server to relay to APNs. The server never holds APNs keys.
- A home machine without a public address is reached through Cloudflare Tunnel or Tailscale. The app only needs a URL.
- The stack (Decided 26 Nov 2026, [ADR-0001](decisions/0001-typescript-monorepo-stack.md)):
  - pnpm monorepo: `apps/waw-bot-client`, `apps/waw-bot-desktop` (the Electron shell), `apps/waw-bot-server`, `packages/api-contract`, `packages/core` ([ADR-0002](decisions/0002-scaffold-toolchain.md)).
  - Client in React Native for iOS. The desktop app is the same client built with React Native Web inside an Electron shell, loaded from the app bundle, never from the server.
  - Server in Node and TypeScript.

Proposed:

- The desktop app shows native notifications itself while it runs; it does not use the push relay.

### 3.1 Deployment and first run

Decided:

- The user starts the server with `docker compose up -d`, or deploys the same compose file from Coolify.
- Configuration is by environment variables: `OPENROUTER_KEY`, and optionally `ANTHROPIC_KEY`. Without an Anthropic key everything goes through OpenRouter.
- Which real model stands behind Server default, Fast, Balanced and Most capable is set on the server by environment variables.
- First run shows a setup page with the server address, an access token, a pairing link and a QR code that carries the address and a one-time token.
- Images are tagged with semantic versions. Updating is `docker compose pull && docker compose up -d`. Migrations run automatically on start, after a database dump.
- Decided (26 Nov 2026): limits are set on the server by environment variables, with these defaults: file size 25 MB, memory loaded into context 20,000 tokens, tool steps per turn 25. A turn stops when it reaches the step limit.

### 3.2 Versioning between client and server

The app updates through the stores; the server updates when the user chooses. (Decided)

- `GET /health` returns the API version and a list of capabilities.
- The client turns a feature on when its capability is listed, not by comparing version numbers.
- Within one major API version, change only by adding.
- When the server is too old, the client says so, shows the update commands, and lets the user continue with limited features.
- Deprecation is soft: warn first, block later.

### 3.3 Auth

Proposed:

- One user per server.
- Each device holds its own access token, stored in the system keychain. Tokens can be revoked individually.

## 4. Data model

Tables (the set is Decided; column names are Proposed):

| Table | Holds |
| --- | --- |
| `bots` | name, handle, avatar (kind and value), color, role prompt, model, tools with their levels |
| `threads` | id, bot_id, title, created_at. Every thread belongs to one bot |
| `messages` | thread_id, author (user, the bot, a called bot), content, tool calls and results |
| `memory` | a tree of Markdown files: scope (user, bot or project), bot_id, path, description, content, version |
| `connections` | connectors: OAuth tokens, or an MCP URL and token for WAW apps and custom servers |
| `approvals` | actions waiting for a yes: bot, thread, tool, the draft or arguments, status, created_at |
| `jobs` | the queue and the routine schedule |
| `files` | metadata; the files themselves are on the volume |

Proposed additions: `routines` (name, bot_id, trigger, instruction, notify, enabled) if it does not fit `jobs`; `allow_rules` for "do not ask again" exceptions (bot_id, tool, action, match).

## 5. Behaviour

### 5.1 The message loop

Decided:

1. A message arrives for a thread. The server finds the bot from the thread.
2. It builds the context: the bot's role, the memory it should see, the thread so far.
3. It calls the model through the adapter and looks at why the model stopped.
4. If the model asks for a tool, the server runs it (through MCP or its own code) and feeds the result back. This repeats until the model ends its turn.
5. The reply is saved and streamed to the client.
6. A background pass then updates the bot's memory.

A tool call set to "Ask" does not run in step 4. It creates an approval and the turn waits. See 5.6.

### 5.2 Commander

Decided:

- `delegate`: gives a brief to another bot. That runs the same loop for the other bot and returns its result to Commander as a tool result. The thread shows a card per delegated job with its state and a link to the other bot's thread.
- `create-bot`: adds a row to `bots`. Commander asks a few questions, shows the bot it would create (role, model, tools, what it must ask before doing), and creates it when the user confirms. The user can edit before creating.
- The user can skip Commander and talk to a bot directly.

### 5.3 Threads and calling another bot

Decided:

- Each bot has its own list of threads. A thread started by a routine is marked as such.
- Typing `@` in a thread opens a list of bots. The called bot joins for one reply: it reads the thread, but uses its own memory and tools. The thread stays with its owner.
- The called bot's reply is shown under its own name, avatar and colour.

### 5.4 Memory

Decided:

- Memory is a tree of Markdown files stored in Postgres, not on S3 or disk.
- Scopes: files shared with all bots (`profile.md`) and files only one bot sees (`topics/`, `areas/`).
- Each file has a one-line description. The bot reads descriptions to decide which files to open.
- Lines are marked by origin: "You said" or "Bot noticed".
- Memory updates automatically after each conversation. The user can open a file, add or edit a line, edit it as text, add a file and delete a file.
- A new thread shows what memory was loaded.

In the interface these are called files, never notes, so they are not confused with WAW Notes.

### 5.5 Connectors and tools

Decided:

- The catalog has filters, a "WAW" group, connected connectors with the number of bots using each, and available ones.
- A built-in connector is connected by signing in on the provider's own page. The token stays on the user's server.
- A WAW app, or any MCP server, is connected by MCP URL plus a token (or OAuth, or nothing). The form tests the server and lists the tools it found.
- For WAW Notes and WAW Tasks the URL is the app's `/mcp` address and the token is the "Token for bots" from that app's Settings.
- Each bot has its own set of tools. A tool is Off, Ask or Auto for that bot.
- On desktop the level is set per action of a connector (for Gmail: read and search, create drafts, send, delete). On mobile one level covers the connector. The per-action model is the real one; mobile shows a summary.
- Decided (26 Nov 2026): the built-in connectors with OAuth in v1 are Gmail and Calendar. Notion, GitHub, Drive and Slack, shown in the design, are not built-in connectors in v1.

### 5.6 Approvals

Decided:

- An action at level Ask creates an approval and appears in the thread as an "Approval needed" card with what will happen, plus Decline and Approve.
- The bots list shows "Needs you" with a count. One request shows as a single card. Several are grouped by bot: two rows, "and N more", and "See all".
- "See all" opens every request, grouped by bot, longest wait first. Each request can be approved or declined in place. A bot with several requests offers "Approve all" and "Decline all".
- Each waiting bot shows "Waiting" with a count in the bots list.
- A draft can be reviewed before approval: recipient, sender, subject, the text (editable), attachments. The user can approve and send, decline, or tell the bot what to change.
- "Do not ask again for emails to <address>" adds an exception. Exceptions are listed under the tool as "Allowed without asking" and can be removed.
- The user is notified when a bot needs approval.
- Decided (26 Nov 2026): when the user declines an approval, the card in the thread shows "Declined", the action does not run, and the bot receives the decline as the tool result and ends its turn with a short reply.

### 5.7 Routines

Decided:

- A routine has a name, a bot, a trigger (a schedule with days and time, or an event such as "when mail arrives"), an instruction, and "notify me when it finishes".
- The scheduler writes into a thread of that bot by itself. A routine can stay quiet unless it finds something.
- Routines can be paused. A user can also create one by telling a bot "do this every morning".
- Decided (26 Nov 2026): in v1 a routine starts on a schedule or on one event: a new email in a connected Gmail.

### 5.8 Models

Decided:

- Each bot picks Server default, Fast, Balanced, Most capable, or a specific model ID that the server's keys can reach.
- The tiers are mapped to real models on the server, so they keep working when models change.

### 5.9 Bot identity

Decided:

- Name and `@handle`. The handle is unique; the form shows whether it is free.
- Avatar: an icon from a fixed set, an emoji, or an uploaded image cropped to a square.
- Colour: one of ten. It is independent of the avatar: a photo avatar can have a green colour.
- The colour themes that bot's threads. See `DESIGN.md` section 3.
- Decided (26 Nov 2026): a bot is archived, not deleted. An archived bot leaves the bots list, runs nothing (its routines are paused), and keeps its threads and memory; it can be restored. Commander cannot be archived.

### 5.10 Desktop app

Decided:

- "Ask any bot": a small window opened by a global shortcut from any app, and by a shortcut inside the app. The user types a message, optionally starting with `@handle`. Without a handle it goes to Commander. The window offers a new thread or continuing a recent one.
- Settings: open at login, keep running in the menu bar or tray, show the Needs you count on the app icon, the global shortcut, pair a phone with a QR code.

Proposed: the shortcuts shown in the design, Ctrl or Cmd + Shift + Space globally and Ctrl or Cmd + K inside the app.

### 5.11 Connection states

Decided:

- Server unreachable: the app says the bots keep working on the server, and suggests what to check (is the machine on, is the tunnel running, did the address change).
- Old server: see 3.2.

Proposed: messages written while the server is unreachable are queued and sent when it is back. The desktop mockup says so; mobile does not show it.

## 6. API sketch (Proposed)

REST, JSON, token in the `Authorization` header. Replies stream over SSE.

- `GET /health`
- `GET|POST /bots`, `GET|PATCH|DELETE /bots/:id`, `GET /bots/handle-available?handle=`
- `GET|POST /bots/:id/threads`, `GET /threads/:id`, `POST /threads/:id/messages`, `GET /threads/:id/stream`
- `GET|PUT|DELETE /memory?scope=&bot=&path=`
- `GET /connectors`, `POST /connections`, `POST /connections/test`, `DELETE /connections/:id`
- `GET|PUT /bots/:id/tools`
- `GET /approvals`, `POST /approvals/:id/approve`, `POST /approvals/:id/decline`, `PATCH /approvals/:id` (edited draft), `POST /approvals/bulk`
- `GET|POST /routines`, `PATCH|DELETE /routines/:id`
- `POST /files`, `GET /files/:id`
- `POST /devices` registers a device for push

## 7. Build order (Proposed)

The build order is in [roadmap.md](roadmap.md).

Work in vertical slices. Each slice includes the API, the screen and a test.

## 8. Open questions

- How does the relay authenticate a user's server? To be decided in Milestone 12, with its own ADR.
