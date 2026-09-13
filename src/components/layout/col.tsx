import React from "react";
import * as UECA from "ueca-react";
import { resolvePaletteColor } from "@core";
import {
    borderStyleMap, FlexProps, flexValue, isFilled, paddingStyleMap, spacingMap, withDividers
} from "./layoutShared";

const colHorizontalAlignMap = {
    left: "flex-start",
    right: "flex-end",
    center: "center",
    stretch: "stretch",
} as const;

const colVerticalAlignMap = {
    top: "flex-start",
    center: "center",
    bottom: "flex-end",
    spaceBetween: "space-between",
    spaceAround: "space-around",
    spaceEvenly: "space-evenly",
} as const;

const colReverseVerticalAlignMap = {
    ...colVerticalAlignMap,
    top: "flex-end",
    bottom: "flex-start",
} as const;

type ColHorizontalAlign = keyof typeof colHorizontalAlignMap;
type ColVerticalAlign = keyof typeof colVerticalAlignMap;

type ColProps = Omit<FlexProps, "horizontalAlign"> & {
    horizontalAlign?: ColHorizontalAlign;
    verticalAlign?: ColVerticalAlign;
};

function Col(props: ColProps): UECA.ReactElement {
    if (props?.render === false) {
        return null;
    }

    const style: React.CSSProperties = {
        display: "flex",
        flexDirection: props?.reverseItems ? "column-reverse" : "column",
        alignItems: colHorizontalAlignMap[props?.horizontalAlign],
        justifyContent: props?.reverseItems
            ? colReverseVerticalAlignMap[props?.verticalAlign ?? "top"]
            : colVerticalAlignMap[props?.verticalAlign ?? "top"],
        flexWrap: props?.flexWrap,
        // No implicit gap — see Row.
        gap: spacingMap[props?.spacing ?? "none"] * 8, // Convert to pixels
        width: props?.width ?? (isFilled(props) ? "100%" : undefined), // Fill/fraction stretches horizontally
        height: props?.height ?? (props?.verticalAlign ? "100%" : undefined), // Default to full height when alignment is used
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

    const children = props?.divider ? withDividers(props?.children, "horizontal") : props?.children;

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

export { Col };
export type { ColProps, ColHorizontalAlign, ColVerticalAlign };
