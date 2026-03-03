import * as UECA from "ueca-react";
import { EditBaseModel, EditBaseParams, EditBaseStruct, useEditBase } from "@components";
import { Palette, resolvePaletteColor } from "@core";
import "./radioGroup.css";

type RadioOption = {
    value: string | number;
    label: string;
    disabled?: boolean;
};

type RadioGroupStruct = EditBaseStruct<{
    props: {
        labelView: React.ReactNode;
        value: string | number;
        options: RadioOption[];
        disabled: boolean;
        helperTextView: string;
        orientation: "row" | "column";
        size: "small" | "medium" | "large";
        required: boolean;
        fullWidth: boolean;
        color: Palette;
    };

    events: {
        onChange: (value: string | number, source: RadioGroupModel) => UECA.MaybePromise;
        onFocus: (source: RadioGroupModel) => UECA.MaybePromise;
        onBlur: (source: RadioGroupModel) => UECA.MaybePromise;
    };
}>;

type RadioGroupParams = EditBaseParams<RadioGroupStruct>;
type RadioGroupModel = EditBaseModel<RadioGroupStruct>;

function useRadioGroup(params?: RadioGroupParams): RadioGroupModel {
    const struct: RadioGroupStruct = {
        props: {
            id: useRadioGroup.name,
            value: "",
            labelView: undefined,
            options: [],
            disabled: false,
            helperTextView: undefined,
            orientation: "column",
            size: "medium",
            required: false,
            fullWidth: false,
            color: "primary.main"
        },

        events: {
            onInternalValidate: async () => {
                if (model.required && !model.value) {
                    return `${UECA.isString(model.labelView) ? model.labelView : "This field"} cannot be empty`;
                }
            },

            onChangeValue: () => model.resetValidationErrors(),
        },

        View: () => {
            const colorClass = resolvePaletteColor(model.color);
            const sizeClass = model.size ? `ueca-radio-group-${model.size}` : "";
            const className = `ueca-radio-group ${sizeClass}${!model.isValid() ? " ueca-radio-group-error" : ""}${model.disabled ? " ueca-radio-group-disabled" : ""}${model.fullWidth ? " ueca-radio-group-fullwidth" : ""}`.trim();

            return (
                <div
                    id={model.htmlId()}
                    className={className}
                    style={{
                        "--radio-color": colorClass
                    } as React.CSSProperties}
                >
                    {model.labelView && (
                        <div className="ueca-radio-group-label">
                            {model.labelView}
                            {model.required && <span className="ueca-radio-group-required"> *</span>}
                        </div>
                    )}
                    <div className={`ueca-radio-group-options ueca-radio-group-options-${model.orientation}`}>
                        {model.options.map((option, index) => {
                            const isChecked = String(model.value) === String(option.value);
                            const isDisabled = model.disabled || option.disabled;
                            const radioId = `${model.htmlId()}-option-${index}`;

                            return (
                                <label
                                    key={option.value}
                                    className={`ueca-radio-item${isDisabled ? " ueca-radio-item-disabled" : ""}`}
                                >
                                    <input
                                        type="radio"
                                        className="ueca-radio-input"
                                        id={radioId}
                                        name={model.htmlId()}
                                        value={String(option.value)}
                                        checked={isChecked}
                                        disabled={isDisabled}
                                        onChange={() => _handleChange(option.value)}
                                        onFocus={_handleFocus}
                                        onBlur={_handleBlur}
                                    />
                                    <span className="ueca-radio-custom"></span>
                                    <span className="ueca-radio-label">{option.label}</span>
                                </label>
                            );
                        })}
                    </div>
                    {(model.helperTextView || !model.isValid()) && (
                        <div className={`ueca-radio-group-helper-text${!model.isValid() ? " ueca-radio-group-helper-text-error" : ""}`}>
                            {!model.isValid() ? model.getValidationError() : model.helperTextView}
                        </div>
                    )}
                </div>
            );
        },
    };

    const model = useEditBase(struct, params);
    return model;

    // Private methods
    function _handleChange(optionValue: string | number) {
        if (!model.disabled) {
            model.value = optionValue;
            if (model.onChange) {
                model.onChange(model.value, model);
            }
        }
    }

    function _handleFocus() {
        if (model.onFocus) {
            model.onFocus(model);
        }
    }

    function _handleBlur() {
        if (model.onBlur) {
            model.onBlur(model);
        }
    }
}

const RadioGroup = UECA.getFC(useRadioGroup);

export { RadioGroupModel, RadioOption, RadioGroupParams, useRadioGroup, RadioGroup };
