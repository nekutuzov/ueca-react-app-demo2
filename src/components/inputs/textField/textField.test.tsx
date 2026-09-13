import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as UECA from "ueca-react";
import {
    FieldLabel, Icon, PasswordField, SECURED_PASSWORD_PLACEHOLDER, SecuredPasswordField, TextField, TextFieldType
} from "@components";
import { mount, settle, stubMessages } from "@test";

// The markup a glyph renders on its own, to compare with what the field draws.
function glyphMarkup(glyph: React.ReactElement): string {
    const { container, unmount } = render(glyph);
    const markup = container.innerHTML;
    unmount();
    return markup;
}

// A password <input> has no ARIA role, so fields are reached through their UECA id.
function inputOf(id: string): HTMLInputElement {
    return document.getElementById(id).querySelector("input");
}

function helperTextOf(id: string): HTMLElement {
    return document.getElementById(id).querySelector(".textfield-helper-text");
}

function stubTooltip() {
    return stubMessages({
        "App.Tooltip.Show": vi.fn(async () => { }),
        "App.Tooltip.Hide": vi.fn(async () => { })
    });
}

describe("TextField", () => {
    describe("rendering", () => {
        it("renders an outlined, full-width, enabled text input in the theme accent by default", async () => {
            await mount(TextField, { id: "name" });

            const root = document.getElementById("name");
            expect(root).toHaveClass("ueca-textfield", "ueca-textfield-outlined", "ueca-textfield-fullwidth");
            expect(root).not.toHaveClass("ueca-textfield-error", "ueca-textfield-disabled", "ueca-textfield-readonly", "ueca-textfield-fill");
            expect(root.style.getPropertyValue("--textfield-color")).toBe("var(--accent)");
            expect(root.style.width).toBe("");

            const input = screen.getByRole("textbox");
            expect(input).toHaveAttribute("type", "text");
            expect(input).toHaveAttribute("placeholder", "");
            expect(input).toBeEnabled();
            expect(input).not.toHaveAttribute("readonly");
            expect(root.querySelector("label")).toBeNull();
            expect(helperTextOf("name")).toBeNull();
            expect(root.querySelector("button")).toBeNull();
        });

        it.each(["outlined", "filled", "standard"] as const)("reflects the %s variant in its class", async (variant) => {
            await mount(TextField, { id: "name", variant });

            expect(document.getElementById("name")).toHaveClass(`ueca-textfield-${variant}`);
        });

        it("shows its value, placeholder, type and autoComplete on the input", async () => {
            await mount(TextField, { id: "email", value: "ada@example.com", placeholder: "you@example.com", type: "email", autoComplete: "email" });

            const input = screen.getByRole("textbox");
            expect(input).toHaveValue("ada@example.com");
            expect(input).toHaveAttribute("placeholder", "you@example.com");
            expect(input).toHaveAttribute("type", "email");
            expect(input).toHaveAttribute("autocomplete", "email");
        });

        it("renders a non-string value through its string form", async () => {
            await mount(TextField, { id: "qty", value: 42 as unknown as string });

            expect(screen.getByRole("textbox")).toHaveValue("42");
        });

        it("disables the input and dims the field when disabled", async () => {
            await mount(TextField, { id: "name", value: "ada", disabled: true });

            expect(document.getElementById("name")).toHaveClass("ueca-textfield-disabled");
            expect(screen.getByRole("textbox")).toBeDisabled();
        });

        // Read-only is visible and selectable but not editable — distinct from disabled.
        it("makes the input read-only without disabling it", async () => {
            await mount(TextField, { id: "name", value: "ada", readOnly: true });

            const input = screen.getByRole("textbox");
            expect(document.getElementById("name")).toHaveClass("ueca-textfield-readonly");
            expect(document.getElementById("name")).not.toHaveClass("ueca-textfield-disabled");
            expect(input).toHaveAttribute("readonly");
            expect(input).toBeEnabled();
        });

        it("recolours its accent with a palette colour and reflects fill", async () => {
            await mount(TextField, { id: "name", color: "error.main", multiline: true, fill: true });

            const root = document.getElementById("name");
            expect(root.style.getPropertyValue("--textfield-color")).toBe("var(--error)");
            expect(root).toHaveClass("ueca-textfield-fill");
        });

        // Without minWidth 0, the CSS min-width made any narrower explicit width unreachable in an
        // auto-width flex row.
        it("takes an explicit width only when not full-width, and lets it go below the CSS min-width", async () => {
            await mount(TextField, { id: "full", extent: { width: 120 } });
            await mount(TextField, { id: "fixed", fullWidth: false, extent: { width: 120 } });
            await mount(TextField, { id: "shrink", fullWidth: false });

            const full = document.getElementById("full");
            expect(full.style.width).toBe("");
            expect(full.style.minWidth).toBe("");

            const fixed = document.getElementById("fixed");
            expect(fixed).not.toHaveClass("ueca-textfield-fullwidth");
            expect(fixed.style.width).toBe("120px");
            expect(fixed.style.minWidth).toBe("0px");

            const shrink = document.getElementById("shrink");
            expect(shrink.style.width).toBe("");
            expect(shrink.style.minWidth).toBe("");
        });

        // The asterisk leads, so it reads as part of the label rather than trailing punctuation.
        it("renders its label, with a leading asterisk when required", async () => {
            const { model } = await mount(TextField, { id: "name", labelView: "Username" });
            const label = () => document.getElementById("name").querySelector("label");
            expect(label()).toHaveTextContent(/^Username$/);

            model.required = true;
            await settle();

            expect(label().firstElementChild).toHaveClass("textfield-required");
            expect(label()).toHaveTextContent(/^\*Username$/);
        });

        it("renders start and end adornments around the input, inside the frame", async () => {
            await mount(TextField, {
                id: "reading",
                startView: <i data-testid="start" />,
                endView: <span data-testid="end">mm</span>
            });

            const frame = document.getElementById("reading").querySelector(".textfield-frame");
            const [start, input, end] = Array.from(frame.children);
            expect(start).toHaveClass("textfield-adornment", "textfield-adornment-start");
            expect(start).toContainElement(screen.getByTestId("start"));
            expect(input).toBe(screen.getByRole("textbox"));
            expect(end).toHaveClass("textfield-adornment", "textfield-adornment-end");
            expect(end).toContainElement(screen.getByTestId("end"));
        });

        it("renders a multiline field as a textarea with rows, and without adornments", async () => {
            await mount(TextField, {
                id: "notes",
                multiline: true,
                rows: 4,
                value: "line",
                startView: <i data-testid="start" />,
                endView: <i data-testid="end" />
            });

            const textarea = screen.getByRole("textbox");
            expect(textarea.tagName).toBe("TEXTAREA");
            expect(textarea).toHaveAttribute("rows", "4");
            expect(textarea).toHaveValue("line");
            expect(document.getElementById("notes").querySelector("input")).toBeNull();
            expect(screen.queryByTestId("start")).toBeNull();
            expect(screen.queryByTestId("end")).toBeNull();
        });

        it("shows helper text, not styled as an error", async () => {
            await mount(TextField, { id: "name", helperTextView: "As on your passport" });

            const helper = helperTextOf("name");
            expect(helper).toHaveTextContent("As on your passport");
            expect(helper).not.toHaveClass("textfield-helper-text-error");
            expect(document.getElementById("name")).not.toHaveClass("ueca-textfield-error");
        });

        it("styles an external error and its helper text as errors", async () => {
            await mount(TextField, { id: "user", value: "ada", error: true, helperTextView: "That name is taken" });

            expect(document.getElementById("user")).toHaveClass("ueca-textfield-error");
            expect(helperTextOf("user")).toHaveClass("textfield-helper-text-error");
            expect(helperTextOf("user")).toHaveTextContent("That name is taken");
        });

        it("shows a validation error in place of the helper text", async () => {
            const { model } = await mount(TextField, { id: "user", labelView: "Username", required: true, helperTextView: "Letters only" });

            await model.validate();
            await settle();

            expect(document.getElementById("user")).toHaveClass("ueca-textfield-error");
            expect(helperTextOf("user")).toHaveClass("textfield-helper-text-error");
            expect(helperTextOf("user")).toHaveTextContent(/^Username cannot be empty$/);
        });
    });

    describe("editing", () => {
        it("updates value as the user types and raises onChange with each value and the model", async () => {
            const onChange = vi.fn();
            const { model } = await mount(TextField, { id: "name", value: "", onChange });

            await userEvent.type(screen.getByRole("textbox"), "ab");

            expect(model.value).toBe("ab");
            expect(onChange.mock.calls).toEqual([["a", model], ["ab", model]]);
        });

        it("shows a value assigned at runtime", async () => {
            const { model } = await mount(TextField, { id: "name", value: "" });

            model.value = "grace";
            await settle();

            expect(screen.getByRole("textbox")).toHaveValue("grace");
        });

        it("edits a multiline value, keeping Enter as a newline", async () => {
            const { model } = await mount(TextField, { id: "notes", multiline: true, value: "" });

            await userEvent.type(screen.getByRole("textbox"), "one{Enter}two");

            expect(model.value).toBe("one\ntwo");
        });

        // The binding is what keeps focus: the owner's View does not re-render per keystroke.
        it("stays in two-way sync with an owner's property through a binding, keeping focus", async () => {
            const { model: owner } = await mount(OwnerProbe, { id: "owner" });
            const input = await screen.findByRole("textbox");

            await userEvent.click(input);
            await userEvent.keyboard("hey");
            await settle();

            expect(owner.text).toBe("hey");
            expect(screen.getByTestId("echo")).toHaveTextContent("hey");
            expect(input).toHaveFocus();

            owner.text = "reset";
            await settle();
            expect(input).toHaveValue("reset");
        });

        it("ignores typing while read-only", async () => {
            const onChange = vi.fn();
            const { model } = await mount(TextField, { id: "name", value: "ada", readOnly: true, onChange });

            await userEvent.type(screen.getByRole("textbox"), "x");

            expect(model.value).toBe("ada");
            expect(onChange).not.toHaveBeenCalled();
        });

        it("cannot be focused or edited while disabled", async () => {
            const onChange = vi.fn();
            const onFocus = vi.fn();
            const { model } = await mount(TextField, { id: "name", value: "ada", disabled: true, onChange, onFocus });

            await userEvent.type(screen.getByRole("textbox"), "x");

            expect(model.value).toBe("ada");
            expect(onChange).not.toHaveBeenCalled();
            expect(onFocus).not.toHaveBeenCalled();
        });

        // BUG: the input renders value={undefined} while the value is undefined (the default), which
        // makes it an UNCONTROLLED input — React warns on the first keystroke that it is switching to
        // controlled, and once a value goes back to undefined (the owner loads a record with no email)
        // the box keeps showing the previous text. SearchField avoids this with `value ?? ""`.
        it.fails("empties the box when its value becomes undefined again", async () => {
            vi.spyOn(console, "error").mockImplementation(() => { });
            const { model } = await mount(TextField, { id: "email" });
            await userEvent.type(screen.getByRole("textbox"), "ada@example.com");

            model.value = undefined;
            await settle();

            expect(screen.getByRole("textbox")).toHaveValue("");
        });
    });

    describe("focus and keys", () => {
        it("raises onFocus and onBlur with the model, tracking _focused", async () => {
            const onFocus = vi.fn();
            const onBlur = vi.fn();
            const { model } = await mount(TextField, { id: "name", value: "", onFocus, onBlur });

            await userEvent.click(screen.getByRole("textbox"));
            expect(model._focused).toBe(true);
            expect(onFocus).toHaveBeenCalledWith(model);

            await userEvent.click(document.body);
            expect(model._focused).toBe(false);
            expect(onBlur).toHaveBeenCalledWith(model);
        });

        // An owner may gate something on _focused (SecuredPasswordField does) without any handlers.
        it("tracks _focused without focus handlers", async () => {
            const { model } = await mount(TextField, { id: "name", value: "" });

            await userEvent.click(screen.getByRole("textbox"));
            expect(model._focused).toBe(true);

            await userEvent.click(document.body);
            expect(model._focused).toBe(false);
        });

        it("raises onEnter with the model on Enter, and on no other key", async () => {
            const onEnter = vi.fn();
            const { model } = await mount(TextField, { id: "name", value: "", onEnter });

            await userEvent.type(screen.getByRole("textbox"), "ada");
            expect(onEnter).not.toHaveBeenCalled();

            await userEvent.keyboard("{Enter}");
            expect(onEnter).toHaveBeenCalledOnce();
            expect(onEnter).toHaveBeenCalledWith(model);
        });

        it("never raises onEnter on a multiline field", async () => {
            const onEnter = vi.fn();
            await mount(TextField, { id: "notes", multiline: true, value: "", onEnter });

            await userEvent.type(screen.getByRole("textbox"), "a{Enter}b");

            expect(onEnter).not.toHaveBeenCalled();
        });

        // `_focused` means "the FIELD has focus": moving focus from the input to the eye inside the
        // same frame used to blur the field, disable a focus-gated eye mid-transit and drop focus to
        // <body>.
        it("keeps _focused and holds back onBlur while focus moves to the reveal button", async () => {
            const onBlur = vi.fn();
            const { model } = await mount(TextField, { id: "pw", type: "password", revealable: true, value: "x", onBlur });

            await userEvent.click(inputOf("pw"));
            await userEvent.tab();

            expect(screen.getByRole("button", { name: "Show password" })).toHaveFocus();
            expect(model._focused).toBe(true);
            expect(onBlur).not.toHaveBeenCalled();
        });

        // BUG: _handleBlur only runs on the INPUT. Once focus has moved to the reveal button (or any
        // focusable adornment) inside the frame, leaving the field from there never clears _focused
        // and never raises onBlur — the field believes it is still focused.
        it.fails("clears _focused and raises onBlur when focus leaves the field from the reveal button", async () => {
            const onBlur = vi.fn();
            const { model } = await mount(TextField, { id: "pw", type: "password", revealable: true, value: "x", onBlur });
            await userEvent.click(inputOf("pw"));
            await userEvent.tab();

            await userEvent.tab();

            expect(screen.getByRole("button", { name: "Show password" })).not.toHaveFocus();
            expect(model._focused).toBe(false);
            expect(onBlur).toHaveBeenCalledOnce();
        });
    });

    describe("validation", () => {
        it.each([
            ["undefined", undefined],
            ["empty", ""],
            ["whitespace-only", "   "]
        ])("reports a required field holding an %s value as empty", async (_case, value) => {
            const { model } = await mount(TextField, { id: "name", labelView: "Username", required: true, value });

            await model.validate();

            expect(model.isValid()).toBe(false);
            expect(model.getValidationError()).toBe("Username cannot be empty");
        });

        it("accepts a required field with a value", async () => {
            const { model } = await mount(TextField, { id: "name", labelView: "Username", required: true, value: "ada" });

            await model.validate();

            expect(model.isValid()).toBe(true);
            expect(model.getValidationError()).toBeUndefined();
        });

        it("accepts an empty optional field", async () => {
            const { model } = await mount(TextField, { id: "name", labelView: "Username", value: "" });

            await model.validate();

            expect(model.isValid()).toBe(true);
        });

        it.each([
            ["a plain label", { labelView: "Email" }, "Email"],
            ["a FieldLabel's own label", { labelView: <FieldLabel labelView="Site name" secondaryView="(URL)" /> }, "Site name"],
            ["the placeholder when the label is not text", { labelView: <b>Email</b>, placeholder: "Contact email" }, "Contact email"],
            ["the placeholder without a label", { placeholder: "Contact email" }, "Contact email"],
            // `||`, not `??`: the default placeholder "" must not leave " cannot be empty".
            ["'This field' without a label or placeholder", {}, "This field"]
        ])("names the field in its message by %s", async (_case, naming, fieldName) => {
            const { model } = await mount(TextField, { id: "field", required: true, ...naming });

            await model.validate();

            expect(model.getValidationError()).toBe(`${fieldName} cannot be empty`);
        });

        it.each([
            ["email", "ada@example.com", undefined],
            ["email", "a@b.co", undefined],
            ["email", "ada@example", "must be a valid email address"],
            ["email", "ada example@x.com", "must be a valid email address"],
            ["email", "@example.com", "must be a valid email address"],
            ["url", "https://example.com/path?q=1", undefined],
            ["url", "mailto:ada@example.com", undefined],
            ["url", "example.com", "must be a valid URL (e.g., https://example.com)"],
            ["tel", "+1 (555) 123-4567", undefined],
            ["tel", "555-CALL", "must be a valid phone number"],
            ["number", "-2.5e3", undefined],
            ["number", " 7 ", undefined],
            ["number", "12abc", "must be a valid number"],
            ["text", "anything @ all", undefined],
            ["password", "12abc", undefined],
            ["search", "not an email", undefined]
        ] as [TextFieldType, string, string][])("validates a %s field holding %j", async (type, value, problem) => {
            const { model } = await mount(TextField, { id: "field", labelView: "Contact", type, value });

            await model.validate();

            expect(model.getValidationError()).toBe(problem && `Contact ${problem}`);
        });

        it("skips the type rule for a blank optional field", async () => {
            const { model } = await mount(TextField, { id: "field", type: "email", value: "   " });

            await model.validate();

            expect(model.isValid()).toBe(true);
        });

        it("clears a validation error as soon as the value changes", async () => {
            const { model } = await mount(TextField, { id: "user", labelView: "Username", required: true, value: "" });
            await model.validate();
            await settle();
            expect(helperTextOf("user")).toHaveTextContent("Username cannot be empty");

            await userEvent.type(screen.getByRole("textbox"), "a");

            expect(model.isValid()).toBe(true);
            expect(helperTextOf("user")).toBeNull();
            expect(document.getElementById("user")).not.toHaveClass("ueca-textfield-error");
        });

        // BUG: `!model.value` treats the number 0 as empty, so a required TextField<number> showing
        // "0" fails validation with "cannot be empty". NumberField checks `value == null` instead.
        it.fails("does not report a required numeric field holding 0 as empty", async () => {
            const { model } = await mount(TextField, { id: "qty", labelView: "Quantity", required: true, type: "number", value: 0 as unknown as string });
            expect(screen.getByRole("spinbutton")).toHaveValue(0);

            await model.validate();

            expect(model.getValidationError()).toBeUndefined();
        });
    });

    describe("password reveal", () => {
        it.each([
            ["a password field that is not revealable", { type: "password" as const }],
            ["a revealable field that is not a password", { type: "text" as const, revealable: true }]
        ])("shows no eye toggle for %s", async (_case, params) => {
            await mount(TextField, { id: "pw", value: "x", ...params });

            expect(document.getElementById("pw").querySelector("button")).toBeNull();
        });

        it("toggles between masked and plain text, swapping the glyph and the accessible name", async () => {
            const { model } = await mount(TextField, { id: "pw", type: "password", revealable: true, value: "hunter2" });
            const toggle = screen.getByRole("button", { name: "Show password" });
            expect(inputOf("pw")).toHaveAttribute("type", "password");
            expect(toggle.innerHTML).toBe(glyphMarkup(<Icon name="eye" size="md" />));
            expect(toggle).toHaveAttribute("type", "button");

            await userEvent.click(toggle);

            expect(model._revealed).toBe(true);
            expect(inputOf("pw")).toHaveAttribute("type", "text");
            const hide = screen.getByRole("button", { name: "Hide password" });
            expect(hide.innerHTML).toBe(glyphMarkup(<Icon name="eyeSlash" size="md" />));

            await userEvent.click(hide);

            expect(inputOf("pw")).toHaveAttribute("type", "password");
            expect(screen.getByRole("button", { name: "Show password" })).toBeInTheDocument();
        });

        it("offers its current label as a tooltip on hover", async () => {
            const bus = await stubTooltip();
            await mount(TextField, { id: "pw", type: "password", revealable: true, value: "x" });

            fireEvent.mouseEnter(screen.getByRole("button", { name: "Show password" }));
            await settle();

            expect(bus["App.Tooltip.Show"]).toHaveBeenCalledWith(expect.objectContaining({ token: "pw", contentView: "Show password" }));
        });

        // The tooltip captures its text on pointer ENTER, so a toggle under an open tooltip re-sends
        // it against the button's own rect with no delay, swapping the text in place.
        it("re-sends its tooltip at once, against its own rect, after toggling", async () => {
            const bus = await stubTooltip();
            await mount(TextField, { id: "pw", type: "password", revealable: true, value: "x" });
            const toggle = screen.getByRole("button", { name: "Show password" });
            vi.spyOn(toggle, "getBoundingClientRect").mockReturnValue({ top: 10, left: 200, width: 24, height: 24 } as DOMRect);

            fireEvent.click(toggle);
            await settle();

            expect(bus["App.Tooltip.Show"]).toHaveBeenCalledOnce();
            expect(bus["App.Tooltip.Show"]).toHaveBeenCalledWith({
                token: "pw",
                anchor: { top: 10, left: 200, width: 24, height: 24 },
                contentView: "Hide password",
                placement: undefined,
                delay: 0
            });
        });

        it.each([
            ["disabled", { disabled: true }],
            ["read-only", { readOnly: true }],
            ["not reveal-enabled", { revealEnabled: false }]
        ])("disables the eye toggle while the field is %s", async (_case, params) => {
            await mount(TextField, { id: "pw", type: "password", revealable: true, value: "x", ...params });

            expect(screen.getByRole("button", { name: "Show password" })).toBeDisabled();
        });
    });

    describe("accessibility", () => {
        // Regression: the <label> was a sibling of the <input> with no htmlFor/id pairing, so the input
        // had no accessible name — a screen reader announced only "edit text".
        it("names its input after the label", async () => {
            await mount(TextField, { id: "user", labelView: "Username" });

            expect(screen.getByRole("textbox", { name: "Username" })).toHaveAttribute("id", "user-input");
        });

        it("names a multiline field and a password field after their labels", async () => {
            await mount(TextField, { id: "notes", labelView: "Notes", multiline: true });
            await mount(TextField, { id: "pw", labelView: "Password", type: "password", revealable: true });

            expect(screen.getByRole("textbox", { name: "Notes" }).tagName).toBe("TEXTAREA");
            // A password input has no ARIA role, but its label names it all the same.
            expect(screen.getByLabelText("Password")).toBe(inputOf("pw"));
        });

        it("focuses its input when the label is clicked", async () => {
            await mount(TextField, { id: "user", labelView: "Username" });

            await userEvent.click(screen.getByText("Username"));

            expect(screen.getByRole("textbox", { name: "Username" })).toHaveFocus();
        });

        // The asterisk is for the eye: a screen reader hears "required", not "star Username".
        it("keeps the required asterisk out of the name and marks the input required", async () => {
            await mount(TextField, { id: "user", labelView: "Username", required: true });

            const input = screen.getByRole("textbox", { name: "Username" });
            expect(input).toHaveAttribute("aria-required", "true");
            expect(document.querySelector(".textfield-required")).toHaveAttribute("aria-hidden", "true");
        });

        // Regression: the invalid state was only painted. Select set aria-invalid on its trigger; the
        // text input never did.
        it("marks its input aria-invalid while it shows a validation error", async () => {
            const { model } = await mount(TextField, { id: "user", labelView: "Username", required: true });
            expect(screen.getByRole("textbox")).not.toHaveAttribute("aria-invalid");

            await model.validate();
            await settle();

            expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
        });

        it("marks its input aria-invalid and describes it for an external error", async () => {
            await mount(TextField, { id: "user", labelView: "Username", error: true, helperTextView: "Already taken" });

            expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
            expect(screen.getByRole("textbox")).toHaveAccessibleDescription("Already taken");
        });

        // Regression: helper and error text were not linked to the input, so the message was never
        // announced with the field.
        it("describes its input with the helper text, and with the error while one shows", async () => {
            const { model } = await mount(TextField, {
                id: "user",
                labelView: "Username",
                required: true,
                helperTextView: "At least 8 characters"
            });
            expect(screen.getByRole("textbox")).toHaveAccessibleDescription("At least 8 characters");

            await model.validate();
            await settle();

            expect(screen.getByRole("textbox")).toHaveAccessibleDescription("Username cannot be empty");
        });

        it("has no description without helper or error text", async () => {
            await mount(TextField, { id: "user", labelView: "Username" });

            expect(screen.getByRole("textbox")).not.toHaveAttribute("aria-describedby");
        });
    });
});

