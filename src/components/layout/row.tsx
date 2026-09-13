import React from "react";
import * as UECA from "ueca-react";
import { resolvePaletteColor } from "@core";
import {
    borderStyleMap, FlexProps, flexValue, isFilled, paddingStyleMap, spacingMap, withDividers
} from "./layoutShared";

const rowHorizontalAlignMap = {
    left: "flex-start",
    right: "flex-end",
    center: "center",
    spaceBetween: "space-between",
    spaceAround: "space-around",
    spaceEvenly: "space-evenly",
} as const;

const rowReverseHorizontalAlignMap = {
    ...rowHorizontalAlignMap,
    left: "flex-end",
    right: "flex-start",
} as const;

const rowVerticalAlignMap = {
    top: "flex-start",
    center: "center",
    bottom: "flex-end",
    stretch: "stretch",
    baseline: "baseline",
} as const;

type RowHorizontalAlign = keyof typeof rowHorizontalAlignMap;
type RowVerticalAlign = keyof typeof rowVerticalAlignMap;

type RowProps = Omit<FlexProps, "horizontalAlign"> & {
    horizontalAlign?: RowHorizontalAlign;
    verticalAlign?: RowVerticalAlign;
};

function Row(props: RowProps): UECA.ReactElement {
    if (props?.render === false) {
        return null;
    }

    const style: React.CSSProperties = {
        display: "flex",
        flexDirection: props?.reverseItems ? "row-reverse" : "row",
        justifyContent: props?.reverseItems
            ? rowReverseHorizontalAlignMap[props?.horizontalAlign ?? "left"]
            : rowHorizontalAlignMap[props?.horizontalAlign ?? "left"],
        alignItems: rowVerticalAlignMap[props?.verticalAlign],
        flexWrap: props?.flexWrap,
        // No implicit gap. A layout primitive that spaces its children by default puts pixels on
        // screen that appear nowhere in the JSX, so tracing a stray gap means knowing the default
        // rather than reading the code. Ask for spacing where you want it.
        gap: spacingMap[props?.spacing ?? "none"] * 8, // Convert to pixels
        width: props?.width ?? (props?.horizontalAlign ? "100%" : undefined), // Default to full width when alignment is used
        height: props?.height ?? (isFilled(props) ? "100%" : undefined), // Fill/fraction stretches vertically
        minWidth: props?.minWidth,
        minHeight: props?.minHeight,
        maxWidth: props?.maxWidth,
        maxHeight: props?.maxHeight,
        zIndex: props?.zIndex,
        overflow: props?.overflow ?? "visible",
        backgroundColor: resolvePaletteColor(props?.backgroundColor),
        color: resolvePaletteColor(props?.color),
        flex: flexValue(props), // Also set flex for when inside flex parent
        cursor: props?.cursor,
        ...paddingStyleMap(props?.padding),
        ...borderStyleMap(props?.border),
        ...props?.sx
    };

    const children = props?.divider ? withDividers(props?.children, "vertical") : props?.children;

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
            {children}
        </div>
    );
}

export { Row };
export type { RowProps, RowHorizontalAlign, RowVerticalAlign };
