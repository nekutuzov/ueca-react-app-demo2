import React from "react";
import * as UECA from "ueca-react";
import { Palette, resolvePaletteColor } from "@core";

type Spacing = keyof typeof spacingMap;

type PaddingSize = keyof typeof paddingSizeMap;

type Padding = {
    top?: PaddingSize;
    right?: PaddingSize;
    bottom?: PaddingSize;
    left?: PaddingSize;
} | {
    topBottom?: PaddingSize;
    leftRight?: PaddingSize;
} | PaddingSize;

type BlockHorizontalAlign = keyof typeof blockHorizontalAlignMap;

type BlockProps = {
    id?: string;
    key?: string | number;
    ref?: React.Ref<HTMLDivElement>;
    render?: boolean;
    children?: React.ReactNode;
    className?: string;
    sx?: React.CSSProperties;
    fill?: boolean;
    zIndex?: number | string;
    width?: number | string;
    height?: number | string;
    padding?: Padding;
    backgroundColor?: Palette;
    overflow?: React.CSSProperties["overflow"];
    horizontalAlign?: BlockHorizontalAlign;
    // Events
    onClick?: React.MouseEventHandler<HTMLDivElement>;
    onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
    onMouseLeave?: React.MouseEventHandler<HTMLDivElement>;
};

type FlexProps = BlockProps & {
    reverseItems?: boolean;
    spacing?: Spacing;
    divider?: boolean;
};

type RowHorizontalAlign = keyof typeof rowHorizontalAlignMap;
type RowVerticalAlign = keyof typeof rowVerticalAlignMap;

type RowProps = Omit<FlexProps, "horizontalAlign"> & {
    horizontalAlign?: RowHorizontalAlign;
    verticalAlign?: RowVerticalAlign;
};

type ColHorizontalAlign = keyof typeof colHorizontalAlignMap;
type ColVerticalAlign = keyof typeof colVerticalAlignMap;

type ColProps = Omit<FlexProps, "horizontalAlign"> & {
    horizontalAlign?: ColHorizontalAlign;
    verticalAlign?: ColVerticalAlign;
};

// Block component
function Block(props: BlockProps): UECA.ReactElement {
    if (props?.render === false) return null;
    
    const style: React.CSSProperties = {
        textAlign: blockHorizontalAlignMap[props?.horizontalAlign ?? "left"],
        width: props?.width,
        height: props?.height,
        zIndex: props?.zIndex,
        overflow: props?.overflow ?? "auto",
        backgroundColor: resolvePaletteColor(props?.backgroundColor),
        flex: props?.fill ? 1 : undefined,
        ...paddingStyleMap(props?.padding),
        ...props?.sx
    };

    return (
        <div
            id={props?.id}
            key={props?.key}
            ref={props?.ref}
            className={props?.className}
            style={style}
            onClick={props?.onClick}
            onMouseEnter={props?.onMouseEnter}
            onMouseLeave={props?.onMouseLeave}
        >
            {props?.children}
        </div>
    );
}

// Row component
function Row(props: RowProps): UECA.ReactElement {
    if (props?.render === false) return null;
    
    const style: React.CSSProperties = {
        display: "flex",
        flexDirection: props?.reverseItems ? "row-reverse" : "row",
        justifyContent: props?.reverseItems 
            ? rowReverseHorizontalAlignMap[props?.horizontalAlign ?? "left"] 
            : rowHorizontalAlignMap[props?.horizontalAlign ?? "left"],
        alignItems: rowVerticalAlignMap[props?.verticalAlign],
        gap: spacingMap[props?.spacing ?? "default"] * 8, // Convert to pixels
        width: props?.width ?? (props?.horizontalAlign ? "100%" : undefined), // Default to full width when alignment is used
        height: props?.height ?? (props?.verticalAlign ? "100%" : undefined), // Fill stretches vertically
        zIndex: props?.zIndex,
        overflow: props?.overflow ?? "hidden",
        backgroundColor: resolvePaletteColor(props?.backgroundColor),
        flex: props?.fill ? 1 : undefined, // Also set flex for when inside flex parent
        ...paddingStyleMap(props?.padding),
        ...props?.sx
    };

    // Handle dividers
    const children = props?.divider 
        ? React.Children.toArray(props?.children).reduce((acc: React.ReactNode[], child, index) => {
            if (index > 0) {
                acc.push(
                    <div 
                        key={`divider-${index}`} 
                        style={{ 
                            width: "1px", 
                            backgroundColor: "#e0e0e0",
                            alignSelf: "stretch"
                        }} 
                    />
                );
            }
            acc.push(child);
            return acc;
        }, [])
        : props?.children;

    return (
        <div
            id={props?.id}
            key={props?.key}
            ref={props?.ref}
            className={props?.className}
            style={style}
            onClick={props?.onClick}
            onMouseEnter={props?.onMouseEnter}
            onMouseLeave={props?.onMouseLeave}
        >
            {children}
        </div>
    );
};

