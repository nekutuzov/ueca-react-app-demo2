import React from "react";
import * as UECA from "ueca-react";
import { resolvePaletteColor } from "@core";
import {
    BlockProps, borderStyleMap, flexValue, isFilled, paddingStyleMap, Spacing, spacingMap
} from "./layoutShared";

const gridVerticalAlignMap = {
    top: "start",
    center: "center",
    bottom: "end",
    stretch: "stretch",
} as const;

type GridVerticalAlign = keyof typeof gridVerticalAlignMap;

type GridProps = BlockProps & {
    /**
     * A number is that many equal columns (`repeat(n, 1fr)`); a string is a raw
     * `grid-template-columns` value, for the cases equal columns cannot express —
     * `"200px 1fr auto"`, `"repeat(auto-fill, minmax(220px, 1fr))"`.
     */
    columns?: number | string;
    rows?: number | string;
    /** Gap between cells. `columnSpacing`/`rowSpacing` override it per axis. */
    spacing?: Spacing;
    columnSpacing?: Spacing;
    rowSpacing?: Spacing;
    verticalAlign?: GridVerticalAlign;
};

// Grid component — two-dimensional layout, where Row/Col only do one axis.
//
// Use it when things must line up in BOTH directions: a form whose labels and fields align down the
// page as well as across, a dashboard of tiles, a definition list. A stack of Rows cannot do that —
// each Row sizes independently, so nothing lines up column-to-column.
function Grid(props: GridProps): UECA.ReactElement {
    if (props?.render === false) {
        return null;
    }

    // No implicit gap — see Row.
    const spacing = props?.spacing ?? "none";

    const style: React.CSSProperties = {
        display: "grid",
        gridTemplateColumns: _gridTracks(props?.columns),
        gridTemplateRows: _gridTracks(props?.rows),
        columnGap: spacingMap[props?.columnSpacing ?? spacing] * 8,
        rowGap: spacingMap[props?.rowSpacing ?? spacing] * 8,
        alignItems: gridVerticalAlignMap[props?.verticalAlign],
        width: props?.width ?? (isFilled(props) ? "100%" : undefined),
        height: props?.height,
        minWidth: props?.minWidth,
        minHeight: props?.minHeight,
        maxWidth: props?.maxWidth,
        maxHeight: props?.maxHeight,
        zIndex: props?.zIndex,
        overflow: props?.overflow,
        backgroundColor: resolvePaletteColor(props?.backgroundColor),
        color: resolvePaletteColor(props?.color),
        flex: flexValue(props),
        cursor: props?.cursor,
        ...paddingStyleMap(props?.padding),
        ...borderStyleMap(props?.border),
        ...props?.sx
    };

    return (
        <div
            id={props?.id}
            ref={props?.ref}
            className={props?.className}
            style={style}
            onClick={props?.onClick}
            onMouseEnter={props?.onMouseEnter}
            onMouseLeave={props?.onMouseLeave}
            onFocus={props?.onFocus}
            onBlur={props?.onBlur}
            onScroll={props?.onScroll}
            onKeyDown={props?.onKeyDown}
            tabIndex={props?.tabIndex}
            role={props?.role}
        >
            {props?.children}
        </div>
    );
}

// A number means that many equal tracks; a string is passed through as a raw template.
function _gridTracks(value?: number | string): string | undefined {
    if (value == null) {
        return undefined;
    }

    return typeof value === "number" ? `repeat(${value}, 1fr)` : value;
}

export { Grid };
export type { GridProps, GridVerticalAlign };
