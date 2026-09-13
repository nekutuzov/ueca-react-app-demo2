import { describe, expect, it, vi } from "vitest";
import { act, fireEvent } from "@testing-library/react";
import { VirtualList, VirtualListParams } from "@components";
import { mount, ResizeObserverStub, settle } from "@test";

// 1,000 items of 32px in a 320px viewport: 10 whole rows plus a partial one are visible, and
// overscan (6) adds rows past each edge.
function mountList(params: VirtualListParams = {}, viewportHeight = 320) {
    // Measured by the mount hook, so it has to be in place before the list mounts.
    vi.spyOn(Element.prototype, "clientHeight", "get").mockReturnValue(viewportHeight);
    return mount(VirtualList, { id: "list", itemCount: 1000, itemSize: 32, onRenderItem: (index) => `Item ${index}`, ...params });
}

function viewport() {
    return document.getElementById("list");
}

function itemElements() {
    return Array.from(document.querySelectorAll<HTMLElement>(".ueca-virtuallist-item"));
}

function renderedIndexes() {
    return itemElements().map((item) => Number(item.textContent.replace("Item ", "")));
}

function indexes(start: number, end: number) {
    return Array.from({ length: end - start }, (_, i) => start + i);
}

function scrollList(scrollTop: number) {
    viewport().scrollTop = scrollTop;
    fireEvent.scroll(viewport());
}

