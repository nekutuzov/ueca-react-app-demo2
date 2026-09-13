import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SECTION_INSET, showSection } from "@core";

// jsdom has no layout, so the page is modelled by hand: a scrolling box at a fixed position on
// screen, and sections whose on-screen top follows the box's scrollTop the way the browser's would.
// `shift` moves content the way a late-loading image above a heading does.

type BoxOptions = { top?: number; clientHeight?: number; scrollHeight?: number; overflowY?: string };

function makeBox(id: string, { top = 0, clientHeight = 500, scrollHeight = 2000, overflowY = "auto" }: BoxOptions = {}) {
    const el = document.createElement("div");
    el.id = id;
    el.style.overflowY = overflowY;
    Object.defineProperty(el, "clientHeight", { configurable: true, value: clientHeight });
    Object.defineProperty(el, "scrollHeight", { configurable: true, value: scrollHeight });
    vi.spyOn(el, "getBoundingClientRect").mockImplementation(() => ({ top }) as DOMRect);
    return el;
}

let shift = 0;

// A section whose top, in content coordinates of `scroller`, is `contentTop`.
function makeSection(id: string, scroller: HTMLElement, contentTop: number) {
    const el = document.createElement("h2");
    el.id = id;
    vi.spyOn(el, "getBoundingClientRect").mockImplementation(
        () => ({ top: scroller.getBoundingClientRect().top + contentTop + shift - scroller.scrollTop }) as DOMRect
    );
    return el;
}

// shell > scroller > screen > (intro, details)
function screenFixture(scrollerOptions?: BoxOptions) {
    const shell = makeBox("shell", { top: 0, clientHeight: 800, scrollHeight: 800 });
    const scroller = makeBox("scroller", { top: 100, ...scrollerOptions });
    const screen = makeBox("screen", { overflowY: "visible" });
    const intro = makeSection("intro", scroller, 0);
    const details = makeSection("details", scroller, 600);
    screen.append(intro, details);
    scroller.append(screen);
    shell.append(scroller);
    document.body.append(shell);
    return { shell, scroller, screen, details, scrollTo: vi.spyOn(scroller, "scrollTo") };
}

// The second pass is deferred with setTimeout(0).
function settleLayout() {
    vi.runOnlyPendingTimers();
}

beforeEach(() => {
    shift = 0;
    vi.useFakeTimers();
});

afterEach(() => {
    document.body.replaceChildren();
});

