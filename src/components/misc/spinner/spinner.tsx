import * as UECA from "ueca-react";
import { Block, UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";
import { Palette, resolvePaletteColor } from "@core";
import "./spinner.css";

type SpinnerStruct = UIBaseStruct<{
    props: {
        visible: boolean;
        size: number | string;
        thickness: number;
        value: number;
        variant: "determinate" | "indeterminate";
        color: Palette;
        delayTime: number;  // milliseconds        
        _visible: boolean;
        __delayTimer: number;
    }
}>;

type SpinnerParams = UIBaseParams<SpinnerStruct>;
type SpinnerModel = UIBaseModel<SpinnerStruct>;

function useSpinner(params?: SpinnerParams): SpinnerModel {
    const struct: SpinnerStruct = {
        props: {
            id: useSpinner.name,
            visible: false,
            size: 40,
            thickness: 3.6,
            value: 0,
            variant: "indeterminate",
            color: "primary.main",
            delayTime: undefined,
            _visible: false
        },

        events: {
            onChangeVisible: () => _updateState()
        },

        View: () => {
            if (!model._visible) {
                return null;
            }

            const sizeValue = typeof model.size === "number" ? `${model.size}px` : model.size;
            const strokeWidth = model.thickness;
            const radius = 20 - strokeWidth / 2;
            const circumference = 2 * Math.PI * radius;
            
            // For determinate variant, calculate stroke-dashoffset based on value
            const strokeDashoffset = model.variant === "determinate" 
                ? circumference - (model.value / 100) * circumference 
                : 0;

            return (
                <Block
                    id={model.htmlId()}
                    className="ueca-spinner"
                    sx={{
                        position: "absolute",
                        // Above the toast layer by default: the busy overlay must cover everything,
                        // including a dialog that triggered the work.
                        zIndex: model.zIndex || "calc(var(--z-toast) + 10)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        top: 0,
                        right: 0,
                        width: "100%",
                        height: "100%",
                        // The shared modal scrim rather than a hardcoded black — it was the last
                        // literal colour in a codebase whose rule is that colour comes from tokens.
                        backgroundColor: "var(--scrim)",
                    }}
                >
                    <svg
                        width={sizeValue}
                        height={sizeValue}
                        viewBox="0 0 44 44"
                        className={`ueca-spinner-svg ${model.variant}`}
                    >
                        <circle
                            cx="22"
                            cy="22"
                            r={radius}
                            fill="none"
                            stroke={resolvePaletteColor(model.color)}
                            strokeWidth={strokeWidth}
                            strokeDasharray={model.variant === "indeterminate" ? circumference : undefined}
                            strokeDashoffset={model.variant === "indeterminate" ? undefined : strokeDashoffset}
                            strokeLinecap="round"
                            className={`ueca-spinner-track ${model.variant}`}
                        />
                    </svg>
                </Block>
            );
        }
    };

    const model = useUIBase(struct, params);
    return model;

    // private methods
    function _updateState() {
        if (model.__delayTimer || model._visible === model.visible) {
            return;
        }

        // Make the whole call asynchronous due to race condition in properties assignment
        setTimeout(() => {
            if (model.delayTime) {
                // Update visibility after delayTime timeout
                model.__delayTimer = setTimeout(() => {
                    model._visible = model.visible;
                    model.__delayTimer = undefined;
                }, model.delayTime);
            } else {
                model._visible = model.visible;
            }
        });
    }
}

const Spinner = UECA.getFC(useSpinner);

export { SpinnerModel, SpinnerParams, useSpinner, Spinner };
