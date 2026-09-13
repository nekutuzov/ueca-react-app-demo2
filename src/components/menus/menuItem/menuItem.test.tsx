import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Icon, MenuItem } from "@components";
import { mount, settle, stubMessages } from "@test";

function row(): HTMLElement {
    return document.getElementById("mi");
}

describe("MenuItem", () => {
    it("renders a menuitem button with its label and an empty icon gutter", async () => {
        await mount(MenuItem, { id: "mi", labelView: "Export as CSV" });

        const item = screen.getByRole("menuitem", { name: "Export as CSV" });
        expect(item).toBe(row());
        expect(item.tagName).toBe("BUTTON");
        expect(item).toHaveAttribute("type", "button");
        expect(item).toHaveClass("ueca-menuitem");
        expect(item).not.toHaveClass("danger");
        expect(item).toBeEnabled();
        // The gutter is always there, so labels line up whether or not a row has an icon.
        expect(item.querySelector(".ueca-menuitem-icon")).toBeEmptyDOMElement();
        expect(item.querySelector(".ueca-menuitem-label")).toHaveTextContent("Export as CSV");
        expect(item.querySelector(".ueca-menuitem-shortcut")).toBeNull();
        expect(item.previousElementSibling).toBeNull();
    });

    // A role from the registry (the selected-row checkmark is the "check" role), drawn small.
    it("draws its registry icon in the gutter at the small size", async () => {
        const { container: reference } = render(<Icon name="check" size="sm" />);

        await mount(MenuItem, { id: "mi", labelView: "Show archived", iconName: "check" });

        const gutter = row().querySelector(".ueca-menuitem-icon");
        expect(gutter.innerHTML).toBe(reference.innerHTML);
        expect(gutter.querySelector(".ueca-icon")).toHaveStyle({ fontSize: "var(--icon-sm)" });
    });

    it("shows its shortcut as a hint beside the label", async () => {
        await mount(MenuItem, { id: "mi", labelView: "Print", shortcut: "Ctrl+P" });

        expect(row().querySelector(".ueca-menuitem-label")).toHaveTextContent("Print");
        expect(row().querySelector(".ueca-menuitem-shortcut")).toHaveTextContent("Ctrl+P");
    });

    it("marks a destructive action with the danger class", async () => {
        await mount(MenuItem, { id: "mi", labelView: "Delete site", danger: true });

        expect(row()).toHaveClass("ueca-menuitem", "danger");
    });

    it("draws a divider directly above itself when separatorBefore is set", async () => {
        const { model } = await mount(MenuItem, { id: "mi", labelView: "Delete site", separatorBefore: true });

        const separator = screen.getByRole("separator");
        expect(separator).toHaveClass("ueca-menu-separator");
        expect(row().previousElementSibling).toBe(separator);

        model.separatorBefore = false;
        await settle();

        expect(screen.queryByRole("separator")).toBeNull();
    });

    it("follows runtime changes to its label, icon and shortcut", async () => {
        const { model } = await mount(MenuItem, { id: "mi", labelView: "Refresh" });

        model.labelView = <em>Reload</em>;
        model.iconName = "refresh";
        model.shortcut = "F5";
        await settle();

        expect(row().querySelector(".ueca-menuitem-label em")).toHaveTextContent("Reload");
        expect(row().querySelector(".ueca-menuitem-icon svg")).not.toBeNull();
        expect(row().querySelector(".ueca-menuitem-shortcut")).toHaveTextContent("F5");
    });

    describe("clicking", () => {
        it("raises onClick with its model", async () => {
            const onClick = vi.fn();
            const { model } = await mount(MenuItem, { id: "mi", labelView: "Export", onClick });

            await userEvent.click(row());

            expect(onClick).toHaveBeenCalledExactlyOnceWith(model);
        });

        // Rows are real buttons, so keyboard activation is native — there is no roving index.
        it.each(["{Enter}", " "])("activates from the keyboard with %s", async (key) => {
            const onClick = vi.fn();
            await mount(MenuItem, { id: "mi", labelView: "Export", onClick });

            row().focus();
            await userEvent.keyboard(key);

            expect(onClick).toHaveBeenCalledOnce();
        });

        it("does nothing, and reports nothing, when clicked without an onClick", async () => {
            const bus = await stubMessages({ "App.UnhandledException": vi.fn(async () => { }) });
            await mount(MenuItem, { id: "mi", labelView: "Placeholder" });

            await userEvent.click(row());
            await settle();

            expect(bus["App.UnhandledException"]).not.toHaveBeenCalled();
        });

        it("is disabled and ignores clicks while disabled, until re-enabled", async () => {
            const onClick = vi.fn();
            const { model } = await mount(MenuItem, { id: "mi", labelView: "Restore archived", disabled: true, onClick });

            expect(row()).toBeDisabled();
            await userEvent.click(row());
            expect(onClick).not.toHaveBeenCalled();

            model.disabled = false;
            await settle();
            await userEvent.click(row());

            expect(onClick).toHaveBeenCalledOnce();
        });
    });
});
