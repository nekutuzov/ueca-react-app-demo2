import { describe, expect, it } from "vitest";
import { AnchorRect, positionOverlay } from "@core";

const viewport = { width: 1000, height: 800 };
const overlay = { width: 100, height: 40 };
// Comfortably inside the viewport, with room on every side.
const anchor: AnchorRect = { top: 400, left: 450, width: 100, height: 20 };

describe("positionOverlay", () => {
    it("places above and centred on the anchor by default, 8px away", () => {
        expect(positionOverlay({ anchor, overlay, viewport })).toEqual({
            top: 400 - 40 - 8,
            left: 450 + (100 - 100) / 2,
            placement: "top"
        });
    });

    it.each([
        ["bottom", { top: 400 + 20 + 8, left: 450 }],
        ["left", { top: 400 + (20 - 40) / 2, left: 450 - 100 - 8 }],
        ["right", { top: 400 + (20 - 40) / 2, left: 450 + 100 + 8 }]
    ] as const)("places %s when that side fits", (placement, expected) => {
        expect(positionOverlay({ anchor, overlay, viewport, placement })).toEqual({ ...expected, placement });
    });

    it("honours a custom gap", () => {
        expect(positionOverlay({ anchor, overlay, viewport, placement: "bottom", gap: 2 }).top).toBe(400 + 20 + 2);
    });

    it.each([
        ["top", { ...anchor, top: 10 }, "bottom"],
        ["bottom", { ...anchor, top: 780 }, "top"],
        ["left", { ...anchor, left: 10 }, "right"],
        ["right", { ...anchor, left: 950 }, "left"]
    ] as const)("flips %s to the opposite side when it does not fit", (placement, cramped, flipped) => {
        expect(positionOverlay({ anchor: cramped, overlay, viewport, placement }).placement).toBe(flipped);
    });

    // Flipping into a side that is just as cramped only makes the overlay jump for no benefit.
    it("keeps the preferred side when the opposite side does not fit either", () => {
        const tallOverlay = { width: 100, height: 500 };
        const middle: AnchorRect = { top: 390, left: 450, width: 100, height: 20 };

        expect(positionOverlay({ anchor: middle, overlay: tallOverlay, viewport, placement: "top" }).placement).toBe("top");
        expect(positionOverlay({ anchor: middle, overlay: tallOverlay, viewport, placement: "bottom" }).placement).toBe("bottom");
    });

    it("counts the margin as part of fitting", () => {
        // Exactly margin (8) + gap (8) + height (40) above the anchor fits...
        expect(positionOverlay({ anchor: { ...anchor, top: 56 }, overlay, viewport, placement: "top" }).placement).toBe("top");
        // ...one pixel less does not.
        expect(positionOverlay({ anchor: { ...anchor, top: 55 }, overlay, viewport, placement: "top" }).placement).toBe("bottom");
        // A bigger margin moves the threshold.
        expect(positionOverlay({ anchor: { ...anchor, top: 56 }, overlay, viewport, placement: "top", margin: 20 }).placement).toBe("bottom");
    });

    it("slides along the cross axis to stay inside the viewport", () => {
        const nearLeft = positionOverlay({ anchor: { top: 400, left: 0, width: 20, height: 20 }, overlay, viewport });
        expect(nearLeft.left).toBe(8);

        const nearRight = positionOverlay({ anchor: { top: 400, left: 990, width: 10, height: 20 }, overlay, viewport });
        expect(nearRight.left).toBe(1000 - 100 - 8);

        const nearTop = positionOverlay({ anchor: { top: 0, left: 450, width: 20, height: 10 }, overlay, viewport, placement: "right" });
        expect(nearTop.top).toBe(8);

        const nearBottom = positionOverlay({ anchor: { top: 795, left: 450, width: 20, height: 5 }, overlay, viewport, placement: "left" });
        expect(nearBottom.top).toBe(800 - 40 - 8);
    });

    // Neither side fits: rather clipped at the edge than positioned off-screen entirely.
    it("clamps the main axis when the overlay is larger than the viewport", () => {
        const huge = { width: 1200, height: 900 };

        expect(positionOverlay({ anchor, overlay: huge, viewport, placement: "top" })).toEqual({ top: 8, left: 8, placement: "top" });
    });
});
