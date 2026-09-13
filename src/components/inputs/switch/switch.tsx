import * as UECA from "ueca-react";
import { EditBaseModel, EditBaseParams, EditBaseStruct, useEditBase } from "@components";
import { Palette, resolvePaletteColor } from "@core";
import "./switch.css";

type SwitchSize = "small" | "medium" | "large";

type SwitchStruct = EditBaseStruct<{
    props: {
        checked: boolean;
        labelView: React.ReactNode;
        disabled: boolean;
        color: Palette;
        size: SwitchSize;
        helperTextView: React.ReactNode;
    };

    events: {
        onChange: (checked: boolean, source: SwitchModel) => UECA.MaybePromise;
    };
}>;

type SwitchParams = EditBaseParams<SwitchStruct>;
type SwitchModel = EditBaseModel<SwitchStruct>;

function useSwitch(params?: SwitchParams): SwitchModel {
    const struct: SwitchStruct = {
        props: {
            id: useSwitch.name,
            checked: false,
            labelView: undefined,
            disabled: false,
            color: "primary.main",
            size: "medium",
            helperTextView: undefined
        },

        View: () => {
            const colorClass = resolvePaletteColor(model.color);
            const className = `ueca-switch ueca-switch-${model.size}${model.disabled ? " ueca-switch-disabled" : ""}`;

            return (
                <div id={model.htmlId()}>
                    <label
                        className={className}
                        style={{
                            "--switch-color": colorClass
                        } as React.CSSProperties}
                    >
                        <input
                            type="checkbox"
                            role="switch"
                            className="switch-input"
                            checked={model.checked}
                            disabled={model.disabled}
                            onChange={_handleChange}
                        />
                        <span className="switch-track">
                            <span className="switch-thumb" />
                        </span>
                        {model.labelView && <span className="switch-label">{model.labelView}</span>}
                    </label>
                    {model.helperTextView && (
                        <div className="switch-helper-text">{model.helperTextView}</div>
                    )}
                </div>
            );
        }
    };

    const model = useEditBase(struct, params);
    return model;

    // Private methods
    function _handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        model.checked = e.target.checked;
        if (model.onChange) {
            model.onChange(model.checked, model);
        }
    }
}

const Switch = UECA.getFC(useSwitch);

export { SwitchModel, SwitchParams, SwitchSize, useSwitch, Switch };
