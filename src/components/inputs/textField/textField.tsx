import * as UECA from "ueca-react";
import {
    EditBaseModel, EditBaseParams, EditBaseStruct, fieldLabelText, Icon, isEmptyValue, useEditBase
} from "@components";
import { asyncSafe, Palette, resolvePaletteColor } from "@core";
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
        // Visible and selectable but not editable — the state a form section wears while an
        // "Enabled" switch above it is off. Distinct from disabled, whose text also dims.
        readOnly: boolean;
        required: boolean;
        error: boolean;
        helperTextView: React.ReactNode;
        variant: TextFieldVariant;
        fullWidth: boolean;
        multiline: boolean;
        rows: number;
        // Grow to the height the parent gives instead of sizing to `rows` — a template editor that
        // owns the rest of its tab. Only meaningful with multiline.
        fill: boolean;
        autoComplete: string;
        color: Palette;
        // Adornment slots rendered inside the field frame; single-line fields only
        startView: React.ReactNode;
        endView: React.ReactNode;
        // Eye toggle for type="password"
        revealable: boolean;
        // Lets an owner gate the eye toggle independently of the field — secured visibility keeps
        // it disabled until the field is focused.
        revealEnabled: boolean;
        _revealed: boolean;
        _focused: boolean;
    };

    events: {
        onChange: (value: T, source: TextFieldModel<T>) => UECA.MaybePromise;
        onFocus: (source: TextFieldModel<T>) => UECA.MaybePromise;
        onBlur: (source: TextFieldModel<T>) => UECA.MaybePromise;
        // Enter pressed in the field — for "submit the form from the keyboard". A semantic event
        // rather than a raw key one, the same shape as SearchField's onSearch. Never fires on a
        // multiline field, where Enter is a newline.
        onEnter: (source: TextFieldModel<T>) => UECA.MaybePromise;
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
            readOnly: false,
            required: false,
            error: false,
            helperTextView: undefined,
            variant: "outlined",
            fullWidth: true,
            multiline: false,
            rows: 1,
            fill: false,
            autoComplete: undefined,
            // default accent follows the active theme; pass `color` to recolor a specific field
            color: "primary.main",
            startView: undefined,
            endView: undefined,
            revealable: false,
            revealEnabled: true,
            _revealed: false,
            _focused: false
        },

        events: {
            onInternalValidate: async () => {
                // `||`, not `??`: placeholder defaults to "", which `??` passes through — leaving an
                // unlabelled field to report " cannot be empty" and never reaching the fallback.
                const fieldName = fieldLabelText(model.labelView) || model.placeholder || "This field";
                
                // Required validation. A TextField<number> holding 0 shows "0", so 0 is not empty.
                if (model.required && isEmptyValue(model.value)) {
                    return `${fieldName} cannot be empty`;
                }

                // Type-specific validation (only if value is not empty)
                if (!isEmptyValue(model.value)) {
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
            const helperShown = showError || !!model.helperTextView;

            const className = `ueca-textfield ueca-textfield-${model.variant}${showError ? " ueca-textfield-error" : ""}${model.disabled ? " ueca-textfield-disabled" : ""}${model.readOnly ? " ueca-textfield-readonly" : ""}${model.fullWidth ? " ueca-textfield-fullwidth" : ""}${model.fill ? " ueca-textfield-fill" : ""}`;

            return (
                <div
                    id={model.htmlId()}
                    className={className}
                    style={{
                        "--textfield-color": colorClass,
                        // Same sizing contract as Select: fullWidth wins, otherwise an explicit
                        // extent.width fixes the control's size. Without either, the wrapper
                        // shrink-wraps at the CSS min-width — which in an auto-width flex row
                        // used to be unreachable, because the min-width blocked anything narrower.
                        width: model.fullWidth ? undefined : model.extent?.width,
                        minWidth: !model.fullWidth && model.extent?.width != null ? 0 : undefined
                    } as React.CSSProperties}
                >
                    {model.labelView && (
                        // htmlFor, not wrapping: the label sits above the frame, and pairing it by id
                        // is what gives the input its accessible name.
                        <label htmlFor={_inputId()} className="textfield-label ueca-label">
                            {/* Leading: the asterisk reads as part of the label rather than as
                                punctuation trailing it. Hidden from screen readers, which hear
                                aria-required instead of "star". */}
                            {model.required && <span className="textfield-required" aria-hidden="true">*</span>}
                            {model.labelView}
                        </label>
                    )}
                    {model.multiline ? (
                        // Focus is tracked on the frame, not on the input: see _handleBlur.
                        <div className="textfield-frame" onFocus={_handleFocus} onBlur={_handleBlur}>
                            <textarea
                                id={_inputId()}
                                className="textfield-input textfield-textarea"
                                // Never undefined: value={undefined} makes React treat the field as
                                // uncontrolled, and an uncontrolled field keeps the text it last
                                // showed when its value is unset again (a reloaded record, a null).
                                value={model.value?.toString() ?? ""}
                                placeholder={model.placeholder}
                                disabled={model.disabled}
                                readOnly={model.readOnly}
                                rows={model.rows}
                                aria-required={model.required || undefined}
                                aria-invalid={showError || undefined}
                                aria-describedby={helperShown ? _helperId() : undefined}
                                onChange={_handleChange}
                            />
                        </div>
                    ) : (
                        <div className="textfield-frame" onFocus={_handleFocus} onBlur={_handleBlur}>
                            {model.startView && (
                                <span className="textfield-adornment textfield-adornment-start">
                                    {model.startView}
                                </span>
                            )}
                            <input
                                id={_inputId()}
                                className="textfield-input"
                                type={_inputType()}
                                // Never undefined, for the same reason as the textarea's.
                                value={model.value?.toString() ?? ""}
                                placeholder={model.placeholder}
                                disabled={model.disabled}
                                readOnly={model.readOnly}
                                autoComplete={model.autoComplete}
                                aria-required={model.required || undefined}
                                aria-invalid={showError || undefined}
                                aria-describedby={helperShown ? _helperId() : undefined}
                                onChange={_handleChange}
                                onKeyDown={_handleKeyDown}
                            />
                            {model.endView && (
                                <span className="textfield-adornment textfield-adornment-end">
                                    {model.endView}
                                </span>
                            )}
                            {model.type === "password" && model.revealable && (
                                <button
                                    type="button"
                                    className="textfield-adornment textfield-adornment-end textfield-reveal"
                                    {...model.tooltipProps(_revealLabel())}
                                    aria-label={_revealLabel()}
                                    disabled={model.disabled || model.readOnly || !model.revealEnabled}
                                    onClick={(e) => _toggleReveal(e.currentTarget)}
                                >
                                    <Icon name={model._revealed ? "eyeSlash" : "eye"} size="md" />
                                </button>
                            )}
                        </div>
                    )}
                    {helperShown && (
                        <div id={_helperId()} className={`textfield-helper-text${showError ? " textfield-helper-text-error" : ""}`}>
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
    // Derived from the model's DOM id, like Select's: the label's htmlFor and the input's
    // aria-describedby point at these.
    function _inputId(): string {
        return `${model.htmlId()}-input`;
    }

    function _helperId(): string {
        return `${model.htmlId()}-helper`;
    }

    function _inputType(): TextFieldType {
        if (model.type === "password" && model.revealable && model._revealed) {
            return "text";
        }
        return model.type;
    }

    function _handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        model.value = e.target.value as T;
        if (model.onChange) {
            model.onChange(model.value, model);
        }
    }

    function _handleFocus(e: React.FocusEvent<HTMLDivElement>) {
        if (_movesWithinField(e)) {
            return;
        }

        model._focused = true;
        if (model.onFocus) {
            model.onFocus(model);
        }
    }

    // `_focused` means "the FIELD has focus", not "the input element has focus". The difference is
    // load-bearing: useSecuredPasswordField gates its reveal button on it, and the button is a
    // sibling of the input inside the same frame — so moving focus toward the eye (by Tab or by
    // mousedown) must not blur the field, or the button is disabled mid-transit and focus drops to
    // <body>. Both handlers sit on the frame, where React's focus events bubble from every control
    // in it: with them on the input alone, focus that left the field FROM the eye never blurred it,
    // and a secured field went on showing its secret, unfocused.
    function _handleBlur(e: React.FocusEvent<HTMLDivElement>) {
        if (_movesWithinField(e)) {
            return;
        }

        model._focused = false;
        if (model.onBlur) {
            model.onBlur(model);
        }
    }

    // Focus passing between the input and an adornment inside the same frame.
    function _movesWithinField(e: React.FocusEvent<HTMLDivElement>): boolean {
        return e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget);
    }

    // Raw DOM handler, so it cannot be async — asyncSafe carries the awaited onEnter.
    function _handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key !== "Enter" || !model.onEnter) {
            return;
        }
        asyncSafe(() => model.onEnter(model));
    }

    function _revealLabel(): string {
        return model._revealed ? "Hide password" : "Show password";
    }

    // The tooltip captures its text when the pointer ENTERS, so toggling under an already-open
    // tooltip would leave the old label showing. Re-send it against the button's own rect, with no
    // delay so the text swaps in place instead of vanishing and reappearing.
    function _toggleReveal(button: HTMLButtonElement) {
        model._revealed = !model._revealed;
        const r = button.getBoundingClientRect();
        const anchor = { top: r.top, left: r.left, width: r.width, height: r.height };
        asyncSafe(() => model.showTooltip(anchor, _revealLabel(), { delay: 0 }));
    }
}

const TextField = UECA.getFC(useTextField);

// Shorthand: a TextField preconfigured as a password entry — masked, with the eye toggle. Not a
// component of its own; it returns a TextFieldModel and callers override any default.
//
// Deliberately BARE: no placeholder, no lock adornment, no autoComplete. Those belong to a sign-in
// box, not to the many stored-secret fields on the configuration screens; the sign-in form
// supplies its own.
function usePasswordField(params?: TextFieldParams): TextFieldModel {
    return useTextField({
        type: "password",
        revealable: true,
        ...params
    });
}

const PasswordField = UECA.getFC(usePasswordField);

// The literal a stored secret arrives as. The server never sends a real password back, so a
// secured field shows this and the user replaces it wholesale; sending it back unchanged is the
// signal "leave the stored secret alone".
const SECURED_PASSWORD_PLACEHOLDER = "PASSWORD_PLACEHOLDER";

// Shorthand: a password field holding a secret that ALREADY EXISTS on the server — an SMTP or
// database password, never a new password the user is choosing. Three behaviours:
//   · the stored value is the placeholder above, not the secret;
//   · focusing clears the placeholder, so an edit replaces the secret rather than appending to it;
//   · the eye toggle stays disabled until the field is focused, so an unfocused field can never
//     reveal what it is holding, and blurring re-hides it.
// A use* factory returning a TextFieldModel, not a component of its own (CLAUDE.md's shorthand rule).
function useSecuredPasswordField(params?: TextFieldParams): TextFieldModel {
    const { onFocus, onBlur, onChange, ...rest } = params ?? {};
    // Annotated because the config below refers to `model` (revealEnabled reads its focus state),
    // which would otherwise be a circular inference.
    const model: TextFieldModel = useTextField({
        type: "password",
        revealable: true,
        autoComplete: "off",
        // Gated on focus, not on the field being editable — TextField already handles that part.
        revealEnabled: () => model._focused,
        ...rest,

        onFocus: async (source) => {
            // A read-only field still takes focus, so without this guard merely tabbing through a
            // section gated off by an "Enabled" switch would wipe the stored secret.
            if (!model.disabled && !model.readOnly && model.value === SECURED_PASSWORD_PLACEHOLDER) {
                model.value = "";
                // The owner has to hear this: clearing the placeholder IS an edit to the record.
                if (onChange) {
                    await onChange(model.value, model);
                }
            }
            if (onFocus) {
                await onFocus(source);
            }
        },

        onBlur: async (source) => {
            model._revealed = false;
            if (onBlur) {
                await onBlur(source);
            }
        },

        onChange: onChange
    });
    return model;
}

const SecuredPasswordField = UECA.getFC(useSecuredPasswordField);

export {
    TextFieldModel, TextFieldParams, TextFieldType, TextFieldVariant, useTextField, TextField,
    usePasswordField, PasswordField,
    useSecuredPasswordField, SecuredPasswordField, SECURED_PASSWORD_PLACEHOLDER
};
