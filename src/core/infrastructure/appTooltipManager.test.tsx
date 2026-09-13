import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen } from "@testing-library/react";
import { AnchorRect, AppTooltipManager, appMessageBus } from "@core";
import { mount, settle } from "@test";

// Comfortably inside jsdom's 1024×768 viewport, with room on every side.
const anchor: AnchorRect = { top: 400, left: 450, width: 100, height: 20 };

type ShowParams = { token: string; anchor: AnchorRect; contentView: React.ReactNode; placement?: "top" | "bottom" | "left" | "right"; delay?: number };

async function show(p: Partial<ShowParams> = {}) {
    await act(async () => {
        await appMessageBus.unicast("App.Tooltip.Show", { token: "t1", anchor, contentView: "Tip", delay: 0, ...p });
    });
}

async function hide(token: string) {
    await act(async () => { await appMessageBus.unicast("App.Tooltip.Hide", { token }); });
}

async function advance(ms: number) {
    await act(async () => { await vi.advanceTimersByTimeAsync(ms); });
}

// By id rather than role: a role query skips a `visibility: hidden` bubble, which would let a
// bubble that is merely hidden pass for one that was removed.
function tooltip() {
    return document.getElementById("tooltip");
}

// jsdom has no layout: give the bubble a size, and record what it looked like when measured.
function stubBubbleSize(width: number, height: number) {
    const measured: { visibility: string }[] = [];
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
        if (!this.classList.contains("ueca-tooltip")) {
            return new DOMRect(0, 0, 0, 0);
        }
        measured.push({ visibility: this.style.visibility });
        return new DOMRect(0, 0, width, height);
    });
    return measured;
}

async function mountTooltipManager() {
    return await mount(AppTooltipManager, { id: "tooltip" });
}

