import * as UECA from "ueca-react";
import { BaseModel, BaseParams, BaseStruct, useBase } from "@components";
import {
    THEMES, THEME_STORAGE_KEY, ThemeId, isThemeId, preferredThemeId, themeIdForMode, themeMode
} from "./appTheme";

// Owns the active theme: stamps it on <html data-theme>/<html data-color-mode>, persists the
// choice, and answers theme queries over the bus. The token values for each theme live in
// src/themes.css; this service only decides which block is active.
type AppThemeManagerStruct = BaseStruct<{
    props: {
        theme: ThemeId;
    };

    methods: {
        apply: (id: ThemeId) => Promise<void>;
        toggle: () => Promise<ThemeId>;
    };
}>;

type AppThemeManagerParams = BaseParams<AppThemeManagerStruct>;
type AppThemeManagerModel = BaseModel<AppThemeManagerStruct>;

function useAppThemeManager(params?: AppThemeManagerParams): AppThemeManagerModel {
    const struct: AppThemeManagerStruct = {
        props: {
            id: useAppThemeManager.name,
            theme: undefined
        },

        messages: {
            "App.Theme.GetTheme": async () => model.theme,
            "App.Theme.SetTheme": async (id) => await model.apply(id),
            "App.Theme.ToggleTheme": async () => await model.toggle(),
            "App.Theme.ListThemes": async () => THEMES,
            "App.Theme.GetMode": async () => themeMode(model.theme),
            "App.Theme.SetMode": async (mode) => await model.apply(themeIdForMode(mode))
        },

        methods: {
            apply: async (id) => {
                if (!isThemeId(id)) {
                    return;
                }
                model.theme = id;
                _stamp(id);
                _store(id);
                await model.bus.broadcast("", "App.Theme.Changed", { theme: id, mode: themeMode(id) });
            },

            toggle: async () => {
                const next = themeIdForMode(themeMode(model.theme) === "dark" ? "light" : "dark");
                await model.apply(next);
                return next;
            }
        },

        // Resolved in constr, not init: another model's init may ask for the mode, and an async
        // init would not have run yet. Everything this needs (localStorage, matchMedia) is
        // synchronous, so there is no reason to defer it.
        constr: () => {
            const id = _restore();
            model.theme = id;
            _stamp(id);
        }
    };

    const model = useBase(struct, params);
    return model;

    // Private methods
    function _restore(): ThemeId {
        // The no-flash script in index.html already stamped this before first paint; reading it
        // back keeps the two in agreement instead of guessing a second time.
        const stored = _read();
        return isThemeId(stored) ? stored : preferredThemeId();
    }

    function _stamp(id: ThemeId) {
        const html = document.documentElement;
        html.setAttribute("data-theme", id);
        html.setAttribute("data-color-mode", themeMode(id));
    }

    function _read(): string {
        // Private browsing and blocked site data both throw here rather than returning null.
        try {
            return window.localStorage.getItem(THEME_STORAGE_KEY);
        } catch {
            return undefined;
        }
    }

    function _store(id: ThemeId) {
        try {
            window.localStorage.setItem(THEME_STORAGE_KEY, id);
        } catch {
            // Preference simply will not survive the reload.
        }
    }
}

const AppThemeManager = UECA.getFC(useAppThemeManager);

export { AppThemeManagerParams, AppThemeManagerModel, useAppThemeManager, AppThemeManager };
