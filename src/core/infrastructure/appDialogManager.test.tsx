import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen, within } from "@testing-library/react";
import { AppDialogManager, appMessageBus, DetailedError } from "@core";
import { mount, settle, stubMessages } from "@test";

// The manager renders only the topmost dialog, always as the AlertDialog "activeDialog".
function dialogElement() {
    return document.getElementById("dialogs.activeDialog.dialog");
}

function footerButtons() {
    const actions = dialogElement().querySelector(".dialog-actions");
    return within(actions as HTMLElement).queryAllByRole("button").map((b) => b.textContent);
}

function titleElement() {
    return dialogElement().querySelector<HTMLElement>(".alert-dialog-title");
}

function button(name: string) {
    return within(dialogElement()).getByRole("button", { name });
}

// Sends a message whose promise settles only when the dialog is answered, and hands back a probe
// for it. The promise is awaited later; act() lets the dialog render in the meantime.
async function open<T>(send: () => Promise<T>) {
    let settled = false;
    const promise = send().then((r) => {
        settled = true;
        return r;
    });
    await settle();
    return {
        promise,
        isSettled: () => settled
    };
}

async function mountDialogManager() {
    const bus = await stubMessages({ "BusyDisplay.SetVisibility": vi.fn(async () => { }) });
    const result = await mount(AppDialogManager, { id: "dialogs" });
    return { ...result, bus };
}