describe("PasswordField", () => {
    it("is a masked entry with the eye toggle", async () => {
        await mount(PasswordField, { id: "pw", value: "hunter2" });

        expect(inputOf("pw")).toHaveAttribute("type", "password");
        expect(screen.getByRole("button", { name: "Show password" })).toBeEnabled();
    });

    // Bare on purpose: placeholder, lock adornment and autoComplete belong to the sign-in form, not to
    // the many stored-secret fields on configuration screens.
    it("carries no placeholder, adornment or autoComplete of its own", async () => {
        await mount(PasswordField, { id: "pw" });

        const input = inputOf("pw");
        expect(input).toHaveAttribute("placeholder", "");
        expect(input).not.toHaveAttribute("autocomplete");
        expect(document.getElementById("pw").querySelector(".textfield-adornment-start")).toBeNull();
    });

    it("lets the caller override its defaults", async () => {
        await mount(PasswordField, { id: "pw", revealable: false, placeholder: "Password", autoComplete: "current-password" });

        const input = inputOf("pw");
        expect(input).toHaveAttribute("type", "password");
        expect(input).toHaveAttribute("placeholder", "Password");
        expect(input).toHaveAttribute("autocomplete", "current-password");
        expect(screen.queryByRole("button")).toBeNull();
    });
});

