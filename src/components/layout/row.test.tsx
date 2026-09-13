import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Row } from "@components";

function renderRow(props: React.ComponentProps<typeof Row>, id = "row"): HTMLElement {
    render(<Row id={id} {...props} />);
    return document.getElementById(id);
}

// Compares only the named inline style values, as a plain object so a failure diff shows them.
function expectInlineStyle(element: HTMLElement, expected: Record<string, string>) {
    const actual = Object.fromEntries(Object.keys(expected).map((prop) => [prop, element.style[prop]]));
    expect(actual).toEqual(expected);
}

describe("Row", () => {
    it("renders nothing when render is false", () => {
        const { container } = render(<Row render={false}><span>hidden</span></Row>);

        expect(container).toBeEmptyDOMElement();
    });

    // No implicit gap: spacing that appears nowhere in the JSX is spacing nobody can trace.
    it("lays its children out left to right with no implicit gap, size or alignment", () => {
        const row = renderRow({ children: <span>a</span> });

        expect(row).toHaveTextContent("a");
        expectInlineStyle(row, {
            display: "flex",
            flexDirection: "row",
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
        ["left", "flex-start"],
        ["right", "flex-end"],
        ["center", "center"],
        ["spaceBetween", "space-between"],
        ["spaceAround", "space-around"],
        ["spaceEvenly", "space-evenly"]
    ] as const)("maps horizontalAlign %s to justify-content %s", (horizontalAlign, justifyContent) => {
        expect(renderRow({ horizontalAlign }).style.justifyContent).toBe(justifyContent);
    });

    // row-reverse flips the main axis, so "left" has to become flex-end to still mean the left edge.
    it.each([
        ["left", "flex-end"],
        ["right", "flex-start"],
        ["center", "center"],
        ["spaceBetween", "space-between"],
        ["spaceAround", "space-around"],
        ["spaceEvenly", "space-evenly"]
    ] as const)("with reverseItems, keeps horizontalAlign %s on screen as justify-content %s", (horizontalAlign, justifyContent) => {
        expectInlineStyle(renderRow({ horizontalAlign, reverseItems: true }), { flexDirection: "row-reverse", justifyContent });
    });

    it("packs reversed items against the left edge by default", () => {
        expectInlineStyle(renderRow({ reverseItems: true }), { flexDirection: "row-reverse", justifyContent: "flex-end" });
    });

    it.each([
        ["top", "flex-start"],
        ["center", "center"],
        ["bottom", "flex-end"],
        ["stretch", "stretch"],
        ["baseline", "baseline"]
    ] as const)("maps verticalAlign %s to align-items %s", (verticalAlign, alignItems) => {
        expect(renderRow({ verticalAlign }).style.alignItems).toBe(alignItems);
    });

    it.each([
        ["small", "16px"],
        ["huge", "64px"],
        ["px2", "2px"]
    ] as const)("converts spacing %s to a %s gap", (spacing, gap) => {
        expect(renderRow({ spacing }).style.gap).toBe(gap);
    });

    // An alignment only means something across the parent's width, so asking for one takes it.
    it("takes the full width whenever horizontalAlign is given, unless a width is", () => {
        expect(renderRow({ horizontalAlign: "left" }, "aligned").style.width).toBe("100%");
        expect(renderRow({ horizontalAlign: "center", width: 200 }, "sized").style.width).toBe("200px");
    });

    it.each([
        ["fill", { fill: true }, "1 1 0%"],
        ["a fraction", { fraction: 3 }, "3 1 0%"],
        ["fraction 0", { fraction: 0 }, "0 1 0%"]
    ])("%s sets flex and stretches to the full cross-axis height", (_, props, flex) => {
        expectInlineStyle(renderRow(props), { flex, height: "100%", width: "" });
    });

    it("keeps an explicit height over the stretch that fill implies", () => {
        expect(renderRow({ fill: true, height: 40 }).style.height).toBe("40px");
    });

    it("passes overflow, flexWrap and the size limits through", () => {
        expectInlineStyle(renderRow({ overflow: "auto", flexWrap: "wrap", minWidth: 10, maxHeight: "50vh", zIndex: 3, cursor: "grab" }), {
            overflow: "auto",
            flexWrap: "wrap",
            minWidth: "10px",
            maxHeight: "50vh",
            zIndex: "3",
            cursor: "grab"
        });
    });

    it("composes palette colours, padding and border", () => {
        expectInlineStyle(renderRow({ backgroundColor: "action.hover", color: "text.secondary", padding: { left: "small" }, border: "dotted" }), {
            backgroundColor: "var(--hover)",
            color: "var(--ink-dim)",
            paddingLeft: "16px",
            paddingRight: "",
            border: "2px dotted var(--border)"
        });
    });

    describe("divider", () => {
        it("interleaves a 1px vertical hairline between children", () => {
            const row = renderRow({ divider: true, children: [<span key="a">a</span>, <span key="b">b</span>, <span key="c">c</span>] });

            const nodes = Array.from(row.children) as HTMLElement[];
            expect(nodes.map((n) => n.textContent || "|")).toEqual(["a", "|", "b", "|", "c"]);
            for (const divider of [nodes[1], nodes[3]]) {
                expect(divider.tagName).toBe("DIV");
                expectInlineStyle(divider, { width: "1px", height: "", backgroundColor: "var(--border)", alignSelf: "stretch" });
            }
        });

        // A conditionally rendered child must not leave a doubled or dangling hairline behind.
        it("skips children that render nothing", () => {
            const row = renderRow({ divider: true, children: [<span key="a">a</span>, false, null, <span key="b">b</span>] });

            expect(Array.from(row.children).map((n) => n.textContent || "|")).toEqual(["a", "|", "b"]);
        });

        it("draws nothing for a single child or without the divider prop", () => {
            expect(renderRow({ divider: true, children: <span>only</span> }, "single").children).toHaveLength(1);
            expect(renderRow({ children: [<span key="a">a</span>, <span key="b">b</span>] }, "plain").children).toHaveLength(2);
        });
    });

    it("applies sx last, over every style it computes", () => {
        const row = renderRow({
            reverseItems: true,
            horizontalAlign: "center",
            spacing: "large",
            fill: true,
            sx: { flexDirection: "column", justifyContent: "flex-end", gap: "3px", width: "50%", height: "10px", overflow: "hidden" }
        });

        expectInlineStyle(row, {
            flexDirection: "column",
            justifyContent: "flex-end",
            gap: "3px",
            width: "50%",
            height: "10px",
            overflow: "hidden"
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
        render(<Row id="toolbar" ref={ref} className="extra" role="toolbar" tabIndex={-1} {...handlers} />);
        const row = screen.getByRole("toolbar");

        fireEvent.click(row);
        fireEvent.mouseEnter(row);
        fireEvent.mouseLeave(row);
        fireEvent.focus(row);
        fireEvent.blur(row);
        fireEvent.scroll(row);
        fireEvent.keyDown(row, { key: "Home" });

        expect(row).toHaveAttribute("id", "toolbar");
        expect(row).toHaveClass("extra");
        expect(row).toHaveAttribute("tabindex", "-1");
        expect(ref.current).toBe(row);
        for (const handler of Object.values(handlers)) {
            expect(handler).toHaveBeenCalledOnce();
        }
    });
});
