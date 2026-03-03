import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";
import { Palette, resolvePaletteColor } from "@core";
import "./textField.css";

type TextFieldStruct = UIBaseStruct<{
    props: {
        value: string;
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
        onChange: (value: string, source: TextFieldModel) => UECA.MaybePromise;
        onFocus: (source: TextFieldModel) => UECA.MaybePromise;
        onBlur: (source: TextFieldModel) => UECA.MaybePromise;
    };
}>;

type TextFieldParams = UIBaseParams<TextFieldStruct>;
type TextFieldModel = UIBaseModel<TextFieldStruct>;

function useTextField(params?: TextFieldParams): TextFieldModel {
    const struct: TextFieldStruct = {
        props: {
            id: useTextField.name,
            value: "",
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
                            value={model.value}
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
                            value={model.value}
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
        model.value = e.target.value;
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
