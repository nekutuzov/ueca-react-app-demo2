import React from "react";
import * as UECA from "ueca-react";
import { resolvePaletteColor } from "@core";
import {
    blockHorizontalAlignMap, borderStyleMap, BlockProps, flexValue, paddingStyleMap
} from "./layoutShared";

function Block(props: BlockProps): UECA.ReactElement {
    if (props?.render === false) {
        return null;
    }

    const style: React.CSSProperties = {
        textAlign: blockHorizontalAlignMap[props?.horizontalAlign ?? "left"],
        width: props?.width,
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

export { Block };
