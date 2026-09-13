import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { Tab } from "@components";
import { mount, settle } from "@test";

// Selection by click needs a TabsContainer, so clicks are covered in tabsContainer.test.tsx.
describe("Tab", () => {
    it("renders an enabled tab button with its label and no icon", async () => {
        await mount(Tab, { id: "tab", labelView: "General" });

        const button = screen.getByRole("button", { name: "General" });
        expect(button).toHaveAttribute("id", "tab");
        expect(button).toHaveAttribute("class", "ueca-tab");
        expect(button).toBeEnabled();
        expect(button.querySelector(".ueca-tab-label")).toHaveTextContent("General");
        expect(button.querySelector(".ueca-tab-icon")).toBeNull();
    });

    it.each(["top", "bottom", "start", "end"] as const)("places the icon %s of the label", async (iconPosition) => {
        await mount(Tab, { id: "tab", labelView: "General", iconView: <i data-testid="icon" />, iconPosition });

        const button = screen.getByRole("button");
        expect(button).toHaveClass(`icon-${iconPosition}`);
        expect(button.querySelector(".ueca-tab-icon")).toContainElement(screen.getByTestId("icon"));
    });

    it("puts the icon on top by default", async () => {
        await mount(Tab, { id: "tab", labelView: "General", iconView: <i /> });

        expect(screen.getByRole("button")).toHaveAttribute("class", "ueca-tab icon-top");
    });

    it("takes no icon position class without an icon", async () => {
        await mount(Tab, { id: "tab", labelView: "General", iconPosition: "end" });

        expect(screen.getByRole("button")).toHaveAttribute("class", "ueca-tab");
    });

    it("renders an icon-only tab without a label element", async () => {
        await mount(Tab, { id: "tab", iconView: <i data-testid="icon" /> });

        const button = screen.getByRole("button");
        expect(button.querySelector(".ueca-tab-label")).toBeNull();
        expect(button).toContainElement(screen.getByTestId("icon"));
    });

    it("reflects selected and wrapped in its classes", async () => {
        const { model } = await mount(Tab, { id: "tab", labelView: "A long label that wraps", wrapped: true });
        expect(screen.getByRole("button")).toHaveAttribute("class", "ueca-tab wrapped");

        model.selected = true;
        await settle();
        expect(screen.getByRole("button")).toHaveAttribute("class", "ueca-tab selected wrapped");

        model.selected = false;
        model.wrapped = false;
        await settle();
        expect(screen.getByRole("button")).toHaveAttribute("class", "ueca-tab");
    });

    it("disables its button", async () => {
        const { model } = await mount(Tab, { id: "tab", labelView: "General", disabled: true });
        expect(screen.getByRole("button")).toBeDisabled();

        model.disabled = false;
        await settle();

        expect(screen.getByRole("button")).toBeEnabled();
    });

    it("renders nothing while invisible and comes back when made visible", async () => {
        const { model } = await mount(Tab, { id: "tab", labelView: "General", visible: false });
        expect(screen.queryByRole("button")).toBeNull();

        model.visible = true;
        await settle();

        expect(screen.getByRole("button", { name: "General" })).toBeInTheDocument();
    });

    it("shows a failed validation as invalid until the errors are reset", async () => {
        const { model } = await mount(Tab, { id: "tab", labelView: "General", onValidate: async () => "Name is required" });
        expect(model.isValid()).toBe(true);

        await model.validate();
        await settle();
        expect(model.getValidationError()).toBe("Name is required");
        expect(screen.getByRole("button")).toHaveClass("invalid");

        model.resetValidationErrors();
        await settle();
        expect(screen.getByRole("button")).not.toHaveClass("invalid");
    });

    it("identifies itself by tabId, falling back to its id", async () => {
        const { model } = await mount(Tab, { id: "tab", labelView: "General" });
        expect(model.getTabId()).toBe("tab");

        model.tabId = "general";

        expect(model.getTabId()).toBe("general");
    });
});
