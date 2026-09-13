import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NumberField, NumberStyle } from "@components";
import { mount, settle, takeUecaErrors } from "@test";

function textbox(): HTMLInputElement {
    return screen.getByRole("textbox");
}

// Replaces the text the way a user would, keystroke by keystroke (every prefix must be allowed).
async function typeText(text: string) {
    await userEvent.clear(textbox());
    if (text) {
        await userEvent.type(textbox(), text);
    }
}

// Leaves the field, which is what commits the text.
async function leave() {
    await userEvent.click(document.body);
}

// UECA reports a binding that does not settle only after its re-convergence rounds run out, so a
// refused text is given all of them before anything is asserted.
async function drainBindingRounds() {
    for (let round = 0; round < 20; round++) {
        await settle();
    }
}

// Offers `text` as the input's new content in one go, as a paste would.
async function offerText(text: string) {
    fireEvent.change(textbox(), { target: { value: text } });
    await drainBindingRounds();
}

function helperText(): HTMLElement {
    return document.querySelector(".textfield-helper-text");
}

describe("NumberField", () => {
    describe("rendering", () => {
        it("renders a full-width TextField child showing the formatted value", async () => {
            await mount(NumberField, { id: "count", value: 12 });

            expect(document.getElementById("count")).toHaveClass("ueca-numberfield", "ueca-numberfield-fullwidth");
            const frame = document.getElementById("count.input");
            expect(frame).toHaveClass("ueca-textfield", "ueca-textfield-fullwidth");
            expect(frame).toContainElement(textbox());
            expect(textbox()).toHaveValue("12");
        });

        it("hands an explicit width to its frame when not full-width", async () => {
            await mount(NumberField, { id: "count", fullWidth: false, extent: { width: 240 } });

            expect(document.getElementById("count")).not.toHaveClass("ueca-numberfield-fullwidth");
            expect(document.getElementById("count.input").style.width).toBe("240px");
        });

        it.each([
            ["float", undefined, 4.8, "4.8"],
            ["float", 2, 4.8, "4.80"],
            ["float", 0, 4.8, "5"],
            ["int", undefined, 12, "12"],
            ["int", 2, 12, "12"],
            ["hex", undefined, 64222, "FADE"],
            ["float", 2, undefined, ""]
        ] as [NumberStyle, number, number, string][])("formats a %s value with digits %s: %s → %j", async (numberStyle, digits, value, text) => {
            await mount(NumberField, { id: "n", numberStyle, digits, value });

            expect(textbox()).toHaveValue(text);
        });

        it("passes label, placeholder, required, disabled and readOnly down to its input", async () => {
            const { model } = await mount(NumberField, { id: "port", labelView: "Port", placeholder: "8080", required: true });

            expect(document.querySelector("label")).toHaveTextContent(/^\*Port$/);
            expect(textbox()).toHaveAttribute("placeholder", "8080");

            model.readOnly = true;
            await settle();
            expect(textbox()).toHaveAttribute("readonly");

            model.disabled = true;
            await settle();
            expect(textbox()).toBeDisabled();
        });

        it("reformats when the value is assigned, without raising onChange", async () => {
            const onChange = vi.fn();
            const { model } = await mount(NumberField, { id: "n", digits: 1, value: 1, onChange });

            model.value = 2.26;
            await settle();

            expect(textbox()).toHaveValue("2.3");
            expect(onChange).not.toHaveBeenCalled();
        });
    });

    describe("typing", () => {
        it.each([
            ["int", "-"],
            ["int", "+"],
            ["int", "-120"],
            ["float", "-"],
            ["float", "."],
            ["float", "1."],
            ["float", ".5"],
            ["float", "1e"],
            ["float", "1e-"],
            ["float", "-2.5E+3"],
            ["hex", "ff"],
            ["hex", "DEAD"],
            ["hex", "0a"]
        ] as [NumberStyle, string][])("lets a %s field hold the partial entry %j without committing it", async (numberStyle, text) => {
            const onChange = vi.fn();
            const { model } = await mount(NumberField, { id: "n", numberStyle, value: 1, onChange });

            await typeText(text);

            expect(textbox()).toHaveValue(text);
            expect(model.value).toBe(1);
            expect(onChange).not.toHaveBeenCalled();
        });

        it.each([
            ["int", "1.5"],
            ["int", "1e3"],
            ["int", "abc"],
            ["float", "1.2.3"],
            ["float", "1e2e3"],
            ["float", "12a"],
            ["float", "--1"],
            ["hex", "-1"],
            ["hex", "fg"],
            ["hex", "0x10"]
        ] as [NumberStyle, string][])("keeps a %s field's text when offered %j", async (numberStyle, text) => {
            const { model } = await mount(NumberField, { id: "n", numberStyle, value: 7 });

            await offerText(text);

            expect(textbox()).toHaveValue("7");
            expect(model.value).toBe(7);
        });

        // Regression: the child's onChangingValue refused the text, but its read-write bond had
        // already written it into `_text`. UECA reported "did not settle after 10 binding rounds",
        // which the app's error handler shows as an exception dialog on every rejected keystroke.
        it("rejects a disallowed character without reporting a binding divergence", async () => {
            await mount(NumberField, { id: "n", numberStyle: "int", value: 1 });

            fireEvent.change(textbox(), { target: { value: "1a" } });
            await drainBindingRounds();

            expect(takeUecaErrors()).toEqual([]);
            expect(textbox()).toHaveValue("1");
        });

        // Regression: the same divergence decided what got committed. The box kept showing "12" after
        // a rejected paste while `_text` held "123.4", so leaving the field committed 123.
        it("commits the text it displays after rejecting a paste", async () => {
            const onChange = vi.fn();
            const { model } = await mount(NumberField, { id: "n", numberStyle: "int", value: 12, onChange });
            await userEvent.click(textbox());

            fireEvent.change(textbox(), { target: { value: "123.4" } });
            await drainBindingRounds();
            expect(textbox()).toHaveValue("12");
            await leave();

            expect(model.value).toBe(12);
            expect(onChange).not.toHaveBeenCalled();
        });

        it("keeps accepting allowed text after refusing a character", async () => {
            const { model } = await mount(NumberField, { id: "n", numberStyle: "int", value: 1 });
            await userEvent.click(textbox());

            fireEvent.change(textbox(), { target: { value: "1a" } });
            await drainBindingRounds();
            await userEvent.type(textbox(), "5");
            await leave();

            expect(textbox()).toHaveValue("15");
            expect(model.value).toBe(15);
        });
    });

    describe("commit on blur", () => {
        it.each([
            ["int", {}, "042", 42, "42"],
            ["int", {}, "+7", 7, "7"],
            ["int", { min: 0, max: 100 }, "150", 100, "100"],
            ["int", { min: 0, max: 100 }, "-5", 0, "0"],
            ["float", {}, "1e3", 1000, "1000"],
            ["float", {}, "1.", 1, "1"],
            ["float", { digits: 2 }, "3.14159", 3.14159, "3.14"],
            ["float", { min: -1.5 }, "-2", -1.5, "-1.5"],
            ["hex", {}, "ff", 255, "FF"],
            ["hex", { max: 255 }, "1ff", 255, "FF"]
        ] as [NumberStyle, object, string, number, string][])("commits %s text %j (%j) as %s, shown as %j", async (numberStyle, limits, typed, value, text) => {
            const onChange = vi.fn();
            const { model } = await mount(NumberField, { id: "n", numberStyle, ...limits, onChange });

            await typeText(typed);
            await leave();

            expect(model.value).toBe(value);
            expect(textbox()).toHaveValue(text);
            expect(onChange).toHaveBeenCalledOnce();
            expect(onChange).toHaveBeenCalledWith(value, model);
        });

        it("clamps on commit, never per keystroke", async () => {
            const { model } = await mount(NumberField, { id: "n", numberStyle: "int", max: 100, value: 1 });

            await typeText("150");
            expect(textbox()).toHaveValue("150");
            expect(model.value).toBe(1);

            await leave();
            expect(model.value).toBe(100);
        });

        it.each(["", "-", "."])("clears the value when the text %j does not parse", async (typed) => {
            const onChange = vi.fn();
            const { model } = await mount(NumberField, { id: "n", value: 5, onChange });

            await typeText(typed);
            await leave();

            expect(model.value).toBeUndefined();
            expect(textbox()).toHaveValue("");
            expect(onChange).toHaveBeenCalledWith(undefined, model);
        });

        // "007" → "7": the text is reformatted even though onChangeValue does not fire.
        it("reformats the text without raising onChange when the number is unchanged", async () => {
            const onChange = vi.fn();
            const { model } = await mount(NumberField, { id: "n", numberStyle: "int", value: 7, onChange });

            await typeText("007");
            await leave();

            expect(model.value).toBe(7);
            expect(textbox()).toHaveValue("7");
            expect(onChange).not.toHaveBeenCalled();
        });
    });

    describe("spin buttons", () => {
        it("renders none by default", async () => {
            await mount(NumberField, { id: "n", value: 1 });

            expect(screen.queryByRole("button")).toBeNull();
        });

        it("renders Increment and Decrement in the end adornment, outside the tab order", async () => {
            await mount(NumberField, { id: "n", value: 1, spinButtons: true });

            for (const name of ["Increment", "Decrement"]) {
                const button = screen.getByRole("button", { name });
                expect(button).toHaveAttribute("tabindex", "-1");
                expect(button).toHaveAttribute("type", "button");
                expect(button.closest(".textfield-adornment-end")).not.toBeNull();
            }
        });

        it("steps the value by one either way, raising onChange", async () => {
            const onChange = vi.fn();
            const { model } = await mount(NumberField, { id: "n", numberStyle: "int", value: 5, spinButtons: true, onChange });

            await userEvent.click(screen.getByRole("button", { name: "Increment" }));
            expect(model.value).toBe(6);
            expect(textbox()).toHaveValue("6");

            await userEvent.click(screen.getByRole("button", { name: "Decrement" }));
            await userEvent.click(screen.getByRole("button", { name: "Decrement" }));
            expect(model.value).toBe(4);
            expect(onChange.mock.calls.map(([value]) => value)).toEqual([6, 5, 4]);
        });

        it("steps from zero when the field is empty", async () => {
            const { model } = await mount(NumberField, { id: "n", spinButtons: true });

            await userEvent.click(screen.getByRole("button", { name: "Decrement" }));

            expect(model.value).toBe(-1);
        });

        // The spin button sits inside the field's frame, so pressing it while typing must not first
        // commit the text through a blur: one click, one change.
        it("steps from the typed text as a single change while the input has focus", async () => {
            const onChange = vi.fn();
            const { model } = await mount(NumberField, { id: "n", numberStyle: "int", spinButtons: true, onChange });

            await typeText("10");
            await userEvent.click(screen.getByRole("button", { name: "Increment" }));

            expect(model.value).toBe(11);
            expect(onChange).toHaveBeenCalledOnce();
            expect(onChange).toHaveBeenCalledWith(11, model);
        });

        it("clamps to min and max, raising no onChange at the limit", async () => {
            const onChange = vi.fn();
            const { model } = await mount(NumberField, { id: "n", numberStyle: "int", min: 0, max: 3, value: 3, spinButtons: true, onChange });

            await userEvent.click(screen.getByRole("button", { name: "Increment" }));
            expect(model.value).toBe(3);

            model.value = 0;
            await settle();
            await userEvent.click(screen.getByRole("button", { name: "Decrement" }));
            expect(model.value).toBe(0);

            expect(onChange).not.toHaveBeenCalled();
        });

        it("brings an empty field into range on the first step", async () => {
            const { model } = await mount(NumberField, { id: "n", min: 5, max: 10, spinButtons: true });

            await userEvent.click(screen.getByRole("button", { name: "Increment" }));

            expect(model.value).toBe(5);
        });

        it.each([
            ["float", 2, 1.25, "2.25"],
            ["hex", undefined, 255, "100"]
        ] as [NumberStyle, number, number, string][])("formats a stepped %s value", async (numberStyle, digits, value, text) => {
            await mount(NumberField, { id: "n", numberStyle, digits, value, spinButtons: true });

            await userEvent.click(screen.getByRole("button", { name: "Increment" }));

            expect(textbox()).toHaveValue(text);
        });

        it("disables both buttons with the field", async () => {
            const onChange = vi.fn();
            const { model } = await mount(NumberField, { id: "n", value: 5, spinButtons: true, disabled: true, onChange });

            expect(screen.getByRole("button", { name: "Increment" })).toBeDisabled();
            expect(screen.getByRole("button", { name: "Decrement" })).toBeDisabled();
            await userEvent.click(screen.getByRole("button", { name: "Increment" }));

            expect(model.value).toBe(5);
            expect(onChange).not.toHaveBeenCalled();
        });

        // BUG: the spin buttons check only `disabled`, and _step has no readOnly guard, so a read-only
        // field — "visible and selectable but not editable" — can still be changed with them.
        it.fails("does not let the spin buttons change a read-only field", async () => {
            const { model } = await mount(NumberField, { id: "n", value: 5, spinButtons: true, readOnly: true });

            await userEvent.click(screen.getByRole("button", { name: "Increment" }));

            expect(model.value).toBe(5);
        });
    });

    describe("validation", () => {
        it("reports a required field without a value, showing the error on its input", async () => {
            const { model } = await mount(NumberField, { id: "port", labelView: "Port", required: true, helperTextView: "1 to 65535" });
            expect(helperText()).toHaveTextContent("1 to 65535");
            expect(helperText()).not.toHaveClass("textfield-helper-text-error");

            await model.validate();
            await settle();

            expect(model.getValidationError()).toBe("Port cannot be empty");
            expect(document.getElementById("port.input")).toHaveClass("ueca-textfield-error");
            expect(helperText()).toHaveClass("textfield-helper-text-error");
            expect(helperText()).toHaveTextContent(/^Port cannot be empty$/);
        });

        it("accepts 0 in a required field", async () => {
            const { model } = await mount(NumberField, { id: "n", labelView: "Offset", required: true, value: 0 });

            await model.validate();

            expect(model.isValid()).toBe(true);
        });

        it("names an unlabelled field by its placeholder", async () => {
            const { model } = await mount(NumberField, { id: "n", placeholder: "Port", required: true });

            await model.validate();

            expect(model.getValidationError()).toBe("Port cannot be empty");
        });

        // BUG: NumberField uses `??` where TextField deliberately uses `||` — the default placeholder
        // "" passes through `??`, so an unlabelled field reports " cannot be empty" (TextField's own
        // comment describes exactly this failure).
        it.fails("names an unlabelled field without a placeholder 'This field'", async () => {
            const { model } = await mount(NumberField, { id: "n", required: true });

            await model.validate();

            expect(model.getValidationError()).toBe("This field cannot be empty");
        });

        it("clears the error once a value is committed", async () => {
            const { model } = await mount(NumberField, { id: "port", labelView: "Port", required: true });
            await model.validate();
            await settle();

            await typeText("8080");
            await leave();

            expect(model.isValid()).toBe(true);
            expect(document.getElementById("port.input")).not.toHaveClass("ueca-textfield-error");
            expect(helperText()).toBeNull();
        });
    });

    describe("accessibility", () => {
        // Regression: inherited from TextField, whose label was not associated with its input, so the
        // number box had no accessible name.
        it("names its input after the label", async () => {
            await mount(NumberField, { id: "port", labelView: "Port" });

            expect(screen.getByRole("textbox", { name: "Port" })).toBeInTheDocument();
        });
    });
});
