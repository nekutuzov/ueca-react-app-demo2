import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FieldLabel, RadioGroup, RadioOption } from "@components";
import { mount, settle } from "@test";

const UNITS: RadioOption[] = [
    { value: "mm", label: "Millimetres" },
    { value: "cm", label: "Centimetres", disabled: true },
    { value: "in", label: "Inches" }
];

const LEVELS = [
    { value: 0, label: "Off" },
    { value: 1, label: "Low" },
    { value: 2, label: "High" }
] as unknown as RadioOption[];

function radio(name: string): HTMLInputElement {
    return screen.getByRole("radio", { name });
}

function helperTextOf(id: string): HTMLElement {
    return document.getElementById(id).querySelector(".ueca-radio-group-helper-text");
}

describe("RadioGroup", () => {
    describe("rendering", () => {
        it("renders a column of unchecked radios that share the group's name", async () => {
            await mount(RadioGroup, { id: "units", options: UNITS });

            const root = document.getElementById("units");
            expect(root).toHaveClass("ueca-radio-group", "ueca-radio-group-medium");
            expect(root).not.toHaveClass("ueca-radio-group-error", "ueca-radio-group-disabled", "ueca-radio-group-fullwidth");
            expect(root.style.getPropertyValue("--radio-color")).toBe("var(--accent)");
            expect(root.querySelector(".ueca-radio-group-options")).toHaveClass("ueca-radio-group-options-column");
            expect(root.querySelector(".ueca-radio-group-label")).toBeNull();
            expect(helperTextOf("units")).toBeNull();

            const radios = screen.getAllByRole("radio") as HTMLInputElement[];
            expect(radios.map((r) => [r.id, r.name, r.value, r.checked])).toEqual([
                ["units-option-0", "units", "mm", false],
                ["units-option-1", "units", "cm", false],
                ["units-option-2", "units", "in", false]
            ]);
        });

        it("names each radio by its option label", async () => {
            await mount(RadioGroup, { id: "units", options: UNITS });

            expect(radio("Inches")).toHaveAttribute("value", "in");
        });

        it("lays the options out in a row, and reflects size, fullWidth and a palette colour", async () => {
            await mount(RadioGroup, { id: "units", options: UNITS, orientation: "row", size: "small", fullWidth: true, color: "secondary.main" });

            const root = document.getElementById("units");
            expect(root.querySelector(".ueca-radio-group-options")).toHaveClass("ueca-radio-group-options-row");
            expect(root).toHaveClass("ueca-radio-group-small", "ueca-radio-group-fullwidth");
            expect(root.style.getPropertyValue("--radio-color")).toBe("var(--secondary)");
        });

        it("renders its label, with a required asterisk after it", async () => {
            await mount(RadioGroup, { id: "units", options: UNITS, labelView: "Units", required: true });

            const label = document.getElementById("units").querySelector(".ueca-radio-group-label");
            expect(label).toHaveTextContent(/^Units \*$/);
            expect(label.lastElementChild).toHaveClass("ueca-radio-group-required");
        });

        it("checks the option whose value matches", async () => {
            const { model } = await mount(RadioGroup, { id: "units", options: UNITS, value: "in" });
            expect(radio("Inches")).toBeChecked();

            model.value = "mm";
            await settle();

            expect(radio("Millimetres")).toBeChecked();
            expect(radio("Inches")).not.toBeChecked();
        });

        // Matching compares string forms, so a numeric option still shows as chosen for "2".
        it("matches the value to options by their string form", async () => {
            await mount(RadioGroup, { id: "level", options: LEVELS, value: "2" });

            expect(radio("High")).toBeChecked();
        });

        it("renders options assigned at runtime", async () => {
            const { model } = await mount(RadioGroup, { id: "units", options: UNITS });

            model.options = [{ value: "px", label: "Pixels" }];
            await settle();

            expect(screen.getAllByRole("radio")).toEqual([radio("Pixels")]);
        });

        it("shows helper text, not styled as an error", async () => {
            await mount(RadioGroup, { id: "units", options: UNITS, helperTextView: "Used for every drawing" });

            expect(helperTextOf("units")).toHaveTextContent("Used for every drawing");
            expect(helperTextOf("units")).not.toHaveClass("ueca-radio-group-helper-text-error");
        });
    });

    describe("interaction", () => {
        it("selects a clicked option, raising onChange with the option's value and the model", async () => {
            const onChange = vi.fn();
            const { model } = await mount(RadioGroup, { id: "units", options: UNITS, value: "mm", onChange });

            await userEvent.click(screen.getByText("Inches"));

            expect(model.value).toBe("in");
            expect(radio("Inches")).toBeChecked();
            expect(onChange).toHaveBeenCalledOnce();
            expect(onChange).toHaveBeenCalledWith("in", model);
        });

        it("commits option values of their own type", async () => {
            const onChange = vi.fn();
            const { model } = await mount(RadioGroup, { id: "level", options: LEVELS, onChange });

            await userEvent.click(radio("High"));

            expect(model.value).toBe(2);
            expect(onChange).toHaveBeenCalledWith(2, model);
        });

        it("moves the selection with the arrow keys, skipping disabled options", async () => {
            const onChange = vi.fn();
            const { model } = await mount(RadioGroup, { id: "units", options: UNITS, value: "mm", onChange });

            await userEvent.click(radio("Millimetres"));
            await userEvent.keyboard("{ArrowDown}");

            expect(model.value).toBe("in");
            expect(radio("Inches")).toHaveFocus();
            expect(onChange).toHaveBeenCalledWith("in", model);
        });

        it("does not select a disabled option", async () => {
            const onChange = vi.fn();
            const { model } = await mount(RadioGroup, { id: "units", options: UNITS, value: "mm", onChange });

            expect(radio("Centimetres")).toBeDisabled();
            expect(radio("Centimetres").closest("label")).toHaveClass("ueca-radio-item-disabled");
            await userEvent.click(screen.getByText("Centimetres"));

            expect(model.value).toBe("mm");
            expect(onChange).not.toHaveBeenCalled();
        });

        it("disables every option while the group is disabled", async () => {
            const onChange = vi.fn();
            const { model } = await mount(RadioGroup, { id: "units", options: UNITS, disabled: true, onChange });

            expect(document.getElementById("units")).toHaveClass("ueca-radio-group-disabled");
            for (const r of screen.getAllByRole("radio")) {
                expect(r).toBeDisabled();
                expect(r.closest("label")).toHaveClass("ueca-radio-item-disabled");
            }
            await userEvent.click(screen.getByText("Inches"));

            expect(model.value).toBeUndefined();
            expect(onChange).not.toHaveBeenCalled();
        });

        it("raises onFocus and onBlur with the model", async () => {
            const onFocus = vi.fn();
            const onBlur = vi.fn();
            const { model } = await mount(RadioGroup, { id: "units", options: UNITS, onFocus, onBlur });

            await userEvent.click(radio("Inches"));
            expect(onFocus).toHaveBeenCalledWith(model);

            await userEvent.click(document.body);
            expect(onBlur).toHaveBeenCalledWith(model);
        });
    });

    describe("validation", () => {
        it("reports a required group without a value, showing the error in place of the helper text", async () => {
            const { model } = await mount(RadioGroup, { id: "units", options: UNITS, labelView: "Units", required: true, helperTextView: "Pick one" });

            await model.validate();
            await settle();

            expect(model.getValidationError()).toBe("Units cannot be empty");
            expect(document.getElementById("units")).toHaveClass("ueca-radio-group-error");
            expect(helperTextOf("units")).toHaveClass("ueca-radio-group-helper-text-error");
            expect(helperTextOf("units")).toHaveTextContent(/^Units cannot be empty$/);
        });

        it.each([
            ["a FieldLabel's own label", <FieldLabel labelView="Units" secondaryView="(drawings)" />, "Units"],
            ["'This field' without a label", undefined, "This field"]
        ])("names the field in its message by %s", async (_case, labelView, fieldName) => {
            const { model } = await mount(RadioGroup, { id: "units", options: UNITS, labelView, required: true });

            await model.validate();

            expect(model.getValidationError()).toBe(`${fieldName} cannot be empty`);
        });

        it("accepts a required group with a value", async () => {
            const { model } = await mount(RadioGroup, { id: "units", options: UNITS, required: true, value: "in" });

            await model.validate();

            expect(model.isValid()).toBe(true);
        });

        it("clears the error once an option is chosen", async () => {
            const { model } = await mount(RadioGroup, { id: "units", options: UNITS, labelView: "Units", required: true });
            await model.validate();
            await settle();

            await userEvent.click(radio("Inches"));

            expect(model.isValid()).toBe(true);
            expect(helperTextOf("units")).toBeNull();
        });

        // Regression: `!model.value` treated 0 as empty, although the group shows the option whose
        // value is 0 as checked.
        it("does not report a required group holding the option 0 as empty", async () => {
            const { model } = await mount(RadioGroup, { id: "level", options: LEVELS, value: 0 as unknown as string, labelView: "Level", required: true });
            expect(radio("Off")).toBeChecked();

            await model.validate();

            expect(model.getValidationError()).toBeUndefined();
        });
    });

    describe("accessibility", () => {
        // Regression: the label was a plain <div> and the options container had no role, so there was
        // no radiogroup and nothing tied "Units" to the radios — a screen reader announced "Inches,
        // radio button, 3 of 3" without ever saying what was being chosen.
        it("exposes its options as a radiogroup named by its label", async () => {
            await mount(RadioGroup, { id: "units", options: UNITS, labelView: "Units" });

            const group = screen.getByRole("radiogroup", { name: "Units" });
            expect(group).toContainElement(radio("Inches"));
        });

        // The asterisk is for the eye: a screen reader hears "required", not "Units star".
        it("keeps the required asterisk out of the name and marks the group required", async () => {
            await mount(RadioGroup, { id: "units", options: UNITS, labelView: "Units", required: true });

            expect(screen.getByRole("radiogroup", { name: "Units" })).toHaveAttribute("aria-required", "true");
            expect(document.querySelector(".ueca-radio-group-required")).toHaveAttribute("aria-hidden", "true");
        });

        it("describes the group with its helper text, and marks it invalid with the error while one shows", async () => {
            const { model } = await mount(RadioGroup, {
                id: "units",
                options: UNITS,
                labelView: "Units",
                required: true,
                helperTextView: "Used for every measurement"
            });
            const group = () => screen.getByRole("radiogroup", { name: "Units" });
            expect(group()).not.toHaveAttribute("aria-invalid");
            expect(group()).toHaveAccessibleDescription("Used for every measurement");

            await model.validate();
            await settle();

            expect(group()).toHaveAttribute("aria-invalid", "true");
            expect(group()).toHaveAccessibleDescription("Units cannot be empty");
        });

        it("is an unlabelled radiogroup without a label, and undescribed without helper text", async () => {
            await mount(RadioGroup, { id: "units", options: UNITS });

            expect(screen.getByRole("radiogroup")).not.toHaveAttribute("aria-labelledby");
            expect(screen.getByRole("radiogroup")).not.toHaveAttribute("aria-describedby");
        });
    });
});
