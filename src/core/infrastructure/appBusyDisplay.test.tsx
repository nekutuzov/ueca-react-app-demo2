import { describe, expect, it, vi } from "vitest";
import { act } from "@testing-library/react";
import { AppBusyDisplay, appMessageBus } from "@core";
import { mount, settle } from "@test";

// The spinner's DOM element; its model is the busy display's `spinner` child.
function spinnerElement() {
    return document.getElementById("busy.spinner");
}

async function send(message: "BusyDisplay.Set" | "BusyDisplay.SetVisibility", value: boolean) {
    await act(async () => { await appMessageBus.unicast(message, value); });
}

async function advance(ms: number) {
    await act(async () => { await vi.advanceTimersByTimeAsync(ms); });
}

// Mounted with real timers (a mount can hang under fake ones), then the clock is faked so the
// spinner's 250ms grace period can be stepped through exactly.
async function mountBusyDisplay() {
    const result = await mount(AppBusyDisplay, { id: "busy" });
    vi.useFakeTimers();
    return result;
}

describe("AppBusyDisplay", () => {
    it("renders its host element with no spinner while nothing is busy", async () => {
        await mount(AppBusyDisplay, { id: "busy" });

        expect(document.getElementById("busy")).toBeInTheDocument();
        expect(spinnerElement()).toBeNull();
    });

    // A short operation should finish without ever flashing an overlay.
    it("shows the spinner only once busy has lasted 250ms", async () => {
        await mountBusyDisplay();

        await send("BusyDisplay.Set", true);
        await advance(240);
        expect(spinnerElement()).toBeNull();

        await advance(20);
        expect(spinnerElement()).toBeInTheDocument();
        expect(spinnerElement()).toHaveClass("ueca-spinner");
    });

    it("never shows the spinner for busy work that ends within the delay", async () => {
        await mountBusyDisplay();

        await send("BusyDisplay.Set", true);
        await advance(100);
        await send("BusyDisplay.Set", false);
        await advance(500);

        expect(spinnerElement()).toBeNull();
    });

    it("counts Set calls: stays busy until every true has been matched by a false", async () => {
        const { model } = await mountBusyDisplay();

        await send("BusyDisplay.Set", true);
        await send("BusyDisplay.Set", true);
        await send("BusyDisplay.Set", false);
        await advance(300);
        expect(model.spinner.visible).toBe(true);
        expect(spinnerElement()).toBeInTheDocument();

        await send("BusyDisplay.Set", false);
        await advance(300);
        expect(model.spinner.visible).toBe(false);
        expect(spinnerElement()).toBeNull();
    });

    it("never counts below zero, so a stray false cannot swallow the next true", async () => {
        const { model } = await mountBusyDisplay();

        await send("BusyDisplay.Set", false);
        await send("BusyDisplay.Set", false);
        await send("BusyDisplay.Set", true);

        expect(model.spinner.visible).toBe(true);
    });

    it("Clear drops every pending Set at once", async () => {
        const { model } = await mountBusyDisplay();
        await send("BusyDisplay.Set", true);
        await send("BusyDisplay.Set", true);
        await send("BusyDisplay.Set", true);
        await advance(300);

        await act(async () => { await appMessageBus.unicast("BusyDisplay.Clear"); });
        await advance(300);

        expect(model.spinner.visible).toBe(false);
        expect(spinnerElement()).toBeNull();

        // Counting starts again from zero.
        await send("BusyDisplay.Set", true);
        expect(model.spinner.visible).toBe(true);
    });

    // A modal dialog hides the spinner so the user can answer it, without losing the busy count.
    it("SetVisibility(false) hides a showing spinner and SetVisibility(true) brings it back", async () => {
        const { model } = await mountBusyDisplay();
        await send("BusyDisplay.Set", true);
        await advance(300);
        expect(spinnerElement()).toBeInTheDocument();

        await send("BusyDisplay.SetVisibility", false);
        expect(spinnerElement()).toBeNull();
        expect(model.spinner.visible).toBe(true);

        await send("BusyDisplay.SetVisibility", true);
        expect(spinnerElement()).toBeInTheDocument();
    });

    it("a new Set makes a hidden spinner visible again", async () => {
        await mountBusyDisplay();
        await send("BusyDisplay.SetVisibility", false);

        await send("BusyDisplay.Set", true);
        await advance(300);

        expect(spinnerElement()).toBeInTheDocument();
    });

    it("stops answering the bus once unmounted", async () => {
        const { model, unmount } = await mount(AppBusyDisplay, { id: "busy" });

        unmount();
        await settle();
        await appMessageBus.unicast("BusyDisplay.Set", true);

        expect(model._busySetCount).toBe(0);
    });
});
