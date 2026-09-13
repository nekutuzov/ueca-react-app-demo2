// Placement maths for anchored overlays — tooltip, menu, popover.
//
// A PURE function of rectangles: no DOM, no React, no component. That is deliberate. Positioning is
// the only genuinely hard part of an overlay and it is identical for all three, so it lives here
// once and each overlay just supplies its measurements. It is also the part most worth reasoning
// about carefully, which is much easier when it cannot touch the document.

type Placement = "top" | "bottom" | "left" | "right";

// Viewport-relative, matching what getBoundingClientRect() returns.
type AnchorRect = { top: number; left: number; width: number; height: number };

type Size = { width: number; height: number };

type PositionedOverlay = {
    top: number;
    left: number;
    // Where it actually ended up — may differ from the request if the preferred side did not fit.
    // The caller needs this to point an arrow at the anchor.
    placement: Placement;
};

const OPPOSITE: Record<Placement, Placement> = {
    top: "bottom",
    bottom: "top",
    left: "right",
    right: "left"
};

type PositionOptions = {
    anchor: AnchorRect;
    overlay: Size;
    viewport: Size;
    // Preferred side. Flipped to its opposite only if that side genuinely has more room.
    placement?: Placement;
    // Distance between anchor edge and overlay edge.
    gap?: number;
    // Keep this far away from the viewport edge.
    margin?: number;
};

// Place `overlay` against `anchor`, flipping if the preferred side does not fit and sliding along
// the cross axis so the overlay stays on screen.
//
// Note this needs the anchor's RECT, not a point. Deciding whether to flip requires knowing how much
// room the anchor leaves on each side, and centring requires its width or height — neither of which
// a bare (x, y) can express.
function positionOverlay(options: PositionOptions): PositionedOverlay {
    const { anchor, overlay, viewport } = options;
    const gap = options.gap ?? 8;
    const margin = options.margin ?? 8;

    const placement = _resolvePlacement(options.placement ?? "top", anchor, overlay, viewport, gap, margin);

    let top: number;
    let left: number;

    if (placement === "top" || placement === "bottom") {
        top = placement === "top"
            ? anchor.top - overlay.height - gap
            : anchor.top + anchor.height + gap;
        // Centre on the anchor, then slide back inside the viewport.
        left = _clamp(anchor.left + (anchor.width - overlay.width) / 2, margin, viewport.width - overlay.width - margin);
    } else {
        left = placement === "left"
            ? anchor.left - overlay.width - gap
            : anchor.left + anchor.width + gap;
        top = _clamp(anchor.top + (anchor.height - overlay.height) / 2, margin, viewport.height - overlay.height - margin);
    }

    // A final clamp on the main axis too: if neither side fits (an overlay taller than the viewport)
    // we would rather show it clipped at the edge than positioned off-screen entirely.
    return {
        top: _clamp(top, margin, Math.max(margin, viewport.height - overlay.height - margin)),
        left: _clamp(left, margin, Math.max(margin, viewport.width - overlay.width - margin)),
        placement
    };
}

export { Placement, AnchorRect, Size, PositionedOverlay, PositionOptions, positionOverlay };


// Private helpers
function _resolvePlacement(
    preferred: Placement, anchor: AnchorRect, overlay: Size, viewport: Size, gap: number, margin: number
): Placement {
    if (_fits(preferred, anchor, overlay, viewport, gap, margin)) {
        return preferred;
    }

    // Only flip if the opposite side actually fits — flipping into a side that is just as cramped
    // makes the overlay jump around for no benefit.
    const opposite = OPPOSITE[preferred];
    return _fits(opposite, anchor, overlay, viewport, gap, margin) ? opposite : preferred;
}

function _fits(
    placement: Placement, anchor: AnchorRect, overlay: Size, viewport: Size, gap: number, margin: number
): boolean {
    switch (placement) {
        case "top":
            return anchor.top - overlay.height - gap >= margin;
        case "bottom":
            return anchor.top + anchor.height + overlay.height + gap <= viewport.height - margin;
        case "left":
            return anchor.left - overlay.width - gap >= margin;
        case "right":
            return anchor.left + anchor.width + overlay.width + gap <= viewport.width - margin;
    }
}

function _clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}
