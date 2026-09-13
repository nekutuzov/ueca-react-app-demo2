import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { BlockProps, Block, Card, Col, Grid, GridCell, Row } from "@components";
import { resolvePaletteColor } from "@core";
// Not re-exported by the @components barrel, which exposes only the types of this module.
import {
    ariaAttributes, borderStyleMap, flexValue, isFilled, Padding, paddingSizeMap, paddingStyleMap, spacingMap,
    withDividers
} from "./layoutShared";

// tokens.css is read from disk because Vitest empties every CSS import, `?raw` included. The test
// tsconfig carries no Node typings, so the one Node API used is typed here.
declare const process: { getBuiltinModule(id: "node:fs"): { readFileSync(path: string, encoding: "utf8"): string } };

function tokensCss(): string {
    const dir = (import.meta as ImportMeta & { dirname: string }).dirname;
    return process.getBuiltinModule("node:fs").readFileSync(`${dir}/../../tokens.css`, "utf8");
}

const border = resolvePaletteColor("border.color");

describe("flexValue and isFilled", () => {
    it.each([
        ["neither prop", {}, undefined, false],
        ["no props object", undefined, undefined, false],
        ["fill", { fill: true }, 1, true],
        ["fill={false}", { fill: false }, undefined, false],
        ["a fraction", { fraction: 2 }, 2, true],
        ["a fraction beside fill", { fraction: 3, fill: true }, 3, true],
        ["a null fraction beside fill", { fraction: null, fill: true }, 1, true]
    ])("resolves %s", (_case, props, flex, filled) => {
        expect(flexValue(props)).toBe(flex);
        expect(isFilled(props)).toBe(filled);
    });

    // Tested against null rather than truthiness, so fraction={0} is the caller's collapse and not
    // a silent fall-back to `fill`.
    it("passes fraction={0} straight through, even beside fill", () => {
        expect(flexValue({ fraction: 0, fill: true })).toBe(0);
        expect(flexValue({ fraction: 0 })).toBe(0);
        expect(isFilled({ fraction: 0 })).toBe(true);
    });
});

describe("ariaAttributes", () => {
    it("picks out the aria-* props and nothing else", () => {
        const props = { "aria-expanded": true, "aria-label": "Showcase", role: "button", fill: true } as BlockProps;

        expect(ariaAttributes(props)).toEqual({ "aria-expanded": true, "aria-label": "Showcase" });
        expect(ariaAttributes(undefined)).toEqual({});
    });

    // A role without its states is half a role: a disclosure header built on Block needs
    // aria-expanded, and an icon-only one needs aria-label.
    it.each([
        ["Block", Block],
        ["Row", Row],
        ["Col", Col],
        ["Grid", Grid],
        ["GridCell", GridCell],
        ["Card", Card]
    ] as [string, (props: BlockProps) => React.ReactNode][])("%s puts aria-* attributes on its element", (_name, Primitive) => {
        const { container } = render(<Primitive role="button" aria-expanded={false} aria-label="Showcase" fill />);

        const element = container.querySelector("[role=button]");
        expect(element).toHaveAttribute("aria-expanded", "false");
        expect(element).toHaveAttribute("aria-label", "Showcase");
        expect(element).not.toHaveAttribute("fill");
    });
});

