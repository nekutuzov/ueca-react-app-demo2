import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as UECA from "ueca-react";
import {
    ButtonModel, MenuItemModel, MenuList, MenuSeparator, PopoverModel, useButton, useMenuItem, usePopover
} from "@components";
import { mount, settle } from "@test";

describe("MenuList", () => {
    it("wraps its rows in a menu", () => {
        render(
            <MenuList>
                <button type="button" role="menuitem">Export</button>
                <button type="button" role="menuitem">Print</button>
            </MenuList>
        );

        const menu = screen.getByRole("menu");
        expect(menu).toHaveClass("ueca-menulist");
        expect(within(menu).getAllByRole("menuitem").map((item) => item.textContent)).toEqual(["Export", "Print"]);
    });

    it("renders an empty menu without children", () => {
        render(<MenuList />);

        expect(screen.getByRole("menu")).toBeEmptyDOMElement();
    });
});

describe("MenuSeparator", () => {
    it("renders a divider", () => {
        render(<MenuSeparator />);

        expect(screen.getByRole("separator")).toHaveClass("ueca-menu-separator");
    });
});

// The composition the screens use (overlaysTopic, ScreenLayout's "…" menu): MenuItem children on the
// owner's model, composed into a MenuList inside a Popover opened from a trigger button.
describe("a menu composed in a Popover", () => {
    async function openMenu() {
        const { model } = await mount(MenuHost, { id: "host" });
        await userEvent.click(screen.getByRole("button", { name: "Actions" }));
        await settle();
        return model;
    }

    it("opens from its trigger, listing the rows in order with the disabled one unavailable", async () => {
        const host = await openMenu();

        expect(host.menuPopover.open).toBe(true);
        const menu = within(document.getElementById("host.menuPopover")).getByRole("menu");
        const items = within(menu).getAllByRole("menuitem");
        expect(items.map((item) => item.textContent)).toEqual(["Export", "Restore archived", "Delete site"]);
        expect(items[1]).toBeDisabled();
        expect(items[2]).toHaveClass("danger");
        expect(items[2].previousElementSibling).toHaveAttribute("role", "separator");
    });

    it("runs the chosen row and closes the menu", async () => {
        const host = await openMenu();

        await userEvent.click(screen.getByRole("menuitem", { name: "Export" }));
        await settle();

        expect(host.lastChoice).toBe("export");
        expect(host.menuPopover.open).toBe(false);
        expect(screen.queryByRole("menu")).toBeNull();
    });

    it("ignores the disabled row and stays open", async () => {
        const host = await openMenu();

        await userEvent.click(screen.getByRole("menuitem", { name: "Restore archived" }));
        await settle();

        expect(host.lastChoice).toBeUndefined();
        expect(host.menuPopover.open).toBe(true);
    });

    // Without onGetTrigger the popover's capture-phase outside-click close runs on mousedown, and
    // the trigger's click that follows re-opens it: the trigger could never toggle the menu shut.
    it("toggles shut from its trigger", async () => {
        const host = await openMenu();

        await userEvent.click(screen.getByRole("button", { name: "Actions" }));
        await settle();

        expect(host.menuPopover.open).toBe(false);
        expect(screen.queryByRole("menu")).toBeNull();
    });

    it("dismisses on Escape and on a click outside, without choosing", async () => {
        const host = await openMenu();

        fireEvent.keyDown(document.body, { key: "Escape" });
        await settle();
        expect(host.menuPopover.open).toBe(false);

        await userEvent.click(screen.getByRole("button", { name: "Actions" }));
        await settle();
        expect(host.menuPopover.open).toBe(true);

        fireEvent.mouseDown(document.body);
        await settle();

        expect(host.menuPopover.open).toBe(false);
        expect(host.lastChoice).toBeUndefined();
    });
});

type MenuHostStruct = UECA.ComponentStruct<{
    props: {
        lastChoice: string;
    };

    children: {
        menuButton: ButtonModel;
        menuPopover: PopoverModel;
        exportItem: MenuItemModel;
        archivedItem: MenuItemModel;
        deleteItem: MenuItemModel;
    };
}>;

function useMenuHost(params?: UECA.ComponentParams<MenuHostStruct>) {
    const struct: MenuHostStruct = {
        props: {
            id: useMenuHost.name,
            lastChoice: undefined
        },

        children: {
            menuButton: useButton({
                contentView: "Actions",
                onClick: (source) => {
                    if (model.menuPopover.open) {
                        model.menuPopover.close();
                        return;
                    }
                    const r = document.getElementById(source.htmlId()).getBoundingClientRect();
                    model.menuPopover.anchor = { top: r.top, left: r.left, width: r.width, height: r.height };
                    model.menuPopover.open = true;
                }
            }),

            menuPopover: usePopover({
                placement: "bottom",
                className: "ueca-popover-menu",
                onGetTrigger: () => document.getElementById(model.menuButton.htmlId()),
                contentView: () => (
                    <MenuList>
                        <model.exportItem.View />
                        <model.archivedItem.View />
                        <model.deleteItem.View />
                    </MenuList>
                )
            }),

            exportItem: useMenuItem({ labelView: "Export", iconName: "exportFile", onClick: () => _chose("export") }),
            archivedItem: useMenuItem({ labelView: "Restore archived", disabled: true, onClick: () => _chose("restore") }),
            deleteItem: useMenuItem({ labelView: "Delete site", danger: true, separatorBefore: true, onClick: () => _chose("delete") })
        },

        View: () => (
            <div id={model.htmlId()}>
                <model.menuButton.View />
                <model.menuPopover.View />
            </div>
        )
    };

    const model = UECA.useComponent(struct, params);
    return model;

    function _chose(choice: string) {
        model.lastChoice = choice;
        model.menuPopover.close();
    }
}

const MenuHost = UECA.getFC(useMenuHost);
