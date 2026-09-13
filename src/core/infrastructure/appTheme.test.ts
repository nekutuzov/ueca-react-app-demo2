import { describe, expect, it, vi } from "vitest";
import indexHtml from "../../../index.html?raw";
import {
    isThemeId, paletteColors, preferredThemeId, resolvePaletteColor, THEME_STORAGE_KEY, ThemeId, themeIdForMode,
    themeMode, THEMES
} from "@core";

// themes.css is read from disk because Vitest empties every CSS import, `?raw` included. The test
// tsconfig carries no Node typings, so the one Node API used is typed here.
declare const process: { getBuiltinModule(id: "node:fs"): { readFileSync(path: string, encoding: "utf8"): string } };

function themesCss(): string {
    const dir = (import.meta as ImportMeta & { dirname: string }).dirname;
    return process.getBuiltinModule("node:fs").readFileSync(`${dir}/../../themes.css`, "utf8");
}

function preferDark(dark: boolean) {
    return vi.spyOn(window, "matchMedia").mockImplementation(
        (query) => ({ matches: dark && query === "(prefers-color-scheme: dark)", media: query }) as MediaQueryList
    );
}

describe("resolvePaletteColor", () => {
    it.each([
        ["primary.main", "var(--accent)"],
        ["text.secondary", "var(--ink-dim)"],
        ["border.color", "var(--border)"],
        ["marker.color", "var(--marker)"]
    ] as const)("maps the %s token to its theme variable", (token, css) => {
        expect(resolvePaletteColor(token)).toBe(css);
    });

    it.each(["#ff0000", "rgb(0 128 0)", "var(--custom)", "transparent", "primary"])("passes %s through as a CSS colour", (color) => {
        expect(resolvePaletteColor(color)).toBe(color);
    });

    it.each([undefined, ""])("resolves %j to undefined, so no inline colour is written", (color) => {
        expect(resolvePaletteColor(color)).toBeUndefined();
    });

    // Every value is a var(...) reference, so whatever resolves a token follows a theme switch with
    // no re-render. A literal colour here would freeze that one token in one theme.
    it("resolves every token through a theme variable", () => {
        for (const [token, css] of Object.entries(paletteColors)) {
            expect(css, token).toMatch(/var\(--[\w-]+\)/);
        }
    });

    it("references only variables that themes.css defines", () => {
        const css = themesCss();
        const defined = new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));

        for (const [token, value] of Object.entries(paletteColors)) {
            for (const [, variable] of value.matchAll(/var\((--[\w-]+)\)/g)) {
                expect(defined.has(variable), `${token} → ${variable}`).toBe(true);
            }
        }
    });
});

describe("theme registry", () => {
    it.each([
        ["ueca-light", true],
        ["ueca-dark", true],
        ["light", false],
        ["UECA-DARK", false],
        ["", false]
    ])("isThemeId(%j) is %s", (value, expected) => {
        expect(isThemeId(value)).toBe(expected);
    });

    it("picks the theme for a colour mode", () => {
        expect(themeIdForMode("dark")).toBe("ueca-dark");
        expect(themeIdForMode("light")).toBe("ueca-light");
    });

    it("reads each registered theme's mode, and treats an unknown id as light", () => {
        for (const theme of THEMES) {
            expect(themeMode(theme.id), theme.id).toBe(theme.mode);
        }
        expect(themeMode("ueca-sepia" as ThemeId)).toBe("light");
    });

    it("gives every registered theme its own colour block in themes.css", () => {
        const css = themesCss();

        for (const theme of THEMES) {
            expect(css, theme.id).toContain(`:root[data-theme="${theme.id}"]`);
        }
    });
});

describe("preferredThemeId", () => {
    // First visit follows the OS preference.
    it("follows an OS preference for dark", () => {
        const matchMedia = preferDark(true);

        expect(preferredThemeId()).toBe("ueca-dark");
        expect(matchMedia).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
    });

    it("chooses light when the OS does not prefer dark", () => {
        preferDark(false);

        expect(preferredThemeId()).toBe("ueca-light");
    });

    it("chooses light where matchMedia is unavailable", () => {
        vi.stubGlobal("matchMedia", undefined);

        expect(preferredThemeId()).toBe("ueca-light");
    });
});

// index.html stamps <html> before first paint with a copy of this module's rules, and its comment
// asks for the two to be kept in sync. Running the real script against the real functions is what
// catches drift in the storage key, the ids, the default or the mode mapping.
describe("the no-flash restore script in index.html", () => {
    function runRestoreScript() {
        const script = /<script>([\s\S]*?)<\/script>/.exec(indexHtml)[1];
        new Function(script)();
        const html = document.documentElement;
        return { theme: html.getAttribute("data-theme"), mode: html.getAttribute("data-color-mode") };
    }

    it.each(THEMES.map((t) => t.id))("restores the stored %s theme with its mode", (id) => {
        localStorage.setItem(THEME_STORAGE_KEY, id);

        expect(runRestoreScript()).toEqual({ theme: id, mode: themeMode(id) });
    });

    it.each([false, true])("falls back to preferredThemeId() when nothing is stored (OS dark: %s)", (dark) => {
        preferDark(dark);
        const expected = preferredThemeId();

        expect(runRestoreScript()).toEqual({ theme: expected, mode: themeMode(expected) });
    });

    it("ignores a stored value that is not a registered theme", () => {
        localStorage.setItem(THEME_STORAGE_KEY, "ueca-sepia");
        preferDark(true);

        expect(runRestoreScript()).toEqual({ theme: preferredThemeId(), mode: "dark" });
    });
});
