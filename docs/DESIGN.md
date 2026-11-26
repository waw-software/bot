# WAW Bot: design reference

This file is the source of truth for how the app looks. `SPEC.md` is the source of truth for how it behaves.

The screens were drawn as HTML mockups. Their sources are in `docs/design/mobile/` and `docs/design/desktop/`. PNG exports, when present, are in `docs/design/screens/`. How to read the sources is explained in `docs/design/README.md`.

Use the mockups for layout, spacing, colour, copy and states. Do not copy their markup: they are inline-styled HTML with sample data, not components.

WAW Bot shares its base tokens with WAW Tasks and WAW Notes.

## 1. Character

- Minimal but not empty. White background, few borders, one app accent.
- Two kinds of colour, never mixed up:
  - **App red** is for the app itself: primary actions outside a thread (Save, Create bot, Connect), the logo, links, and anything that needs the user's attention ("Needs you", "Waiting").
  - **Bot colour** is for one bot: the ring on its avatar and everything inside its threads.
- Every bot is recognisable by avatar, name and colour wherever it appears.
- All UI copy is in English.

## 2. Tokens

Put these in one theme module and use only the names in components.

### Base colour

| Token | Value | Use |
| --- | --- | --- |
| `bg` | `#FFFFFF` | Screen background |
| `surface` | `#F6F5F2` | Sidebar, cards, segmented controls, selected rows |
| `ink` | `#171717` | Primary text, selected segment, outline of a strong button |
| `ink-2` | `#3D3D3D` | Secondary text |
| `muted` | `#5C5C5C` | Meta text, labels, inactive tabs |
| `border` | `#E4E2DD` | Card borders |
| `border-strong` | `#D9D6D0` | Input borders, outline buttons |
| `divider` | `#EEECE8` | Row dividers |
| `accent` | `#D4213D` | App primary buttons, logo, count badge |
| `accent-text` | `#B01A31` | Links, "Waiting", "Needs you" label |
| `accent-dark` | `#8C1427` | Hover, text on accent tint |
| `accent-tint` | `#FCEBEE` | "Needs you" panel, "Waiting" badge, update banner |
| `success` | `#1F7A4D` | Online dot, done |
| `success-text` | `#1B6943` | Success text |
| `success-tint` | `#EEF6F1` | Success line |
| `warning` | `#8A5A00` | Unreachable dot. Use `#7A4F00` on a tint |
| `warning-tint` | `#FBF3E2` | "Can't reach your server" banner |

### Bot colours

