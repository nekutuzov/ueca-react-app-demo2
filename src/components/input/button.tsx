import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";
import { asyncSafe, Palette, resolvePaletteColor } from "@core";
import "./button.css";

type ButtonStruct = UIBaseStruct<{
    props: {
        color: Palette | "inherit";
        disabled: boolean;
        contentView: React.ReactNode;
        endIconView: React.ReactNode;
        size: "small" | "medium" | "large";
        startIconView: React.ReactNode;
        variant: "text" | "outlined" | "contained";
        fullWidth: boolean;
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
            color: "primary.main",
            disabled: false,
            endIconView: undefined,
            size: "medium",
            startIconView: undefined,
            contentView: undefined,
            variant: "text",
            fullWidth: false,
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
                    className={`ueca-button ueca-button-${model.variant} ueca-button-${model.size}${model.fullWidth ? " ueca-button-fullwidth" : ""}`}
                    disabled={model.disabled}
                    onClick={model.click}
                    style={{
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

export { ButtonModel, ButtonParams, useButton, Button };
