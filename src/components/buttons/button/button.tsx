import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";
import { asyncSafe, Palette, resolvePaletteColor } from "@core";
import "./button.css";

type ButtonVariant = "text" | "outlined" | "contained";
type ButtonSize = "xsmall" | "small" | "medium" | "large";
type ButtonAlign = "left" | "center" | "right";

type ButtonStruct = UIBaseStruct<{
    props: {
        color: Palette | "inherit";
        disabled: boolean;
        contentView: React.ReactNode;
        endIconView: React.ReactNode;
        size: ButtonSize;
        startIconView: React.ReactNode;
        variant: ButtonVariant;
        fullWidth: boolean;
        align: ButtonAlign;
        selected: boolean;
        title: string;
        // Rich tooltip shown via the app's single tooltip (AppTooltipManager). Prefer this over
        // `title`, which is the browser's own and cannot be styled or hold JSX.
        tooltipView: React.ReactNode;
    };

    events: {
        onClick: (source: ButtonModel) => UECA.MaybePromise;
    };

    methods: {
        click: () => void;
    };
}>;

type ButtonParams = UIBaseParams<ButtonStruct>;
type ButtonModel = UIBaseModel<ButtonStruct>;

function useButton(params?: ButtonParams): ButtonModel {
    const struct: ButtonStruct = {
        props: {
            id: useButton.name,
            // default accent = the active theme's (via the button.css --btn-accent fallback);
            // "inherit" means no --button-color override is injected. Pass `color` to recolor.
            color: "inherit",
            disabled: false,
            endIconView: undefined,
            size: "medium",
            startIconView: undefined,
            contentView: undefined,
            variant: "text",
            fullWidth: false,
            align: "center",
            selected: false,
            title: undefined,
            tooltipView: undefined,
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
            const justifyContent = model.align === "left" ? "flex-start" : model.align === "right" ? "flex-end" : "center";
            // See IconButton: `title` drives the app's tooltip rather than the browser's hint.
            const tooltip = model.tooltipView ?? model.title;
            return (
                <button
                    id={model.htmlId()}
                    className={`ueca-button ueca-button-${model.variant} ueca-button-${model.size}${model.fullWidth ? " ueca-button-fullwidth" : ""}${model.selected ? " ueca-button-selected" : ""}`}
                    disabled={model.disabled}
                    onClick={model.click}
                    {...(tooltip ? model.tooltipProps(tooltip) : {})}
                    style={{
                        justifyContent,
                        ...(model.color !== "inherit" ? {
                            "--button-color": colorClass
                        } as React.CSSProperties : {})
                    }}
                >
                    {model.startIconView && <span className="button-icon button-start-icon">{model.startIconView}</span>}
                    {model.contentView}
                    {model.endIconView && <span className="button-icon button-end-icon">{model.endIconView}</span>}
                </button>
            );
        }
    };

    const model = useUIBase(struct, params);
    return model;
}

const Button = UECA.getFC(useButton);

export { ButtonModel, ButtonParams, ButtonSize, ButtonVariant, ButtonAlign, useButton, Button };
