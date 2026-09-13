import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Block } from "@components";

function renderBlock(props: React.ComponentProps<typeof Block>, id = "block"): HTMLElement {
    render(<Block id={id} {...props} />);
    return document.getElementById(id);
}

// Compares only the named inline style values, as a plain object so a failure diff shows them.
function expectInlineStyle(element: HTMLElement, expected: Record<string, string>) {
    const actual = Object.fromEntries(Object.keys(expected).map((prop) => [prop, element.style[prop]]));
    expect(actual).toEqual(expected);
}

describe("Block", () => {
    it("renders nothing when render is false", () => {
        const { container } = render(<Block render={false}>hidden</Block>);

        expect(container).toBeEmptyDOMElement();
    });

    it("renders its children in a plain div, left-aligned, with no layout of its own", () => {
        const block = renderBlock({ children: <span>content</span> });

        expect(block.tagName).toBe("DIV");
        expect(block).toHaveTextContent("content");
        expectInlineStyle(block, { textAlign: "left", display: "", flex: "", width: "", height: "", overflow: "" });
        expect(block).not.toHaveAttribute("role");
        expect(block).not.toHaveAttribute("tabindex");
    });

    it.each([
        ["left", "left"],
        ["center", "center"],
        ["right", "right"]
    ] as const)("maps horizontalAlign %s to text-align", (horizontalAlign, textAlign) => {
        expect(renderBlock({ horizontalAlign }).style.textAlign).toBe(textAlign);
    });

    it("passes size, stacking, overflow and cursor props straight through", () => {
        const block = renderBlock({
            width: 120,
            height: "50%",
            minWidth: 10,
            minHeight: "2rem",
            maxWidth: 400,
            maxHeight: "80vh",
            zIndex: 5,
            overflow: "hidden",
            cursor: "pointer"
        });

        expectInlineStyle(block, {
            width: "120px",
            height: "50%",
            minWidth: "10px",
            minHeight: "2rem",
            maxWidth: "400px",
            maxHeight: "80vh",
            zIndex: "5",
            overflow: "hidden",
            cursor: "pointer"
        });
    });

    it("resolves palette tokens to theme variables and passes raw CSS colours through", () => {
        const block = renderBlock({ backgroundColor: "background.paper", color: "rebeccapurple" });

        expectInlineStyle(block, { backgroundColor: "var(--surface)", color: "rebeccapurple" });
    });

    // Block takes part in proportional sizing only through flex: the cross-axis 100% belongs to
    // Row and Col, which know their axis.
    it("fill sets flex without any implicit width or height", () => {
        expectInlineStyle(renderBlock({ fill: true }), { flex: "1 1 0%", width: "", height: "" });
    });

    it.each([
        ["a fraction", { fraction: 2 }, "2 1 0%"],
        ["a fraction over fill", { fraction: 3, fill: true }, "3 1 0%"],
        ["fraction 0 as an explicit collapse rather than falling back to fill", { fraction: 0, fill: true }, "0 1 0%"]
    ])("sets flex from %s", (_, props, flex) => {
        expect(renderBlock(props).style.flex).toBe(flex);
    });

    it("applies padding in 8px units, uniformly or per side", () => {
        expect(renderBlock({ padding: "small" }, "uniform").style.padding).toBe("16px");

        expectInlineStyle(renderBlock({ padding: { topBottom: "tiny", leftRight: "px3" } }, "perSide"), {
            paddingTop: "4px",
            paddingBottom: "4px",
            paddingLeft: "3px",
            paddingRight: "3px"
        });
    });

    it.each([
        ["solid", "2px solid var(--border)", ""],
        ["dashed", "2px dashed var(--border)", ""],
        ["rounded", "2px solid var(--border)", "8px"]
    ] as const)("draws a %s border in the theme's border colour", (border, expected, borderRadius) => {
        expectInlineStyle(renderBlock({ border }), { border: expected, borderRadius });
    });

    it("applies sx last, over every style it computes", () => {
        const block = renderBlock({
            horizontalAlign: "right",
            fill: true,
            padding: "large",
            border: "solid",
            backgroundColor: "background.paper",
            sx: { textAlign: "center", flex: "0 0 auto", padding: "1px", border: "1px dotted red", backgroundColor: "transparent" }
        });

        expectInlineStyle(block, {
            textAlign: "center",
            flex: "0 0 auto",
            padding: "1px",
            border: "1px dotted red",
            backgroundColor: "transparent"
        });
    });

    it("forwards id, className, role, tabIndex and ref", () => {
        const ref = React.createRef<HTMLDivElement>();
        render(<Block id="grid" ref={ref} className="extra" role="grid" tabIndex={0} />);

        const block = screen.getByRole("grid");
        expect(block).toHaveAttribute("id", "grid");
        expect(block).toHaveClass("extra");
        expect(block).toHaveAttribute("tabindex", "0");
        expect(ref.current).toBe(block);
    });

    // The focus pair makes hover affordances reachable from the keyboard, and the scroll/key pair
    // lets windowed and keyboard-driven composites (Table) do without a raw div.
    it("forwards the pointer, focus, scroll and keyboard events", () => {
        const handlers = {
            onClick: vi.fn(),
            onMouseEnter: vi.fn(),
            onMouseLeave: vi.fn(),
            onFocus: vi.fn(),
            onBlur: vi.fn(),
            onScroll: vi.fn(),
            onKeyDown: vi.fn()
        };
        const block = renderBlock({ tabIndex: 0, ...handlers });

        fireEvent.click(block);
        fireEvent.mouseEnter(block);
        fireEvent.mouseLeave(block);
        fireEvent.focus(block);
        fireEvent.blur(block);
        fireEvent.scroll(block);
        fireEvent.keyDown(block, { key: "ArrowDown" });

        for (const handler of Object.values(handlers)) {
            expect(handler).toHaveBeenCalledOnce();
        }
        expect(handlers.onKeyDown.mock.calls[0][0].key).toBe("ArrowDown");
    });
});
