import * as UECA from "ueca-react";
import { EditBaseModel, EditBaseParams, EditBaseStruct, useEditBase } from "@components";
import { Palette, resolvePaletteColor } from "@core";
import "./select.css";

type SelectOption<T = string> = {
    value: T;
    label: string;
    disabled?: boolean;
};

type SelectVariant = "filled" | "outlined" | "standard";
type SelectSize = "small" | "medium";

type SelectStruct<T = string> = EditBaseStruct<{
    props: {
        labelView: React.ReactNode;
        value: T;
        options: SelectOption<T>[];
        placeholder: string;
        disabled: boolean;
        helperTextView: string;
        variant: SelectVariant;
        size: SelectSize;
        required: boolean;
        fullWidth: boolean;
        color: Palette;
    };

    events: {
        onChange: (value: T, source: SelectModel<T>) => UECA.MaybePromise;
        onFocus: (source: SelectModel<T>) => UECA.MaybePromise;
        onBlur: (source: SelectModel<T>) => UECA.MaybePromise;
    };
}>;

type SelectParams<T = string> = EditBaseParams<SelectStruct<T>>;
type SelectModel<T = string> = EditBaseModel<SelectStruct<T>>;

function useSelect<T = string>(params?: SelectParams<T>): SelectModel<T> {
    const struct: SelectStruct<T> = {
        props: {
            id: useSelect.name,
            value: undefined,
            labelView: undefined,
            options: [],
            placeholder: undefined,
            disabled: false,
            helperTextView: undefined,
            variant: "outlined",
            size: "medium",
            required: false,
            fullWidth: true,
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
            const sizeClass = model.size ? `ueca-select-${model.size}` : "";
            const className = `ueca-select ueca-select-${model.variant} ${sizeClass} ${!model.isValid() ? "ueca-select-error" : ""} ${model.disabled ? "ueca-select-disabled" : ""}`.trim();

            return (
                <div
                    id={model.htmlId()}
                    className={className}
                    style={{
                        width: model.fullWidth ? "100%" : model.extent?.width,
                        "--select-color": colorClass
                    } as React.CSSProperties}
                >
                    {model.labelView && (
                        <label className="ueca-select-label">
                            {model.labelView}
                            {model.required && <span className="ueca-select-required"> *</span>}
                        </label>
                    )}
                    <select
                        className="ueca-select-input"
                        value={String(model.value)}
                        disabled={model.disabled}
                        required={model.required}                        
                        onChange={_handleChange}
                        onFocus={_handleFocus}
                        onBlur={_handleBlur}
                    >
                        {model.placeholder && (
                            <option value="" disabled>
                                {model.placeholder}
                            </option>
                        )}
                        {model.options.map((option) => (
                            <option
                                key={option.value?.toString()}
                                value={String(option.value)}
                                disabled={option.disabled}
                            >
                                {option.label}
                            </option>
                        ))}
                    </select>
                    {(model.helperTextView || !model.isValid()) && (
                        <div className={`ueca-select-helper-text ${!model.isValid() ? "ueca-select-helper-text-error" : ""}`}>
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
    function _handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const newValue = e.target.value as T;
        // Convert back to number if the original option value was a number
        const option = model.options.find(opt => String(opt.value) === newValue);
        model.value = option ? option.value : newValue;
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

const Select = UECA.getFC(useSelect);

export { SelectModel, SelectOption, SelectParams, SelectVariant, SelectSize, useSelect, Select };