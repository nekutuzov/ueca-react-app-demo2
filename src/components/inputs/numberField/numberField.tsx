import * as UECA from "ueca-react";
import {
    EditBaseModel, EditBaseParams, EditBaseStruct, fieldLabelText, Icon, TextFieldModel, useEditBase,
    useTextField
} from "@components";
import "./numberField.css";

type NumberStyle = "int" | "float" | "hex";

// Characters the field accepts while typing — deliberately looser than a full number so partial
// entries ("-", "1e", "1.") survive; the COMMIT on blur/spin is what parses and clamps.
const CHAR_PATTERNS: Record<NumberStyle, RegExp> = {
    int: /^[+-]?\d*$/,
    float: /^[+-]?\d*\.?\d*(e[+-]?\d*)?$/i,
    hex: /^[0-9a-f]*$/i
};

// A numeric entry: int/float/hex styles, fixed fraction digits, min/max clamping, optional spin
// buttons. Owns a TextField child for the frame and text editing; this model owns the number —
// text is parsed, clamped, and reformatted on commit (blur or a spin click), never per keystroke.
type NumberFieldStruct = EditBaseStruct<{
    props: {
        value: number;
        numberStyle: NumberStyle;
        // Fraction digits shown after a commit (float style only).
        digits: number;
        min: number;
        max: number;
        spinButtons: boolean;
        labelView: React.ReactNode;
        placeholder: string;
        disabled: boolean;
        readOnly: boolean;
        required: boolean;
        fullWidth: boolean;
        helperTextView: React.ReactNode;
        _text: string;
    };

    children: {
        input: TextFieldModel;
    };

    events: {
        onChange: (value: number, source: NumberFieldModel) => UECA.MaybePromise;
    };
}>;

type NumberFieldParams = EditBaseParams<NumberFieldStruct>;
type NumberFieldModel = EditBaseModel<NumberFieldStruct>;

function useNumberField(params?: NumberFieldParams): NumberFieldModel {
    const struct: NumberFieldStruct = {
        props: {
            id: useNumberField.name,
            value: undefined,
            numberStyle: "float",
            digits: undefined,
            min: undefined,
            max: undefined,
            spinButtons: false,
            labelView: undefined,
            placeholder: "",
            disabled: false,
            readOnly: false,
            required: false,
            fullWidth: true,
            helperTextView: undefined,
            _text: ""
        },

        children: {
            input: useTextField({
                value: UECA.bind(() => model, "_text"),
                labelView: () => model.labelView,
                placeholder: () => model.placeholder,
                disabled: () => model.disabled,
                readOnly: () => model.readOnly,
                required: () => model.required,
                fullWidth: () => model.fullWidth,
                extent: () => model.extent,
                error: () => !model.isValid(),
                helperTextView: () => model.isValid() ? model.helperTextView : model.getValidationError(),
                endView: () => model.spinButtons ? _SpinView() : undefined,
                onChangingValue: (newText: string, oldText: string) =>
                    CHAR_PATTERNS[model.numberStyle].test(newText) ? newText : oldText,
                onBlur: () => _commit()
            })
        },

        events: {
            onInternalValidate: async () => {
                if (model.required && model.value == null) {
                    const fieldName = fieldLabelText(model.labelView) ?? model.placeholder ?? "This field";
                    return `${fieldName} cannot be empty`;
                }
            },

            onChangeValue: () => {
                model._text = _format(model.value);
                model.resetValidationErrors();
            }
        },

        init: () => {
            model._text = _format(model.value);
        },

        View: () => (
            <div id={model.htmlId()} className={model.fullWidth ? "ueca-numberfield ueca-numberfield-fullwidth" : "ueca-numberfield"}>
                <model.input.View />
            </div>
        )
    };

    const model = useEditBase(struct, params);
    return model;

    // Private methods
    function _SpinView(): React.JSX.Element {
        return (
            <span className="numberfield-spin">
                <button
                    type="button"
                    tabIndex={-1}
                    className="numberfield-spin-button"
                    disabled={model.disabled}
                    aria-label="Increment"
                    onClick={() => { _step(1); }}
                >
                    <Icon name="chevronUp" size="xs" />
                </button>
                <button
                    type="button"
                    tabIndex={-1}
                    className="numberfield-spin-button"
                    disabled={model.disabled}
                    aria-label="Decrement"
                    onClick={() => { _step(-1); }}
                >
                    <Icon name="chevronDown" size="xs" />
                </button>
            </span>
        );
    }

    function _commit() {
        _apply(_clamp(_parse(model._text)));
    }

    function _step(delta: number) {
        const base = _clamp(_parse(model._text)) ?? 0;
        _apply(_clamp(base + delta));
    }

    function _apply(next: number) {
        const changed = next !== model.value;
        model.value = next;
        // Reformat even when the number itself did not change ("007" → "7"); onChangeValue only
        // fires on an actual change.
        model._text = _format(next);
        if (changed && model.onChange) {
            model.onChange(next, model);
        }
    }

    function _parse(text: string): number {
        if (!text?.trim()) {
            return undefined;
        }

        let parsed: number;
        switch (model.numberStyle) {
            case "int": {
                parsed = Number.parseInt(text, 10);
                break;
            }
            case "hex": {
                parsed = Number.parseInt(text, 16);
                break;
            }
            default: {
                parsed = Number.parseFloat(text);
                break;
            }
        }

        return Number.isNaN(parsed) ? undefined : parsed;
    }

    function _clamp(value: number): number {
        if (value == null) {
            return undefined;
        }
        if (model.min != null && value < model.min) {
            return model.min;
        }
        if (model.max != null && value > model.max) {
            return model.max;
        }
        return value;
    }

    function _format(value: number): string {
        if (value == null || Number.isNaN(value)) {
            return "";
        }
        if (model.numberStyle === "hex") {
            return value.toString(16).toUpperCase();
        }
        if (model.numberStyle === "float" && model.digits != null) {
            return value.toFixed(model.digits);
        }
        return String(value);
    }
}

const NumberField = UECA.getFC(useNumberField);

export { NumberFieldModel, NumberFieldParams, NumberStyle, useNumberField, NumberField };
