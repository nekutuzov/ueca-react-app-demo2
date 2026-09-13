import { describe, expect, it, vi } from "vitest";
import { AppThemeManager, appMessageBus, THEME_STORAGE_KEY, THEMES } from "@core";
import { mount, settle, stubMessages } from "@test";

const html = document.documentElement;

function preferDark(prefersDark: boolean) {
    vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
        matches: prefersDark && query === "(prefers-color-scheme: dark)",
        media: query
    }) as MediaQueryList);
}

describe("AppThemeManager", () => {
    describe("startup", () => {
        // Resolved in constr, not init: another model's init may ask for the mode before an async
        // init would have run.
        it("restores the stored theme and stamps <html> already in constr", async () => {
            localStorage.setItem(THEME_STORAGE_KEY, "ueca-dark");
            let atConstr: { theme: string; stamp: string; mode: string };

            const { model } = await mount(AppThemeManager, {
                id: "theme",
                constr: (m) => {
                    atConstr = { theme: m.theme, stamp: html.getAttribute("data-theme"), mode: html.getAttribute("data-color-mode") };
                }
            });

            expect(atConstr).toEqual({ theme: "ueca-dark", stamp: "ueca-dark", mode: "dark" });
            expect(model.theme).toBe("ueca-dark");
        });

        it.each([
            [true, "ueca-dark", "dark"],
            [false, "ueca-light", "light"]
        ] as const)("follows the OS preference (dark: %s) when nothing is stored", async (prefersDark, theme, mode) => {
            preferDark(prefersDark);

            const { model } = await mount(AppThemeManager, { id: "theme" });

            expect(model.theme).toBe(theme);
            expect(html).toHaveAttribute("data-theme", theme);
            expect(html).toHaveAttribute("data-color-mode", mode);
        });

        it("ignores a stored value that is not a known theme", async () => {
            localStorage.setItem(THEME_STORAGE_KEY, "ueca-sepia");
            preferDark(true);

            const { model } = await mount(AppThemeManager, { id: "theme" });

            expect(model.theme).toBe("ueca-dark");
        });

        // Private browsing and blocked site data throw on access rather than returning null.
        it("falls back to the OS preference when storage cannot be read", async () => {
            vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new DOMException("denied", "SecurityError"); });
            preferDark(true);

            const { model } = await mount(AppThemeManager, { id: "theme" });

            expect(model.theme).toBe("ueca-dark");
        });

        it("does not persist or announce the theme it restored", async () => {
            preferDark(true);
            const bus = await stubMessages({ "App.Theme.Changed": vi.fn(async () => { }) });

            await mount(AppThemeManager, { id: "theme" });

            expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
            expect(bus["App.Theme.Changed"]).not.toHaveBeenCalled();
        });
    });

    describe("apply", () => {
        it("stamps <html>, persists the choice and broadcasts App.Theme.Changed", async () => {
            preferDark(false);
            const bus = await stubMessages({ "App.Theme.Changed": vi.fn(async () => { }) });
            const { model } = await mount(AppThemeManager, { id: "theme" });

            await model.apply("ueca-dark");

            expect(model.theme).toBe("ueca-dark");
            expect(html).toHaveAttribute("data-theme", "ueca-dark");
            expect(html).toHaveAttribute("data-color-mode", "dark");
            expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("ueca-dark");
            expect(bus["App.Theme.Changed"]).toHaveBeenCalledExactlyOnceWith({ theme: "ueca-dark", mode: "dark" });
        });

        it("ignores an unknown theme id entirely", async () => {
            preferDark(false);
            const bus = await stubMessages({ "App.Theme.Changed": vi.fn(async () => { }) });
            const { model } = await mount(AppThemeManager, { id: "theme" });

            await model.apply("ueca-sepia" as never);

            expect(model.theme).toBe("ueca-light");
            expect(html).toHaveAttribute("data-theme", "ueca-light");
            expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
            expect(bus["App.Theme.Changed"]).not.toHaveBeenCalled();
        });

        it("still switches the theme when storage refuses the write", async () => {
            preferDark(false);
            vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("full", "QuotaExceededError"); });
            const bus = await stubMessages({ "App.Theme.Changed": vi.fn(async () => { }) });
            const { model } = await mount(AppThemeManager, { id: "theme" });

            await model.apply("ueca-dark");

            expect(model.theme).toBe("ueca-dark");
            expect(html).toHaveAttribute("data-theme", "ueca-dark");
            expect(bus["App.Theme.Changed"]).toHaveBeenCalledOnce();
        });

        it("toggle flips the mode each time and returns the theme it switched to", async () => {
            preferDark(false);
            const { model } = await mount(AppThemeManager, { id: "theme" });

            expect(await model.toggle()).toBe("ueca-dark");
            expect(model.theme).toBe("ueca-dark");
            expect(await model.toggle()).toBe("ueca-light");
            expect(html).toHaveAttribute("data-color-mode", "light");
        });
    });

    describe("messages", () => {
        it("answers the theme queries", async () => {
            localStorage.setItem(THEME_STORAGE_KEY, "ueca-dark");
            await mount(AppThemeManager, { id: "theme" });

            expect(await appMessageBus.unicast("App.Theme.GetTheme")).toBe("ueca-dark");
            expect(await appMessageBus.unicast("App.Theme.GetMode")).toBe("dark");
            expect(await appMessageBus.unicast("App.Theme.ListThemes")).toEqual(THEMES);
        });

        it("SetTheme, SetMode and ToggleTheme change the active theme", async () => {
            preferDark(false);
            const { model } = await mount(AppThemeManager, { id: "theme" });

            await appMessageBus.unicast("App.Theme.SetTheme", "ueca-dark");
            expect(model.theme).toBe("ueca-dark");

            await appMessageBus.unicast("App.Theme.SetMode", "light");
            expect(model.theme).toBe("ueca-light");

            expect(await appMessageBus.unicast("App.Theme.ToggleTheme")).toBe("ueca-dark");
            await settle();
            expect(html).toHaveAttribute("data-theme", "ueca-dark");
        });
    });
});
