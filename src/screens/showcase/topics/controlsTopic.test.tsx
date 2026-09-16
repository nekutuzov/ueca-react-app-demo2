import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mount, settle, stubMessages } from "@test";
import { ControlsTopic } from "./controlsTopic";

const TOPIC = "controls";

function byId(id: string): HTMLElement {
    return document.getElementById(`${TOPIC}.${id}`);
}

const SIZES = ["xsmall", "small", "medium", "large"] as const;

describe("ControlsTopic", () => {
    it.each(["text", "outlined", "contained"])("lays out the %s button at every size, then disabled", async (variant) => {
        await mount(ControlsTopic, { id: TOPIC });

        for (const size of SIZES) {
            const button = byId(`btn-${variant}-${size}`);
            expect(button).toHaveClass(`ueca-button-${variant}`, `ueca-button-${size}`);
            expect(button).toHaveTextContent(size);
            expect(button).toBeEnabled();
        }
        expect(byId(`btn-${variant}-disabled`)).toBeDisabled();
        expect(byId(`btn-${variant}-disabled`)).toHaveClass(`ueca-button-${variant}`, "ueca-button-medium");
    });

    // The pairs exist to line up a Button and an IconButton on the same rung of the control ladder.
    it.each([
        ["xsmall", "--control-h-xs"],
        ["small", "--control-h-sm"],
        ["medium", "--control-h-md"],
        ["large", "--control-h-lg"]
    ])("pairs the %s Button with the IconButton of the same size under %s", async (size, token) => {
        await mount(ControlsTopic, { id: TOPIC });

        const pair = byId(`pair-btn-${size}`).closest(".showcase-pair") as HTMLElement;
        expect(pair.previousElementSibling).toHaveTextContent(token);
        expect(byId(`pair-btn-${size}`)).toHaveClass(`ueca-button-${size}`);
        expect(pair).toContainElement(byId(`pair-icon-${size}`));
        expect(byId(`pair-icon-${size}`)).toHaveClass(`ueca-icon-button-${size}`);
    });

    it("names each size's IconButton for its tooltip and screen readers", async () => {
        await mount(ControlsTopic, { id: TOPIC });

        for (const size of SIZES) {
            expect(byId(`icon-${size}`)).toHaveAttribute("aria-label", size);
            expect(byId(`icon-${size}`)).toHaveClass(`ueca-icon-button-${size}`);
        }
    });

    describe("toolbar shorthands", () => {
        it("shows the preset content of each shorthand", async () => {
            await mount(ControlsTopic, { id: TOPIC });

            expect(byId("tool-add")).toHaveTextContent("Add new");
            expect(byId("tool-save")).toHaveTextContent("Save");
            expect(byId("tool-edit")).toHaveTextContent("Edit");
            expect(byId("tool-cancel")).toHaveTextContent("Cancel");
            expect(byId("tool-delete")).toHaveTextContent("Delete");
            expect(byId("tool-refresh")).toHaveAttribute("aria-label", "Refresh");
        });

        // "Cancel and Delete here open the real dialogs."
        it("opens the real confirmation dialogs from Cancel and Delete", async () => {
            const bus = await stubMessages({
                "Dialog.Confirmation": vi.fn(async () => false),
                "Dialog.ActionConfirmation": vi.fn(async () => false)
            });
            await mount(ControlsTopic, { id: TOPIC });

            await userEvent.click(byId("tool-cancel"));
            await userEvent.click(byId("tool-delete"));
            await settle();

            expect(bus["Dialog.Confirmation"]).toHaveBeenCalledWith({
                title: "Confirmation",
                message: "All unsaved changes will be lost! Are you sure you want to cancel?"
            });
            expect(bus["Dialog.ActionConfirmation"]).toHaveBeenCalledWith({
                title: "Warning",
                message: "Are you sure want to delete this item?",
                action: "Delete"
            });
        });
    });

    describe("fields", () => {
        it("includes the error and disabled states, the ones that usually rot", async () => {
            await mount(ControlsTopic, { id: TOPIC });

            expect(byId("tf-error")).toHaveClass("ueca-textfield-error");
            expect(byId("tf-error")).toHaveTextContent("Enter a valid address");
            expect(byId("tf-disabled").querySelector("input")).toBeDisabled();
            expect(byId("tf-disabled").querySelector("input")).toHaveValue("SN-40213");
            expect(byId("tf-normal").querySelector(".textfield-required")).not.toBeNull();
            expect(byId("tf-placeholder").querySelector("input")).toHaveAttribute("placeholder", "not assigned");
        });

        it("fixes each field's width through extent rather than a wrapper", async () => {
            await mount(ControlsTopic, { id: TOPIC });

            for (const id of ["tf-normal", "tf-placeholder", "tf-error", "tf-disabled", "tf-adorn-start", "tf-adorn-end"]) {
                expect(byId(id)).not.toHaveClass("ueca-textfield-fullwidth");
                expect(byId(id)).toHaveStyle({ width: "240px" });
            }
        });

        it("puts the adornments inside the field, and the eye on the password", async () => {
            await mount(ControlsTopic, { id: TOPIC });

            expect(byId("tf-adorn-start").querySelector(".textfield-adornment-start .ueca-icon")).not.toBeNull();
            expect(byId("tf-adorn-end").querySelector(".textfield-adornment-end")).toHaveTextContent("mm");
            expect(byId("tf-adorn-password").querySelector("input")).toHaveAttribute("type", "password");
            expect(within(byId("tf-adorn-password")).getByRole("button", { name: "Show password" })).toBeInTheDocument();
        });

        it.each([
            ["nf-int", "12"],
            ["nf-float", "4.80"],
            ["nf-hex", "FADE"]
        ])("formats the %s NumberField as %s", async (id, text) => {
            await mount(ControlsTopic, { id: TOPIC });

            expect(byId(id).querySelector("input")).toHaveValue(text);
        });

        it("offers spin buttons on the integer field only", async () => {
            await mount(ControlsTopic, { id: TOPIC });

            expect(within(byId("nf-int")).getByRole("button", { name: "Increment" })).toBeInTheDocument();
            expect(within(byId("nf-float")).queryByRole("button", { name: "Increment" })).toBeNull();
        });
    });

    describe("date and time", () => {
        it.each([
            ["dtp-date", "Inspection date", "2026-09-14", "YYYY-MM-DD"],
            ["dtp-time", "Reading taken", "09:30", "HH:MM"],
            ["dtp-datetime", "Next service", "2026-09-14 09:30", "YYYY-MM-DD HH:MM"]
        ])("shows %s in the mode's own format", async (id, label, text, pattern) => {
            await mount(ControlsTopic, { id: TOPIC });

            expect(byId(id)).toHaveTextContent(label);
            expect(byId(id).querySelector("input")).toHaveValue(text);
            expect(byId(id).querySelector("input")).toHaveAttribute("placeholder", pattern);
        });

        it("opens a calendar from the date field, bounded where the field is bounded", async () => {
            await mount(ControlsTopic, { id: TOPIC });

            await userEvent.click(byId("dtp-bounded").querySelector(".dtp-toggle"));
            await settle();

            expect(screen.getByRole("grid")).toHaveAttribute("aria-label", "September 2026");
            expect(screen.getByRole("gridcell", { name: "Thursday, 10 September 2026" })).toBeEnabled();
            expect(screen.getByRole("gridcell", { name: "Wednesday, 9 September 2026" })).toBeDisabled();
        });

        it("offers a clock and no calendar on the time field", async () => {
            await mount(ControlsTopic, { id: TOPIC });

            await userEvent.click(byId("dtp-time").querySelector(".dtp-toggle"));
            await settle();

            expect(screen.queryByRole("grid")).toBeNull();
            expect(screen.getByRole("spinbutton", { name: "Hour" })).toHaveTextContent("09");
        });

        it("shows the required, read-only and disabled states", async () => {
            await mount(ControlsTopic, { id: TOPIC });

            expect(byId("dtp-required").querySelector(".textfield-required")).not.toBeNull();
            expect(byId("dtp-readonly").querySelector("input")).toHaveAttribute("readonly");
            expect(byId("dtp-disabled").querySelector("input")).toBeDisabled();
            expect(byId("dtp-seconds").querySelector("input")).toHaveValue("2026-09-14 09:30:05");
        });
    });

    it("shows each choice control on, off and disabled", async () => {
        await mount(ControlsTopic, { id: TOPIC });

        const checkbox = (id: string) => within(byId(id)).getByRole("checkbox");
        const toggle = (id: string) => within(byId(id)).getByRole("switch");
        expect(checkbox("cb-on")).toBeChecked();
        expect(checkbox("cb-off")).not.toBeChecked();
        expect(checkbox("cb-disabled")).toBeChecked();
        expect(checkbox("cb-disabled")).toBeDisabled();
        expect(toggle("sw-on")).toBeChecked();
        expect(toggle("sw-off")).not.toBeChecked();
        expect(toggle("sw-disabled")).toBeDisabled();
        expect(screen.getByRole("radio", { name: "Millimetres" })).toBeChecked();
        expect(screen.getByRole("radio", { name: "Inches" })).not.toBeChecked();
    });
});
