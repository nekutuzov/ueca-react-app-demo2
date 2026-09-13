import { describe, expect, it, vi } from "vitest";
import { within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AlertDialog, AlertDialogModel, UIBaseModel } from "@components";
import { mount, settle, takeUecaErrors } from "@test";

// Child ids are dotted paths under the AlertDialog's id "ad".
function dialogPanel(id = "ad"): HTMLElement {
    return document.getElementById(`${id}.dialog`);
}

function detailsPanel(id = "ad"): HTMLElement {
    return document.getElementById(`${id}.detailsDrawer.drawer`);
}

// The footer's buttons, in the order they are drawn.
function footerButtons(): string[] {
    const actions = dialogPanel().querySelector(".dialog-actions") as HTMLElement;
    return within(actions).queryAllByRole("button").map((button) => button.textContent);
}

async function clickInDialog(name: string) {
    await userEvent.click(within(dialogPanel()).getByRole("button", { name }));
    await settle();
}

// Overlays left open when a test unmounts them stay on uiBase's module-level modal stack, so a test
// asserting an absolute zIndex starts from an empty stack.
function drainModalStack(model: UIBaseModel) {
    for (let top = model.activeModalDialog(); top; top = model.activeModalDialog()) {
        top.leaveModalMode();
    }
}

describe("AlertDialog", () => {
    it("renders nothing while closed", async () => {
        const { container } = await mount(AlertDialog, { id: "ad", titleView: "Title", contentView: "Body" });

        expect(container).toBeEmptyDOMElement();
    });

    it("opens a full-width dialog with the title, the message and a Cancel answer by default", async () => {
        const { model } = await mount(AlertDialog, { id: "ad", titleView: "Heads up", contentView: "Something happened." });

        model.open = true;
        await settle();

        expect(dialogPanel()).toHaveClass("ueca-dialog", "dialog-fullwidth");
        expect(dialogPanel().querySelector(".alert-dialog-title")).toHaveTextContent("Heads up");
        expect(dialogPanel().querySelector(".dialog-content-text")).toHaveTextContent("Something happened.");
        expect(footerButtons()).toEqual(["Cancel"]);
    });

    // The configurations AppDialogManager hands out, and what each answer resolves to.
    describe("answers", () => {
        it.each([
            ["cancel (the default)", undefined, ["Cancel"]],
            ["okCancel", { okCancel: true }, ["Cancel", "OK"]],
            ["ok", { ok: true }, ["OK"]],
            ["yesNo", { yesNo: true }, ["No", "Yes"]],
            ["details without details to show", { details: true }, []],
            ["nothing", {}, []]
        ] as [string, AlertDialogModel["buttons"], string[]][])("offers %s", async (_, buttons, expected) => {
            await mount(AlertDialog, { id: "ad", open: true, ...(buttons ? { buttons } : {}) });

            expect(footerButtons()).toEqual(expected);
            // Every configuration keeps the × — no dialog is a dead end.
            expect(within(dialogPanel().querySelector(".dialog-title") as HTMLElement).getByRole("button", { name: "Close" }))
                .toBeInTheDocument();
        });

        it.each([
            [{ okCancel: true }, "OK", true],
            [{ okCancel: true }, "Cancel", false],
            [{ ok: true }, "OK", true],
            [{ cancel: true }, "Cancel", false],
            [{ yesNo: true }, "Yes", true],
            [{ yesNo: true }, "No", false]
        ] as [AlertDialogModel["buttons"], string, boolean][])("with %o, %s closes the dialog and reports %s", async (buttons, answer, result) => {
            const onClose = vi.fn();
            const { model } = await mount(AlertDialog, { id: "ad", open: true, buttons, onClose });

            await clickInDialog(answer);

            expect(onClose).toHaveBeenCalledExactlyOnceWith(result, model);
            expect(model.open).toBe(false);
            expect(dialogPanel()).toBeNull();
        });

        // AppDialogManager coerces this with !!result, so the × settles every kind of dialog as false.
        it("reports no result from the ×", async () => {
            const onClose = vi.fn();
            const { model } = await mount(AlertDialog, { id: "ad", open: true, buttons: {}, onClose });

            await clickInDialog("Close");

            expect(onClose).toHaveBeenCalledExactlyOnceWith(undefined, model);
        });

        it("forgets the previous answer when it is opened again", async () => {
            const onClose = vi.fn();
            const { model } = await mount(AlertDialog, { id: "ad", open: true, buttons: { yesNo: true }, onClose });
            await clickInDialog("Yes");

            model.open = true;
            await settle();
            await clickInDialog("Close");

            expect(onClose).toHaveBeenLastCalledWith(undefined, model);
        });

        // Every answer wears the same chip — outlined, on the 24px rung — so the box never sorts its
        // answers by weight.
        it("wears every answer as the same outlined extra-small chip", async () => {
            const { model } = await mount(AlertDialog, { id: "ad", open: true, buttons: { okCancel: true }, detailsView: "trace" });
            model.buttons = { okCancel: true, yesNo: true, details: true };
            await settle();

            const buttons = within(dialogPanel().querySelector(".dialog-actions") as HTMLElement).getAllByRole("button");
            expect(buttons.map((button) => button.textContent)).toEqual(["Show details", "Cancel", "OK", "No", "Yes"]);
            for (const button of buttons) {
                expect(button).toHaveClass("ueca-button-outlined", "ueca-button-xsmall");
            }
        });

        it("draws a customActionView ahead of the standard answers", async () => {
            await mount(AlertDialog, {
                id: "ad",
                open: true,
                buttons: { okCancel: true },
                customActionView: <button type="button">Retry</button>
            });

            expect(footerButtons()).toEqual(["Retry", "Cancel", "OK"]);
        });

        // A details slot that renders nothing left spaceBetween with a single child, which it then
        // put on the LEFT — how every Yes/No pair ended up in the wrong corner.
        it("keeps the answers in the right-hand group when there is no details button", async () => {
            await mount(AlertDialog, { id: "ad", open: true, buttons: { yesNo: true } });

            const answers = within(dialogPanel()).getByRole("button", { name: "Yes" }).parentElement;
            const footerRow = answers.parentElement;
            expect(footerRow).toHaveStyle({ justifyContent: "space-between" });
            expect(footerRow.children).toHaveLength(2);
            expect(footerRow.firstElementChild).toBeEmptyDOMElement();
            expect(footerRow.lastElementChild).toBe(answers);
        });

        // AppDialogManager's init: the action's own verb, tinted danger for a destructive action.
        it("lets the owner restyle the OK button through its child model at init", async () => {
            await mount(AlertDialog, {
                id: "ad",
                open: true,
                buttons: { okCancel: true },
                init: (m) => {
                    m.okButton.contentView = "Delete";
                    m.okButton.color = "error.main";
                }
            });

            const verb = within(dialogPanel()).getByRole("button", { name: "Delete" });
            expect(verb.style.getPropertyValue("--button-color")).toBe("var(--error)");
            expect(footerButtons()).toEqual(["Cancel", "Delete"]);
        });
    });

    describe("severity", () => {
        it.each(["success", "info", "warning", "error"] as const)("shows the %s icon and publishes its colour to the title", async (severity) => {
            await mount(AlertDialog, { id: "ad", open: true, titleView: "Title", severity });

            const icon = dialogPanel().querySelector(".alert-dialog-icon svg");
            expect(icon).toHaveAttribute("color", `var(--${severity})`);
            expect((dialogPanel().querySelector(".alert-dialog-title") as HTMLElement).style.getPropertyValue("--alert-severity"))
                .toBe(`var(--${severity})`);
        });

        it("shows no icon and publishes no colour without a severity", async () => {
            await mount(AlertDialog, { id: "ad", open: true, titleView: "Title" });

            expect(dialogPanel().querySelector(".alert-dialog-icon")).toBeNull();
            expect((dialogPanel().querySelector(".alert-dialog-title") as HTMLElement).style.getPropertyValue("--alert-severity"))
                .toBe("");
        });
    });

    describe("details", () => {
        it("offers Show details only when asked for AND there are details", async () => {
            const { model } = await mount(AlertDialog, { id: "ad", open: true, detailsView: "trace" });
            expect(footerButtons()).toEqual(["Cancel"]);

            model.buttons = { details: true };
            await settle();
            expect(footerButtons()).toEqual(["Show details"]);

            model.detailsView = undefined;
            await settle();
            expect(footerButtons()).toEqual([]);
        });

        // Hidden rather than closed: closing would settle the caller's promise, and the panel's
        // Cancel would have nothing to come back to.
        it("opens the details panel and suspends the dialog without closing it", async () => {
            const onClose = vi.fn();
            const { model } = await mount(AlertDialog, {
                id: "ad", open: true, buttons: { details: true }, detailsView: "the details", onClose
            });

            await clickInDialog("Show details");

            expect(model.detailsDrawer.open).toBe(true);
            expect(detailsPanel()).toHaveTextContent("the details");
            expect(dialogPanel().parentElement).toHaveClass("dialog-hidden");
            expect(model.open).toBe(true);
            expect(onClose).not.toHaveBeenCalled();
        });

        it("returns to the still-open dialog when the details panel is cancelled", async () => {
            const onClose = vi.fn();
            const { model } = await mount(AlertDialog, {
                id: "ad", open: true, buttons: { details: true }, detailsView: "the details", onClose
            });
            await clickInDialog("Show details");

            await userEvent.click(within(detailsPanel()).getByRole("button", { name: "Cancel" }));
            await settle();

            expect(detailsPanel()).toBeNull();
            expect(dialogPanel().parentElement).not.toHaveClass("dialog-hidden");
            expect(model.open).toBe(true);
            expect(onClose).not.toHaveBeenCalled();
        });

        // The details panel is a modal drawer, so it takes focus. In a browser the dialog behind it is
        // display:none meanwhile, and focus given back to "Show details" there lands nowhere until the
        // dialog shows again and reclaims it — so what is asserted is where focus ends up: inside the
        // dialog.
        it("moves focus into the details panel, and back inside the dialog when that is cancelled", async () => {
            await mount(AlertDialog, {
                id: "ad", open: true, titleView: "Save failed", buttons: { details: true }, detailsView: "the details"
            });

            await clickInDialog("Show details");
            expect(detailsPanel()).toHaveAttribute("role", "dialog");
            expect(detailsPanel()).toHaveFocus();

            await userEvent.click(within(detailsPanel()).getByRole("button", { name: "Cancel" }));
            await settle();

            expect(dialogPanel().contains(document.activeElement)).toBe(true);
        });

        // A message plus a stack trace has to survive verbatim.
        it("keeps string details verbatim in a <pre>", async () => {
            const details = "Error: boom\n    at load (api.ts:12)\n    at run (app.ts:3)";
            const { model } = await mount(AlertDialog, { id: "ad", open: true, buttons: { details: true }, detailsView: details });

            model.detailsDrawer.open = true;
            await settle();

            const pre = detailsPanel().querySelector("pre");
            expect(pre).toHaveClass("alert-dialog-details");
            expect(pre.textContent).toBe(details);
        });

        it("renders node details as they are", async () => {
            const { model } = await mount(AlertDialog, {
                id: "ad", open: true, buttons: { details: true }, detailsView: <table data-testid="details-table" />
            });

            model.detailsDrawer.open = true;
            await settle();

            expect(within(detailsPanel()).getByTestId("details-table")).toBeInTheDocument();
            expect(detailsPanel().querySelector("pre")).toBeNull();
        });

        it.each([
            ["error", "Error Details"],
            ["warning", "Warning Details"],
            ["info", "Message Details"],
            ["success", "Message Details"],
            [undefined, "Message Details"]
        ] as const)("names the %s details panel \"%s\"", async (severity, title) => {
            const { model } = await mount(AlertDialog, { id: "ad", open: true, severity, detailsView: "trace" });

            model.detailsDrawer.open = true;
            await settle();

            expect(detailsPanel().querySelector(".alert-details-title")).toHaveTextContent(title);
        });

        it("names the details panel from detailsTitleView when given", async () => {
            const { model } = await mount(AlertDialog, {
                id: "ad", open: true, severity: "error", detailsView: "trace", detailsTitleView: "Server response"
            });

            model.detailsDrawer.open = true;
            await settle();

            expect(detailsPanel().querySelector(".alert-details-title")).toHaveTextContent("Server response");
        });

        // The panel has no glyph of its own, so the heading's colour is what names the severity.
        it("tints the details heading with the severity colour, and not without a severity", async () => {
            const { model } = await mount(AlertDialog, { id: "ad", open: true, severity: "warning", detailsView: "trace" });
            model.detailsDrawer.open = true;
            await settle();

            const heading = () => detailsPanel().querySelector(".alert-details-title") as HTMLElement;
            expect(heading().style.getPropertyValue("--alert-severity")).toBe("var(--warning)");

            model.severity = undefined;
            await settle();

            expect(heading().style.getPropertyValue("--alert-severity")).toBe("");
        });

        // Two thirds of the viewport: the width a stack trace needs without wrapping.
        it("opens the details panel from the right at 65% of the viewport", async () => {
            const { model } = await mount(AlertDialog, { id: "ad", open: true, detailsView: "trace" });

            model.detailsDrawer.open = true;
            await settle();

            expect(detailsPanel()).toHaveClass("drawer-anchor-right");
            expect(detailsPanel().style.width).toBe("65%");
        });

        // Regression: closing the dialog set `detailsOpen = false` to put the details away, but nothing
        // connected that prop to the details drawer. A panel left open outlived its dialog, and the
        // dialog came back hidden behind it the next time it opened.
        it("puts the details panel away when the dialog closes", async () => {
            const { model } = await mount(AlertDialog, { id: "ad", open: true, buttons: { details: true }, detailsView: "trace" });
            await clickInDialog("Show details");

            model.open = false;
            await settle();

            expect(model.detailsDrawer.open).toBe(false);
            expect(detailsPanel()).toBeNull();

            model.open = true;
            await settle();

            expect(dialogPanel().parentElement).not.toHaveClass("dialog-hidden");
        });

        it("reads the details panel's state through detailsOpen and opens the panel from it", async () => {
            const { model } = await mount(AlertDialog, { id: "ad", open: true, buttons: { details: true }, detailsView: "trace" });
            expect(model.detailsOpen).toBe(false);

            await clickInDialog("Show details");
            expect(model.detailsOpen).toBe(true);

            model.detailsDrawer.open = false;
            await settle();
            expect(model.detailsOpen).toBe(false);

            model.detailsOpen = true;
            await settle();
            expect(detailsPanel()).toBeInTheDocument();
        });
    });

    describe("modal mode", () => {
        it("raises onOpen with its own model", async () => {
            const onOpen = vi.fn();
            const { model } = await mount(AlertDialog, { id: "ad", onOpen });

            model.open = true;
            await settle();

            expect(onOpen).toHaveBeenCalledExactlyOnceWith(model);
        });

        // AppDialogManager creates every dialog already open, through the dialog's bound `open`.
        // Entering modal mode twice would leave one entry behind after the close.
        it("raises onOpen and enters modal mode once for a dialog created open", async () => {
            const onOpen = vi.fn();
            const { model } = await mount(AlertDialog, { id: "ad", open: true, onOpen });
            expect(onOpen).toHaveBeenCalledExactlyOnceWith(model);

            model.open = false;
            await settle();

            expect(model.activeModalDialog()).not.toBe(model);
        });

        it("becomes the active modal at zIndex 1000 when nothing else is modal", async () => {
            const { model } = await mount(AlertDialog, { id: "ad" });
            drainModalStack(model);

            model.open = true;
            await settle();

            expect(model.zIndex).toBe(1000);
            expect(model.activeModalDialog()).toBe(model);
        });

        it("stacks a dialog opened over another 100 above it, and hands back on close", async () => {
            const { model: outer } = await mount(AlertDialog, { id: "outer", open: true });
            const { model: inner } = await mount(AlertDialog, { id: "inner" });

            inner.open = true;
            await settle();
            expect(inner.zIndex).toBe(outer.zIndex + 100);
            expect(inner.activeModalDialog()).toBe(inner);

            inner.open = false;
            await settle();
            expect(outer.activeModalDialog()).toBe(outer);

            outer.open = false;
            await settle();
            expect(outer.activeModalDialog()).not.toBe(outer);
        });

        it("leaves modal mode even when the owner's onClose throws", async () => {
            const { model } = await mount(AlertDialog, {
                id: "ad",
                open: true,
                buttons: { ok: true },
                onClose: () => { throw new Error("owner failed"); }
            });

            await clickInDialog("OK");

            expect(model.activeModalDialog()).not.toBe(model);
            expect(takeUecaErrors()).toEqual([expect.objectContaining({ message: "owner failed" })]);
        });

        // Regression: modal mode was left only on close. A dialog removed while still open — which is
        // how AppDialogManager's Dialog.Close retires one: it pops the view without closing it — stayed
        // on the modal stack for the session, and every later overlay's zIndex came out 100 higher
        // (the leak uiBase.tsx warns about). Nothing paints zIndex today — the painted z comes from
        // overlayStack, which Dialog releases on unmount — so the leak was not visible.
        it("leaves modal mode when unmounted while still open", async () => {
            const { model, unmount } = await mount(AlertDialog, { id: "ad", open: true });

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