describe("AppDialogManager", () => {
    it("renders nothing while no dialog is open", async () => {
        await mountDialogManager();

        expect(dialogElement()).toBeNull();
    });

    describe("kinds", () => {
        it("Dialog.Information shows an info message whose only way out is the ×", async () => {
            await mountDialogManager();

            const dialog = await open(() => appMessageBus.unicast("Dialog.Information", { title: "Note", message: "All done" }));

            expect(within(dialogElement()).getByText("Note")).toBeInTheDocument();
            expect(within(dialogElement()).getByText("All done")).toBeInTheDocument();
            expect(titleElement().style.getPropertyValue("--alert-severity")).toBe("var(--info)");
            expect(footerButtons()).toEqual([]);
            expect(dialog.isSettled()).toBe(false);

            fireEvent.click(button("Close"));
            await dialog.promise;
            await settle();

            expect(dialogElement()).toBeNull();
        });

        it.each([
            ["Dialog.Warning", "var(--warning)"],
            ["Dialog.Error", "var(--error)"]
        ] as const)("%s offers Show details only when there are details", async (message, severity) => {
            await mountDialogManager();

            const plain = await open(() => appMessageBus.unicast(message, { title: "T", message: "Without details" }));
            expect(titleElement().style.getPropertyValue("--alert-severity")).toBe(severity);
            expect(footerButtons()).toEqual([]);
            fireEvent.click(button("Close"));
            await plain.promise;
            await settle();

            await open(() => appMessageBus.unicast(message, { title: "T", message: "With details", details: "The fine print" }));
            expect(footerButtons()).toEqual(["Show details"]);

            fireEvent.click(button("Show details"));
            await settle();
            expect(screen.getByText("The fine print")).toBeInTheDocument();
        });

        it("Dialog.Confirmation asks No / Yes and resolves with the answer", async () => {
            await mountDialogManager();

            const yes = await open(() => appMessageBus.unicast("Dialog.Confirmation", { title: "Proceed?", message: "Continue with the import?" }));
            expect(titleElement().style.getPropertyValue("--alert-severity")).toBe("var(--warning)");
            expect(footerButtons()).toEqual(["No", "Yes"]);
            fireEvent.click(button("Yes"));
            expect(await yes.promise).toBe(true);
            await settle();

            const no = await open(() => appMessageBus.unicast("Dialog.Confirmation", { title: "Proceed?", message: "Again?" }));
            fireEvent.click(button("No"));
            expect(await no.promise).toBe(false);
        });

        it("Dialog.ActionConfirmation labels its OK with the action's verb, tinted danger", async () => {
            await mountDialogManager();

            const dialog = await open(() => appMessageBus.unicast("Dialog.ActionConfirmation", {
                title: "Delete", message: "Delete the record?", action: "Delete"
            }));

            expect(footerButtons()).toEqual(["Cancel", "Delete"]);
            expect(button("Delete").style.getPropertyValue("--button-color")).toBe("var(--error)");
            fireEvent.click(button("Delete"));
            expect(await dialog.promise).toBe(true);
        });

        it("Dialog.ActionConfirmation resolves false on Cancel", async () => {
            await mountDialogManager();

            const dialog = await open(() => appMessageBus.unicast("Dialog.ActionConfirmation", {
                title: "Delete", message: "Delete the record?", action: "Delete"
            }));
            fireEvent.click(button("Cancel"));

            expect(await dialog.promise).toBe(false);
        });

        it("Dialog.Custom shows arbitrary content with a single primary action", async () => {
            await mountDialogManager();

            const dialog = await open(() => appMessageBus.unicast("Dialog.Custom", {
                title: <span>Rich title</span>,
                content: <input aria-label="Name" />,
                okText: "Apply"
            }));

            expect(within(dialogElement()).getByRole("textbox", { name: "Name" })).toBeInTheDocument();
            expect(within(dialogElement()).getByText("Rich title")).toBeInTheDocument();
            // No severity: no glyph and no tint on the heading.
            expect(dialogElement().querySelector(".alert-dialog-icon")).toBeNull();
            expect(titleElement().style.getPropertyValue("--alert-severity")).toBe("");
            expect(footerButtons()).toEqual(["Apply"]);
            expect(button("Apply").style.getPropertyValue("--button-color")).toBe("var(--accent)");

            fireEvent.click(button("Apply"));
            expect(await dialog.promise).toBe(true);
        });

        it("Dialog.Custom keeps the default OK label when no okText is given", async () => {
            await mountDialogManager();

            await open(() => appMessageBus.unicast("Dialog.Custom", { title: "Pick", content: "Content" }));

            expect(footerButtons()).toEqual(["OK"]);
        });

        // Every kind still resolves through the ×, which settles false, so no dialog is a dead end.
        it.each([
            ["Dialog.Confirmation", { title: "T", message: "M" }],
            ["Dialog.ActionConfirmation", { title: "T", message: "M", action: "Go" }],
            ["Dialog.Custom", { title: "T", content: "M" }]
        ] as const)("%s resolves false when dismissed with the ×", async (message, payload) => {
            await mountDialogManager();

            const dialog = await open(() => appMessageBus.unicast(message, payload as never));
            fireEvent.click(button("Close"));

            expect(await dialog.promise).toBe(false);
        });
    });

    describe("Dialog.Exception", () => {
        async function detailsOf(error: Error, title?: string) {
            await mountDialogManager();
            await open(() => appMessageBus.unicast("Dialog.Exception", { title, error }));
            const heading = within(dialogElement()).getByText(title ?? "Error");
            fireEvent.click(button("Show details"));
            await settle();
            return {
                heading,
                message: dialogElement().querySelector(".dialog-content-text").textContent,
                details: document.querySelector(".alert-dialog-details").textContent
            };
        }

        it("shows the error's message, and its message and call stack as details", async () => {
            const error = new Error("Disk full");
            error.stack = "Error: Disk full\n    at save (store.ts:1:1)";

            const shown = await detailsOf(error, "Save failed");

            expect(shown.message).toBe("Disk full");
            expect(shown.details).toBe("Disk full\n\nCall Stack:\nError: Disk full\n    at save (store.ts:1:1)");
            expect(titleElement().style.getPropertyValue("--alert-severity")).toBe("var(--error)");
        });

        it("titles itself Error and falls back to a generic message", async () => {
            const error = new Error("");
            error.stack = "at somewhere";

            const shown = await detailsOf(error);

            expect(shown.heading).toBeInTheDocument();
            expect(shown.message).toBe("An error has occurred.");
            expect(shown.details).toBe("An error has occurred.\n\nCall Stack:\nat somewhere");
        });

        it("puts a DetailedError's details between the message and the stack", async () => {
            const error = new DetailedError("ApiError", "Request failed", "HTTP 503 from /api/items", "at fetchItems");

            const shown = await detailsOf(error, "API");

            expect(shown.details).toBe("Request failed\n\nHTTP 503 from /api/items\n\nCall Stack:\nat fetchItems");
        });

        it("omits the call stack section when the error has none", async () => {
            const error = new Error("No trace");
            error.stack = undefined;

            const shown = await detailsOf(error);

            expect(shown.details).toBe("No trace");
        });
    });

    describe("Dialog.Close", () => {
        it("settles the open dialog as cancelled", async () => {
            await mountDialogManager();
            const dialog = await open(() => appMessageBus.unicast("Dialog.Confirmation", { title: "T", message: "Waiting" }));

            await act(async () => { await appMessageBus.unicast("Dialog.Close"); });

            expect(await dialog.promise).toBe(false);
            await settle();
            expect(dialogElement()).toBeNull();
        });

        it("does nothing when no dialog is open", async () => {
            const { bus } = await mountDialogManager();

            await act(async () => { await appMessageBus.unicast("Dialog.Close"); });

            expect(dialogElement()).toBeNull();
            expect(bus["BusyDisplay.SetVisibility"]).not.toHaveBeenCalled();
        });
    });

    describe("stacking", () => {
        it("shows only the topmost dialog and reveals the one beneath when it closes", async () => {
            await mountDialogManager();
            const outer = await open(() => appMessageBus.unicast("Dialog.Confirmation", { title: "Outer", message: "Outer question" }));
            const inner = await open(() => appMessageBus.unicast("Dialog.Information", { title: "Inner", message: "Inner note" }));

            expect(within(dialogElement()).getByText("Inner note")).toBeInTheDocument();
            expect(screen.queryByText("Outer question")).toBeNull();

            fireEvent.click(button("Close"));
            await inner.promise;
            await settle();

            expect(within(dialogElement()).getByText("Outer question")).toBeInTheDocument();
            expect(footerButtons()).toEqual(["No", "Yes"]);
            expect(outer.isSettled()).toBe(false);

            fireEvent.click(button("Yes"));
            expect(await outer.promise).toBe(true);
        });

        it("Dialog.Close dismisses only the topmost dialog", async () => {
            await mountDialogManager();
            const outer = await open(() => appMessageBus.unicast("Dialog.Confirmation", { title: "Outer", message: "Outer question" }));
            const inner = await open(() => appMessageBus.unicast("Dialog.Confirmation", { title: "Inner", message: "Inner question" }));

            await act(async () => { await appMessageBus.unicast("Dialog.Close"); });

            expect(await inner.promise).toBe(false);
            expect(outer.isSettled()).toBe(false);
            await settle();
            expect(within(dialogElement()).getByText("Outer question")).toBeInTheDocument();
        });

        // BUG: every dialog is rendered as the same AlertDialog ("activeDialog") at the same place,
        // so a nested dialog re-uses the model of the one beneath. Its `init` param — where the OK
        // button gets its verb and colour — never runs again, and the nested dialog shows the
        // previous dialog's button (appDialogManager.tsx:66-83).
        it.fails("gives a nested action confirmation its own verb and danger tint", async () => {
            await mountDialogManager();
            await open(() => appMessageBus.unicast("Dialog.Custom", { title: "Edit", content: "Form", okText: "Apply" }));

            await open(() => appMessageBus.unicast("Dialog.ActionConfirmation", { title: "Delete", message: "Really?", action: "Delete" }));

            expect(footerButtons()).toEqual(["Cancel", "Delete"]);
            expect(button("Delete").style.getPropertyValue("--button-color")).toBe("var(--error)");
        });
    });

    describe("busy display", () => {
        it("hides the busy spinner while a dialog is up and restores it on close", async () => {
            const { bus } = await mountDialogManager();

            const dialog = await open(() => appMessageBus.unicast("Dialog.Information", { title: "T", message: "M" }));
            expect(bus["BusyDisplay.SetVisibility"]).toHaveBeenCalledExactlyOnceWith(false);

            fireEvent.click(button("Close"));
            await dialog.promise;
            await settle();
            expect(bus["BusyDisplay.SetVisibility"]).toHaveBeenLastCalledWith(true);
            expect(bus["BusyDisplay.SetVisibility"]).toHaveBeenCalledTimes(2);
        });

        // BUG: closing a nested dialog restores the spinner while the dialog beneath is still up.
        // The spinner covers every dialog (spinner.tsx: "must cover everything, including a
        // dialog"), so while the app is busy the outer dialog is covered and can no longer be
        // answered (appDialogManager.tsx:57; appBusyDisplay.tsx:7).
        it.fails("keeps the spinner hidden while a dialog beneath the closed one is still open", async () => {
            const { bus } = await mountDialogManager();
            await open(() => appMessageBus.unicast("Dialog.Confirmation", { title: "Outer", message: "Outer question" }));
            const inner = await open(() => appMessageBus.unicast("Dialog.Information", { title: "Inner", message: "Inner note" }));

            fireEvent.click(button("Close"));
            await inner.promise;
            await settle();

            expect(bus["BusyDisplay.SetVisibility"]).not.toHaveBeenCalledWith(true);
        });
    });
});
