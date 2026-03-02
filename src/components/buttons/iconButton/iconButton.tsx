import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";
import { asyncSafe, Palette, resolvePaletteColor } from "@core";
import "./iconButton.css";

type IconKind = "ok" | "cancel" | "delete" | "refresh" | "close";

type IconButtonStruct = UIBaseStruct<{
    props: {
        kind: IconKind;
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
        _getIconForKind: () => React.ReactNode;
    };
}>;

type IconButtonParams = UIBaseParams<IconButtonStruct>;
type IconButtonModel = UIBaseModel<IconButtonStruct>;

function useIconButton(params?: IconButtonParams): IconButtonModel {
    const struct: IconButtonStruct = {
        props: {
            id: useIconButton.name,
            kind: undefined,
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
            },

            _getIconForKind: () => {
                if (model.iconView) {
                    return model.iconView;
                }

                switch (model.kind) {
                    case "ok":
                        return (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                        );
                    case "cancel":
                        return (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
                            </svg>
                        );
                    case "delete":
                        return (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                            </svg>
                        );
                    case "refresh":
                        return (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                            </svg>
                        );
                    case "close":
                        return (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        );
                    default:
                        return null;
                }
            }
        },

        View: () => {
            const colorClass = model.color === "inherit" ? "inherit" : resolvePaletteColor(model.color as Palette);
            const icon = model._getIconForKind();

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
                    {icon}
                </button>
            );
        }
    };

    const model = useUIBase(struct, params);
    return model;
}

const IconButton = UECA.getFC(useIconButton);

// CloseIconButton convenience component
type CloseIconButtonParams = Omit<IconButtonParams, "iconView" | "kind">;

function useCloseIconButton(params?: CloseIconButtonParams): IconButtonModel {
    return useIconButton({
        ...params,
        kind: "close"
    });
}

const CloseIconButton = UECA.getFC(useCloseIconButton);

export { IconKind, IconButtonModel, IconButtonParams, useIconButton, IconButton, useCloseIconButton, CloseIconButton };