describe("VirtualList", () => {
    it("renders the visible slice plus overscan inside a spacer as tall as every item", async () => {
        const { model } = await mountList();

        expect(viewport()).toHaveClass("ueca-virtuallist");
        expect(renderedIndexes()).toEqual(indexes(0, 17));
        expect(model.range()).toEqual({ start: 0, end: 17 });
        expect(document.querySelector<HTMLElement>(".ueca-virtuallist-spacer").style.height).toBe(`${1000 * 32}px`);
        expect(document.querySelector<HTMLElement>(".ueca-virtuallist-window").style.top).toBe("0px");
    });

    it("moves the window with the scroll offset, overscanning on both sides", async () => {
        const { model } = await mountList();

        scrollList(3200);
        await settle();

        expect(renderedIndexes()).toEqual(indexes(94, 117));
        expect(model.range()).toEqual({ start: 94, end: 117 });
        // The window sits where its first item belongs in the full-height spacer.
        expect(document.querySelector<HTMLElement>(".ueca-virtuallist-window").style.top).toBe(`${94 * 32}px`);
    });

    it("ends the window at the last item", async () => {
        await mountList();

        scrollList(31900);
        await settle();

        expect(renderedIndexes()).toEqual(indexes(990, 1000));
    });

    it.each([
        // scrollTop, itemSize, overscan, viewport height, start, end
        [50, 32, 6, 320, 0, 18],
        [3200, 32, 0, 320, 100, 111],
        [3200, 20, 2, 100, 158, 168],
        [0, 32, 6, 0, 0, 7]
    ])("at scrollTop %i with %ipx items, overscan %i and a %ipx viewport spans items %i–%i", async (scrollTop, itemSize, overscan, height, start, end) => {
        const { model } = await mountList({ itemSize, overscan }, height);

        scrollList(scrollTop);

        expect(model.range()).toEqual({ start, end });
    });

    it("hands each rendered item its index and the list, in a box locked to itemSize", async () => {
        const onRenderItem = vi.fn((index: number) => `Item ${index}`);
        const { model } = await mountList({ itemCount: 3, itemSize: 20, onRenderItem });

        expect(new Set(onRenderItem.mock.calls.map(([index]) => index))).toEqual(new Set([0, 1, 2]));
        expect(onRenderItem).toHaveBeenCalledWith(1, model);
        expect(itemElements().map((item) => item.style.height)).toEqual(["20px", "20px", "20px"]);
        expect(document.querySelector<HTMLElement>(".ueca-virtuallist-spacer").style.height).toBe("60px");
    });

    it("follows item count changes", async () => {
        const { model } = await mountList();

        model.itemCount = 5;
        await settle();

        expect(renderedIndexes()).toEqual(indexes(0, 5));
        expect(document.querySelector<HTMLElement>(".ueca-virtuallist-spacer").style.height).toBe("160px");
    });

    it("resizes the window when the ResizeObserver reports a new viewport height", async () => {
        const { model } = await mountList();

        Object.defineProperty(viewport(), "clientHeight", { configurable: true, value: 640 });
        await act(async () => { ResizeObserverStub.trigger(viewport()); });

        expect(model.range()).toEqual({ start: 0, end: 27 });
        expect(itemElements()).toHaveLength(27);
    });

    // A cached model remounts into a fresh element scrolled to the top; a window left deep in the
    // list by the previous element would render only blank spacer.
    it("takes the scroll offset from its element when it mounts", async () => {
        const { model } = await mountList({ _scrollTop: 3200 });

        expect(model.range()).toEqual({ start: 0, end: 17 });
    });

    it("observes its viewport while mounted and disconnects the observer on unmount", async () => {
        const { unmount } = await mountList();
        const observer = [...ResizeObserverStub.instances].find((o) => o.targets.has(viewport()));
        expect(observer).toBeDefined();

        unmount();
        await settle();

        expect(ResizeObserverStub.instances.has(observer)).toBe(false);
    });

    it("shows its empty view in place of the items when there are none", async () => {
        const { model } = await mountList({ itemCount: 0, emptyView: "Nothing to show" });

        expect(document.querySelector(".ueca-virtuallist-empty")).toHaveTextContent("Nothing to show");
        expect(document.querySelector(".ueca-virtuallist-spacer")).toBeNull();

        model.itemCount = 2;
        await settle();

        expect(document.querySelector(".ueca-virtuallist-empty")).toBeNull();
        expect(renderedIndexes()).toEqual([0, 1]);
    });

    it("renders an empty spacer for no items when it has no empty view", async () => {
        await mountList({ itemCount: 0 });

        expect(document.querySelector(".ueca-virtuallist-empty")).toBeNull();
        expect(document.querySelector<HTMLElement>(".ueca-virtuallist-spacer").style.height).toBe("0px");
        expect(itemElements()).toHaveLength(0);
    });

    it("adds its className to its own", async () => {
        await mountList({ className: "instrument-picker" });

        expect(viewport()).toHaveClass("ueca-virtuallist", "instrument-picker");
    });

    describe("scrollToIndex", () => {
        it.each([
            // align, scrollTop before, index, scrollTop after
            ["start", 0, 100, 100 * 32],
            // The item's centre on the viewport's centre: 3200 − (320 − 32) / 2.
            ["center", 0, 100, 3056],
            // Below the viewport: scroll just enough to bring its bottom edge in.
            ["nearest", 0, 100, 101 * 32 - 320],
            // Above the viewport: scroll just enough to bring its top edge in.
            ["nearest", 3200, 50, 50 * 32],
            // Already fully visible: stay put.
            ["nearest", 3200, 105, 3200]
        ] as const)("aligned %s from scrollTop %i, index %i scrolls to %i", async (align, from, index, to) => {
            const { model } = await mountList();
            viewport().scrollTop = from;

            model.scrollToIndex(index, align);

            expect(viewport().scrollTop).toBe(to);
        });

        it("scrolls to the nearest edge by default", async () => {
            const { model } = await mountList();

            model.scrollToIndex(100);

            expect(viewport().scrollTop).toBe(101 * 32 - 320);
        });

        // "Set it eagerly too so a caller that reads range() right after scrollToIndex() sees the
        // new window" — before the scroll event arrives.
        it("moves the window at once, without waiting for the scroll event", async () => {
            const { model } = await mountList();

            model.scrollToIndex(500, "start");

            expect(model.range()).toEqual({ start: 494, end: 517 });
        });

        it("clamps the index into the list", async () => {
            const { model } = await mountList();

            model.scrollToIndex(5000, "start");
            expect(viewport().scrollTop).toBe(999 * 32);

            model.scrollToIndex(-3, "start");
            expect(viewport().scrollTop).toBe(0);
        });

        it("never scrolls above the top of the list", async () => {
            const { model } = await mountList();
            viewport().scrollTop = 500;

            model.scrollToIndex(0, "center");

            expect(viewport().scrollTop).toBe(0);
        });

        it("does nothing for an empty list", async () => {
            const { model } = await mountList({ itemCount: 0 });
            viewport().scrollTop = 40;

            model.scrollToIndex(3, "start");

            expect(viewport().scrollTop).toBe(40);
            expect(model.range()).toEqual({ start: 0, end: 0 });
        });

        it("does nothing once the list is unmounted", async () => {
            const { model, unmount } = await mountList();
            unmount();

            expect(() => model.scrollToIndex(10, "start")).not.toThrow();
        });
    });
});
