import * as UECA from "ueca-react";
import { IconButtonModel, UIBaseModel, UIBaseParams, UIBaseStruct, useIconButton, useUIBase } from "@components";
import { MoonIcon, SunIcon } from "../../misc/icons";
import { ThemeMode } from "../../infrastructure/appTheme";

// Light/dark switch for the top bar. It holds the current mode only so it can draw the right
// icon; AppThemeManager owns the actual theme. Staying in sync through the App.Theme.Changed
// broadcast means a theme change from anywhere else still updates this button.
type ThemeToggleStruct = UIBaseStruct<{
    props: {
        mode: ThemeMode;
    };

    children: {
        button: IconButtonModel;
    };

    methods: {
        toggle: () => Promise<void>;
    };
}>;

type ThemeToggleParams = UIBaseParams<ThemeToggleStruct>;
type ThemeToggleModel = UIBaseModel<ThemeToggleStruct>;

function useThemeToggle(params?: ThemeToggleParams): ThemeToggleModel {
    const struct: ThemeToggleStruct = {
        props: {
            id: useThemeToggle.name,
            mode: "light"
        },

        children: {
            button: useIconButton({
                // Getters, not constants: the icon and the label have to follow model.mode.
                iconView: () => model.mode === "dark" ? <SunIcon /> : <MoonIcon />,
                title: () => model.mode === "dark" ? "Switch to light theme" : "Switch to dark theme",
                color: "inherit",
                onClick: () => model.toggle()
            })
        },

        messages: {
            "App.Theme.Changed": async (p) => {
                model.mode = p.mode;
            }
        },

        methods: {
            toggle: async () => {
                await model.bus.unicast("App.Theme.ToggleTheme");
            }
        },

        init: async () => {
            model.mode = await model.bus.unicast("App.Theme.GetMode");
        },

        View: () =>
            <div id={model.htmlId()} className="ueca-theme-toggle">
                <model.button.View />
            </div>
    };

    const model = useUIBase(struct, params);
    return model;
}

const ThemeToggle = UECA.getFC(useThemeToggle);

export { ThemeToggleParams, ThemeToggleModel, useThemeToggle, ThemeToggle };
