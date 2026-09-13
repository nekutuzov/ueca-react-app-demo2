import { describe, expect, it, vi } from "vitest";
import { within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AlertDrawer, AlertDrawerModel } from "@components";
import { mount, settle, takeUecaErrors } from "@test";

function drawerPanel(): HTMLElement {
    return document.getElementById("ald.drawer");
}

function footerButtons(): HTMLElement[] {
    const actions = drawerPanel().querySelector(".drawer-actions") as HTMLElement;
    return within(actions).queryAllByRole("button");
}

async function clickInDrawer(name: string) {
    await userEvent.click(within(drawerPanel()).getByRole("button", { name }));
    await settle();
}

describe("AlertDrawer", () => {
    it("renders nothing while closed", async () => {
        const { container } = await mount(AlertDrawer, { id: "ald", titleView: "Details", contentView: "Body" });

        expect(container).toBeEmptyDOMElement();
    });

    it("opens a right-anchored drawer with its title, content and a Cancel button by default", async () => {
        const { model } = await mount(AlertDrawer, { id: "ald", titleView: "Error Details", contentView: "stack trace" });

        model.open = true;
        await settle();

        expect(drawerPanel()).toHaveClass("ueca-drawer", "drawer-anchor-right", "drawer-open");
        expect(drawerPanel().querySelector(".drawer-title")).toHaveTextContent("Error Details");
        expect(drawerPanel().querySelector(".drawer-content")).toHaveTextContent("stack trace");
        expect(footerButtons().map((button) => button.textContent)).toEqual(["Cancel"]);
    });

    // No type of its own: the heading wears the Drawer's --drawer-title-* tokens, which an inline
    // font-size here used to override.
    it("leaves the heading's type to the drawer's title tokens", async () => {
        await mount(AlertDrawer, { id: "ald", open: true, titleView: "Error Details", severity: "error" });

        const heading = within(drawerPanel().querySelector(".drawer-title") as HTMLElement).getByText("Error Details");
        expect(heading.style.fontSize).toBe("");
        expect(heading.style.fontWeight).toBe("");
    });

    it("forwards its anchor and width to the drawer", async () => {
        const { model } = await mount(AlertDrawer, { id: "ald", open: true, anchor: "left", width: 420 });
        expect(drawerPanel()).toHaveClass("drawer-anchor-left");
        expect(drawerPanel().style.width).toBe("420px");

        model.width = "65%";
        await settle();

        expect(drawerPanel().style.width).toBe("65%");
    });

    describe("buttons", () => {
        it.each([
            ["okCancel", { okCancel: true }, ["Cancel", "OK"]],
            ["ok", { ok: true }, ["OK"]],
            ["cancel", { cancel: true }, ["Cancel"]],
            ["nothing", {}, []]
        ] as [string, AlertDrawerModel["buttons"], string[]][])("offers %s", async (_, buttons, expected) => {
            await mount(AlertDrawer, { id: "ald", open: true, buttons });

            expect(footerButtons().map((button) => button.textContent)).toEqual(expected);
        });

        // A panel footer's buttons sit on the 32px rung, as EditDrawer's do — one above the
        // dialog's 24px answers — with OK as the primary action.
        it("sizes its buttons for a panel footer, with OK as the contained primary action", async () => {
            await mount(AlertDrawer, { id: "ald", open: true, buttons: { okCancel: true } });

            const [cancel, ok] = footerButtons();
            expect(cancel).toHaveClass("ueca-button-outlined", "ueca-button-small");
            expect(ok).toHaveClass("ueca-button-contained", "ueca-button-small");
            expect(ok.style.getPropertyValue("--button-color")).toBe("var(--accent)");
        });

        it("draws a customActionView ahead of the standard buttons", async () => {
            await mount(AlertDrawer, {
                id: "ald", open: true, buttons: { okCancel: true }, customActionView: <button type="button">Copy</button>
            });

            expect(footerButtons().map((button) => button.textContent)).toEqual(["Copy", "Cancel", "OK"]);
        });

        it.each([
            ["OK", true],
            ["Cancel", false]
        ] as const)("%s closes the drawer and reports %s", async (name, result) => {
            const onClose = vi.fn();
            const { model } = await mount(AlertDrawer, { id: "ald", open: true, buttons: { okCancel: true }, onClose });

            await clickInDrawer(name);

            expect(onClose).toHaveBeenCalledExactlyOnceWith(result, model);
            expect(model.open).toBe(false);
            expect(drawerPanel()).toBeNull();
        });

        it("reports false from the ×", async () => {
            const onClose = vi.fn();
            const { model } = await mount(AlertDrawer, { id: "ald", open: true, buttons: { okCancel: true }, onClose });

            await clickInDrawer("Close");

            expect(onClose).toHaveBeenCalledExactlyOnceWith(false, model);
        });

        // Regression: closeResult was set by OK/Cancel but never reset when the drawer opened again
        // (the AlertDialog resets its own on open for exactly this reason), so dismissing a reopened
        // drawer with the × reported the PREVIOUS answer — an earlier OK came back as true.
        it("reports false from the × even after an earlier OK", async () => {
            const onClose = vi.fn();
            const { model } = await mount(AlertDrawer, { id: "ald", open: true, buttons: { okCancel: true }, onClose });
            await clickInDrawer("OK");

            model.open = true;
            await settle();
            await clickInDrawer("Close");

            expect(onClose).toHaveBeenLastCalledWith(false, model);
        });
    });

    describe("severity", () => {
        it.each(["success", "info", "warning", "error"] as const)("puts the %s icon, in its colour, before the title", async (severity) => {
            await mount(AlertDrawer, { id: "ald", open: true, titleView: "Title", severity });

            const title = drawerPanel().querySelector(".drawer-title") as HTMLElement;
            const icon = title.querySelector("svg:not(.ueca-icon-button svg)");
            expect(icon).toHaveAttribute("color", `var(--${severity})`);
            // The icon's wrapper comes first in the heading row, the title text after it.
            expect(within(title).getByText("Title").previousElementSibling).toContainElement(icon as HTMLElement);
        });

        it.each([
            ["no severity", undefined],
            ["severity none", "none"]
        ] as const)("shows no icon with %s", async (_, severity) => {
            await mount(AlertDrawer, { id: "ald", open: true, titleView: "Title", severity });

            const title = drawerPanel().querySelector(".drawer-title") as HTMLElement;
            // The only glyph left in the heading is the ×.
            expect(title.querySelectorAll("svg")).toHaveLength(1);
            expect(within(title).getByRole("button", { name: "Close" })).toBeInTheDocument();
        });
    });

    describe("modal mode", () => {
        it("raises onOpen with its own model", async () => {
            const onOpen = vi.fn();
            const { model } = await mount(AlertDrawer, { id: "ald", onOpen });

            model.open = true;
            await settle();

            expect(onOpen).toHaveBeenCalledExactlyOnceWith(model);
        });

        it("raises onOpen and enters modal mode once when created open", async () => {
            const onOpen = vi.fn();
            const { model } = await mount(AlertDrawer, { id: "ald", open: true, onOpen });
            expect(onOpen).toHaveBeenCalledExactlyOnceWith(model);
            expect(model.activeModalDialog()).toBe(model);

            model.open = false;
            await settle();

            expect(model.activeModalDialog()).not.toBe(model);
        });

        it("stacks 100 above an overlay already in modal mode, and hands back on close", async () => {
            const { model: under } = await mount(AlertDrawer, { id: "under", open: true });
            const { model: over } = await mount(AlertDrawer, { id: "ald" });

            over.open = true;
            await settle();
            expect(over.zIndex).toBe(under.zIndex + 100);
            expect(over.activeModalDialog()).toBe(over);

            over.open = false;
            await settle();
            expect(under.activeModalDialog()).toBe(under);

            under.open = false;
            await settle();
        });

        it("leaves modal mode even when the owner's onClose throws", async () => {
            const { model } = await mount(AlertDrawer, {
                id: "ald",
                open: true,
                buttons: { ok: true },
                onClose: () => { throw new Error("owner failed"); }
            });

            await clickInDrawer("OK");

            expect(model.activeModalDialog()).not.toBe(model);
            expect(takeUecaErrors()).toEqual([expect.objectContaining({ message: "owner failed" })]);
        });

        // Regression: as in AlertDialog, modal mode was left only on close, so a drawer removed while
        // still open stayed on uiBase's modal stack for the session and every later overlay's zIndex
        // came out 100 higher. Nothing paints zIndex today (the painted z comes from overlayStack,
        // which Drawer releases on unmount), so the leak was a held reference rather than a visible one.
        it("leaves modal mode when unmounted while still open", async () => {
            const { model, unmount } = await mount(AlertDrawer, { id: "ald", open: true });

            unmount();
            await settle();

            try {
                expect(model.activeModalDialog()).not.toBe(model);
            } finally {
                model.leaveModalMode();
            }
        });
    });
});