describe("SecuredPasswordField", () => {
    it("holds the stored placeholder masked, with autoComplete off and the eye disabled until focused", async () => {
        await mount(SecuredPasswordField, { id: "smtp", value: SECURED_PASSWORD_PLACEHOLDER });

        const input = inputOf("smtp");
        expect(input).toHaveAttribute("type", "password");
        expect(input).toHaveValue(SECURED_PASSWORD_PLACEHOLDER);
        expect(input).toHaveAttribute("autocomplete", "off");
        expect(screen.getByRole("button", { name: "Show password" })).toBeDisabled();
    });

    // Clearing the placeholder IS an edit to the record, so the owner hears it — before onFocus.
    it("clears the placeholder on focus and reports the change before raising onFocus", async () => {
        const calls: string[] = [];
        const onChange = vi.fn(async (value: string) => { calls.push(`change:${value}`); });
        const onFocus = vi.fn(async () => { calls.push("focus"); });
        const { model } = await mount(SecuredPasswordField, { id: "smtp", value: SECURED_PASSWORD_PLACEHOLDER, onChange, onFocus });

        await userEvent.click(inputOf("smtp"));
        await settle();

        expect(model.value).toBe("");
        expect(inputOf("smtp")).toHaveValue("");
        expect(onChange).toHaveBeenCalledWith("", model);
        expect(onFocus).toHaveBeenCalledWith(model);
        expect(calls).toEqual(["change:", "focus"]);
    });

    // The common shape: the owner binds the value and supplies no handlers of its own.
    it("clears the placeholder and re-hides on blur for an owner without onChange or onBlur", async () => {
        const { model } = await mount(SecuredPasswordField, { id: "smtp", value: SECURED_PASSWORD_PLACEHOLDER });

        await userEvent.click(inputOf("smtp"));
        expect(model.value).toBe("");

        await userEvent.click(screen.getByRole("button", { name: "Show password" }));
        await userEvent.click(inputOf("smtp"));
        await userEvent.click(document.body);

        expect(model._focused).toBe(false);
        expect(inputOf("smtp")).toHaveAttribute("type", "password");
    });

    it("leaves a real value alone on focus", async () => {
        const onChange = vi.fn();
        const onFocus = vi.fn();
        const { model } = await mount(SecuredPasswordField, { id: "smtp", value: "new-secret", onChange, onFocus });

        await userEvent.click(inputOf("smtp"));
        await settle();

        expect(model.value).toBe("new-secret");
        expect(onChange).not.toHaveBeenCalled();
        expect(onFocus).toHaveBeenCalledOnce();
    });

    it("forwards typing to the owner's onChange", async () => {
        const onChange = vi.fn();
        const { model } = await mount(SecuredPasswordField, { id: "smtp", value: SECURED_PASSWORD_PLACEHOLDER, onChange });

        await userEvent.click(inputOf("smtp"));
        await userEvent.keyboard("s3");

        expect(model.value).toBe("s3");
        expect(onChange).toHaveBeenLastCalledWith("s3", model);
    });

    // A read-only field still takes focus: merely tabbing through a section switched off by an
    // "Enabled" switch must not wipe the stored secret.
    it("never wipes the stored secret when read-only", async () => {
        const onChange = vi.fn();
        const { model } = await mount(SecuredPasswordField, { id: "smtp", value: SECURED_PASSWORD_PLACEHOLDER, readOnly: true, onChange });

        await userEvent.click(inputOf("smtp"));
        await settle();

        expect(inputOf("smtp")).toHaveFocus();
        expect(model.value).toBe(SECURED_PASSWORD_PLACEHOLDER);
        expect(onChange).not.toHaveBeenCalled();
    });

    it("never wipes the stored secret when disabled, even if a focus event arrives", async () => {
        const onChange = vi.fn();
        const { model } = await mount(SecuredPasswordField, { id: "smtp", value: SECURED_PASSWORD_PLACEHOLDER, disabled: true, onChange });

        fireEvent.focus(inputOf("smtp"));
        await settle();

        expect(model.value).toBe(SECURED_PASSWORD_PLACEHOLDER);
        expect(onChange).not.toHaveBeenCalled();
    });

    it("enables the eye only while focused, and re-hides the password on blur, raising onBlur", async () => {
        const onBlur = vi.fn();
        const { model } = await mount(SecuredPasswordField, { id: "smtp", value: "secret", onBlur });

        await userEvent.click(inputOf("smtp"));
        await userEvent.click(screen.getByRole("button", { name: "Show password" }));
        expect(inputOf("smtp")).toHaveAttribute("type", "text");

        await userEvent.click(inputOf("smtp"));
        await userEvent.click(document.body);

        expect(model._revealed).toBe(false);
        expect(inputOf("smtp")).toHaveAttribute("type", "password");
        expect(screen.getByRole("button", { name: "Show password" })).toBeDisabled();
        expect(onBlur).toHaveBeenCalledWith(model);
    });

    // The eye used to be unreachable by keyboard on every secured field: tabbing to it blurred the
    // input, which disabled the eye mid-transit and dropped focus to <body>.
    it("lets Tab reach the enabled eye without dropping focus", async () => {
        await mount(SecuredPasswordField, { id: "smtp", value: "secret" });

        await userEvent.click(inputOf("smtp"));
        await userEvent.tab();

        const eye = screen.getByRole("button", { name: "Show password" });
        expect(eye).toHaveFocus();
        expect(eye).toBeEnabled();

        await userEvent.keyboard("{Enter}");
        expect(inputOf("smtp")).toHaveAttribute("type", "text");
    });

    // BUG: the contract is "an unfocused field can never reveal what it is holding, and blurring
    // re-hides it" — but when focus leaves from the eye itself (click the eye, then Tab or click
    // away) the input's blur handler never runs (see TextField's _handleBlur), so the secret stays
    // revealed and the eye stays enabled on an unfocused field.
    it.fails("re-hides the password and disables the eye when focus leaves from the eye", async () => {
        const { model } = await mount(SecuredPasswordField, { id: "smtp", value: "secret" });
        await userEvent.click(inputOf("smtp"));
        await userEvent.tab();
        await userEvent.keyboard("{Enter}");
        expect(model._revealed).toBe(true);

        await userEvent.tab();

        expect(inputOf("smtp")).toHaveAttribute("type", "password");
        expect(screen.getByRole("button", { name: "Show password" })).toBeDisabled();
    });

    // Gated on focus, not on editability — TextField already disables the eye when read-only.
    it("keeps the eye disabled on a focused read-only field", async () => {
        await mount(SecuredPasswordField, { id: "smtp", value: "secret", readOnly: true });

        await userEvent.click(inputOf("smtp"));

        expect(screen.getByRole("button", { name: "Show password" })).toBeDisabled();
    });
});

// An owner holding the text and binding a TextField to it — the recommended shape. Its View does not
// read `text`, so typing never re-renders the View that hosts the field; the echo is its own observer.
type OwnerProbeStruct = UECA.ComponentStruct<{
    props: { text: string };
    methods: { _EchoView: () => UECA.ReactElement };
}>;

function useOwnerProbe(params?: UECA.ComponentParams<OwnerProbeStruct>) {
    const struct: OwnerProbeStruct = {
        props: {
            id: useOwnerProbe.name,
            text: ""
        },

        methods: {
            _EchoView: () => <span data-testid="echo">{model.text}</span>
        },

        View: () => (
            <div id={model.htmlId()}>
                <TextField id="field" labelView="Name" value={UECA.bind(() => model, "text")} />
                <model._EchoView />
            </div>
        )
    };

    const model = UECA.useComponent(struct, params);
    return model;
}

const OwnerProbe = UECA.getFC(useOwnerProbe);
