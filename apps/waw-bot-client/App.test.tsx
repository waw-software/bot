import { render, screen } from "@testing-library/react-native";
import App from "./App";

describe("App", () => {
	it("REQ-018 AC-56: renders the WAW Bot heading", async () => {
		await render(<App />);

		const heading = screen.getByRole("header", { name: "WAW Bot" });
		expect(heading).toBeOnTheScreen();
		expect(heading).toHaveTextContent("WAW Bot", { exact: true });
	});
});
