import { afterEach, describe, expect, it } from "vitest";
import { acquireOverlayZ, releaseOverlayZ } from "@core";

// tokens.css is read from disk because Vitest empties every CSS import, `?raw` included. The test
// tsconfig carries no Node typings, so the one Node API used is typed here.
declare const process: { getBuiltinModule(id: "node:fs"): { readFileSync(path: string, encoding: "utf8"): string } };

function projectFile(path: string): string {
    const dir = (import.meta as ImportMeta & { dirname: string }).dirname;
    return process.getBuiltinModule("node:fs").readFileSync(`${dir}/../../../${path}`, "utf8");
}

// The ladder is module state shared by every test in this file. Tests acquire through `open` and
// anything still held is released afterwards, so each test starts from an empty ladder even when
// an earlier one failed half-way.
const held = new Set<number>();

function open(): number {
    const z = acquireOverlayZ();
    held.add(z);
    return z;
}

function close(z: number) {
    held.delete(z);
    releaseOverlayZ(z);
}

afterEach(() => {
    held.forEach((z) => releaseOverlayZ(z));
    held.clear();
});

// The fixed layers the ladder has to fit between, read from tokens.css so the two cannot drift.
function zToken(name: string): number {
    return Number(new RegExp(`--${name}:\\s*(\\d+)`).exec(projectFile("src/tokens.css"))[1]);
}

describe("overlay stack", () => {
    // Each overlay paints its backdrop at z and its panel at z + 1, so the next band has to start
    // above both or a new backdrop would slide under the previous panel.
    it("hands out bands in open order, each clear of the previous backdrop and panel", () => {
        const first = open();
        const second = open();
        const third = open();

        expect(second).toBeGreaterThan(first + 1);
        expect(third).toBeGreaterThan(second + 1);
    });

    // A confirmation raised from inside an edit drawer must cover that drawer.
    it("puts an overlay opened after an earlier one closed above every overlay still open", () => {
        const drawer = open();
        const dialog = open();
        close(drawer);

        const confirmation = open();

        expect(confirmation).toBeGreaterThan(dialog + 1);
    });

    // Otherwise a long-lived session climbs toward the toast band.
    it("resets the ladder once every overlay has closed", () => {
        const first = open();
        const second = open();
        close(second);
        close(first);

        expect(open()).toBe(first);
    });

    // The reason the stack is a Set and not a counter: a band released twice, or one that was never
    // handed out, must not count as another overlay closing.
    it("does not reset while an overlay is open, however often a stale band is released", () => {
        const drawer = open();
        const dialog = open();
        close(dialog);
        releaseOverlayZ(dialog);
        releaseOverlayZ(123456);

        expect(open()).toBeGreaterThan(drawer + 1);
    });

    it("starts above the fixed overlay floor from tokens.css", () => {
        expect(open()).toBeGreaterThan(zToken("z-dialog-backdrop"));
    });

    // Toasts and the tooltip render outside the overlay subtrees and must stay above them.
    it("keeps a deep stack of overlays below the toast and tooltip layers", () => {
        let top = 0;
        for (let i = 0; i < 20; i++) {
            top = open();
        }

        expect(top + 1).toBeLessThan(Math.min(zToken("z-toast"), zToken("z-tooltip")));
    });
});
