import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { appMessageBus, THEME_STORAGE_KEY } from "@core";
import { goBack, menuLink, renderApp, send, waitForScreen } from "./appHarness";

// What the operating system reports for prefers-color-scheme.
function systemPrefersDark(dark: boolean) {
    return vi.spyOn(window, "matchMedia").mockImplementation((query: string) => ({
        matches: dark && query === "(prefers-color-scheme: dark)",
        media: query,
        onchange: null,
        addEventListener: () => { },
        removeEventListener: () => { },
        addListener: () => { },
        removeListener: () => { },
        dispatchEvent: () => false
    }) as MediaQueryList);
}

// The top bar's toggle names the theme it would switch TO.
function themeToggle(offering: "light" | "dark"): Promise<HTMLElement> {
    return screen.findByRole("button", { name: `Switch to ${offering} theme` });
}

const html = document.documentElement;

describe("Theme", { timeout: 20_000 }, () => {
    it("the top-bar toggle switches <html data-theme> between ueca-light and ueca-dark and stores each choice", async () => {
        await renderApp({ url: "/home", signedIn: true });
        expect(html).toHaveAttribute("data-theme", "ueca-light");
        expect(html).toHaveAttribute("data-color-mode", "light");

        await userEvent.click(await themeToggle("dark"));

        await waitFor(() => expect(html).toHaveAttribute("data-theme", "ueca-dark"));
        expect(html).toHaveAttribute("data-color-mode", "dark");
        expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("ueca-dark");

        await userEvent.click(await themeToggle("light"));

        await waitFor(() => expect(html).toHaveAttribute("data-theme", "ueca-light"));
        expect(html).toHaveAttribute("data-color-mode", "light");
        expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("ueca-light");
        expect(await themeToggle("dark")).toBeInTheDocument();
    });

    it("a remounted app restores the theme chosen before it", async () => {
        const { unmount } = await renderApp({ url: "/home", signedIn: true });
        await userEvent.click(await themeToggle("dark"));
        await waitFor(() => expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("ueca-dark"));
        unmount();
        // A reload starts from a bare document.
        html.removeAttribute("data-theme");
        html.removeAttribute("data-color-mode");

        await renderApp({ url: "/home" });

        expect(html).toHaveAttribute("data-theme", "ueca-dark");
        expect(html).toHaveAttribute("data-color-mode", "dark");
        expect(await themeToggle("light")).toBeInTheDocument();
    });

    it.each([
        ["ueca-dark", false, "light"],
        ["ueca-light", true, "dark"]
    ] as const)("a stored %s wins over the system preference (prefers dark: %s), from the sign-in form on", async (stored, prefersDark, offering) => {
        localStorage.setItem(THEME_STORAGE_KEY, stored);
        systemPrefersDark(prefersDark);

        const { unmount } = await renderApp();
        expect(html).toHaveAttribute("data-theme", stored);
        unmount();
        html.removeAttribute("data-theme");

        await renderApp({ url: "/home", signedIn: true });
        expect(html).toHaveAttribute("data-theme", stored);
        expect(await themeToggle(offering)).toBeInTheDocument();
    });

    it.each([
        [true, "ueca-dark", "light"],
        [false, "ueca-light", "dark"]
    ] as const)("with no stored choice, prefers-color-scheme: dark = %s starts the app in %s", async (prefersDark, theme, offering) => {
        const matchMedia = systemPrefersDark(prefersDark);

        await renderApp({ url: "/home", signedIn: true });

        expect(matchMedia).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
        expect(html).toHaveAttribute("data-theme", theme);
        expect(await themeToggle(offering)).toBeInTheDocument();
        // Following the system is not a choice: nothing is stored until the user makes one.
        expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    });

    it("ignores a stored theme it does not know and follows the system instead", async () => {
        localStorage.setItem(THEME_STORAGE_KEY, "high-contrast");
        systemPrefersDark(true);

        await renderApp({ url: "/home", signedIn: true });

        expect(html).toHaveAttribute("data-theme", "ueca-dark");
    });

    // Every screen has a toggle of its own in its top bar; the theme manager is the one owner.
    it("every screen's toggle follows a theme chosen on another screen", async () => {
        await renderApp({ url: "/home", signedIn: true });
        await userEvent.click(await themeToggle("dark"));

        await userEvent.click(menuLink("Controls"));
        await waitForScreen("Controls");
        expect(await themeToggle("light")).toBeInTheDocument();
        await userEvent.click(await themeToggle("light"));
        await waitFor(() => expect(html).toHaveAttribute("data-theme", "ueca-light"));

        // Home's toggle was not mounted when the theme changed, and reads it again on return.
        await goBack();
        await waitForScreen(/^Fifty components/);
        expect(await themeToggle("dark")).toBeInTheDocument();
    });

    it("a theme set over the bus restyles the page and relabels the toggle on show", async () => {
        await renderApp({ url: "/showcase/status", signedIn: true });
        await themeToggle("dark");

        await send(() => appMessageBus.unicast("App.Theme.SetMode", "dark"));

        expect(html).toHaveAttribute("data-theme", "ueca-dark");
        expect(await themeToggle("light")).toBeInTheDocument();
        expect(await send(() => appMessageBus.unicast("App.Theme.GetTheme"))).toBe("ueca-dark");
        expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("ueca-dark");
    });
});
