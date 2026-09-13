import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Grid } from "@components";

function renderGrid(props: React.ComponentProps<typeof Grid>, id = "grid"): HTMLElement {
    render(<Grid id={id} {...props} />);
    return document.getElementById(id);
}

// Compares only the named inline style values, as a plain object so a failure diff shows them.
function expectInlineStyle(element: HTMLElement, expected: Record<string, string>) {
    const actual = Object.fromEntries(Object.keys(expected).map((prop) => [prop, element.style[prop]]));
    expect(actual).toEqual(expected);
}

describe("Grid", () => {
    it("renders nothing when render is false", () => {
        const { container } = render(<Grid render={false} columns={2}><span>hidden</span></Grid>);

        expect(container).toBeEmptyDOMElement();
    });

    it("renders a grid with no template, gap, size or overflow of its own", () => {
        const grid = renderGrid({ children: <span>cell</span> });

        expect(grid).toHaveTextContent("cell");
        expectInlineStyle(grid, {
            display: "grid",
            gridTemplateColumns: "",
            gridTemplateRows: "",
            columnGap: "0px",
            rowGap: "0px",
            alignItems: "",
            width: "",
            height: "",
            overflow: ""
        });
    });

    it("turns a number of columns or rows into that many equal tracks", () => {
        expectInlineStyle(renderGrid({ columns: 3, rows: 2 }), {
            gridTemplateColumns: "repeat(3, 1fr)",
            gridTemplateRows: "repeat(2, 1fr)"
        });
    });

    // For the layouts equal columns cannot express.
    it("passes a string template through untouched", () => {
        expectInlineStyle(renderGrid({ columns: "200px 1fr auto", rows: "auto 1fr" }), {
            gridTemplateColumns: "200px 1fr auto",
            gridTemplateRows: "auto 1fr"
        });
    });

    it("spacing sets both gaps, and columnSpacing/rowSpacing override it per axis", () => {
        expectInlineStyle(renderGrid({ spacing: "small" }, "both"), { columnGap: "16px", rowGap: "16px" });
        expectInlineStyle(renderGrid({ spacing: "small", columnSpacing: "large" }, "columns"), { columnGap: "32px", rowGap: "16px" });
        expectInlineStyle(renderGrid({ spacing: "small", rowSpacing: "px4" }, "rows"), { columnGap: "16px", rowGap: "4px" });
        expectInlineStyle(renderGrid({ columnSpacing: "tiny" }, "columnsOnly"), { columnGap: "4px", rowGap: "0px" });
    });

    it.each([
        ["top", "start"],
        ["center", "center"],
        ["bottom", "end"],
        ["stretch", "stretch"]
    ] as const)("maps verticalAlign %s to align-items %s", (verticalAlign, alignItems) => {
        expect(renderGrid({ verticalAlign }).style.alignItems).toBe(alignItems);
    });

    it.each([
        ["fill", { fill: true }, "1 1 0%"],
        ["a fraction", { fraction: 2 }, "2 1 0%"]
    ])("%s sets flex and takes the full width, but never an implicit height", (_, props, flex) => {
        expectInlineStyle(renderGrid(props), { flex, width: "100%", height: "" });
    });

    it("keeps explicit sizes over the width that fill implies", () => {
        expectInlineStyle(renderGrid({ fill: true, width: 300, height: "40vh", minHeight: 50, maxWidth: "90%" }), {
            width: "300px",
            height: "40vh",
            minHeight: "50px",
            maxWidth: "90%"
        });
    });

    it("composes overflow, cursor, stacking, palette colours, padding and border", () => {
        expectInlineStyle(renderGrid({
            overflow: "auto",
            cursor: "default",
            zIndex: 2,
            color: "primary.main",
            backgroundColor: "background.paper",
            padding: { top: "huge" },
            border: "rounded"
        }), {
            overflow: "auto",
            cursor: "default",
            zIndex: "2",
            color: "var(--accent)",
            backgroundColor: "var(--surface)",
            paddingTop: "64px",
            border: "2px solid var(--border)",
            borderRadius: "8px"
        });
    });

    it("applies sx last, over every style it computes", () => {
        const grid = renderGrid({
            columns: 4,
            spacing: "large",
            verticalAlign: "top",
            fill: true,
            sx: { gridTemplateColumns: "1fr 2fr", columnGap: "5px", alignItems: "end", width: "auto" }
        });

        expectInlineStyle(grid, { gridTemplateColumns: "1fr 2fr", columnGap: "5px", rowGap: "32px", alignItems: "end", width: "auto" });
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
        render(<Grid id="table" ref={ref} className="extra" role="grid" tabIndex={0} {...handlers} />);
        const grid = screen.getByRole("grid");

        fireEvent.click(grid);
        fireEvent.mouseEnter(grid);
        fireEvent.mouseLeave(grid);
        fireEvent.focus(grid);
        fireEvent.blur(grid);
        fireEvent.scroll(grid);
        fireEvent.keyDown(grid, { key: "ArrowUp" });

        expect(grid).toHaveAttribute("id", "table");
        expect(grid).toHaveClass("extra");
        expect(grid).toHaveAttribute("tabindex", "0");
        expect(ref.current).toBe(grid);
        for (const handler of Object.values(handlers)) {
            expect(handler).toHaveBeenCalledOnce();
        }
    });
});
