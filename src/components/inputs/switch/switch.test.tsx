import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Switch } from "@components";
import { mount, settle } from "@test";

function toggle(): HTMLInputElement {
    return screen.getByRole("switch");
}

// The <label> that wraps the input carries the control's classes and colour.
function frameOf(id: string): HTMLElement {
    return document.getElementById(id).querySelector("label");
}

describe("Switch", () => {
    it("renders an off, enabled, medium switch in the theme accent by default", async () => {
        await mount(Switch, { id: "refresh" });

        const frame = frameOf("refresh");
        expect(frame).toHaveClass("ueca-switch", "ueca-switch-medium");
        expect(frame).not.toHaveClass("ueca-switch-disabled");
        expect(frame.style.getPropertyValue("--switch-color")).toBe("var(--accent)");
        expect(frame.querySelector(".switch-track > .switch-thumb")).not.toBeNull();
        expect(frame.querySelector(".switch-label")).toBeNull();

        expect(toggle()).toHaveAttribute("type", "checkbox");
        expect(toggle()).not.toBeChecked();
        expect(toggle()).toBeEnabled();
        expect(document.querySelector(".switch-helper-text")).toBeNull();
    });

    // The label wraps the input, so the switch is named by it.
    it("is a switch named by its label", async () => {
        await mount(Switch, { id: "refresh", labelView: "Auto-refresh", checked: true });

        expect(screen.getByRole("switch", { name: "Auto-refresh" })).toBeChecked();
    });

    it.each(["small", "large"] as const)("reflects the %s size in its class", async (size) => {
        await mount(Switch, { id: "s", size });

        expect(frameOf("s")).toHaveClass(`ueca-switch-${size}`);
    });

    it("recolours with a palette colour", async () => {
        await mount(Switch, { id: "s", color: "warning.main" });

        expect(frameOf("s").style.getPropertyValue("--switch-color")).toBe("var(--warning)");
    });

    it("toggles on a click on the switch or its label, raising onChange with the new state and the model", async () => {
        const onChange = vi.fn();
        const { model } = await mount(Switch, { id: "s", labelView: "Maintenance mode", onChange });

        await userEvent.click(toggle());
        expect(model.checked).toBe(true);
        expect(onChange).toHaveBeenLastCalledWith(true, model);

        await userEvent.click(screen.getByText("Maintenance mode"));
        expect(model.checked).toBe(false);
        expect(onChange).toHaveBeenLastCalledWith(false, model);
    });

    it("toggles with Space from the keyboard", async () => {
        const { model } = await mount(Switch, { id: "s", labelView: "Maintenance mode" });

        await userEvent.tab();
        await userEvent.keyboard(" ");

        expect(model.checked).toBe(true);
    });

    it("reflects checked assigned at runtime without raising onChange", async () => {
        const onChange = vi.fn();
        const { model } = await mount(Switch, { id: "s", onChange });

        model.checked = true;
        await settle();

        expect(toggle()).toBeChecked();
        expect(onChange).not.toHaveBeenCalled();
    });

    it("cannot be toggled while disabled", async () => {
        const onChange = vi.fn();
        const { model } = await mount(Switch, { id: "s", labelView: "Licensed feature", disabled: true, onChange });

        expect(frameOf("s")).toHaveClass("ueca-switch-disabled");
        expect(toggle()).toBeDisabled();
        await userEvent.click(screen.getByText("Licensed feature"));

        expect(model.checked).toBe(false);
        expect(onChange).not.toHaveBeenCalled();
    });

    it("shows helper text", async () => {
        const { model } = await mount(Switch, { id: "s", helperTextView: "Applies to new sessions" });
        expect(document.querySelector(".switch-helper-text")).toHaveTextContent("Applies to new sessions");

        model.helperTextView = undefined;
        await settle();

        expect(document.querySelector(".switch-helper-text")).toBeNull();
    });
});
