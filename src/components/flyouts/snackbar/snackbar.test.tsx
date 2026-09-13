import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen } from "@testing-library/react";
import { Snackbar } from "@components";
import { mount, settle } from "@test";

function snackbar(): HTMLElement {
    return document.getElementById("sb");
}

async function advance(ms: number) {
    await act(async () => { await vi.advanceTimersByTimeAsync(ms); });
}

describe("Snackbar", () => {
    it("renders nothing while closed", async () => {
        const { container } = await mount(Snackbar, { id: "sb", messageView: "Saved" });

        expect(container).toBeEmptyDOMElement();
    });

    it("shows its message at the top right, sliding in, by default", async () => {
        const { model } = await mount(Snackbar, { id: "sb", messageView: "Saved" });

        model.open = true;
        await settle();

        expect(snackbar()).toHaveClass("ueca-snackbar", "snackbar-top-right", "snackbar-transition");
        expect(snackbar()).not.toHaveClass("snackbar-relative");
        expect(snackbar().querySelector(".snackbar-content .snackbar-message")).toHaveTextContent("Saved");
        expect(snackbar().querySelector(".snackbar-action")).toBeNull();
    });

    it("draws an actionView beside the message", async () => {
        await mount(Snackbar, { id: "sb", open: true, messageView: "Deleted", actionView: <button type="button">Undo</button> });

        expect(snackbar().querySelector(".snackbar-action")).toContainElement(screen.getByRole("button", { name: "Undo" }));
    });

    it("draws a contentView in place of the standard message layout", async () => {
        await mount(Snackbar, { id: "sb", open: true, messageView: "unused", contentView: <div data-testid="custom">Custom</div> });

        expect(screen.getByTestId("custom").parentElement).toBe(snackbar());
        expect(snackbar().querySelector(".snackbar-content")).toBeNull();
        expect(snackbar()).not.toHaveTextContent("unused");
    });

    it.each([
        ["top", "left"],
        ["top", "center"],
        ["top", "right"],
        ["bottom", "left"],
        ["bottom", "center"],
        ["bottom", "right"]
    ] as const)("positions itself %s-%s from anchorOrigin", async (vertical, horizontal) => {
        await mount(Snackbar, { id: "sb", open: true, messageView: "Hi", anchorOrigin: { vertical, horizontal } });

        expect(snackbar()).toHaveClass(`snackbar-${vertical}-${horizontal}`);
    });

    it("drops the transition when transition is off", async () => {
        await mount(Snackbar, { id: "sb", open: true, messageView: "Hi", transition: false });

        expect(snackbar()).toHaveClass("ueca-snackbar", "snackbar-top-right");
        expect(snackbar()).not.toHaveClass("snackbar-transition");
    });

    // A stacked toast is laid out by its container, so it takes no fixed position of its own.
    it("renders in flow, without a position, when disablePortal is set", async () => {
        await mount(Snackbar, {
            id: "sb", open: true, messageView: "Hi", disablePortal: true, anchorOrigin: { vertical: "bottom", horizontal: "left" }
        });

        expect(snackbar()).toHaveClass("ueca-snackbar", "snackbar-relative");
        expect(snackbar().className).not.toMatch(/snackbar-(top|bottom)-/);
    });

    it("raises onOpen and onClose with its model", async () => {
        const onOpen = vi.fn();
        const onClose = vi.fn();
        const { model } = await mount(Snackbar, { id: "sb", messageView: "Hi", onOpen, onClose });

        model.open = true;
        await settle();
        expect(onOpen).toHaveBeenCalledExactlyOnceWith(model);

        model.open = false;
        await settle();
        expect(onClose).toHaveBeenCalledExactlyOnceWith(model);
        expect(snackbar()).toBeNull();
    });

    it("raises onOpen for a snackbar created open", async () => {
        const onOpen = vi.fn();

        const { model } = await mount(Snackbar, { id: "sb", open: true, messageView: "Hi", onOpen });

        expect(onOpen).toHaveBeenCalledExactlyOnceWith(model);
    });

    describe("auto-hide", () => {
        it("closes four seconds after opening when timeout is a close reason", async () => {
            const onClose = vi.fn();
            const { model } = await mount(Snackbar, { id: "sb", messageView: "Hi", closeReasons: { timeout: true }, onClose });
            vi.useFakeTimers({ shouldAdvanceTime: true });

            model.open = true;
            await settle();
            await advance(3900);
            expect(model.open).toBe(true);

            await advance(100);

            expect(model.open).toBe(false);
            expect(snackbar()).toBeNull();
            expect(onClose).toHaveBeenCalledOnce();
        });

        it("stays open without the timeout close reason", async () => {
            const { model } = await mount(Snackbar, { id: "sb", messageView: "Hi", closeReasons: { escapeKeyDown: true } });
            vi.useFakeTimers({ shouldAdvanceTime: true });

            model.open = true;
            await settle();
            await advance(10000);

            expect(model.open).toBe(true);
        });

        it("does not close again when the owner already closed it", async () => {
            const onClose = vi.fn();
            const { model } = await mount(Snackbar, { id: "sb", messageView: "Hi", closeReasons: { timeout: true }, onClose });
            vi.useFakeTimers({ shouldAdvanceTime: true });
            model.open = true;
            await settle();

            await advance(1000);
            model.open = false;
            await settle();
            await advance(4000);

            expect(onClose).toHaveBeenCalledOnce();
        });

        // BUG: the auto-hide timer is never cleared. A snackbar closed and reopened within four
        // seconds is shut by the FIRST opening's timer, cutting the second showing short.
        it.fails("gives a reopened snackbar its full four seconds", async () => {
            const { model } = await mount(Snackbar, { id: "sb", messageView: "Hi", closeReasons: { timeout: true } });
            vi.useFakeTimers({ shouldAdvanceTime: true });
            model.open = true;
            await settle();
            await advance(1000);
            model.open = false;
            await settle();
            await advance(2000);

            model.open = true;
            await settle();
            // Four seconds after the FIRST opening, one after the second.
            await advance(1000);

            expect(model.open).toBe(true);
        });
    });

    describe("dismissal", () => {
        it("closes on Escape when escapeKeyDown is a close reason", async () => {
            const onClose = vi.fn();
            const { model } = await mount(Snackbar, { id: "sb", open: true, messageView: "Hi", closeReasons: { escapeKeyDown: true }, onClose });

            fireEvent.keyDown(document.body, { key: "Enter" });
            await settle();
            expect(model.open).toBe(true);

            fireEvent.keyDown(document.body, { key: "Escape" });
            await settle();

            expect(model.open).toBe(false);
            expect(onClose).toHaveBeenCalledOnce();
        });

        it.each([
            ["no close reasons", undefined],
            ["only other close reasons", { timeout: true, clickaway: true }]
        ])("ignores Escape with %s", async (_, closeReasons) => {
            const { model } = await mount(Snackbar, { id: "sb", open: true, messageView: "Hi", closeReasons });

            fireEvent.keyDown(document.body, { key: "Escape" });
            await settle();

            expect(model.open).toBe(true);
        });

        it("closes on a mousedown outside it when clickaway is a close reason, but not on one inside", async () => {
            const { model } = await mount(Snackbar, {
                id: "sb", open: true, messageView: <span>message</span>, closeReasons: { clickaway: true }
            });

            fireEvent.mouseDown(screen.getByText("message"));
            await settle();
            expect(model.open).toBe(true);

            fireEvent.mouseDown(document.body);
            await settle();
            expect(model.open).toBe(false);
        });

        it.each([
            ["no close reasons", undefined],
            ["only other close reasons", { timeout: true, escapeKeyDown: true }]
        ])("ignores outside mousedowns with %s", async (_, closeReasons) => {
            const { model } = await mount(Snackbar, { id: "sb", open: true, messageView: "Hi", closeReasons });

            fireEvent.mouseDown(document.body);
            await settle();

            expect(model.open).toBe(true);
        });

        // BUG: `mount` adds document keydown and mousedown listeners that nothing ever removes (there
        // is no `unmount` hook, unlike Popover's). Every mount leaks another pair for the session,
        // and a snackbar removed while open still answers Escape and clicks on its detached model.
        it.fails("stops listening to the document once unmounted", async () => {
            const { model, unmount } = await mount(Snackbar, {
                id: "sb", open: true, messageView: "Hi", closeReasons: { escapeKeyDown: true, clickaway: true }
            });

            unmount();
            await settle();

            try {
                fireEvent.keyDown(document.body, { key: "Escape" });
                fireEvent.mouseDown(document.body);
                await settle();
                expect(model.open).toBe(true);
            } finally {
                // Leaves the leaked handlers with nothing to act on in later tests.
                model.open = false;
                await settle();
            }
        });
    });
});