describe("AppTooltipManager", () => {
    it("renders nothing until asked to show", async () => {
        await mountTooltipManager();

        expect(tooltip()).toBeNull();
    });

    describe("delay", () => {
        it("waits 250ms by default before showing", async () => {
            await mountTooltipManager();
            vi.useFakeTimers();

            await show({ delay: undefined, contentView: "Refresh the list" });
            await advance(240);
            expect(tooltip()).toBeNull();

            await advance(20);
            expect(tooltip()).toHaveTextContent("Refresh the list");
        });

        it("shows at once with delay 0", async () => {
            await mountTooltipManager();

            await show({ delay: 0, contentView: "Now" });

            expect(tooltip()).toHaveTextContent("Now");
        });

        it("a Show during a pending delay replaces the pending one", async () => {
            await mountTooltipManager();
            vi.useFakeTimers();

            await show({ token: "a", delay: 250, contentView: "From A" });
            await advance(100);
            await show({ token: "b", delay: 250, contentView: "From B" });

            // A's timer would have fired here.
            await advance(200);
            expect(tooltip()).toBeNull();

            await advance(60);
            expect(tooltip()).toHaveTextContent("From B");
            expect(screen.queryByText("From A")).toBeNull();
        });

        it("a hide during the delay cancels the pending show", async () => {
            await mountTooltipManager();
            vi.useFakeTimers();

            await show({ token: "a", delay: 250 });
            await advance(100);
            await hide("a");
            await advance(500);

            expect(tooltip()).toBeNull();
        });

        it("a show replacing an open tooltip swaps its content in place", async () => {
            await mountTooltipManager();
            await show({ token: "a", contentView: "Show password" });

            await show({ token: "a", contentView: "Hide password" });

            expect(tooltip()).toHaveTextContent("Hide password");
        });
    });

    describe("hide", () => {
        // A late hide from the element the pointer has just left must not close the tooltip that
        // the element now under the pointer has opened.
        it("ignores a hide from a trigger that is not the one showing", async () => {
            await mountTooltipManager();
            await show({ token: "b", contentView: "From B" });

            await hide("a");

            expect(tooltip()).toHaveTextContent("From B");
        });

        it("hides when the showing trigger asks", async () => {
            await mountTooltipManager();
            await show({ token: "b" });

            await hide("b");

            expect(tooltip()).toBeNull();
        });

        it("a hide without a token always hides", async () => {
            const { model } = await mountTooltipManager();
            await show({ token: "b" });

            await act(async () => { model.hide(); });

            expect(tooltip()).toBeNull();
            expect(model._token).toBeUndefined();
        });

        it("forgets the closed trigger, so the next trigger's tooltip can be hidden by it", async () => {
            await mountTooltipManager();
            await show({ token: "a" });
            await hide("a");
            await show({ token: "b", contentView: "From B" });

            await hide("a");

            expect(tooltip()).toHaveTextContent("From B");
            await hide("b");
            expect(tooltip()).toBeNull();
        });
    });

    describe("placement", () => {
        it("renders the content in the bubble with an arrow, above the anchor by default", async () => {
            stubBubbleSize(100, 40);
            await mountTooltipManager();

            await show({ contentView: <b>Bold tip</b> });

            expect(screen.getByRole("tooltip")).toBe(tooltip());
            expect(tooltip()).toHaveClass("ueca-tooltip", "ueca-tooltip-top");
            expect(tooltip().querySelector(".ueca-tooltip-body")).toContainHTML("<b>Bold tip</b>");
            expect(tooltip().querySelector(".ueca-tooltip-arrow")).toHaveAttribute("aria-hidden", "true");
            expect(tooltip()).toHaveStyle({ top: `${400 - 40 - 8}px`, left: "450px", visibility: "visible" });
            // The arrow points at the anchor's centre: 450 + 100 / 2 - 450.
            expect(tooltip().style.getPropertyValue("--tooltip-arrow-left")).toBe("50px");
        });

        // Placement needs the bubble's own size, which only exists once it is in the document.
        it("is measured while still hidden and revealed only once placed", async () => {
            const measured = stubBubbleSize(100, 40);
            await mountTooltipManager();

            await show();

            expect(measured[0]).toEqual({ visibility: "hidden" });
            expect(tooltip()).toHaveStyle({ visibility: "visible" });
        });

        it("stays hidden when it has no anchor to be placed against", async () => {
            stubBubbleSize(100, 40);
            await mountTooltipManager();

            await show({ anchor: undefined });

            expect(tooltip()).toHaveStyle({ visibility: "hidden", top: "0px", left: "0px" });
        });

        it("flips below an anchor with no room above and says so in its class", async () => {
            stubBubbleSize(100, 40);
            await mountTooltipManager();

            await show({ anchor: { top: 10, left: 450, width: 100, height: 20 } });

            expect(tooltip()).toHaveClass("ueca-tooltip-bottom");
            expect(tooltip()).toHaveStyle({ top: `${10 + 20 + 8}px` });
        });

        it("places beside the anchor and offsets the arrow along the vertical edge", async () => {
            stubBubbleSize(100, 40);
            await mountTooltipManager();

            await show({ placement: "right" });

            expect(tooltip()).toHaveClass("ueca-tooltip-right");
            expect(tooltip()).toHaveStyle({ top: `${400 + (20 - 40) / 2}px`, left: `${450 + 100 + 8}px` });
            // 400 + 20 / 2 - 390
            expect(tooltip().style.getPropertyValue("--tooltip-arrow-top")).toBe("20px");
            expect(tooltip().style.getPropertyValue("--tooltip-arrow-left")).toBe("");
        });

        it("reads the viewport size at measure time", async () => {
            stubBubbleSize(100, 40);
            vi.spyOn(window, "innerHeight", "get").mockReturnValue(450);
            await mountTooltipManager();

            // Room above in a 768px viewport, but not below in a 450px one — so it stays on top;
            // asked for the bottom, it flips up for lack of room.
            await show({ placement: "bottom" });

            expect(tooltip()).toHaveClass("ueca-tooltip-top");
        });

        // The bubble slides back inside the viewport; the arrow must keep pointing at the anchor
        // but never ride up into the bubble's rounded corner.
        it.each([
            ["near the left edge", { top: 400, left: 0, width: 20, height: 20 }, 100, "12px"],
            ["near the right edge", { top: 400, left: 1014, width: 10, height: 20 }, 100, "88px"],
            ["on a bubble narrower than both insets", { top: 400, left: 450, width: 100, height: 20 }, 20, "12px"]
        ] as const)("clamps the arrow %s", async (_case, cramped, bubbleWidth, arrow) => {
            stubBubbleSize(bubbleWidth, 40);
            await mountTooltipManager();

            await show({ anchor: cramped });

            expect(tooltip().style.getPropertyValue("--tooltip-arrow-left")).toBe(arrow);
        });

        it("re-measures when a new show arrives for a different anchor", async () => {
            stubBubbleSize(100, 40);
            await mountTooltipManager();
            await show({ token: "a" });

            await show({ token: "b", anchor: { top: 200, left: 100, width: 40, height: 20 } });

            expect(tooltip()).toHaveStyle({ top: `${200 - 40 - 8}px`, left: `${100 + (40 - 100) / 2}px`, visibility: "visible" });
        });
    });

    describe("dismissal", () => {
        it.each([
            ["the window scrolls", () => window.dispatchEvent(new Event("scroll"))],
            ["a nested container scrolls", () => {
                // scroll does not bubble: only a capture listener hears a nested container's.
                const scroller = document.body.appendChild(document.createElement("div"));
                scroller.dispatchEvent(new Event("scroll"));
                scroller.remove();
            }],
            ["the window resizes", () => window.dispatchEvent(new Event("resize"))],
            ["Escape is pressed", () => fireEvent.keyDown(window, { key: "Escape" })],
            ["the window loses focus", () => window.dispatchEvent(new Event("blur"))]
        ])("hides when %s", async (_case, trigger) => {
            await mountTooltipManager();
            await show();

            await act(async () => { trigger(); });

            expect(tooltip()).toBeNull();
        });

        it("ignores keys other than Escape", async () => {
            await mountTooltipManager();
            await show();

            await act(async () => { fireEvent.keyDown(window, { key: "Enter" }); });

            expect(tooltip()).toBeInTheDocument();
        });

        // Switching tab fires no mouseleave on the trigger, so the tooltip would still be up on return.
        it("hides when the page becomes hidden, but not when it becomes visible again", async () => {
            const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(false);
            await mountTooltipManager();
            await show();

            await act(async () => { document.dispatchEvent(new Event("visibilitychange")); });
            expect(tooltip()).toBeInTheDocument();

            hidden.mockReturnValue(true);
            await act(async () => { document.dispatchEvent(new Event("visibilitychange")); });
            expect(tooltip()).toBeNull();
        });

        // A navigation GUARD: it must answer true, or it would veto every route change.
        it("closes on App.Router.BeforeRouteChange and never blocks the navigation", async () => {
            await mountTooltipManager();
            await show();

            let answers: boolean[];
            await act(async () => {
                answers = await appMessageBus.broadcast(null, "App.Router.BeforeRouteChange", { path: "/home" });
            });

            expect(answers).toEqual([true]);
            expect(tooltip()).toBeNull();
        });
    });

    describe("teardown", () => {
        it("removes exactly the listeners it added when unmounted", async () => {
            const windowAdd = vi.spyOn(window, "addEventListener");
            const documentAdd = vi.spyOn(document, "addEventListener");
            const { unmount } = await mountTooltipManager();
            const added = [
                ...windowAdd.mock.calls.filter(([type]) => ["scroll", "resize", "keydown", "blur"].includes(type)).map((c) => ["window", ...c]),
                ...documentAdd.mock.calls.filter(([type]) => type === "visibilitychange").map((c) => ["document", ...c])
            ];
            expect(added.map(([target, type]) => `${target}:${type}`)).toEqual(
                ["window:scroll", "window:resize", "window:keydown", "window:blur", "document:visibilitychange"]
            );
            const windowRemove = vi.spyOn(window, "removeEventListener");
            const documentRemove = vi.spyOn(document, "removeEventListener");

            unmount();
            await settle();

            for (const [target, type, listener, options] of added) {
                const removals = (target === "window" ? windowRemove : documentRemove).mock.calls;
                // Same function, and for scroll the same capture flag — otherwise the listener stays.
                expect(removals).toContainEqual(options === undefined ? [type, listener] : [type, listener, options]);
            }
        });

        it("cancels a pending show when unmounted", async () => {
            const { model, unmount } = await mountTooltipManager();
            vi.useFakeTimers();
            await show({ delay: 250 });

            unmount();
            await advance(0);
            await advance(500);

            expect(model._open).toBe(false);
        });
    });
});
