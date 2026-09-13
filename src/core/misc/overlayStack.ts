// Stacking order for the overlays that can contain each other — dialogs and drawers.
//
// These CANNOT live in fixed z-index bands. Which one belongs on top is a RUNTIME fact, not a
// static property of the kind: a confirmation raised from inside an edit drawer must cover that
// drawer, while a drawer opened from a dialog must cover the dialog. Any fixed pair of bands gets
// one of those two cases wrong — and the app had the first one wrong, with the dialog backdrop
// below the drawer, so "Delete" inside a drawer opened a confirmation nobody could see.
//
// So the z is handed out in OPEN order and the most recently opened always wins. Each overlay owns
// a small band rather than a single value, because one overlay paints two layers (its backdrop and
// its panel).
//
// Not a bus service: this allocates a number, it does not carry information between components,
// and it has to answer synchronously — an await here would paint one frame at the wrong depth.

// Below --z-toast / --z-tooltip, which stay above every overlay by design (they render outside the
// overlay subtrees; see docs/raw/overlays.md).
const BASE_Z = 1300;
const BAND = 10;

// The z values currently handed out. A Set rather than a counter alone so that releasing the last
// overlay can reset the ladder — otherwise a long-lived session climbs toward the toast band.
const live = new Set<number>();
let nextZ = BASE_Z;

// Reserve the next band up. The caller owns `z` (its backdrop) and `z + 1` (its panel) until it
// releases.
function acquireOverlayZ(): number {
    nextZ += BAND;
    live.add(nextZ);
    return nextZ;
}

function releaseOverlayZ(z: number): void {
    live.delete(z);
    if (live.size === 0) {
        nextZ = BASE_Z;
    }
}

export { acquireOverlayZ, releaseOverlayZ };