describe("paddingStyleMap", () => {
    it.each([
        ["medium", "24px"],
        ["tiny", "4px"],
        ["px3", "3px"],
        ["none", "0px"]
    ] as const)("maps the %s size to one padding on every side", (size, px) => {
        expect(paddingStyleMap(size)).toEqual({ padding: px });
    });

    it("maps the topBottom and leftRight pairs", () => {
        expect(paddingStyleMap({ topBottom: "small", leftRight: "tiny" })).toEqual({
            paddingTop: "16px", paddingBottom: "16px", paddingLeft: "4px", paddingRight: "4px"
        });
    });

    it("maps individual sides and writes nothing for the sides left out", () => {
        expect(paddingStyleMap({ top: "default", right: "px2", bottom: "large", left: "huge" })).toEqual({
            paddingTop: "8px", paddingRight: "2px", paddingBottom: "32px", paddingLeft: "64px"
        });
        expect(paddingStyleMap({ left: "small" })).toEqual({ paddingLeft: "16px" });
    });

    // NavItem passes `leftRight: undefined` in icon-only mode; a key that is present but unset must
    // not become "NaNpx".
    it("skips a side or pair whose value is undefined", () => {
        expect(paddingStyleMap({ topBottom: "small", leftRight: undefined })).toEqual({
            paddingTop: "16px", paddingBottom: "16px"
        });
        expect(paddingStyleMap({ top: undefined, bottom: "tiny" })).toEqual({ paddingBottom: "4px" });
    });

    it("lets a single side override the pair it belongs to", () => {
        const mixed = { topBottom: "small", top: "large" } as Padding;

        expect(paddingStyleMap(mixed)).toEqual({ paddingTop: "32px", paddingBottom: "16px" });
    });

    it.each([undefined, {}])("writes no padding for %j", (padding) => {
        expect(paddingStyleMap(padding)).toEqual({});
    });
});

describe("borderStyleMap", () => {
    it.each([
        ["solid", { border: `2px solid ${border}` }],
        ["dashed", { border: `2px dashed ${border}` }],
        ["dotted", { border: `2px dotted ${border}` }],
        ["rounded", { border: `2px solid ${border}`, borderRadius: "8px" }]
    ] as const)("draws a %s border in the theme's border colour", (kind, style) => {
        expect(borderStyleMap(kind)).toEqual(style);
    });

    it("writes no border for none or an unknown kind", () => {
        expect(borderStyleMap(undefined)).toEqual({});
        expect(borderStyleMap("double" as never)).toEqual({});
    });
});

describe("withDividers", () => {
    function renderRow(children: React.ReactNode, axis: "vertical" | "horizontal") {
        const { container } = render(<div>{withDividers(children, axis)}</div>);
        return [...container.firstElementChild.children] as HTMLElement[];
    }

    it("puts a vertical hairline between Row children, and none at the ends", () => {
        const nodes = renderRow([<span key="a">A</span>, <span key="b">B</span>, <span key="c">C</span>], "vertical");

        expect(nodes.map((n) => n.textContent)).toEqual(["A", "", "B", "", "C"]);
        for (const divider of [nodes[1], nodes[3]]) {
            expect(divider.style.width).toBe("1px");
            expect(divider.style.height).toBe("");
            expect(divider.style.alignSelf).toBe("stretch");
            expect(divider.style.backgroundColor).toBe(border);
        }
    });

    it("puts a horizontal hairline between Col children", () => {
        const nodes = renderRow([<span key="a">A</span>, <span key="b">B</span>], "horizontal");

        expect(nodes).toHaveLength(3);
        expect(nodes[1].style.height).toBe("1px");
        expect(nodes[1].style.width).toBe("");
    });

    it("adds no divider to a single child", () => {
        expect(renderRow(<span>Only</span>, "vertical")).toHaveLength(1);
    });

    // A conditionally rendered child must not leave a doubled or dangling divider behind.
    it("ignores children that render nothing", () => {
        const nodes = renderRow([null, <span key="a">A</span>, false, undefined, <span key="b">B</span>, null], "vertical");

        expect(nodes.map((n) => n.textContent)).toEqual(["A", "", "B"]);
    });

    it("keys the dividers so React raises no key warning", () => {
        const consoleError = vi.spyOn(console, "error");

        renderRow([<span key="a">A</span>, <span key="b">B</span>, <span key="c">C</span>], "vertical");

        expect(consoleError).not.toHaveBeenCalled();
    });
});

// tokens.css mirrors these scales so a component's CSS measures with the same ruler as JSX, and its
// comment asks for the two to be kept in sync.
describe("the spacing scale", () => {
    it.each(["none", "tiny", "default", "small", "medium", "large", "huge", "massive"] as const)(
        "matches --space-%s in tokens.css for spacing and padding alike",
        (name) => {
            const px = Number(new RegExp(`--space-${name}:\\s*(\\d+)px`).exec(tokensCss())[1]);

            expect(spacingMap[name] * 8).toBe(px);
            expect(paddingSizeMap[name] * 8).toBe(px);
        }
    );
});
