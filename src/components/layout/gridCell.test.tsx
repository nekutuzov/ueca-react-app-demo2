import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { GridCell } from "@components";

function renderCell(props: React.ComponentProps<typeof GridCell>, id = "cell"): HTMLElement {
    render(<GridCell id={id} {...props} />);
    return document.getElementById(id);
}

describe("GridCell", () => {
    it("renders nothing when render is false", () => {
        const { container } = render(<GridCell render={false} colSpan={2}>hidden</GridCell>);

        expect(container).toBeEmptyDOMElement();
    });

    // A plain child already occupies one cell, so a cell with no placement adds nothing to it.
    it("places nothing without a span or a start", () => {
        const cell = renderCell({ children: "content" });

        expect(cell).toHaveTextContent("content");
        expect(cell.style.gridColumn).toBe("");
        expect(cell.style.gridRow).toBe("");
    });

    it.each([
        ["a span alone flows from the automatic slot", { colSpan: 2 }, "auto / span 2"],
        ["a start alone covers one track", { colStart: 3 }, "3"],
        ["a start and a span", { colStart: 2, colSpan: 3 }, "2 / span 3"]
    ])("grid-column: %s", (_, props, gridColumn) => {
        const cell = renderCell(props);

        expect(cell.style.gridColumn).toBe(gridColumn);
        expect(cell.style.gridRow).toBe("");
    });

    it.each([
        ["a span alone flows from the automatic slot", { rowSpan: 4 }, "auto / span 4"],
        ["a start alone covers one track", { rowStart: 1 }, "1"],
        ["a start and a span", { rowStart: 2, rowSpan: 2 }, "2 / span 2"]
    ])("grid-row: %s", (_, props, gridRow) => {
        const cell = renderCell(props);

        expect(cell.style.gridRow).toBe(gridRow);
        expect(cell.style.gridColumn).toBe("");
    });

    it("lets sx override the computed placement", () => {
        const cell = renderCell({ colSpan: 2, rowStart: 1, sx: { gridColumn: "1 / -1" } });

        expect(cell.style.gridColumn).toBe("1 / -1");
        expect(cell.style.gridRow).toBe("1");
    });

    it("is a Block underneath: its layout, identity and event props all apply", () => {
        const onClick = vi.fn();
        const cell = renderCell({
            className: "summary",
            role: "gridcell",
            horizontalAlign: "right",
            padding: "small",
            backgroundColor: "background.paper",
            fill: true,
            colSpan: 2,
            onClick
        });

        fireEvent.click(cell);

        expect(cell).toHaveClass("summary");
        expect(cell).toHaveAttribute("role", "gridcell");
        expect(cell.style.textAlign).toBe("right");
        expect(cell.style.padding).toBe("16px");
        expect(cell.style.backgroundColor).toBe("var(--surface)");
        expect(cell.style.flex).toBe("1 1 0%");
        expect(cell.style.gridColumn).toBe("auto / span 2");
        expect(onClick).toHaveBeenCalledOnce();
    });
});
