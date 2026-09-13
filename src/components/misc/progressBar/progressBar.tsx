import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";
import { Palette, resolvePaletteColor } from "@core";
import "./progressBar.css";

// A determinate/indeterminate progress bar. `value` is 0–100; undefined renders the indeterminate
// sweep.
type ProgressBarStruct = UIBaseStruct<{
    props: {
        value: number;
        // Render the numeric percentage next to the bar.
        percentage: boolean;
        color: Palette;
    };
}>;

type ProgressBarParams = UIBaseParams<ProgressBarStruct>;
type ProgressBarModel = UIBaseModel<ProgressBarStruct>;

function useProgressBar(params?: ProgressBarParams): ProgressBarModel {
    const struct: ProgressBarStruct = {
        props: {
            id: useProgressBar.name,
            value: undefined,
            percentage: false,
            color: "primary.main"
        },

        View: () => {
            const indeterminate = model.value == null;
            const clamped = indeterminate ? 0 : Math.min(100, Math.max(0, model.value));
            const colorClass = resolvePaletteColor(model.color);

            return (
                <div
                    id={model.htmlId()}
                    className="ueca-progressbar"
                    style={{ "--progressbar-color": colorClass } as React.CSSProperties}
                >
                    <div
                        className={`progressbar-track${indeterminate ? " indeterminate" : ""}`}
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={indeterminate ? undefined : Math.round(clamped)}
                    >
                        <div
                            className="progressbar-fill"
                            style={indeterminate ? undefined : { width: `${clamped}%` }}
                        />
                    </div>
                    {model.percentage && !indeterminate && (
                        <span className="progressbar-label">{Math.round(clamped)}%</span>
                    )}
                </div>
            );
        }
    };

    const model = useUIBase(struct, params);
    return model;
}

const ProgressBar = UECA.getFC(useProgressBar);

export { ProgressBarModel, ProgressBarParams, useProgressBar, ProgressBar };