describe("showSection", () => {
    it("scrolls the scrolling box so the section lands SECTION_INSET below its top", () => {
        const { scroller, scrollTo } = screenFixture();

        showSection("screen", "details");

        // Instant, not smooth: the exact argument carries no `behavior`.
        expect(scrollTo).toHaveBeenCalledExactlyOnceWith({ top: 600 - SECTION_INSET });
        expect(scroller.scrollTop).toBe(600 - SECTION_INSET);
    });

    it("measures from the current scroll position", () => {
        const { scroller, scrollTo } = screenFixture();
        scroller.scrollTop = 250;

        showSection("screen", "details");

        expect(scrollTo).toHaveBeenCalledExactlyOnceWith({ top: 600 - SECTION_INSET });
    });

    // Called from `draw`, before the browser paints, so no frame shows the screen at the wrong place.
    it("makes the first scroll synchronously", () => {
        const { scrollTo } = screenFixture();

        showSection("screen", "details");

        expect(scrollTo).toHaveBeenCalledOnce();
        expect(vi.getTimerCount()).toBe(1);
    });

    it("does not scroll a second time when the first pass landed", () => {
        const { scrollTo } = screenFixture();

        showSection("screen", "details");
        settleLayout();

        expect(scrollTo).toHaveBeenCalledOnce();
    });

    // The second pass is the one that lands it: a heading moves under the first measurement while
    // anything above it is still settling.
    it("corrects on the deferred pass when the section moved while layout settled", () => {
        const { scroller, scrollTo } = screenFixture();

        showSection("screen", "details");
        shift = 40;
        settleLayout();

        expect(scrollTo).toHaveBeenCalledTimes(2);
        expect(scrollTo).toHaveBeenLastCalledWith({ top: 600 - SECTION_INSET + 40 });
        expect(scroller.scrollTop).toBe(600 - SECTION_INSET + 40);
    });

    // Correcting only when the target actually moved keeps the common case to one scroll and no jump.
    it.each([1, -1, 0.5])("ignores a drift of %spx", (drift) => {
        const { scrollTo } = screenFixture();

        showSection("screen", "details");
        shift = drift;
        settleLayout();

        expect(scrollTo).toHaveBeenCalledOnce();
    });

    it.each([1.5, -2])("corrects a drift of %spx", (drift) => {
        const { scrollTo } = screenFixture();

        showSection("screen", "details");
        shift = drift;
        settleLayout();

        expect(scrollTo).toHaveBeenCalledTimes(2);
        expect(scrollTo).toHaveBeenLastCalledWith({ top: 600 - SECTION_INSET + drift });
    });

    // No section is an address too: the screen itself, read from the top.
    it("scrolls back to the top without a section, and only on the first pass", () => {
        const { scroller, scrollTo } = screenFixture();
        scroller.scrollTop = 300;

        showSection("screen");
        scroller.scrollTop = 20;
        settleLayout();

        expect(scrollTo).toHaveBeenCalledExactlyOnceWith({ top: 0 });
        expect(scroller.scrollTop).toBe(20);
    });

    // A section inside an inactive tab, or a stale one, must not punish the reader with a jump to
    // the top.
    it("leaves the view alone for a section that is not rendered", () => {
        const { scroller, scrollTo } = screenFixture();
        scroller.scrollTop = 300;

        showSection("screen", "no-such-section");
        settleLayout();

        expect(scrollTo).not.toHaveBeenCalled();
        expect(scroller.scrollTop).toBe(300);
    });

    it("does nothing while the screen itself is not in the document", () => {
        const { scrollTo } = screenFixture();

        showSection("other-screen", "details");
        showSection("other-screen");
        settleLayout();

        expect(scrollTo).not.toHaveBeenCalled();
    });

    it("tolerates the screen going away before the deferred pass", () => {
        const { shell, scrollTo } = screenFixture();

        showSection("screen", "details");
        shift = 40;
        shell.remove();

        expect(() => settleLayout()).not.toThrow();
        expect(scrollTo).toHaveBeenCalledOnce();
    });

    describe("finding the box that scrolls", () => {
        it.each(["auto", "scroll"])("accepts overflow-y: %s", (overflowY) => {
            const { scrollTo } = screenFixture({ overflowY });

            showSection("screen", "details");

            expect(scrollTo).toHaveBeenCalledOnce();
        });

        it.each(["visible", "hidden", "clip"])("does not scroll a box with overflow-y: %s", (overflowY) => {
            const { scrollTo } = screenFixture({ overflowY });

            showSection("screen", "details");
            settleLayout();

            expect(scrollTo).not.toHaveBeenCalled();
        });

        // A screen's content box may be unable to move at all while a panel inside it scrolls.
        it("skips a box that has overflow but nothing to scroll", () => {
            const { scrollTo, shell } = screenFixture({ scrollHeight: 500, clientHeight: 500 });
            Object.defineProperty(shell, "scrollHeight", { configurable: true, value: 3000 });
            const shellScroll = vi.spyOn(shell, "scrollTo");

            showSection("screen", "details");

            expect(scrollTo).not.toHaveBeenCalled();
            expect(shellScroll).toHaveBeenCalledOnce();
        });

        // scrollIntoView walks every scrollable ancestor and drags the app shell with it.
        it("moves only the nearest scrolling box, never the shell around it, and never via scrollIntoView", () => {
            const { shell, scrollTo } = screenFixture();
            Object.defineProperty(shell, "scrollHeight", { configurable: true, value: 3000 });
            const shellScroll = vi.spyOn(shell, "scrollTo");
            const scrollIntoView = vi.spyOn(Element.prototype, "scrollIntoView");

            showSection("screen", "details");
            shift = 40;
            settleLayout();

            expect(scrollTo).toHaveBeenCalledTimes(2);
            expect(shellScroll).not.toHaveBeenCalled();
            expect(scrollIntoView).not.toHaveBeenCalled();
        });

        it("leaves the view alone when nothing around the section can scroll", () => {
            const { scrollTo } = screenFixture({ scrollHeight: 500, clientHeight: 500 });

            showSection("screen", "details");
            showSection("screen");
            settleLayout();

            expect(scrollTo).not.toHaveBeenCalled();
        });
    });
});
