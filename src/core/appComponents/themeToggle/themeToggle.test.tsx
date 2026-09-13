import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppThemeManager, appMessageBus, MoonIcon, SunIcon, THEME_STORAGE_KEY, ThemeMode, ThemeToggle } from "@core";
import { mount, settle, stubMessages } from "@test";

function markupOf(element: React.ReactElement): string {
    const { container, unmount } = render(element);
    const html = container.innerHTML;
    unmount();
    return html;
}

async function announceTheme(mode: ThemeMode) {
    await act(async () => {
        await appMessageBus.broadcast("", "App.Theme.Changed", { theme: mode === "dark" ? "ueca-dark" : "ueca-light", mode });
    });
    await settle();
}

describe("ThemeToggle", () => {
    it("asks for the current mode on start and, in dark mode, offers the light theme with a sun", async () => {
        const bus = await stubMessages({ "App.Theme.GetMode": vi.fn(async (): Promise<ThemeMode> => "dark") });
        const { model } = await mount(ThemeToggle, { id: "toggle" });

        expect(bus["App.Theme.GetMode"]).toHaveBeenCalledOnce();
        expect(model.mode).toBe("dark");
        const button = screen.getByRole("button", { name: "Switch to light theme" });
        expect(button).toHaveAttribute("id", "toggle.button");
        expect(button.innerHTML).toBe(markupOf(<SunIcon />));
        expect(document.getElementById("toggle")).toHaveClass("ueca-theme-toggle");
    });

    it("in light mode offers the dark theme with a moon", async () => {
        await stubMessages({ "App.Theme.GetMode": vi.fn(async (): Promise<ThemeMode> => "light") });
        await mount(ThemeToggle, { id: "toggle" });

        const button = screen.getByRole("button", { name: "Switch to dark theme" });
        expect(button.innerHTML).toBe(markupOf(<MoonIcon />));
    });

    // The tooltip's text is read at hover time, so after a switch an open tooltip would still offer
    // the theme that was just applied.
    it("switches the theme on click, then closes the tooltip that still offers the old theme", async () => {
        const calls: string[] = [];
        const bus = await stubMessages({
            "App.Theme.GetMode": vi.fn(async (): Promise<ThemeMode> => "light"),
            "App.Theme.ToggleTheme": vi.fn(async () => {
                calls.push("toggle");
                await appMessageBus.broadcast("", "App.Theme.Changed", { theme: "ueca-dark", mode: "dark" });
                return "ueca-dark" as const;
            }),
            "App.Tooltip.Show": vi.fn(async () => { }),
            "App.Tooltip.Hide": vi.fn(async () => { calls.push("hide"); })
        });
        await mount(ThemeToggle, { id: "toggle" });

        fireEvent.mouseEnter(screen.getByRole("button"));
        await settle();
        expect(bus["App.Tooltip.Show"]).toHaveBeenLastCalledWith(expect.objectContaining({
            token: "toggle.button",
            contentView: "Switch to dark theme"
        }));

        fireEvent.click(screen.getByRole("button"));
        await settle();
        expect(bus["App.Theme.ToggleTheme"]).toHaveBeenCalledOnce();
        expect(bus["App.Tooltip.Hide"]).toHaveBeenCalledWith({ token: "toggle.button" });
        expect(calls).toEqual(["toggle", "hide"]);
        expect(screen.getByRole("button", { name: "Switch to light theme" }).innerHTML).toBe(markupOf(<SunIcon />));

        fireEvent.mouseEnter(screen.getByRole("button"));
        await settle();
        expect(bus["App.Tooltip.Show"]).toHaveBeenLastCalledWith(expect.objectContaining({ contentView: "Switch to light theme" }));
    });

    it("stays in step with theme changes announced from elsewhere", async () => {
        await stubMessages({ "App.Theme.GetMode": vi.fn(async (): Promise<ThemeMode> => "light") });
        const { model } = await mount(ThemeToggle, { id: "toggle" });

        await announceTheme("dark");
        expect(model.mode).toBe("dark");
        expect(screen.getByRole("button", { name: "Switch to light theme" })).toBeInTheDocument();

        await announceTheme("light");
        expect(screen.getByRole("button", { name: "Switch to dark theme" }).innerHTML).toBe(markupOf(<MoonIcon />));
    });

    describe("with the real AppThemeManager", () => {
        it("starts from the stored theme and switches the page between themes", async () => {
            localStorage.setItem(THEME_STORAGE_KEY, "ueca-dark");
            await mount(AppThemeManager, { id: "themeManager" });
            await mount(ThemeToggle, { id: "toggle" });
            expect(screen.getByRole("button", { name: "Switch to light theme" })).toBeInTheDocument();

            await userEvent.click(screen.getByRole("button"));
            await settle();
            expect(document.documentElement).toHaveAttribute("data-theme", "ueca-light");
            expect(document.documentElement).toHaveAttribute("data-color-mode", "light");
            expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("ueca-light");
            expect(screen.getByRole("button", { name: "Switch to dark theme" })).toBeInTheDocument();

            await userEvent.click(screen.getByRole("button"));
            await settle();
            expect(document.documentElement).toHaveAttribute("data-theme", "ueca-dark");
            expect(screen.getByRole("button", { name: "Switch to light theme" })).toBeInTheDocument();
        });

        it("follows a mode set on the manager by another component", async () => {
            await mount(AppThemeManager, { id: "themeManager" });
            await mount(ThemeToggle, { id: "toggle" });
            expect(screen.getByRole("button", { name: "Switch to dark theme" })).toBeInTheDocument();

            await act(async () => { await appMessageBus.unicast("App.Theme.SetMode", "dark"); });
            await settle();

            expect(screen.getByRole("button", { name: "Switch to light theme" })).toBeInTheDocument();
        });
    });
});
