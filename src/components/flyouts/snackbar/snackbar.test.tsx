import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen } from "@testing-library/react";
import * as UECA from "ueca-react";
import { Snackbar, SnackbarModel } from "@components";
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

    // Regression: an undefined anchorOrigin replaces the default rather than falling back to it, and the
    // View read anchorOrigin.vertical unguarded — AlertToast, which hands on its own unset position,
    // threw instead of showing.
    it("sits at the top right when anchorOrigin is passed unset", async () => {
        await mount(Snackbar, { id: "sb", open: true, messageView: "Hi", anchorOrigin: undefined });

        expect(snackbar()).toHaveClass("ueca-snackbar", "snackbar-top-right");
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

        // Regression: the auto-hide timer was never cleared. A snackbar closed and reopened within four
        // seconds was shut by the FIRST opening's timer, cutting the second showing short.
        it("gives a reopened snackbar its full four seconds", async () => {
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

        // A snackbar created open never hears onChangeOpen for that first value, so its timer used to
        // start only when `open` next changed — it never hid on its own.
        it("hides on time when it is created open", async () => {
            const onClose = vi.fn();
            vi.useFakeTimers({ shouldAdvanceTime: true });
            const { model } = await mount(Snackbar, { id: "sb", open: true, messageView: "Hi", closeReasons: { timeout: true }, onClose });

            await advance(3500);
            expect(model.open).toBe(true);
            await advance(600);

            expect(model.open).toBe(false);
            expect(onClose).toHaveBeenCalledOnce();
        });

        it("cancels a pending auto-hide when it unmounts", async () => {
            const onClose = vi.fn();
            const { model, unmount } = await mount(Snackbar, { id: "sb", messageView: "Hi", closeReasons: { timeout: true }, onClose });
            vi.useFakeTimers({ shouldAdvanceTime: true });
            model.open = true;
            await settle();

            unmount();
            await settle();
            await advance(5000);

            expect(model.open).toBe(true);
            expect(onClose).not.toHaveBeenCalled();
        });

        // A model outlives its element: brought back open from the cache, it gets a fresh four
        // seconds, rather than a timer that ran on while it was away or none at all.
        it("restarts its auto-hide when brought back open from the model cache", async () => {
            let snackbarModel: SnackbarModel;
            vi.useFakeTimers({ shouldAdvanceTime: true });
            const { model: host } = await mount(SnackbarHost, { id: "host", onSnackbarInit: (m) => { snackbarModel = m; } });

            await advance(1000);
            host.shown = false;
            await settle();
            await advance(5000);
            expect(snackbarModel.open).toBe(true);

            host.shown = true;
            await settle();
            await advance(3500);
            expect(document.getElementById("host.sb")).not.toBeNull();
            await advance(600);

            expect(snackbarModel.open).toBe(false);
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

        // Regression: `mount` added document keydown and mousedown listeners that nothing removed.
        // Every mount leaked another pair for the session, and a snackbar removed while open still
        // answered Escape and clicks on its detached model.
        it("stops listening to the document once unmounted", async () => {
            const { model, unmount } = await mount(Snackbar, {
                id: "sb", open: true, messageView: "Hi", closeReasons: { escapeKeyDown: true, clickaway: true }
            });

            unmount();
            await settle();
            fireEvent.keyDown(document.body, { key: "Escape" });
            fireEvent.mouseDown(document.body);
            await settle();

            expect(model.open).toBe(true);
        });
    });
});

// Shows or hides an open, self-hiding Snackbar child. A JSX child with an id is cached by its owner,
// so hiding and showing it again parks the model and brings it back.
type SnackbarHostStruct = UECA.ComponentStruct<{
    props: {
        shown: boolean;
    };

    events: {
        onSnackbarInit: (snackbar: SnackbarModel) => void;
    };
}>;

function useSnackbarHost(params?: UECA.ComponentParams<SnackbarHostStruct>) {
    const struct: SnackbarHostStruct = {
        props: {
            id: useSnackbarHost.name,
            shown: true
        },

        View: () => (
            <div id={model.htmlId()}>
                {model.shown && (
                    <Snackbar
                        id="sb"
                        open
                        messageView="Hi"
                        closeReasons={{ timeout: true }}
                        init={(m) => { model.onSnackbarInit?.(m); }}
                    />
                )}
            </div>
        )
    };

    const model = UECA.useComponent(struct, params);
    return model;
}

const SnackbarHost = UECA.getFC(useSnackbarHost);
