import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialog } from "@components";
import { mount, settle } from "@test";

// The panel carries the model's id; the backdrop is its parent and holds the stacking band.
function panelOf(id: string): HTMLElement {
    return document.getElementById(id);
}

function backdropOf(id: string): HTMLElement {
    return panelOf(id)?.parentElement;
}

function overlayZ(el: HTMLElement): number | undefined {
    const value = el?.style.getPropertyValue("--overlay-z");
    return value ? Number(value) : undefined;
}

describe("Dialog", () => {
    it("renders nothing while closed", async () => {
        const { container } = await mount(Dialog, { id: "dlg", titleView: "Title", contentView: "Body" });

        expect(container).toBeEmptyDOMElement();
        expect(document.querySelector(".ueca-dialog-backdrop")).toBeNull();
    });

    it("renders the title, content and close button inside a backdrop when opened", async () => {
        const { model } = await mount(Dialog, { id: "dlg", titleView: "Delete site", contentView: "It cannot be undone." });

        model.open = true;
        await settle();

        const panel = panelOf("dlg");
        expect(panel).toHaveClass("ueca-dialog", "dialog-max-sm");
        expect(panel).not.toHaveClass("dialog-fullscreen", "dialog-fullwidth");
        expect(panel.parentElement).toHaveClass("ueca-dialog-backdrop");
        expect(panel.querySelector(".dialog-title")).toHaveTextContent("Delete site");
        expect(panel.querySelector(".dialog-content-text")).toHaveTextContent("It cannot be undone.");
        expect(within(panel).getByRole("button", { name: "Close" })).toBeInTheDocument();
    });

    it("renders the actions bar only when there is an actionView", async () => {
        const { model } = await mount(Dialog, { id: "dlg", open: true, contentView: "Body" });
        expect(panelOf("dlg").querySelector(".dialog-actions")).toBeNull();

        model.actionView = <button type="button">Apply</button>;
        await settle();

        const actions = panelOf("dlg").querySelector(".dialog-actions");
        expect(actions).not.toBeNull();
        expect(within(actions as HTMLElement).getByRole("button", { name: "Apply" })).toBeInTheDocument();
    });

    it.each(["xs", "sm", "md", "lg", "xl"] as const)("applies the %s max-width rung", async (maxWidth) => {
        await mount(Dialog, { id: "dlg", open: true, maxWidth });

        expect(panelOf("dlg")).toHaveClass(`dialog-max-${maxWidth}`);
    });

    it("drops the max-width rung for maxWidth=false", async () => {
        await mount(Dialog, { id: "dlg", open: true, maxWidth: false });

        expect(panelOf("dlg").className).not.toMatch(/dialog-max-/);
    });

    it("reflects fullScreen and fullWidth in its classes", async () => {
        const { model } = await mount(Dialog, { id: "dlg", open: true, fullScreen: true });
        expect(panelOf("dlg")).toHaveClass("dialog-fullscreen");

        model.fullScreen = false;
        model.fullWidth = true;
        await settle();

        expect(panelOf("dlg")).not.toHaveClass("dialog-fullscreen");
        expect(panelOf("dlg")).toHaveClass("dialog-fullwidth");
    });

    describe("opening and closing", () => {
        it("raises onOpen with its model when opened and onClose when closed", async () => {
            const onOpen = vi.fn();
            const onClose = vi.fn();
            const { model } = await mount(Dialog, { id: "dlg", onOpen, onClose });

            model.open = true;
            await settle();
            expect(onOpen).toHaveBeenCalledOnce();
            expect(onOpen).toHaveBeenCalledWith(model);
            expect(onClose).not.toHaveBeenCalled();

            model.open = false;
            await settle();
            expect(onClose).toHaveBeenCalledOnce();
            expect(onClose).toHaveBeenCalledWith(model);
            expect(panelOf("dlg")).toBeNull();
        });

        it("raises onOpen for a dialog created already open", async () => {
            const onOpen = vi.fn();

            const { model } = await mount(Dialog, { id: "dlg", open: true, onOpen });

            expect(onOpen).toHaveBeenCalledOnce();
            expect(onOpen).toHaveBeenCalledWith(model);
            expect(panelOf("dlg")).toBeInTheDocument();
        });

        it("closes from the × button", async () => {
            const onClose = vi.fn();
            const { model } = await mount(Dialog, { id: "dlg", open: true, titleView: "Title", onClose });

            await userEvent.click(within(panelOf("dlg")).getByRole("button", { name: "Close" }));
            await settle();

            expect(model.open).toBe(false);
            expect(onClose).toHaveBeenCalledOnce();
            expect(document.querySelector(".ueca-dialog-backdrop")).toBeNull();
        });

        it("closes when the backdrop is clicked", async () => {
            const onClose = vi.fn();
            const { model } = await mount(Dialog, { id: "dlg", open: true, onClose });

            await userEvent.click(backdropOf("dlg"));
            await settle();

            expect(model.open).toBe(false);
            expect(onClose).toHaveBeenCalledOnce();
        });

        // The panel stops propagation, or every click on the dialog's own content would dismiss it.
        it("stays open when its content is clicked", async () => {
            const onClose = vi.fn();
            const { model } = await mount(Dialog, {
                id: "dlg",
                open: true,
                contentView: <span>Body text</span>,
                actionView: <button type="button">Apply</button>,
                onClose
            });

            await userEvent.click(screen.getByText("Body text"));
            await userEvent.click(screen.getByRole("button", { name: "Apply" }));
            await userEvent.click(panelOf("dlg"));
            await settle();

            expect(model.open).toBe(true);
            expect(onClose).not.toHaveBeenCalled();
        });
    });

    // Suspended, not closed: closing would settle the caller's promise and pop it off the manager's
    // stack, and releasing its band would bring it back UNDER a drawer it was raised over.
    it("hides without closing, keeping its content and its stacking band", async () => {
        const onClose = vi.fn();
        const { model } = await mount(Dialog, { id: "dlg", open: true, contentView: "Body", onClose });
        const z = overlayZ(backdropOf("dlg"));
        expect(z).toBeGreaterThan(0);

        model.hidden = true;
        await settle();

        expect(backdropOf("dlg")).toHaveClass("ueca-dialog-backdrop", "dialog-hidden");
        expect(panelOf("dlg")).toHaveTextContent("Body");
        expect(overlayZ(backdropOf("dlg"))).toBe(z);
        expect(model.open).toBe(true);
        expect(onClose).not.toHaveBeenCalled();

        model.hidden = false;
        await settle();

        expect(backdropOf("dlg")).not.toHaveClass("dialog-hidden");
    });

    // overlayStack.ts: the z is handed out in OPEN order so the most recently opened overlay wins,
    // and releasing the last one resets the ladder.
    describe("stacking", () => {
        it("takes the first band above the base while open", async () => {
            await mount(Dialog, { id: "dlg", open: true });

            expect(overlayZ(backdropOf("dlg"))).toBe(1310);
        });

        it("gives the most recently opened dialog the higher band", async () => {
            const { model: first } = await mount(Dialog, { id: "first" });
            const { model: second } = await mount(Dialog, { id: "second" });

            second.open = true;
            await settle();
            first.open = true;
            await settle();

            expect(overlayZ(backdropOf("second"))).toBe(1310);
            expect(overlayZ(backdropOf("first"))).toBe(1320);
        });

        // A dialog created open must not take a second band when its open state is first applied.
        it("holds exactly one band when created open", async () => {
            await mount(Dialog, { id: "first", open: true });
            await mount(Dialog, { id: "second", open: true });

            expect(overlayZ(backdropOf("first"))).toBe(1310);
            expect(overlayZ(backdropOf("second"))).toBe(1320);
        });

        it("keeps climbing while any overlay is still open, so a newer dialog stays on top", async () => {
            const { model: a } = await mount(Dialog, { id: "a", open: true });
            await mount(Dialog, { id: "b", open: true });
            const { model: c } = await mount(Dialog, { id: "c" });

            a.open = false;
            await settle();
            c.open = true;
            await settle();

            expect(overlayZ(backdropOf("b"))).toBe(1320);
            expect(overlayZ(backdropOf("c"))).toBe(1330);
        });

        it("resets the ladder once every dialog has closed", async () => {
            const { model: a } = await mount(Dialog, { id: "a", open: true });
            const { model: b } = await mount(Dialog, { id: "b", open: true });

            b.open = false;
            a.open = false;
            await settle();
            b.open = true;
            await settle();

            expect(overlayZ(backdropOf("b"))).toBe(1310);
        });

        it("reopening takes a fresh band above whatever is open now", async () => {
            const { model: a } = await mount(Dialog, { id: "a", open: true });
            await mount(Dialog, { id: "b", open: true });

            a.open = false;
            await settle();
            a.open = true;
            await settle();

            expect(overlayZ(backdropOf("a"))).toBe(1330);
        });

        // A dialog torn down while still open would otherwise hold its band for the session.
        it("releases its band when unmounted while open", async () => {
            const { unmount } = await mount(Dialog, { id: "gone", open: true });
            expect(overlayZ(backdropOf("gone"))).toBe(1310);

            unmount();
            await settle();
            await mount(Dialog, { id: "next", open: true });

            expect(overlayZ(backdropOf("next"))).toBe(1310);
        });
    });

    // Regression: the modal panel had no dialog semantics — no role="dialog", no aria-modal and no
    // accessible name from its title — so assistive technology could not tell a modal was up. The ×
    // is named precisely so a screen reader can find the way out (iconButton.tsx), which it cannot
    // do if it is never told it is inside a dialog.
    describe("accessibility", () => {
        it("exposes itself as a modal dialog named by its title, outside the tab order", async () => {
            await mount(Dialog, { id: "dlg", open: true, titleView: "Delete site", contentView: "Body" });

            const dialog = screen.getByRole("dialog", { name: "Delete site" });
            expect(dialog).toHaveAttribute("aria-modal", "true");
            expect(dialog).toBe(panelOf("dlg"));
            expect(dialog).toHaveAttribute("tabindex", "-1");
        });

        it("has no name without a title", async () => {
            await mount(Dialog, { id: "dlg", open: true, contentView: "Body" });

            expect(screen.getByRole("dialog")).not.toHaveAttribute("aria-labelledby");
        });

        it("moves focus into its panel when it opens and gives it back when it closes", async () => {
            render(<button type="button">Open</button>);
            const trigger = screen.getByRole("button", { name: "Open" });
            trigger.focus();
            const { model } = await mount(Dialog, { id: "dlg", titleView: "Delete site", contentView: "Body" });

            model.open = true;
            await settle();
            expect(screen.getByRole("dialog")).toHaveFocus();

            await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Close" }));
            await settle();

            expect(trigger).toHaveFocus();
        });

        // The way AppDialogManager shows every dialog.
        it("takes focus when created already open", async () => {
            render(<button type="button">Open</button>);
            screen.getByRole("button", { name: "Open" }).focus();

            await mount(Dialog, { id: "dlg", open: true, titleView: "Delete site", contentView: "Body" });

            expect(screen.getByRole("dialog")).toHaveFocus();
        });

        // Dialog.Close removes the dialog from the manager's stack rather than closing it.
        it("gives focus back when it is removed while still open", async () => {
            render(<button type="button">Open</button>);
            const trigger = screen.getByRole("button", { name: "Open" });
            trigger.focus();
            const { unmount } = await mount(Dialog, { id: "dlg", open: true, titleView: "Delete site", contentView: "Body" });
            expect(screen.getByRole("dialog")).toHaveFocus();

            unmount();
            await settle();

            expect(trigger).toHaveFocus();
        });

        it("leaves focus where the user moved it before the dialog closed", async () => {
            render(<><button type="button">Open</button><input aria-label="Elsewhere" /></>);
            screen.getByRole("button", { name: "Open" }).focus();
            const { model } = await mount(Dialog, { id: "dlg", titleView: "Delete site", contentView: "Body" });
            model.open = true;
            await settle();

            screen.getByRole("textbox", { name: "Elsewhere" }).focus();
            model.open = false;
            await settle();

            expect(screen.getByRole("textbox", { name: "Elsewhere" })).toHaveFocus();
        });

        // Suspended while something it opened covers it (AlertDialog's details), it must not pull
        // focus back from what is on top.
        it("waits until it is shown before taking focus", async () => {
            render(<button type="button">Open</button>);
            const trigger = screen.getByRole("button", { name: "Open" });
            trigger.focus();
            const { model } = await mount(Dialog, { id: "dlg", titleView: "Delete site", contentView: "Body", hidden: true });

            model.open = true;
            await settle();
            expect(trigger).toHaveFocus();

            model.hidden = false;
            await settle();
            expect(screen.getByRole("dialog")).toHaveFocus();
        });

        // A browser neither keeps nor gives focus to an element inside a hidden subtree, so focus can
        // be lost while the dialog is suspended; shown again, the dialog takes it back.
        it("takes focus back when shown again after losing it while hidden", async () => {
            const { model } = await mount(Dialog, { id: "dlg", open: true, titleView: "Delete site", contentView: "Body" });
            model.hidden = true;
            await settle();
            (document.activeElement as HTMLElement).blur();
            expect(document.body).toHaveFocus();

            model.hidden = false;
            await settle();

            expect(screen.getByRole("dialog")).toHaveFocus();
        });

        it("leaves focus on a control inside it when shown again", async () => {
            const { model } = await mount(Dialog, {
                id: "dlg", open: true, titleView: "Delete site", contentView: <button type="button">Show details</button>
            });
            model.hidden = true;
            await settle();
            screen.getByRole("button", { name: "Show details" }).focus();

            model.hidden = false;
            await settle();

            expect(screen.getByRole("button", { name: "Show details" })).toHaveFocus();
        });
    });
});
