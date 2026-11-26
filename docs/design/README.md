# Design sources

These folders hold the screen mockups for WAW Bot.

- `mobile/`: 28 phone screens, drawn at 390 x 844, with their `canvas.json`.
- `desktop/`: 14 desktop screens, drawn at 1440 x 900, with their `canvas.json`. They stretch to fill the window.
- `screens/`: PNG exports of the same screens; see below.

`../DESIGN.md` lists every screen, what it shows, and which desktop screen covers which mobile screens.

## How to read a `.dc.html` file

Each file is one screen. It is plain HTML with inline styles, plus a small template layer:

- Everything inside `<x-dc>` is the screen's markup. Read it for structure, spacing, colours, sizes and copy.
- `<helmet>` holds the fonts and a few global styles.
- `{{name}}` is a placeholder filled from the script at the bottom of the file.
- `<sc-for list="{{items}}" as="item">` repeats its content for each entry of a list.
- `<sc-if value="{{flag}}">` shows its content when the flag is true.
- The `<script type="text/x-dc">` block at the bottom returns the sample data for the placeholders. Most desktop screens and the newer mobile ones are fully written out and return nothing.
- `onClick="{{handler}}"` marks an interactive mockup. `mobile/EditBot.dc.html` is one: its script holds the full lists of icons, emoji and colours.
- Links between screens (`href="Chat.dc.html"`) show the navigation.
- `canvas.json` records each screen's title, size and position on the canvas. Its `notes` are the group titles.

The files reference `./support.js`, the runtime of the design tool. It is not included, so the files do not render when opened in a browser. Read them as source. For the rendered look, use the PNGs.

## Using them

- Use the mockups for layout, spacing, colour, wording and states.
- Do not copy the markup. Build real components from the tokens in `../DESIGN.md`.
- A bot's colour appears in the sources as plain hex values. Map them back to the palette in `../DESIGN.md` section 2: for example `#1F7A4D`, `#EEF6F1` and `#1B6943` are Green `main`, `tint` and `dark`.
- The avatar photo is an inline drawing that stands in for an uploaded image.
- The sample data is illustrative.
- What the mockups do not cover is listed in `../DESIGN.md` section 8.

## PNG exports

The PNG exports of the screens are in `screens/mobile/` and `screens/desktop/`. Each is named by the screen's title on its canvas (the `title` in `canvas.json`), without the colons, not by the source file name: for example, `Chat.dc.html` is `screens/mobile/3 · Chat green bot, photo avatar.png`.
