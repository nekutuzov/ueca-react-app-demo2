import * as UECA from "ueca-react";
import { Block, UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";
import { Palette, resolvePaletteColor } from "@core";

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
            if (!model._visible) return null;

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
                    sx={{
                        position: "absolute",
                        zIndex: model.zIndex || 1000000,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        top: 0,
                        right: 0,
                        width: "100%",
                        height: "100%",
                        backgroundColor: "rgba(0, 0, 0, 0.2)",
                    }}
                >
                    <svg
                        width={sizeValue}
                        height={sizeValue}
                        viewBox="0 0 44 44"
                        style={{
                            animation: model.variant === "indeterminate" ? "spinner-rotate 1.4s linear infinite" : undefined,
                        }}
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
                            style={{
                                animation: model.variant === "indeterminate" 
                                    ? "spinner-dash 1.4s ease-in-out infinite" 
                                    : undefined,
                                transition: model.variant === "determinate" ? "stroke-dashoffset 0.3s" : undefined,
                            }}
                        />
                    </svg>
                    <style>{`
                        @keyframes spinner-rotate {
                            100% { transform: rotate(360deg); }
                        }
                        @keyframes spinner-dash {
                            0% {
                                stroke-dasharray: 1px, 200px;
                                stroke-dashoffset: 0;
                            }
                            50% {
                                stroke-dasharray: 100px, 200px;
                                stroke-dashoffset: -15px;
                            }
                            100% {
                                stroke-dasharray: 100px, 200px;
                                stroke-dashoffset: -125px;
                            }
                        }
                    `}</style>
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

export { SpinnerModel, useSpinner, Spinner };
