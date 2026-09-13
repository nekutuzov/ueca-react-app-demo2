import React from "react";
import { Palette, resolvePaletteColor } from "@core";

// Shared plumbing of the layout family (Block, Row, Col, Grid, GridCell, Card): the prop types,
// the spacing/padding scales, and the style mappers every member composes.

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

type Overflow = React.CSSProperties["overflow"];

type Cursor = React.CSSProperties["cursor"];

type FlexWrap = React.CSSProperties["flexWrap"];

type Border = "solid" | "dashed" | "dotted" | "rounded";

type BlockProps = {
    id?: string;
    ref?: React.Ref<HTMLDivElement>;
    render?: boolean;
    children?: React.ReactNode;
    className?: string;
    sx?: React.CSSProperties;
    fill?: boolean;
    /**
     * Proportional share of the parent's space — sets `flex`. Siblings divide space in the ratio
     * of their fractions, so `fraction={2}` beside `fraction={1}` is a 2:1 split. The ratio holds
     * regardless of content, because CSS `flex: <n>` expands to `<n> 1 0%` — a zero basis.
     *
     * `fill` is the boolean shorthand for `fraction={1}`; `fraction` wins if both are given.
     * A sibling with neither keeps its own width/height, so fixed and proportional children mix
     * freely — that is the ordinary toolbar shape.
     *
     * Note `fraction={0}` COLLAPSES the element (`flex: 0 1 0%` — zero basis, still shrinkable)
     * even if you gave it a width. To hold a fixed size, omit the prop rather than passing 0.
     */
    fraction?: number;
    zIndex?: number | string;
    width?: number | string;
    height?: number | string;
    minWidth?: number | string;
    minHeight?: number | string;
    maxWidth?: number | string;
    maxHeight?: number | string;
    padding?: Padding;
    backgroundColor?: Palette;
    color?: Palette;
    overflow?: Overflow;
    horizontalAlign?: BlockHorizontalAlign;
    cursor?: Cursor;
    border?: Border;
    // Events
    onClick?: React.MouseEventHandler<HTMLDivElement>;
    onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
    onMouseLeave?: React.MouseEventHandler<HTMLDivElement>;
    // Focus pair as well as the pointer pair: a hover-only affordance (a tooltip, most often) is
    // invisible to keyboard users without these.
    onFocus?: React.FocusEventHandler<HTMLDivElement>;
    onBlur?: React.FocusEventHandler<HTMLDivElement>;
    // Scroll/keyboard pair: a scroll container that windows its content (Table) has to observe
    // its own scrolling, and a focusable composite (a grid with keyboard row navigation) has to
    // hear its keys. Forwarded, like the focus pair, so such components need no raw <div>.
    onScroll?: React.UIEventHandler<HTMLDivElement>;
    onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
    tabIndex?: number;
    // ARIA role. A div is semantically nothing, so anything acting as a grid, list or dialog has to
    // say so for assistive technology to make sense of it.
    role?: string;
};

type FlexProps = BlockProps & {
    reverseItems?: boolean;
    spacing?: Spacing;
    divider?: boolean;
    flexWrap?: FlexWrap;
};

// Maps for spacing and alignment.
// Values are in 8px units (token * 8 = px). The `px*` tokens are exact pixels (px/8) for fine,
// non-8px-grid layouts; the semantic tokens are the 8px-grid scale.
const fineSteps = {
    px2: 0.25,
    px3: 0.375,
    px4: 0.5,
    px6: 0.75,
    px7: 0.875,
    px8: 1,
    px9: 1.125,
    px10: 1.25,
    px12: 1.5,
    px13: 1.625,
    px14: 1.75,
    px16: 2,
    px18: 2.25,
} as const;

const spacingMap = {
    none: 0,
    tiny: 0.5,
    default: 1,
    small: 2,
    medium: 3,
    large: 4,
    huge: 8,
    massive: 12,
    ...fineSteps,
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
    ...fineSteps,
} as const;

const blockHorizontalAlignMap = {
    left: "left",
    right: "right",
    center: "center",
} as const;

// Resolve `fraction` / `fill` to a CSS `flex` value. `fill` is the boolean shorthand for
// `fraction={1}`, so a fraction always wins when both are supplied.
// Tested against null rather than truthiness so that an explicit `fraction={0}` is passed straight
// through as `flex: 0` instead of silently falling back to `fill`. That collapses the element —
// which is exactly what `flex: 0` means in CSS — and is the caller's decision to make, not ours.
function flexValue(props?: { fraction?: number; fill?: boolean }): number | undefined {
    if (props?.fraction != null) {
        return props.fraction;
    }

    return props?.fill ? 1 : undefined;
}

// Whether the element takes part in proportional sizing at all. Drives the cross-axis `100%` that
// `fill` has always applied, so `fraction` behaves like the generalisation of `fill` it is rather
// than a subtly different prop.
function isFilled(props?: { fraction?: number; fill?: boolean }): boolean {
    return props?.fraction != null || !!props?.fill;
}

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

// Function to map border prop to CSS style properties
function borderStyleMap(border?: Border): React.CSSProperties {
    if (!border) {
        return {};
    }

    const borderColor = resolvePaletteColor("border.color");
    const borderWidth = "2px";

    switch (border) {
        case "solid":
            return {
                border: `${borderWidth} solid ${borderColor}`
            };
        case "dashed":
            return {
                border: `${borderWidth} dashed ${borderColor}`
            };
        case "dotted":
            return {
                border: `${borderWidth} dotted ${borderColor}`
            };
        case "rounded":
            return {
                border: `${borderWidth} solid ${borderColor}`,
                borderRadius: "8px"
            };
        default:
            return {};
    }
}

// Interleave a hairline divider between flex children. `axis` is the divider's own thin dimension:
// "vertical" (1px wide) between Row children, "horizontal" (1px tall) between Col children.
function withDividers(children: React.ReactNode, axis: "vertical" | "horizontal"): React.ReactNode {
    return React.Children.toArray(children).reduce((acc: React.ReactNode[], child, index) => {
        if (index > 0) {
            acc.push(
                React.createElement("div", {
                    key: `divider-${index}`,
                    style: {
                        ...(axis === "vertical" ? { width: "1px" } : { height: "1px" }),
                        backgroundColor: resolvePaletteColor("border.color"),
                        alignSelf: "stretch"
                    }
                })
            );
        }
        acc.push(child);
        return acc;
    }, []);
}

export {
    Spacing, PaddingSize, Padding, BlockHorizontalAlign, Overflow, Cursor, FlexWrap, Border,
    BlockProps, FlexProps,
    spacingMap, paddingSizeMap, blockHorizontalAlignMap,
    flexValue, isFilled, paddingStyleMap, borderStyleMap, withDividers
};
