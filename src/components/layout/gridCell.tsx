import React from "react";
import * as UECA from "ueca-react";
import { Block } from "./block";
import { BlockProps } from "./layoutShared";

type GridCellProps = BlockProps & {
    /** How many columns/rows this cell covers. */
    colSpan?: number;
    rowSpan?: number;
    /** 1-based explicit placement, for a cell that must land in a specific slot. */
    colStart?: number;
    rowStart?: number;
};

// GridCell — only needed for a cell that spans or is explicitly placed. A plain child (Block, or
// anything else) already occupies one cell, so most grid children need no wrapper at all.
function GridCell(props: GridCellProps): UECA.ReactElement {
    if (props?.render === false) {
        return null;
    }

    const sx: React.CSSProperties = {
        gridColumn: _gridSpan(props?.colStart, props?.colSpan),
        gridRow: _gridSpan(props?.rowStart, props?.rowSpan),
        ...props?.sx
    };

    return <Block {...props} sx={sx} />;
}

// Build a `grid-column` / `grid-row` shorthand from an optional 1-based start and a span.
function _gridSpan(start?: number, span?: number): string | undefined {
    if (start == null && span == null) {
        return undefined;
    }

    const from = start != null ? `${start}` : "auto";
    return span != null ? `${from} / span ${span}` : from;
}

export { GridCell };
export type { GridCellProps };
