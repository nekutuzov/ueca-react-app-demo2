import * as UECA from "ueca-react";
import {
    EditBaseModel, EditBaseParams, EditBaseStruct, fieldLabelText, isEmptyValue, useEditBase
} from "@components";
import { Palette, resolvePaletteColor } from "@core";
import "./radioGroup.css";

type RadioOption<T = string> = {
    value: T;
    label: string;
    disabled?: boolean;
};

type RadioOrientation = "row" | "column";
type RadioSize = "small" | "medium" | "large";

type RadioGroupStruct<T = string> = EditBaseStruct<{
    props: {
        labelView: React.ReactNode;
        value: T;
        options: RadioOption<T>[];
        disabled: boolean;
        helperTextView: string;
        orientation: RadioOrientation;
        size: RadioSize;
        required: boolean;
        fullWidth: boolean;
        color: Palette;
    };

    events: {
        onChange: (value: T, source: RadioGroupModel<T>) => UECA.MaybePromise;
        onFocus: (source: RadioGroupModel<T>) => UECA.MaybePromise;
        onBlur: (source: RadioGroupModel<T>) => UECA.MaybePromise;
    };
}>;

type RadioGroupParams<T = string> = EditBaseParams<RadioGroupStruct<T>>;
type RadioGroupModel<T = string> = EditBaseModel<RadioGroupStruct<T>>;

function useRadioGroup<T = string>(params?: RadioGroupParams<T>): RadioGroupModel<T> {
    const struct: RadioGroupStruct<T> = {
        props: {
            id: useRadioGroup.name,
            value: undefined,
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
                // Not `!model.value`: an option whose value is 0 is a choice, and shows as checked.
                if (model.required && isEmptyValue(model.value)) {
                    return `${fieldLabelText(model.labelView) ?? "This field"} cannot be empty`;
                }
            },

            onChangeValue: () => model.resetValidationErrors(),
        },

        View: () => {
            const colorClass = resolvePaletteColor(model.color);
            const sizeClass = model.size ? `ueca-radio-group-${model.size}` : "";
            const invalid = !model.isValid();
            const helperShown = invalid || !!model.helperTextView;
            const className = `ueca-radio-group ${sizeClass}${invalid ? " ueca-radio-group-error" : ""}${model.disabled ? " ueca-radio-group-disabled" : ""}${model.fullWidth ? " ueca-radio-group-fullwidth" : ""}`.trim();

            return (
                <div
                    id={model.htmlId()}
                    className={className}
                    style={{
                        "--radio-color": colorClass
                    } as React.CSSProperties}
                >
                    {model.labelView && (
                        <div id={_labelId()} className="ueca-radio-group-label ueca-label">
                            {model.labelView}
                            {/* Hidden from screen readers, which hear aria-required instead. */}
                            {model.required && <span className="ueca-radio-group-required" aria-hidden="true"> *</span>}
                        </div>
                    )}
                    {/* The radiogroup role and its label are what make a screen reader say what is
                        being chosen, rather than only "Inches, radio button, 3 of 3". */}
                    <div
                        className={`ueca-radio-group-options ueca-radio-group-options-${model.orientation}`}
                        role="radiogroup"
                        aria-labelledby={model.labelView ? _labelId() : undefined}
                        aria-required={model.required || undefined}
                        aria-invalid={invalid || undefined}
                        aria-describedby={helperShown ? _helperId() : undefined}
                    >
                        {model.options.map((option, index) => {
                            const isChecked = String(model.value) === String(option.value);
                            const isDisabled = model.disabled || option.disabled;
                            const radioId = `${model.htmlId()}-option-${index}`;

                            return (
                                <label
                                    key={option.value?.toString()}
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
                    {helperShown && (
                        <div id={_helperId()} className={`ueca-radio-group-helper-text${invalid ? " ueca-radio-group-helper-text-error" : ""}`}>
                            {invalid ? model.getValidationError() : model.helperTextView}
                        </div>
                    )}
                </div>
            );
        },
    };

    const model = useEditBase(struct, params);
    return model;

    // Private methods
    function _labelId(): string {
        return `${model.htmlId()}-label`;
    }

    function _helperId(): string {
        return `${model.htmlId()}-helper`;
    }

    function _handleChange(optionValue: T) {
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

export { RadioGroupModel, RadioOption, RadioGroupParams, RadioOrientation, RadioSize, useRadioGroup, RadioGroup };