// Col component
function Col(props: ColProps): UECA.ReactElement {
    if (props?.render === false) return null;
    
    const style: React.CSSProperties = {
        display: "flex",
        flexDirection: props?.reverseItems ? "column-reverse" : "column",
        alignItems: colHorizontalAlignMap[props?.horizontalAlign],
        justifyContent: props?.reverseItems 
            ? colReverseVerticalAlignMap[props?.verticalAlign ?? "top"] 
            : colVerticalAlignMap[props?.verticalAlign ?? "top"],
        gap: spacingMap[props?.spacing ?? "default"] * 8, // Convert to pixels
        width: props?.width ?? (props?.horizontalAlign ? "100%" : undefined), // Fill stretches horizontally
        height: props?.height ?? (props?.verticalAlign ? "100%" : undefined), // Default to full height when alignment is used
        zIndex: props?.zIndex,
        overflow: props?.overflow ?? "hidden",
        backgroundColor: resolvePaletteColor(props?.backgroundColor),
        flex: props?.fill ? 1 : undefined, // Also set flex for when inside flex parent
        ...paddingStyleMap(props?.padding),
        ...props?.sx
    };

    // Handle dividers
    const children = props?.divider 
        ? React.Children.toArray(props?.children).reduce((acc: React.ReactNode[], child, index) => {
            if (index > 0) {
                acc.push(
                    <div 
                        key={`divider-${index}`} 
                        style={{ 
                            height: "1px", 
                            backgroundColor: "#e0e0e0",
                            alignSelf: "stretch"
                        }} 
                    />
                );
            }
            acc.push(child);
            return acc;
        }, [])
        : props?.children;

    return (
        <div
            id={props?.id}
            key={props?.key}
            ref={props?.ref}
            className={props?.className}
            style={style}
            onClick={props?.onClick}
            onMouseEnter={props?.onMouseEnter}
            onMouseLeave={props?.onMouseLeave}
        >
            {children}
        </div>
    );
};

// Maps for spacing and alignment
const spacingMap = {
    none: 0,
    tiny: 0.5,
    default: 1,
    small: 2,
    medium: 3,
    large: 4,
    huge: 8,
    massive: 12,
} as const

const paddingSizeMap = {
    none: 0,
    tiny: 0.5,
    default: 1,
    small: 2,
    medium: 3,
    large: 4,
    huge: 8,
    massive: 12,
} as const;

const blockHorizontalAlignMap = {
    left: "left",
    right: "right",
    center: "center",
} as const;


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

// Function to map padding prop to CSS style properties
function paddingStyleMap(padding?: Padding): React.CSSProperties {
    if (!padding) {
        return {};
    }

    if (typeof padding === "string") {
        const px = paddingSizeMap[padding] * 8;
        return { padding: `${px}px` };
    }

    const paddingValues: React.CSSProperties = {};

    if ("topBottom" in padding && padding.topBottom) {
        const px = paddingSizeMap[padding.topBottom] * 8;
        paddingValues.paddingTop = `${px}px`;
        paddingValues.paddingBottom = `${px}px`;
    }

    if ("leftRight" in padding && padding.leftRight) {
        const px = paddingSizeMap[padding.leftRight] * 8;
        paddingValues.paddingLeft = `${px}px`;
        paddingValues.paddingRight = `${px}px`;
    }

    if ("left" in padding && padding.left) {
        const px = paddingSizeMap[padding.left] * 8;
        paddingValues.paddingLeft = `${px}px`;
    }
    if ("right" in padding && padding.right) {
        const px = paddingSizeMap[padding.right] * 8;
        paddingValues.paddingRight = `${px}px`;
    }
    if ("top" in padding && padding.top) {
        const px = paddingSizeMap[padding.top] * 8;
        paddingValues.paddingTop = `${px}px`;
    }
    if ("bottom" in padding && padding.bottom) {
        const px = paddingSizeMap[padding.bottom] * 8;
        paddingValues.paddingBottom = `${px}px`;
    }

    return paddingValues;
}

export { BlockProps, RowProps, ColProps, Block, Row, Col };
