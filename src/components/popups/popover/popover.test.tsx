import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { AnchorRect } from "@core";
import { Popover } from "@components";
import { mount, settle } from "@test";

const VIEWPORT = { width: 1000, height: 800 };

// jsdom has no layout: give every popover element the size in `overlay` (mutable, so a test can
// grow it), and pin the viewport. Returns the spy, so a test can count the measurements.
function stubLayout(overlay: { width: number; height: number }) {
    vi.stubGlobal("innerWidth", VIEWPORT.width);
    vi.stubGlobal("innerHeight", VIEWPORT.height);
    return vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
        const isPopover = this.classList.contains("ueca-popover");
        const width = isPopover ? overlay.width : 0;
        const height = isPopover ? overlay.height : 0;
        return { x: 0, y: 0, top: 0, left: 0, right: width, bottom: height, width, height, toJSON: () => ({}) } as DOMRect;
    });
}

function popoverMeasurements(spy: ReturnType<typeof stubLayout>): number {
    return spy.mock.contexts.filter((el) => (el as Element).classList.contains("ueca-popover")).length;
}

function popover(id = "pop"): HTMLElement {
    return document.getElementById(id);
}

// Mid-viewport, with room on every side for a 200×120 overlay.
const anchor: AnchorRect = { top: 100, left: 300, width: 80, height: 30 };

