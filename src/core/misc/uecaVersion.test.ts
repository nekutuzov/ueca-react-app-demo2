import { describe, expect, it } from "vitest";
import { UECA_VERSION } from "@core";
import appPackage from "../../../package.json";
import uecaPackage from "ueca-react/package.json";

// The number the app shows has to be the one that is installed. Written down by hand it went stale
// and nothing failed: the sidebar and the home page both read "3.0" across three library upgrades.

// Ranks a version for comparison - 3.10.2 sorts above 3.9.7, which a string compare gets wrong. A
// prerelease suffix is dropped, and anything unparseable yields NaN, which fails the comparison.
function rank(version: string): number {
    return version.split("-")[0].split(".").map(Number).reduce((n, part) => n * 1000 + part, 0);
}

describe("UECA_VERSION", () => {
    it("is the version of the library in node_modules", () => {
        expect(UECA_VERSION).toBe(uecaPackage.version);
    });

    // A dependency bumped in package.json with no install behind it leaves the tree on the old
    // version - which is how a number that says one thing while reality says another gets shipped.
    it("satisfies the range this project depends on", () => {
        const range = appPackage.dependencies["ueca-react"];
        expect(range.startsWith("^")).toBe(true);
        const floor = range.slice(1);
        expect(UECA_VERSION.split(".")[0]).toBe(floor.split(".")[0]);
        expect(rank(UECA_VERSION)).toBeGreaterThanOrEqual(rank(floor));
    });
});
