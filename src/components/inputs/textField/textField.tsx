import * as UECA from "ueca-react";
import { EditBaseModel, EditBaseParams, EditBaseStruct, useEditBase } from "@components";
import { Palette, resolvePaletteColor } from "@core";
import "./textField.css";

type TextFieldType = "text" | "email" | "password" | "number" | "tel" | "url" | "search";
type TextFieldVariant = "outlined" | "filled" | "standard";

type TextFieldStruct<T = string> = EditBaseStruct<{
    props: {
        value: T;
        labelView: React.ReactNode;
        placeholder: string;
        type: TextFieldType;
        disabled: boolean;
        required: boolean;
        error: boolean;
        helperTextView: React.ReactNode;
        variant: TextFieldVariant;
        fullWidth: boolean;
        multiline: boolean;
        rows: number;
        autoComplete: string;
        color: Palette;
    };

    events: {
        onChange: (value: T, source: TextFieldModel<T>) => UECA.MaybePromise;
        onFocus: (source: TextFieldModel<T>) => UECA.MaybePromise;
        onBlur: (source: TextFieldModel<T>) => UECA.MaybePromise;
    };
}>;

type TextFieldParams<T = string> = EditBaseParams<TextFieldStruct<T>>;
type TextFieldModel<T = string> = EditBaseModel<TextFieldStruct<T>>;

function useTextField<T = string>(params?: TextFieldParams<T>): TextFieldModel<T> {
    const struct: TextFieldStruct<T> = {
        props: {
            id: useTextField.name,
            value: undefined,
            labelView: undefined,
            placeholder: "",
            type: "text",
            disabled: false,
            required: false,
            error: false,
            helperTextView: undefined,
            variant: "outlined",
            fullWidth: true,
            multiline: false,
            rows: 1,
            autoComplete: undefined,
            color: "primary.main"
        },

        events: {
            onInternalValidate: async () => {
                const fieldName = UECA.isString(model.labelView) ? model.labelView : "This field";
                
                // Required validation
                if (model.required && (!model.value || model.value.toString().trim() === "")) {
                    return `${fieldName} is required`;
                }

                // Type-specific validation (only if value is not empty)
                if (model.value && model.value.toString().trim() !== "") {
                    const valueStr = model.value.toString();
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    const phoneRegex = /^[\d\s\-+()]+$/;

                    switch (model.type) {
                        case "email":                    
                            if (!emailRegex.test(valueStr)) {
                                return `${fieldName} must be a valid email address`;
                            }
                            break;

                        case "url":
                            try {
                                new URL(valueStr);
                            } catch {
                                return `${fieldName} must be a valid URL (e.g., https://example.com)`;
                            }
                            break;

                        case "tel":                            
                            if (!phoneRegex.test(valueStr)) {
                                return `${fieldName} must be a valid phone number`;
                            }
                            break;

                        case "number":
                            if (isNaN(Number(valueStr))) {
                                return `${fieldName} must be a valid number`;
                            }
                            break;
                    }
                }
            },

            onChangeValue: () => model.resetValidationErrors(),
        },

        View: () => {
            const colorClass = resolvePaletteColor(model.color);
            const hasValidationError = !model.isValid();
            const hasExternalError = model.error;
            const showError = hasValidationError || hasExternalError;
            const errorMessage = hasValidationError ? model.getValidationError() : model.helperTextView;

            const className = `ueca-textfield ueca-textfield-${model.variant}${showError ? " ueca-textfield-error" : ""}${model.disabled ? " ueca-textfield-disabled" : ""}${model.fullWidth ? " ueca-textfield-fullwidth" : ""}`;

            return (
                <div
                    id={model.htmlId()}
                    className={className}
                    style={{
                        "--textfield-color": colorClass
                    } as React.CSSProperties}
                >
                    {model.labelView && (
                        <label className="textfield-label">
                            {model.labelView}
                            {model.required && <span className="textfield-required"> *</span>}
                        </label>
                    )}
                    {model.multiline ? (
                        <textarea
                            className="textfield-input textfield-textarea"
                            value={model.value?.toString()}
                            placeholder={model.placeholder}
                            disabled={model.disabled}
                            required={model.required}
                            rows={model.rows}
                            onChange={_handleChange}
                            onFocus={_handleFocus}
                            onBlur={_handleBlur}
                        />
                    ) : (
                        <input
                            className="textfield-input"
                            type={model.type}
                            value={model.value?.toString()}
                            placeholder={model.placeholder}
                            disabled={model.disabled}
                            required={model.required}
                            autoComplete={model.autoComplete}
                            onChange={_handleChange}
                            onFocus={_handleFocus}
                            onBlur={_handleBlur}
                        />
                    )}
                    {(showError || model.helperTextView) && (
                        <div className={`textfield-helper-text${showError ? " textfield-helper-text-error" : ""}`}>
                            {errorMessage}
                        </div>
                    )}
                </div>
            );
        }
    };

    const model = useEditBase(struct, params);
    return model;

    // Private methods
    function _handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        model.value = e.target.value as T;
        if (model.onChange) {
            model.onChange(model.value, model);
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

const TextField = UECA.getFC(useTextField);

export { TextFieldModel, TextFieldParams, TextFieldType, TextFieldVariant, useTextField, TextField };
