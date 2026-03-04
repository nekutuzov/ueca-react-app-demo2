import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";
import { Palette, resolvePaletteColor } from "@core";
import "./textField.css";

type TextFieldStruct<T = string> = UIBaseStruct<{
    props: {
        value: T;
        labelView: React.ReactNode;
        placeholder: string;
        type: "text" | "email" | "password" | "number" | "tel" | "url" | "search";
        disabled: boolean;
        required: boolean;
        error: boolean;
        helperTextView: React.ReactNode;
        variant: "outlined" | "filled" | "standard";
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

type TextFieldParams<T = string> = UIBaseParams<TextFieldStruct<T>>;
type TextFieldModel<T = string> = UIBaseModel<TextFieldStruct<T>>;

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

        View: () => {
            const colorClass = resolvePaletteColor(model.color);
            const className = `ueca-textfield ueca-textfield-${model.variant}${model.error ? " ueca-textfield-error" : ""}${model.disabled ? " ueca-textfield-disabled" : ""}${model.fullWidth ? " ueca-textfield-fullwidth" : ""}`;

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
                    {model.helperTextView && (
                        <div className={`textfield-helper-text${model.error ? " textfield-helper-text-error" : ""}`}>
                            {model.helperTextView}
                        </div>
                    )}
                </div>
            );
        }
    };

    const model = useUIBase(struct, params);
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

export { TextFieldModel, TextFieldParams, useTextField, TextField };
