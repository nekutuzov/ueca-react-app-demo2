// Application color palette - centralized color system for all components

type Palette =
    "primary.main" | "primary.light" | "primary.dark" |
    "secondary.main" | "secondary.light" | "secondary.dark" |
    "error.main" | "error.light" | "error.dark" |
    "warning.main" | "warning.light" | "warning.dark" |
    "info.main" | "info.light" | "info.dark" |
    "success.main" | "success.light" | "success.dark" |
    "text.primary" | "text.secondary" | "text.disabled" |
    "background.paper" | "background.default" |
    "action.active" | "action.hover" | "action.selected" | "action.disabled" | "action.disabledBackground" | "action.focus" |
    "menu.hover" | "menu.disabled" | "menu.active" |
    "border.color" | "marker.color" |
    (string & {});

// Maps the app's palette tokens onto the active theme's CSS variables (defined per theme in
// src/themes.css, switched via <html data-theme>). Every value is a var(...) reference, so
// anything that resolves a palette token - layout backgrounds, menu tints, borders, the spinner -
// follows a theme switch with no re-render and no change at the call site.
// Change actual colours in src/themes.css, not here.
const paletteColors: Record<string, string> = {
    // Primary = the theme accent (logo blue). Actions and links.
    "primary.main": "var(--accent)",
    "primary.light": "var(--accent-strong)",
    "primary.dark": "var(--accent-dim)",

    // Secondary (logo green)
    "secondary.main": "var(--secondary)",
    "secondary.light": "color-mix(in srgb, var(--secondary) 70%, white)",
    "secondary.dark": "color-mix(in srgb, var(--secondary) 70%, black)",

    // Error (logo coral)
    "error.main": "var(--error)",
    "error.light": "color-mix(in srgb, var(--error) 70%, white)",
    "error.dark": "color-mix(in srgb, var(--error) 70%, black)",

    // Warning (logo amber)
    "warning.main": "var(--warning)",
    "warning.light": "color-mix(in srgb, var(--warning) 70%, white)",
    "warning.dark": "color-mix(in srgb, var(--warning) 70%, black)",

    // Info
    "info.main": "var(--info)",
    "info.light": "color-mix(in srgb, var(--info) 70%, white)",
    "info.dark": "color-mix(in srgb, var(--info) 70%, black)",

    // Success (logo green)
    "success.main": "var(--success)",
    "success.light": "color-mix(in srgb, var(--success) 70%, white)",
    "success.dark": "color-mix(in srgb, var(--success) 70%, black)",

    // Text
    "text.primary": "var(--ink)",
    "text.secondary": "var(--ink-dim)",
    "text.disabled": "var(--ink-disabled)",

    // Backgrounds
    "background.paper": "var(--surface)",
    "background.default": "var(--bg)",

    // Action tints
    "action.active": "var(--accent)",
    "action.hover": "var(--hover)",
    "action.selected": "var(--selected)",
    "action.disabled": "var(--disabled-ink)",
    "action.disabledBackground": "var(--disabled-line)",
    "action.focus": "var(--focus)",

    "menu.hover": "var(--hover)",
    "menu.disabled": "var(--disabled-ink)",
    "menu.active": "var(--selected)",

    "border.color": "var(--border)",

    // Structural accent (logo amber). Spine markers, chapter numbers, section rules -
    // never anything interactive, which is what keeps it distinct from primary.
    "marker.color": "var(--marker)",
} as const;

// Helper function to resolve palette color to CSS color
function resolvePaletteColor(color?: Palette): string | undefined {
    if (!color) return undefined;
    // Check if it's a palette token, otherwise return as-is (supports direct CSS colors)
    return paletteColors[color] ?? color;
}

// Runtime theme registry. Each id has a matching :root[data-theme="<id>"] block in
// src/themes.css. `mode` drives <html data-color-mode>, which the markdown preview and
// native form controls read.
type ThemeId = "ueca-light" | "ueca-dark";

type ThemeMode = "light" | "dark";

type ThemeDescriptor = { id: ThemeId; label: string; mode: ThemeMode };

const THEMES: ThemeDescriptor[] = [
    { id: "ueca-light", label: "Light", mode: "light" },
    { id: "ueca-dark", label: "Dark", mode: "dark" },
];

// Storage key - shared with the no-flash restore script in index.html.
const THEME_STORAGE_KEY = "ueca-demo2-theme";

function isThemeId(value: string): value is ThemeId {
    return THEMES.some((t) => t.id === value);
}

function themeIdForMode(mode: ThemeMode): ThemeId {
    return mode === "dark" ? "ueca-dark" : "ueca-light";
}

function themeMode(id: ThemeId): ThemeMode {
    return THEMES.find((t) => t.id === id)?.mode ?? "light";
}

// First visit follows the OS preference; after that the stored choice wins.
function preferredThemeId(): ThemeId {
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    return themeIdForMode(prefersDark ? "dark" : "light");
}

export {
    Palette, paletteColors, resolvePaletteColor,
    ThemeId, ThemeMode, ThemeDescriptor, THEMES, THEME_STORAGE_KEY,
    isThemeId, themeIdForMode, themeMode, preferredThemeId,
};
