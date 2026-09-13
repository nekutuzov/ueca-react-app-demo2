import { runAsync } from "../infrastructure/appUtils";

// Bringing a screen to the section its address names. Extracted because the tricky parts are the
// same wherever it is done, and getting any of them wrong fails quietly.
//
// A section names an element in the RENDERED DOM. On a tabbed screen only the active tab is
// rendered, so a section is resolvable only while its element is on show - see "scoped to what is
// rendered" below.

// Breathing room between the top of the scrolling box and the heading landed on.
const SECTION_INSET = 12;

// The box that actually scrolls, found by walking up from the target rather than by naming a class.
// A screen's own content box is often the scroller and often is not: on MLAdmin's showcase the
// content box cannot move at all (maxScroll 0) while a panel inside it scrolls 502px, so anything
// assuming the outer box would scroll nothing and appear broken.
function _scrollerFor(element: Element): HTMLElement | undefined {
    for (let node = element.parentElement; node; node = node.parentElement) {
        const overflowY = getComputedStyle(node).overflowY;
        const scrollable = overflowY === "auto" || overflowY === "scroll";
        if (scrollable && node.scrollHeight > node.clientHeight) {
            return node;
        }
    }
    return undefined;
}

function _scroll(rootId: string, section: string | undefined, onlyIfAdrift: boolean): void {
    const root = document.getElementById(rootId);
    if (!root) {
        return;
    }

    // No section is an address too: the screen itself, read from the top. Distinct from a section
    // that cannot be found, below.
    if (!section) {
        if (!onlyIfAdrift) {
            _scrollerFor(root)?.scrollTo({ top: 0 });
        }
        return;
    }

    // Scoped to what is rendered. A section naming an element that is not in the DOM - one inside
    // an inactive tab, or simply stale - leaves the view ALONE. Scrolling to the top instead would
    // punish the reader for an address the screen cannot honour.
    const target = document.getElementById(section);
    const scroller = target ? _scrollerFor(target) : undefined;
    if (!target || !scroller) {
        return;
    }

    // Scroll the box itself, never scrollIntoView: that walks every scrollable ancestor and drags
    // the app shell with it. Instant, not smooth - a smooth scroll over this distance is still
    // animating when the next render lands, and the browser abandons it part-way.
    const delta = target.getBoundingClientRect().top - scroller.getBoundingClientRect().top - SECTION_INSET;
    if (onlyIfAdrift && Math.abs(delta) <= 1) {
        return;
    }
    scroller.scrollTo({ top: scroller.scrollTop + delta });
}

// Applied twice: once now - call it from `draw`, before the browser paints, so no frame shows the
// screen at the wrong place - and once after layout has settled. The second pass is the one that
// lands it: a heading moves under the first measurement whenever anything above it is still
// settling, an image with no intrinsic dimensions being the usual cause. Correcting only when the
// target actually moved keeps the common case to a single scroll and no visible jump.
function showSection(rootId: string, section?: string): void {
    _scroll(rootId, section, false);
    runAsync(() => _scroll(rootId, section, true));
}

export { showSection, SECTION_INSET };
