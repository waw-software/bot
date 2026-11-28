type Base = { id: string; mockup: string | null }; // mockup: repo-relative PNG under docs/design/screens/

export type ElectronScreen = Base & {
	surface: "electron";
	size: { width: number; height: number };
	readyHeading: string;
};
export type IosScreen = Base & {
	surface: "ios";
	launchPath: string; // "" = the app's start screen
};
export type Screen = ElectronScreen | IosScreen;

// A later milestone adds entries here: id `<screen>.<surface>-<width>`, with `mockup` the path
// of its PNG under `docs/design/screens/` (the canvas titles of `docs/design/README.md`).
export const screens: readonly Screen[] = [
	{
		id: "shell.electron-1440",
		surface: "electron",
		size: { width: 1440, height: 900 },
		readyHeading: "WAW Bot",
		mockup: null,
	},
	{ id: "shell.ios-390", surface: "ios", launchPath: "", mockup: null },
];
