import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Checkbox, FieldLabel } from "@components";
import { mount, settle } from "@test";

function checkbox(): HTMLInputElement {
    return screen.getByRole("checkbox");
}

// The <label> that wraps the input carries the control's classes and colour.
function frameOf(id: string): HTMLElement {
    return document.getElementById(id).querySelector("label");
}

function helperTextOf(id: string): HTMLElement {
    return document.getElementById(id).querySelector(".checkbox-helper-text");
}

describe("Checkbox", () => {
    describe("rendering", () => {
        it("renders an unchecked, enabled, medium checkbox in the theme accent by default", async () => {
            await mount(Checkbox, { id: "archived" });

            const frame = frameOf("archived");
            expect(frame).toHaveClass("ueca-checkbox", "ueca-checkbox-medium");
            expect(frame).not.toHaveClass("ueca-checkbox-error", "ueca-checkbox-disabled", "ueca-checkbox-indeterminate");
            expect(frame.style.getPropertyValue("--checkbox-color")).toBe("var(--accent)");

            expect(checkbox()).not.toBeChecked();
            expect(checkbox()).toBeEnabled();
            expect(frame.querySelector(".checkbox-icon")).toBeNull();
            expect(frame.querySelector(".checkbox-label")).toBeNull();
            expect(helperTextOf("archived")).toBeNull();
        });

        // The label wraps the input, so the checkbox is named by it and a click on the text toggles it.
        it("is named by its label, and toggles from a click on the label text", async () => {
            const { model } = await mount(Checkbox, { id: "archived", labelView: "Include archived" });

            await userEvent.click(screen.getByText("Include archived"));

            expect(screen.getByRole("checkbox", { name: "Include archived" })).toBeChecked();
            expect(model.checked).toBe(true);
        });

        it.each(["small", "large"] as const)("reflects the %s size in its class", async (size) => {
            await mount(Checkbox, { id: "c", size });

            expect(frameOf("c")).toHaveClass(`ueca-checkbox-${size}`);
        });

        it("recolours with a palette colour", async () => {
            await mount(Checkbox, { id: "c", color: "success.main" });

            expect(frameOf("c").style.getPropertyValue("--checkbox-color")).toBe("var(--success)");
        });

        it("draws the check glyph while checked", async () => {
            await mount(Checkbox, { id: "c", checked: true });

            expect(checkbox()).toBeChecked();
            expect(frameOf("c").querySelector(".checkbox-icon-check")).not.toBeNull();
            expect(frameOf("c").querySelector(".checkbox-icon-indeterminate")).toBeNull();
        });

        it("draws the indeterminate glyph only while unchecked", async () => {
            const { model } = await mount(Checkbox, { id: "c", indeterminate: true });
            const frame = frameOf("c");
            expect(frame).toHaveClass("ueca-checkbox-indeterminate");
            expect(frame.querySelector(".checkbox-icon-indeterminate")).not.toBeNull();
            expect(frame.querySelector(".checkbox-icon-check")).toBeNull();

            model.checked = true;
            await settle();

            expect(frame.querySelector(".checkbox-icon-check")).not.toBeNull();
            expect(frame.querySelector(".checkbox-icon-indeterminate")).toBeNull();
        });

        it("shows helper text, not styled as an error", async () => {
            await mount(Checkbox, { id: "c", labelView: "Notify me", helperTextView: "Daily at most" });

            expect(helperTextOf("c")).toHaveTextContent("Daily at most");
            expect(helperTextOf("c")).not.toHaveClass("checkbox-helper-text-error");
        });
    });

    describe("interaction", () => {
        it("toggles on click, raising onChange with the new state and the model", async () => {
            const onChange = vi.fn();
            const { model } = await mount(Checkbox, { id: "c", labelView: "Notify me", onChange });

            await userEvent.click(checkbox());
            expect(model.checked).toBe(true);
            expect(onChange).toHaveBeenLastCalledWith(true, model);

            await userEvent.click(checkbox());
            expect(model.checked).toBe(false);
            expect(onChange).toHaveBeenLastCalledWith(false, model);
        });

        it("toggles with Space from the keyboard", async () => {
            const { model } = await mount(Checkbox, { id: "c", labelView: "Notify me" });

            await userEvent.tab();
            await userEvent.keyboard(" ");

            expect(model.checked).toBe(true);
        });

        it("reflects checked assigned at runtime without raising onChange", async () => {
            const onChange = vi.fn();
            const { model } = await mount(Checkbox, { id: "c", onChange });

            model.checked = true;
            await settle();

            expect(checkbox()).toBeChecked();
            expect(onChange).not.toHaveBeenCalled();
        });

        // Regression: the input rendered checked={model.checked} as it was, so an unset value — a
        // binding to a record field not loaded yet, or sent as null — made it an UNCONTROLLED
        // checkbox. React warned, and the box kept showing its last state.
        it.each([undefined, null])("shows a checked value that becomes %s as unchecked", async (unset) => {
            const { model } = await mount(Checkbox, { id: "c", checked: true });

            model.checked = unset;
            await settle();

            expect(checkbox()).not.toBeChecked();
        });

        it("cannot be toggled while disabled", async () => {
            const onChange = vi.fn();
            const { model } = await mount(Checkbox, { id: "c", labelView: "Locked", disabled: true, onChange });

            expect(frameOf("c")).toHaveClass("ueca-checkbox-disabled");
            expect(checkbox()).toBeDisabled();
            await userEvent.click(screen.getByText("Locked"));

            expect(model.checked).toBe(false);
            expect(onChange).not.toHaveBeenCalled();
        });
    });

    describe("validation", () => {
        it("requires a required checkbox to be checked, showing the error in place of the helper text", async () => {
            const { model } = await mount(Checkbox, { id: "terms", labelView: "Accept the terms", required: true, helperTextView: "Required" });

            await model.validate();
            await settle();

            expect(model.getValidationError()).toBe("Accept the terms must be checked");
            expect(frameOf("terms")).toHaveClass("ueca-checkbox-error");
            expect(helperTextOf("terms")).toHaveClass("checkbox-helper-text-error");
            expect(helperTextOf("terms")).toHaveTextContent(/^Accept the terms must be checked$/);
        });

        it.each([
            ["a FieldLabel's own label", <FieldLabel labelView="Accept the terms" secondaryView="(v2)" />, "Accept the terms"],
            ["'This field' without a label", undefined, "This field"]
        ])("names the field in its message by %s", async (_case, labelView, fieldName) => {
            const { model } = await mount(Checkbox, { id: "terms", labelView, required: true });

            await model.validate();

            expect(model.getValidationError()).toBe(`${fieldName} must be checked`);
        });

        it("accepts a required checkbox that is checked, and an optional one that is not", async () => {
            const { model: required } = await mount(Checkbox, { id: "required", required: true, checked: true });
            const { model: optional } = await mount(Checkbox, { id: "optional" });

            await required.validate();
            await optional.validate();

            expect(required.isValid()).toBe(true);
            expect(optional.isValid()).toBe(true);
        });

        // BUG: the reset is wired to `onChangeValue`, but a Checkbox has no `value` prop — its state
        // is `checked` — so the handler never fires. Once validation has flagged the box, checking it
        // leaves "must be checked" on screen until the owner validates again.
        it.fails("clears its validation error once checked", async () => {
            const { model } = await mount(Checkbox, { id: "terms", labelView: "Accept the terms", required: true });
            await model.validate();
            await settle();

            await userEvent.click(checkbox());

            expect(model.isValid()).toBe(true);
            expect(helperTextOf("terms")).toBeNull();
        });
    });

    describe("accessibility", () => {
        // BUG: `indeterminate` only swaps the drawn glyph. The input's DOM `indeterminate` property is
        // never set (React has no attribute for it) and there is no aria-checked="mixed", so assistive
        // technology announces a mixed checkbox as plain "not checked".
        it.fails("exposes the indeterminate state as partially checked", async () => {
            await mount(Checkbox, { id: "all", labelView: "Select all", indeterminate: true });

            expect(screen.getByRole("checkbox", { name: "Select all" })).toBePartiallyChecked();
        });
    });
});
