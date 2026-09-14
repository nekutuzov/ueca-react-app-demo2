import { describe, expect, it } from "vitest";

// theme.css's `.ueca-focus-bleed` pads a clipping box by the ring's reach and pulls it back out with the
// same negative margin, which leaves the content where it was only while the box's width can follow the
// margins. Col's `fill` writes `width: 100%` inline, and against that the margins shift the box left
// instead, taking twice the bleed off its content on the right: the tab panel lost 10px that way. The
// markup is scanned, so a new wearer - a screen's scroller, say - cannot bring it back.
//
// Sources are read from disk: Vitest empties CSS imports and there is no glob over the tree. The test
// tsconfig carries no Node typings, so the Node API used is typed here.
declare const process: {
    getBuiltinModule(id: "node:fs"): {
        readFileSync(path: string, encoding: "utf8"): string;
        readdirSync(path: string, options: { recursive: true }): string[];
    };
};

function markup(): { path: string; source: string }[] {
    const fs = process.getBuiltinModule("node:fs");
    const src = (import.meta as ImportMeta & { dirname: string }).dirname;
    return fs.readdirSync(src, { recursive: true })
        .map((path) => path.replace(/\\/g, "/"))
        .filter((path) => path.endsWith(".tsx") && !path.endsWith(".test.tsx"))
        .map((path) => ({ path, source: fs.readFileSync(`${src}/${path}`, "utf8") }));
}

describe("the focus bleed utility", () => {
    it("lets a fill Col that wears it stretch, rather than shifting it left", () => {
        const wearers = markup().flatMap(({ path, source }) =>
            (source.match(/<Col\b[^>]*className="ueca-focus-bleed"[^>]*>/g) ?? []).map((tag) => ({ path, tag })));
        const offenders = wearers
            .filter(({ tag }) => /\sfill[\s>]/.test(tag) && !/\swidth=\{?"auto"\}?[\s>]/.test(tag))
            .map(({ path, tag }) => `${path}: ${tag}`);

        expect(wearers.map(({ path }) => path)).toContain("components/tabs/tabsContainer/tabsContainer.tsx");
        expect(offenders).toEqual([]);
    });
});
