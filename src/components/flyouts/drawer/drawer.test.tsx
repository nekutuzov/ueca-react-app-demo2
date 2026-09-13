import { describe, expect, it, vi } from "vitest";
import { within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialog, Drawer } from "@components";
import { mount, settle } from "@test";

function panelOf(id: string): HTMLElement {
    return document.getElementById(id);
}

function backdrop(): HTMLElement {
    return document.querySelector(".ueca-drawer-backdrop");
}

function overlayZ(el: HTMLElement): number | undefined {
    const value = el?.style.getPropertyValue("--overlay-z");
    return value ? Number(value) : undefined;
}

describe("Drawer", () => {
    it("renders nothing while a temporary drawer is closed", async () => {
        const { container } = await mount(Drawer, { id: "drw", titleView: "Title", contentView: "Body" });

        expect(container).toBeEmptyDOMElement();
    });

    it("opens as a left-anchored temporary panel with a backdrop, title, content and ×", async () => {
        const { model } = await mount(Drawer, { id: "drw", titleView: "Filters", contentView: "Body" });

        model.open = true;
        await settle();

        const panel = panelOf("drw");
        expect(panel).toHaveClass("ueca-drawer", "drawer-anchor-left", "drawer-open");
        expect(panel.querySelector(".drawer-title")).toHaveTextContent("Filters");
        expect(panel.querySelector(".drawer-content")).toHaveTextContent("Body");
        expect(within(panel).getByRole("button", { name: "Close" })).toBeInTheDocument();
        expect(panel.querySelector(".drawer-actions")).toBeNull();
        expect(backdrop()).toBeInTheDocument();
        // No width asked for: the theme token sizes it.
        expect(panel.style.width).toBe("");
        expect(panel.style.height).toBe("");
    });

    it("renders the actions bar only when there is an actionView", async () => {
        await mount(Drawer, { id: "drw", open: true, actionView: <button type="button">Apply</button> });

        const actions = panelOf("drw").querySelector(".drawer-actions") as HTMLElement;
        expect(within(actions).getByRole("button", { name: "Apply" })).toBeInTheDocument();
    });

    it.each(["left", "right", "top", "bottom"] as const)("anchors to the %s edge", async (anchor) => {
        await mount(Drawer, { id: "drw", open: true, anchor });

        expect(panelOf("drw")).toHaveClass(`drawer-anchor-${anchor}`);
    });

    // A bare number is pixels; a string is any CSS length (a share of the viewport).
    it.each([
        [320, "320px"],
        ["65%", "65%"]
    ] as const)("sizes a side drawer's width from %s", async (width, expected) => {
        await mount(Drawer, { id: "drw", open: true, anchor: "right", width });

        expect(panelOf("drw").style.width).toBe(expected);
        expect(panelOf("drw").style.height).toBe("");
    });

    it.each(["top", "bottom"] as const)("sizes a %s drawer's height, 600px by default and capped at 60vh", async (anchor) => {
        const { model } = await mount(Drawer, { id: "drw", open: true, anchor });
        expect(panelOf("drw")).toHaveStyle({ height: "600px", maxHeight: "60vh" });
        expect(panelOf("drw").style.width).toBe("");

        model.width = "40%";
        await settle();

        expect(panelOf("drw")).toHaveStyle({ height: "40%", maxHeight: "60vh" });
        expect(panelOf("drw").style.width).toBe("");
    });

    describe("opening and closing", () => {
        it("raises onOpen and onClose with its model", async () => {
            const onOpen = vi.fn();
            const onClose = vi.fn();
            const { model } = await mount(Drawer, { id: "drw", onOpen, onClose });

            model.open = true;
            await settle();
            expect(onOpen).toHaveBeenCalledExactlyOnceWith(model);

            model.open = false;
            await settle();
            expect(onClose).toHaveBeenCalledExactlyOnceWith(model);
            expect(panelOf("drw")).toBeNull();
            expect(backdrop()).toBeNull();
        });

        it("raises onOpen for a drawer created already open", async () => {
            const onOpen = vi.fn();

            const { model } = await mount(Drawer, { id: "drw", open: true, onOpen });

            expect(onOpen).toHaveBeenCalledExactlyOnceWith(model);
        });

        it("closes from the × button", async () => {
            const onClose = vi.fn();
            const { model } = await mount(Drawer, { id: "drw", open: true, onClose });

            await userEvent.click(within(panelOf("drw")).getByRole("button", { name: "Close" }));
            await settle();

            expect(model.open).toBe(false);
            expect(onClose).toHaveBeenCalledOnce();
        });

        it("closes when the backdrop is clicked", async () => {
            const { model } = await mount(Drawer, { id: "drw", open: true });

            await userEvent.click(backdrop());
            await settle();

            expect(model.open).toBe(false);
            expect(panelOf("drw")).toBeNull();
        });

        it("stays open when its own content is clicked", async () => {
            const { model } = await mount(Drawer, { id: "drw", open: true, contentView: <span>Body text</span> });

            await userEvent.click(within(panelOf("drw")).getByText("Body text"));
            await settle();

            expect(model.open).toBe(true);
        });
    });

    describe("variants", () => {
        it("keeps a permanent drawer on screen while closed, with no backdrop, no × and no band", async () => {
            const { model } = await mount(Drawer, { id: "drw", variant: "permanent", titleView: "Nav" });

            const panel = panelOf("drw");
            expect(panel).toHaveClass("ueca-drawer", "drawer-closed");
            expect(panel).toHaveTextContent("Nav");
            expect(within(panel).queryByRole("button", { name: "Close" })).toBeNull();
            expect(backdrop()).toBeNull();
            expect(overlayZ(panel)).toBeUndefined();

            model.open = true;
            await settle();

            expect(panelOf("drw")).toHaveClass("drawer-open");
            expect(backdrop()).toBeNull();
            expect(within(panelOf("drw")).queryByRole("button", { name: "Close" })).toBeNull();
        });

        it("shows a persistent drawer only while open, with a × but no backdrop", async () => {
            const { model } = await mount(Drawer, { id: "drw", variant: "persistent" });
            expect(panelOf("drw")).toBeNull();

            model.open = true;
            await settle();

            expect(panelOf("drw")).toHaveClass("drawer-open");
            expect(within(panelOf("drw")).getByRole("button", { name: "Close" })).toBeInTheDocument();
            expect(backdrop()).toBeNull();
        });
    });

    // overlayStack.ts: an overlay owns a band — its backdrop at z and its panel one step above, at
    // z + 1 — and the most recently opened overlay always wins.
    describe("stacking", () => {
        it("puts the backdrop at its band and the panel one step above it", async () => {
            await mount(Drawer, { id: "drw", open: true });

            expect(overlayZ(backdrop())).toBe(1310);
            expect(overlayZ(panelOf("drw"))).toBe(1311);
        });

        it("releases its band on close, so the ladder resets", async () => {
            const { model } = await mount(Drawer, { id: "drw", open: true });

            model.open = false;
            await settle();
            model.open = true;
            await settle();

            expect(overlayZ(panelOf("drw"))).toBe(1311);
        });

        // A drawer torn down while still open would otherwise hold its band for the session.
        it("releases its band when unmounted while open", async () => {
            const { unmount } = await mount(Drawer, { id: "gone", open: true });

            unmount();
            await settle();
            await mount(Drawer, { id: "next", open: true });

            expect(overlayZ(panelOf("next"))).toBe(1311);
        });

        // The bug overlayStack.ts records: with fixed bands the dialog backdrop sat BELOW the drawer,
        // so "Delete" inside a drawer opened a confirmation nobody could see.
        it("puts a dialog opened from inside a drawer above that drawer", async () => {
            await mount(Drawer, { id: "drw", open: true });
            const { model: dialog } = await mount(Dialog, { id: "confirm" });

            dialog.open = true;
            await settle();

            const dialogBackdrop = document.getElementById("confirm").parentElement;
            expect(overlayZ(dialogBackdrop)).toBeGreaterThan(overlayZ(panelOf("drw")));
        });

        it("puts a drawer opened from a dialog above that dialog", async () => {
            await mount(Dialog, { id: "dlg", open: true });
            const { model: drawer } = await mount(Drawer, { id: "drw" });

            drawer.open = true;
            await settle();

            const dialogBackdrop = document.getElementById("dlg").parentElement;
            expect(overlayZ(backdrop())).toBeGreaterThan(overlayZ(dialogBackdrop));
        });

        it("resets the ladder only after both the drawer and the dialog above it close", async () => {
            const { model: drawer } = await mount(Drawer, { id: "drw", open: true });
            const { model: dialog } = await mount(Dialog, { id: "dlg", open: true });

            dialog.open = false;
            await settle();
            dialog.open = true;
            await settle();
            // The drawer still holds 1310, so the dialog climbs rather than landing under it.
            expect(overlayZ(document.getElementById("dlg").parentElement)).toBe(1330);

            dialog.open = false;
            drawer.open = false;
            await settle();
            drawer.open = true;
            await settle();

            expect(overlayZ(backdrop())).toBe(1310);
        });
    });
});
