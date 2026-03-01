import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";
import { asyncSafe, Palette, resolvePaletteColor } from "@core";
import "./iconButton.css";

type IconButtonStruct = UIBaseStruct<{
    props: {
        color: Palette | "inherit";
        disabled: boolean;
        iconView: React.ReactNode;
        size: "small" | "medium" | "large";
    };

    events: {
        onClick: (source: IconButtonModel) => UECA.MaybePromise;
    };

    methods: {
        click: () => void;
    };
}>;

type IconButtonParams = UIBaseParams<IconButtonStruct>;
type IconButtonModel = UIBaseModel<IconButtonStruct>;

function useIconButton(params?: IconButtonParams): IconButtonModel {
    const struct: IconButtonStruct = {
        props: {
            id: useIconButton.name,
            color: "inherit",
            disabled: false,
            iconView: undefined,
            size: "medium",
        },

        methods: {
            click: () => {
                if (!model.disabled && model.onClick) {
                    asyncSafe(() => model.onClick(model));
                }
            }
        },

        View: () => {
            const colorClass = model.color === "inherit" ? "inherit" : resolvePaletteColor(model.color as Palette);
            return (
                <button
                    id={model.htmlId()}
                    className={`ueca-icon-button ueca-icon-button-${model.size}`}
                    disabled={model.disabled}
                    onClick={model.click}
                    style={{
                        ...(model.color !== "inherit" ? {
                            "--icon-button-color": colorClass
                        } as React.CSSProperties : {})
                    }}
                >
                    {model.iconView}
                </button>
            );
        }
    };

    const model = useUIBase(struct, params);
    return model;
}

const IconButton = UECA.getFC(useIconButton);

// CloseIconButton convenience component
type CloseIconButtonParams = Omit<IconButtonParams, "iconView">;

function useCloseIconButton(params?: CloseIconButtonParams): IconButtonModel {
    return useIconButton({
        ...params,
        iconView: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
        )
    });
}

const CloseIconButton = UECA.getFC(useCloseIconButton);

export { IconButtonModel, IconButtonParams, useIconButton, IconButton, useCloseIconButton, CloseIconButton };