Ten colours. Each has three values: `main` (fills, ring; white text on it passes contrast), `tint` (the bot's bubbles and chips) and `dark` (text and links in that colour on white or on the tint).

| Name | main | tint | dark |
| --- | --- | --- | --- |
| Red | `#D4213D` | `#FCEBEE` | `#B01A31` |
| Orange | `#B45309` | `#FBEDE2` | `#8F3F06` |
| Amber | `#8A5A00` | `#FBF3E2` | `#7A4F00` |
| Green | `#1F7A4D` | `#EEF6F1` | `#1B6943` |
| Teal | `#0F766E` | `#E6F4F2` | `#0B5F58` |
| Sky | `#0369A1` | `#E6F2F9` | `#035783` |
| Blue | `#1F5FBF` | `#EAF1FB` | `#1A4F9F` |
| Violet | `#5B3FB5` | `#F0ECFA` | `#4B3396` |
| Pink | `#B4236B` | `#FBEAF2` | `#96195A` |
| Graphite | `#171717` | `#F6F5F2` | `#171717` |

Sample bots in the mockups: Commander graphite with an icon, Accountant green with a photo, Coder blue with an icon, Planner orange with an icon, Researcher amber with an icon, Noter violet with an emoji.

### Type

- Interface and messages: Inter 400, 500, 600.
- Headings, bot names in headers, the wordmark: Space Grotesk 600.
- File paths, tokens, URLs, tool names, keyboard hints: the system monospace stack.

| Role | Size |
| --- | --- |
| Screen title | 30 px on list screens, 24 px on pushed screens |
| Bot name in a header | 16 to 20 px, 600 |
| Message text | 15 px, line 22 |
| Row title | 15 to 16 px, 600 |
| Meta | 13 px |
| Group label | 12 px, 600, uppercase, letter spacing 0.4 px |

### Shape and size

- Radius: 8 to 10 for chips and small rows, 12 for inputs and buttons, 14 for primary buttons, 16 for cards, 18 for message bubbles and dialogs, 999 for pills.
- A message bubble has one small corner (4 px): bottom right for the user, bottom left for a bot.
- Every tappable target is at least 44 px high.
- Mobile: inputs 50 px, primary button 54 px. Reference frame 390 x 844.
- Desktop: sidebar 256 px, bot column 300 to 340 px, right panel 340 to 440 px, message column at most 720 px wide and centred. Reference width 1440.

## 3. The bot colour in a thread

Inside a thread, the bot's colour replaces the neutral or app accent in these places, and only these:

- The ring around the bot's avatar in the header.
- The user's message bubbles: `main` fill, white text.
- The bot's message bubbles: `tint` fill, `ink` text.
- The tick on finished tool steps.
- The approval card: 1.5 px `main` border, label and link in `dark`, Approve button in `main`.
- Links the bot produced, in `dark`.
- The send button, and "New thread" on that bot's thread list.

A bot called in with `@` brings its own colour for its own reply: its avatar ring, its result card label and link, and its bubble tint. The rest of the thread keeps the owner's colour.

Commander is graphite, so its threads look neutral.

"Needs you", "Waiting" and anything else that asks for attention stays app red everywhere.

## 4. Components

- **Avatar.** A rounded square (radius about 30% of its size) showing an icon, an emoji or a cropped image on a neutral background, with a ring in the bot's colour: 2 px gap in the background colour, then 2 px of `main`. The ring is what carries the colour; the picture never does. Sizes used: 26, 28, 32, 34, 40, 44, 56, 64.
- **Bot row.** Avatar, name, one status line, and on the right a time, "Waiting · N", or nothing.
- **Needs you panel.** `accent-tint` card: label with a count, "See all", up to two rows (avatar, what is asked, thread and wait), "and N more".
- **Request card.** Bot avatar and name, thread and wait time, what is asked, then Review, Decline, Approve. Approve uses that bot's `main`.
- **Message bubbles, tool steps, approval card, result card.** See section 3. Tool steps are small outlined chips with a tick.
- **Delegation card** (Commander): the asked bot's avatar, "Asked <bot>", the job, a state ("Done", "Working"), the result and a link to the other thread.
- **Composer.** A hint line, the input, a square send button.
- **Bot picker** (after `@`): a list of bots with avatar, name, handle and what it does.
- **Bot header with tabs.** Avatar, name, handle, a Customize button, and a segmented control: Threads, Memory, Tools.
- **Segmented control.** `surface` track, white selected segment with a soft shadow.
- **Level control.** Three segments, Off, Ask, Auto; the selected one is `ink` with white text.
- **Memory file row and file view.** Monospace path, one-line description. In the file, each line has a bar on the left: `ink` for "You said", `border-strong` for "Bot noticed".
- **Connector card.** A letter tile, name, what it covers, and a count of bots or a Connect button. WAW apps use an app-red tile.
- **Routine row.** A switch, name, note, a schedule chip, the bot.
- **Colour picker.** Ten 44 px circles; the selected one has an `ink` ring.
- **Icon and emoji grids, image row** in Customize bot.
- **Banners**: update available (`accent-tint` or `surface`), server unreachable (`warning-tint`).
- **Buttons**: primary (app red, or bot `main` inside a thread), strong outline (`ink` border), outline, text.
- **Desktop only**: sidebar, right panel with a close button, "Ask any bot" dialog over a dimmed window.

### Icons and emoji

Interface icons are stroke icons in the current text colour. Emoji appear only where the user chose one as a bot's avatar.

## 5. Screens

### Mobile (`docs/design/mobile/`)

| File | Screen |
| --- | --- |
| `Main.dc.html` | Connect to your server |
| `ScanQR.dc.html` | Scan QR |
| `ConnectError.dc.html` | Old server version |
| `Offline.dc.html` | Server unreachable |
| `Bots.dc.html` | Bots list with "Needs you" for several bots |
| `NeedsYou.dc.html` | All requests, grouped by bot |
| `ReviewDraft.dc.html` | Review a draft before it is sent |
| `Chat.dc.html` | A thread: Accountant, green, photo avatar, approval card |
| `ChatNoter.dc.html` | A thread in violet with an emoji avatar; uses WAW Notes and WAW Tasks |
| `ChatCoder.dc.html` | A thread in blue with an icon avatar; a second kind of approval |
| `Threads.dc.html` | A bot's threads |
| `NewThread.dc.html` | An empty new thread |
| `Memory.dc.html` | A bot's memory files |
| `MemoryFile.dc.html` | One memory file |
| `BotTools.dc.html` | A bot's tools and model |
| `ModelPicker.dc.html` | Choose a model |
| `CreateBotChat.dc.html` | Asking Commander for a new bot |
| `CreateBotConfirm.dc.html` | Confirm the new bot |
| `EditBot.dc.html` | Customize bot: name, handle, avatar, colour. Interactive mockup |
| `Delegate.dc.html` | Commander delegates to other bots |
| `Mention.dc.html` | Calling a bot with `@` |
| `MentionResult.dc.html` | The called bot replies |
| `Connectors.dc.html` | Connector catalog with the WAW group |
| `ConnectGmail.dc.html` | Connecting a built-in connector (the example is Calendar) |
| `AddMcp.dc.html` | Connect by MCP URL |
| `Routines.dc.html` | Routines |
| `NewRoutine.dc.html` | New routine |
| `Settings.dc.html` | Settings |

### Desktop (`docs/design/desktop/`)

Desktop is a sidebar, a column for the selected bot, the thread, and a right panel when needed.

| File | Screen | Covers these mobile screens |
| --- | --- | --- |
| `Main.dc.html` | Bots, threads and chat | Bots, Threads, Chat |
| `DeskQuickAsk.dc.html` | Ask any bot from anywhere | none, desktop only |
| `DeskMention.dc.html` | Calling a bot with `@` and its reply | Mention, MentionResult |
| `DeskNeeds.dc.html` | All requests by bot | NeedsYou |
| `DeskReview.dc.html` | Review draft in a right panel | ReviewDraft |
| `DeskCommander.dc.html` | Commander delegates | Delegate |
| `DeskCreateBot.dc.html` | New bot: confirm and customize | CreateBotChat, CreateBotConfirm, EditBot |
| `DeskMemory.dc.html` | Memory files and one file open | Memory, MemoryFile |
| `DeskTools.dc.html` | Tools with per-action levels, and the model | BotTools, ModelPicker, ConnectGmail |
| `DeskConnectors.dc.html` | Catalog and connect by MCP URL | Connectors, AddMcp |
| `DeskRoutines.dc.html` | Routines and a new routine | Routines, NewRoutine |
| `DeskSettings.dc.html` | Settings | Settings |
| `DeskConnect.dc.html` | Connect with deploy steps | Main, ScanQR (desktop pastes a pairing link) |
| `DeskStates.dc.html` | Server unreachable, old server, empty new thread | Offline, ConnectError, NewThread |

## 6. Layout rules for the desktop window

- Electron opens with the sidebar, the bot column and the thread.
- A right panel replaces the bot column when both would not fit, as in `DeskReview` and `DeskCreateBot`.
- Under about 1100 px wide, show the sidebar plus one more column. Under about 700 px, fall back to the mobile layout.

These breakpoints are a proposal. There is no web version, so only the window sizes Electron allows matter.

## 7. Accessibility

- White text on a bot's `main` and `ink` text on its `tint` pass contrast for all ten colours. Use `dark`, not `main`, for coloured text on white.
- Never show state by colour alone: "Waiting" is a word, levels are labelled Off, Ask, Auto, and a bot is always named next to its avatar.
- Avatars are decorative for screen readers; the bot's name is always present as text.
- Every control has a visible label or an accessible name. Minimum target 44 px.
- On desktop everything works from the keyboard, including the bot picker and "Ask any bot".

## 8. Known gaps in the mockups

Follow this file and `SPEC.md` where the mockups disagree with them.

- Some older mobile screens were drawn before bot colours existed. `CreateBotChat`, `CreateBotConfirm`, `ModelPicker`, `MemoryFile` and `Routines` do not show avatar rings. Build them with the avatar component.
- Mobile `Mention` shows bots as letter tiles. Use real avatars, as desktop `DeskMention` does.
- Mobile `BotTools` has one level per connector; desktop `DeskTools` has a level per action and the "Allowed without asking" list. The desktop model is the real one.
- Mobile Settings has two notification switches, desktop has three ("A routine finds something" is the third).
- The photo in avatars is a drawn placeholder standing in for an uploaded image.
- There are no mockups for: a reply while it streams, a failed tool step, a declined approval, the image crop step, the full emoji picker, deleting a bot, editing a memory file as text, thread search, a routine's event list, loading states, dark mode.
- Sample data (names, addresses, amounts, dates) is illustrative.
