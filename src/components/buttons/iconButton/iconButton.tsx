import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";
import { CheckIcon, CancelIcon, DeleteIcon, RefreshIcon, CloseIcon } from "@core";
import { asyncSafe, Palette, resolvePaletteColor } from "@core";
import "./iconButton.css";

type IconKind = "ok" | "cancel" | "delete" | "refresh" | "close";
type IconSize = "xsmall" | "small" | "medium" | "large";

type IconButtonStruct = UIBaseStruct<{
    props: {
        kind: IconKind;
        color: Palette | "inherit";
        disabled: boolean;
        iconView: React.ReactNode;
        size: IconSize;
        title: string;
        // Rich tooltip shown via the app's single tooltip (AppTooltipManager). Prefer this over
        // `title`, which is the browser's own and cannot be styled or hold JSX.
        tooltipView: React.ReactNode;
        // Set false for a control whose meaning is already unmistakable — a dialog's ×. `title`
        // still supplies the aria-label, so the button keeps its accessible name without putting a
        // bubble over a glyph nobody needs explained.
        tooltipEnabled: boolean;
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
            title: undefined,
            tooltipView: undefined,
            tooltipEnabled: true,
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

            // `title` becomes the app's tooltip, not the browser's own hint popup — the native one
            // cannot be styled, cannot hold JSX, ignores keyboard focus, and appears alongside the
            // real tooltip whenever both are set. It stays the accessible name via aria-label,
            // which an icon-only button has no other source for.
            const tooltip = model.tooltipEnabled ? (model.tooltipView ?? model.title) : undefined;

            return (
                <button
                    id={model.htmlId()}
                    className={`ueca-icon-button ueca-icon-button-${model.size}`}
                    disabled={model.disabled}
                    onClick={model.click}
                    {...(tooltip ? model.tooltipProps(tooltip) : {})}
                    aria-label={model.title}
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
        // Named but NOT tooltipped. The name is load-bearing: on some dialogs the × is the ONLY way
        // out — an information or warning box carries no footer button at all (see
        // appDialogManager's per-kind table) — so a screen reader must be able to announce it. A
        // tooltip on it is just clutter over the most universally understood glyph in the app.
        title: "Close",
        tooltipEnabled: false,
        ...params,
        kind: "close"
    });
}

const CloseIconButton = UECA.getFC(useCloseIconButton);

export { IconKind, IconSize, IconButtonModel, IconButtonParams, useIconButton, IconButton, useCloseIconButton, CloseIconButton };
