import * as UECA from "ueca-react";
import { EditBaseModel, EditBaseParams, EditBaseStruct, useEditBase } from "@components";
import { Palette, resolvePaletteColor } from "@core";
import "./checkbox.css";

type CheckboxStruct = EditBaseStruct<{
    props: {
        checked: boolean;
        labelView: React.ReactNode;
        disabled: boolean;
        indeterminate: boolean;
        required: boolean;
        color: Palette;
        size: "small" | "medium" | "large";
        helperTextView: React.ReactNode;
    };

    events: {
        onChange: (checked: boolean, source: CheckboxModel) => UECA.MaybePromise;
        onChangeValue: () => void;
    };
}>;

type CheckboxParams = EditBaseParams<CheckboxStruct>;
type CheckboxModel = EditBaseModel<CheckboxStruct>;

function useCheckbox(params?: CheckboxParams): CheckboxModel {
    const struct: CheckboxStruct = {
        props: {
            id: useCheckbox.name,
            checked: false,
            labelView: undefined,
            disabled: false,
            indeterminate: false,
            required: false,
            color: "primary.main",
            size: "medium",
            helperTextView: undefined
        },

        events: {
            onInternalValidate: async () => {
                if (model.required && !model.checked) {
                    const fieldName = UECA.isString(model.labelView) ? model.labelView : "This field";
                    return `${fieldName} must be checked`;
                }
            },

            onChangeValue: () => model.resetValidationErrors(),
        },

        View: () => {
            const colorClass = resolvePaletteColor(model.color);
            const hasValidationError = !model.isValid();
            const className = `ueca-checkbox ueca-checkbox-${model.size}${hasValidationError ? " ueca-checkbox-error" : ""}${model.disabled ? " ueca-checkbox-disabled" : ""}${model.indeterminate ? " ueca-checkbox-indeterminate" : ""}`.trim();

            return (
                <div id={model.htmlId()}>
                    <label
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
                            onChange={_handleChange}
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
                    {(hasValidationError || model.helperTextView) && (
                        <div className={`checkbox-helper-text${hasValidationError ? " checkbox-helper-text-error" : ""}`}>
                            {hasValidationError ? model.getValidationError() : model.helperTextView}
                        </div>
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

const Checkbox = UECA.getFC(useCheckbox);

export { CheckboxModel, CheckboxParams, useCheckbox, Checkbox };
