import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";
import { CheckIcon, CancelIcon, DeleteIcon, RefreshIcon, CloseIcon } from "@core";
import { asyncSafe, Palette, resolvePaletteColor } from "@core";
import "./iconButton.css";

type IconKind = "ok" | "cancel" | "delete" | "refresh" | "close";
type IconSize = "small" | "medium" | "large";

type IconButtonStruct = UIBaseStruct<{
    props: {
        kind: IconKind;
        color: Palette | "inherit";
        disabled: boolean;
        iconView: React.ReactNode;
        size: IconSize;
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
                        return <CheckIcon />;
                    case "cancel":
                        return <CancelIcon />;
                    case "delete":
                        return <DeleteIcon />;
                    case "refresh":
                        return <RefreshIcon />;
                    case "close":
                        return <CloseIcon />;
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

export { IconKind, IconSize, IconButtonModel, IconButtonParams, useIconButton, IconButton, useCloseIconButton, CloseIconButton };
