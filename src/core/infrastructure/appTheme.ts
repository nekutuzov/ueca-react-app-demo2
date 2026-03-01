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
    (string & {});

// Color palette mapping - customize these colors as needed
const paletteColors: Record<string, string> = {
    // Primary colors
    "primary.main": "#1976d2",
    "primary.light": "#42a5f5",
    "primary.dark": "#1565c0",
    
    // Secondary colors
    "secondary.main": "#9c27b0",
    "secondary.light": "#ba68c8",
    "secondary.dark": "#7b1fa2",
    
    // Error colors
    "error.main": "#d32f2f",
    "error.light": "#ef5350",
    "error.dark": "#c62828",
    
    // Warning colors
    "warning.main": "#ed6c02",
    "warning.light": "#ff9800",
    "warning.dark": "#e65100",
    
    // Info colors
    "info.main": "#0288d1",
    "info.light": "#03a9f4",
    "info.dark": "#01579b",
    
    // Success colors
    "success.main": "#2e7d32",
    "success.light": "#4caf50",
    "success.dark": "#1b5e20",
    
    // Text colors
    "text.primary": "rgba(0, 0, 0, 0.87)",
    "text.secondary": "rgba(0, 0, 0, 0.6)",
    "text.disabled": "rgba(0, 0, 0, 0.38)",
    
    // Background colors
    "background.paper": "#ffffff",
    "background.default": "#fafafa",
    
    // Action colors
    "action.active": "rgba(0, 0, 0, 0.54)",
    "action.hover": "rgba(0, 0, 0, 0.04)",
    "action.selected": "rgba(0, 0, 0, 0.08)",
    "action.disabled": "rgba(0, 0, 0, 0.26)",
    "action.disabledBackground": "rgba(0, 0, 0, 0.12)",
    "action.focus": "rgba(0, 0, 0, 0.12)",
} as const;

// Helper function to resolve palette color to CSS color
function resolvePaletteColor(color?: Palette): string | undefined {
    if (!color) return undefined;
    // Check if it's a palette token, otherwise return as-is (supports direct CSS colors)
    return paletteColors[color] ?? color;
}

export { Palette, paletteColors, resolvePaletteColor };
