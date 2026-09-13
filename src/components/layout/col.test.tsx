import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Col } from "@components";

function renderCol(props: React.ComponentProps<typeof Col>, id = "col"): HTMLElement {
    render(<Col id={id} {...props} />);
    return document.getElementById(id);
}

// Compares only the named inline style values, as a plain object so a failure diff shows them.
function expectInlineStyle(element: HTMLElement, expected: Record<string, string>) {
    const actual = Object.fromEntries(Object.keys(expected).map((prop) => [prop, element.style[prop]]));
    expect(actual).toEqual(expected);
}

describe("Col", () => {
    it("renders nothing when render is false", () => {
        const { container } = render(<Col render={false}><span>hidden</span></Col>);

        expect(container).toBeEmptyDOMElement();
    });

    it("stacks its children top to bottom with no implicit gap, size or alignment", () => {
        const col = renderCol({ children: <span>a</span> });

        expect(col).toHaveTextContent("a");
        expectInlineStyle(col, {
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "",
            gap: "0px",
            width: "",
            height: "",
            flex: "",
            overflow: "visible"
        });
    });

    it.each([
        ["top", "flex-start"],
        ["center", "center"],
        ["bottom", "flex-end"],
        ["spaceBetween", "space-between"],
        ["spaceAround", "space-around"],
        ["spaceEvenly", "space-evenly"]
    ] as const)("maps verticalAlign %s to justify-content %s", (verticalAlign, justifyContent) => {
        expect(renderCol({ verticalAlign }).style.justifyContent).toBe(justifyContent);
    });

    // column-reverse flips the main axis, so "top" has to become flex-end to still mean the top edge.
    it.each([
        ["top", "flex-end"],
        ["bottom", "flex-start"],
        ["center", "center"],
        ["spaceBetween", "space-between"],
        ["spaceAround", "space-around"],
        ["spaceEvenly", "space-evenly"]
    ] as const)("with reverseItems, keeps verticalAlign %s on screen as justify-content %s", (verticalAlign, justifyContent) => {
        expectInlineStyle(renderCol({ verticalAlign, reverseItems: true }), { flexDirection: "column-reverse", justifyContent });
    });

    it("packs reversed items against the top edge by default", () => {
        expectInlineStyle(renderCol({ reverseItems: true }), { flexDirection: "column-reverse", justifyContent: "flex-end" });
    });

    it.each([
        ["left", "flex-start"],
        ["right", "flex-end"],
        ["center", "center"],
        ["stretch", "stretch"]
    ] as const)("maps horizontalAlign %s to align-items %s", (horizontalAlign, alignItems) => {
        expect(renderCol({ horizontalAlign }).style.alignItems).toBe(alignItems);
    });

    it.each([
        ["default", "8px"],
        ["medium", "24px"],
        ["px6", "6px"]
    ] as const)("converts spacing %s to a %s gap", (spacing, gap) => {
        expect(renderCol({ spacing }).style.gap).toBe(gap);
    });

    // The mirror of Row: here it is the vertical alignment that needs the parent's full height.
    it("takes the full height whenever verticalAlign is given, unless a height is", () => {
        expect(renderCol({ verticalAlign: "top" }, "aligned").style.height).toBe("100%");
        expect(renderCol({ verticalAlign: "bottom", height: 300 }, "sized").style.height).toBe("300px");
        expect(renderCol({ horizontalAlign: "center" }, "crossAligned").style.height).toBe("");
    });

    it.each([
        ["fill", { fill: true }, "1 1 0%"],
        ["a fraction", { fraction: 2 }, "2 1 0%"],
        ["fraction 0", { fraction: 0 }, "0 1 0%"]
    ])("%s sets flex and stretches to the full cross-axis width", (_, props, flex) => {
        expectInlineStyle(renderCol(props), { flex, width: "100%", height: "" });
    });

    it("keeps an explicit width over the stretch that fill implies", () => {
        expect(renderCol({ fraction: 1, width: "30%" }).style.width).toBe("30%");
    });

    it("passes overflow, flexWrap, the size limits and palette colours through", () => {
        expectInlineStyle(renderCol({
            overflow: "scroll",
            flexWrap: "nowrap",
            maxWidth: 640,
            minHeight: 100,
            zIndex: "auto",
            backgroundColor: "background.default",
            padding: "tiny",
            border: "solid"
        }), {
            overflow: "scroll",
            flexWrap: "nowrap",
            maxWidth: "640px",
            minHeight: "100px",
            zIndex: "auto",
            backgroundColor: "var(--bg)",
            padding: "4px",
            border: "2px solid var(--border)"
        });
    });

    describe("divider", () => {
        it("interleaves a 1px horizontal hairline between children", () => {
            const col = renderCol({ divider: true, children: [<span key="a">a</span>, <span key="b">b</span>] });

            const nodes = Array.from(col.children) as HTMLElement[];
            expect(nodes.map((n) => n.textContent || "|")).toEqual(["a", "|", "b"]);
            expectInlineStyle(nodes[1], { height: "1px", width: "", backgroundColor: "var(--border)", alignSelf: "stretch" });
        });

        it("skips children that render nothing", () => {
            const col = renderCol({ divider: true, children: [null, <span key="a">a</span>, undefined, <span key="b">b</span>, false] });

            expect(Array.from(col.children).map((n) => n.textContent || "|")).toEqual(["a", "|", "b"]);
        });
    });

    it("applies sx last, over every style it computes", () => {
        const col = renderCol({
            verticalAlign: "center",
            horizontalAlign: "stretch",
            fill: true,
            spacing: "small",
            sx: { justifyContent: "flex-start", alignItems: "baseline", width: "auto", height: "auto", gap: "1px", overflow: "clip" }
        });

        expectInlineStyle(col, {
            justifyContent: "flex-start",
            alignItems: "baseline",
            width: "auto",
            height: "auto",
            gap: "1px",
            overflow: "clip"
        });
    });

    it("forwards id, className, role, tabIndex, ref and events", () => {
        const ref = React.createRef<HTMLDivElement>();
        const handlers = {
            onClick: vi.fn(),
            onMouseEnter: vi.fn(),
            onMouseLeave: vi.fn(),
            onFocus: vi.fn(),
            onBlur: vi.fn(),
            onScroll: vi.fn(),
            onKeyDown: vi.fn()
        };
        render(<Col id="list" ref={ref} className="extra" role="list" tabIndex={0} {...handlers} />);
        const col = screen.getByRole("list");

        fireEvent.click(col);
        fireEvent.mouseEnter(col);
        fireEvent.mouseLeave(col);
        fireEvent.focus(col);
        fireEvent.blur(col);
        fireEvent.scroll(col);
        fireEvent.keyDown(col, { key: "End" });

        expect(col).toHaveAttribute("id", "list");
        expect(col).toHaveClass("extra");
        expect(col).toHaveAttribute("tabindex", "0");
        expect(ref.current).toBe(col);
        for (const handler of Object.values(handlers)) {
            expect(handler).toHaveBeenCalledOnce();
        }
    });
});
