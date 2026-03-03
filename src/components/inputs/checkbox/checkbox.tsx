import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";
import { Palette, resolvePaletteColor } from "@core";
import "./checkbox.css";

type CheckboxStruct = UIBaseStruct<{
    props: {
        checked: boolean;
        labelView: React.ReactNode;
        disabled: boolean;
        indeterminate: boolean;
        color: Palette;
        size: "small" | "medium" | "large";
    };

    events: {
        onChange: (checked: boolean, source: CheckboxModel) => UECA.MaybePromise;
    };
}>;

type CheckboxParams = UIBaseParams<CheckboxStruct>;
type CheckboxModel = UIBaseModel<CheckboxStruct>;

function useCheckbox(params?: CheckboxParams): CheckboxModel {
    const struct: CheckboxStruct = {
        props: {
            id: useCheckbox.name,
            checked: false,
            labelView: undefined,
            disabled: false,
            indeterminate: false,
            color: "primary.main",
            size: "medium"
        },

        View: () => {
            const colorClass = resolvePaletteColor(model.color);
            const className = `ueca-checkbox ueca-checkbox-${model.size} ${model.disabled ? "ueca-checkbox-disabled" : ""} ${model.indeterminate ? "ueca-checkbox-indeterminate" : ""}`;

            const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {                
                model.checked = e.target.checked;
                if (model.onChange) {
                    model.onChange(model.checked, model);
                }
            };

            return (
                <label
                    id={model.htmlId()}
                    className={className}
                    style={{
                        "--checkbox-color": colorClass
                    } as React.CSSProperties}
                >
                    <input
                        type="checkbox"
                        className="checkbox-input"
                        checked={model.checked}
                        disabled={model.disabled}
                        onChange={handleChange}
                    />
                    <span className="checkbox-custom">
                        {model.checked && (
                            <svg className="checkbox-icon checkbox-icon-check" viewBox="0 0 24 24">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                            </svg>
                        )}
                        {model.indeterminate && !model.checked && (
                            <svg className="checkbox-icon checkbox-icon-indeterminate" viewBox="0 0 24 24">
                                <path d="M19 13H5v-2h14v2z" />
                            </svg>
                        )}
                    </span>
                    {model.labelView && <span className="checkbox-label">{model.labelView}</span>}
                </label>
            );
        }
    };

    const model = useUIBase(struct, params);
    return model;
}

const Checkbox = UECA.getFC(useCheckbox);

export { CheckboxModel, CheckboxParams, useCheckbox, Checkbox };