describe("Popover", () => {
    it("renders nothing while closed", async () => {
        const { container } = await mount(Popover, { id: "pop", anchor, contentView: "Body" });

        expect(container).toBeEmptyDOMElement();
    });

    it("renders its content in a dialog-role panel, with a caller's className appended", async () => {
        stubLayout({ width: 200, height: 120 });

        await mount(Popover, { id: "pop", open: true, anchor, className: "ueca-popover-menu", contentView: "Filter body" });

        expect(screen.getByRole("dialog")).toBe(popover());
        expect(popover()).toHaveClass("ueca-popover", "ueca-popover-menu");
        expect(popover()).toHaveTextContent("Filter body");
    });

    describe("placement", () => {
        it("places itself below and centred on the anchor, 6px away, and becomes visible", async () => {
            stubLayout({ width: 200, height: 120 });

            await mount(Popover, { id: "pop", open: true, anchor, contentView: "Body" });

            expect(popover()).toHaveStyle({
                top: `${100 + 30 + 6}px`,
                left: `${300 + (80 - 200) / 2}px`,
                visibility: "visible"
            });
        });

        it("honours a requested side", async () => {
            stubLayout({ width: 200, height: 120 });

            await mount(Popover, {
                id: "pop", open: true, placement: "right", anchor: { top: 300, left: 100, width: 80, height: 30 }
            });

            expect(popover()).toHaveStyle({ top: `${300 + (30 - 120) / 2}px`, left: `${100 + 80 + 6}px` });
        });

        it("flips above an anchor with no room below it", async () => {
            stubLayout({ width: 200, height: 120 });

            await mount(Popover, { id: "pop", open: true, anchor: { top: 700, left: 300, width: 80, height: 30 } });

            expect(popover()).toHaveStyle({ top: `${700 - 120 - 6}px`, left: "240px" });
        });

        it("slides back inside the viewport near its edge", async () => {
            stubLayout({ width: 200, height: 120 });

            await mount(Popover, { id: "pop", open: true, anchor: { top: 100, left: 950, width: 40, height: 30 } });

            expect(popover()).toHaveStyle({ top: "136px", left: `${VIEWPORT.width - 200 - 8}px` });
        });

        // Without an anchor there is nothing to place against: it must not flash at the top-left.
        it("stays invisible at the origin until it has something to measure against", async () => {
            stubLayout({ width: 200, height: 120 });

            const { model } = await mount(Popover, { id: "pop", open: true, contentView: "Body" });

            expect(popover()).toHaveStyle({ top: "0px", left: "0px", visibility: "hidden" });

            model.anchor = anchor;
            model._measureAndPlace();
            await settle();

            expect(popover()).toHaveStyle({ top: "136px", left: "240px", visibility: "visible" });
        });

        it("re-places itself when its content re-renders at a new size", async () => {
            const overlay = { width: 200, height: 120 };
            stubLayout(overlay);
            const { model } = await mount(Popover, {
                id: "pop", open: true, anchor: { top: 500, left: 300, width: 80, height: 30 }, contentView: "short"
            });
            expect(popover()).toHaveStyle({ top: `${500 + 30 + 6}px` });

            overlay.height = 300;
            model.contentView = "much taller";
            await settle();

            // No longer fits below (500 + 30 + 6 + 300 > 800 - 8), so it flips above.
            expect(popover()).toHaveStyle({ top: `${500 - 300 - 6}px`, visibility: "visible" });
        });

        // The draw hook measures after every render, and a measurement that changes the position
        // re-renders — so an unconditional reassignment would never stop.
        it("stops re-measuring once its position is stable", async () => {
            const spy = stubLayout({ width: 200, height: 120 });

            const { model } = await mount(Popover, { id: "pop", anchor, contentView: "Body" });
            model.open = true;
            await settle(20);

            expect(popover()).toHaveStyle({ top: "136px", visibility: "visible" });
            expect(popoverMeasurements(spy)).toBeLessThanOrEqual(3);
        });

        // "Re-measure from scratch each time it opens: the anchor will have moved."
        it("does not reopen at the previous position before it has measured again", async () => {
            stubLayout({ width: 200, height: 120 });
            const { model } = await mount(Popover, { id: "pop", anchor, contentView: "Body" });
            model.open = true;
            await settle();
            expect(popover()).toHaveStyle({ top: "136px", visibility: "visible" });

            model.close();
            model.anchor = undefined;
            model.open = true;
            await settle();

            expect(popover()).toHaveStyle({ top: "0px", left: "0px", visibility: "hidden" });
        });

        it("measures the new anchor when reopened elsewhere", async () => {
            stubLayout({ width: 200, height: 120 });
            const { model } = await mount(Popover, { id: "pop", anchor, contentView: "Body" });
            model.open = true;
            await settle();

            model.close();
            model.anchor = { top: 400, left: 500, width: 100, height: 20 };
            model.open = true;
            await settle();

            expect(popover()).toHaveStyle({ top: `${400 + 20 + 6}px`, left: `${500 + (100 - 200) / 2}px` });
        });
    });

    describe("closing", () => {
        it("close() closes and raises onClose once with its model", async () => {
            stubLayout({ width: 200, height: 120 });
            const onClose = vi.fn();
            const { model } = await mount(Popover, { id: "pop", open: true, anchor, onClose });

            model.close();
            model.close();
            await settle();

            expect(model.open).toBe(false);
            expect(popover()).toBeNull();
            expect(onClose).toHaveBeenCalledExactlyOnceWith(model);
        });

        it("close() on a closed popover raises nothing", async () => {
            const onClose = vi.fn();
            const { model } = await mount(Popover, { id: "pop", anchor, onClose });

            model.close();

            expect(onClose).not.toHaveBeenCalled();
        });

        it("closes on a mousedown outside it, but not on one inside it", async () => {
            stubLayout({ width: 200, height: 120 });
            const onClose = vi.fn();
            const { model } = await mount(Popover, {
                id: "pop", open: true, anchor, contentView: <button type="button">Inside</button>, onClose
            });

            fireEvent.mouseDown(screen.getByRole("button", { name: "Inside" }));
            await settle();
            expect(model.open).toBe(true);

            fireEvent.mouseDown(document.body);
            await settle();
            expect(model.open).toBe(false);
            expect(onClose).toHaveBeenCalledOnce();
        });

        it("ignores outside mousedowns when closeOnOutsideClick is off", async () => {
            stubLayout({ width: 200, height: 120 });
            const { model } = await mount(Popover, { id: "pop", open: true, anchor, closeOnOutsideClick: false });

            fireEvent.mouseDown(document.body);
            await settle();

            expect(model.open).toBe(true);
        });

        // Capture-phase close runs before the trigger's own click, which would then see the popover
        // closed and re-open it — the trigger could never toggle it shut.
        it("does not treat a mousedown on its trigger, or inside it, as an outside click", async () => {
            stubLayout({ width: 200, height: 120 });
            render(<button type="button">Toggle <span data-testid="glyph">▾</span></button>);
            const trigger = screen.getByRole("button", { name: /Toggle/ });
            const { model } = await mount(Popover, { id: "pop", open: true, anchor, onGetTrigger: () => trigger });

            fireEvent.mouseDown(trigger);
            fireEvent.mouseDown(screen.getByTestId("glyph"));
            await settle();

            expect(model.open).toBe(true);
        });

        it("closes on Escape and swallows the key, but ignores other keys", async () => {
            stubLayout({ width: 200, height: 120 });
            const { model } = await mount(Popover, { id: "pop", open: true, anchor });

            expect(fireEvent.keyDown(document.body, { key: "Enter" })).toBe(true);
            await settle();
            expect(model.open).toBe(true);

            // fireEvent returns false when the default was prevented.
            expect(fireEvent.keyDown(document.body, { key: "Escape" })).toBe(false);
            await settle();
            expect(model.open).toBe(false);
        });

        it("ignores Escape when closeOnEscape is off", async () => {
            stubLayout({ width: 200, height: 120 });
            const { model } = await mount(Popover, { id: "pop", open: true, anchor, closeOnEscape: false });

            expect(fireEvent.keyDown(document.body, { key: "Escape" })).toBe(true);
            await settle();

            expect(model.open).toBe(true);
        });

        // The anchor rect was captured at open, so a scroll leaves the popover pointing at nothing.
        it("closes when the page or another container scrolls", async () => {
            stubLayout({ width: 200, height: 120 });
            render(<div data-testid="other-scroller" />);
            const { model } = await mount(Popover, { id: "pop", anchor });

            model.open = true;
            await settle();
            fireEvent.scroll(screen.getByTestId("other-scroller"));
            await settle();
            expect(model.open).toBe(false);

            model.open = true;
            await settle();
            fireEvent.scroll(window);
            await settle();
            expect(model.open).toBe(false);
        });

        it("stays open when its own content scrolls", async () => {
            stubLayout({ width: 200, height: 120 });
            const { model } = await mount(Popover, {
                id: "pop", open: true, anchor, contentView: <div data-testid="inner-list">rows</div>
            });

            fireEvent.scroll(screen.getByTestId("inner-list"));
            fireEvent.scroll(popover());
            await settle();

            expect(model.open).toBe(true);
        });

        it("closes on a window resize", async () => {
            stubLayout({ width: 200, height: 120 });
            const onClose = vi.fn();
            const { model } = await mount(Popover, { id: "pop", open: true, anchor, onClose });

            fireEvent(window, new Event("resize"));
            await settle();

            expect(model.open).toBe(false);
            expect(onClose).toHaveBeenCalledOnce();
        });

        it("ignores scrolls and resizes when closeOnScroll is off", async () => {
            stubLayout({ width: 200, height: 120 });
            const { model } = await mount(Popover, { id: "pop", open: true, anchor, closeOnScroll: false });

            fireEvent.scroll(window);
            fireEvent(window, new Event("resize"));
            await settle();

            expect(model.open).toBe(true);
        });

        it("stops listening once unmounted", async () => {
            stubLayout({ width: 200, height: 120 });
            const onClose = vi.fn();
            const { model, unmount } = await mount(Popover, { id: "pop", open: true, anchor, onClose });

            unmount();
            // The unmount hook runs after the React unmount, not inside it.
            await settle();
            fireEvent.mouseDown(document.body);
            fireEvent.keyDown(document.body, { key: "Escape" });
            fireEvent.scroll(window);
            fireEvent(window, new Event("resize"));
            await settle();

            expect(onClose).not.toHaveBeenCalled();
            expect(model.open).toBe(true);
        });
    });

    // Deliberately not a singleton: each popover owns its content's state and its own visibility.
    it("lets two popovers be open at once, each closing independently", async () => {
        stubLayout({ width: 200, height: 120 });
        const { model: first } = await mount(Popover, { id: "first", open: true, anchor, contentView: <span>first body</span> });
        const { model: second } = await mount(Popover, { id: "second", open: true, anchor, contentView: <span>second body</span> });

        expect(popover("first")).toBeInTheDocument();
        expect(popover("second")).toBeInTheDocument();

        // A click inside one popover is an outside click for the other.
        fireEvent.mouseDown(screen.getByText("first body"));
        await settle();

        expect(first.open).toBe(true);
        expect(second.open).toBe(false);
        expect(popover("first")).toBeInTheDocument();
    });
});
