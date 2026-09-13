import React from "react";
import { Block } from "./block";
import { Col } from "./col";
import { BlockProps } from "./layoutShared";

type CardProps = BlockProps & {
    title?: string;
};

function Card(props: CardProps): React.ReactElement {
    if (props?.render === false) {
        return null;
    }

    const sx: React.CSSProperties = {
        borderRadius: "var(--radius-lg)",
        // Card draws no border of its own, so it composes the hairline ring in FRONT of the
        // shadow: a drop shadow alone is nearly invisible on a dark theme, leaving the card with
        // no edge at all. Both are tokens — the previous rgba() was a hardcoded colour.
        boxShadow: "var(--ring), var(--shadow-2)",
        ...props?.sx
    };

    const p = { ...props };
    p.padding = p.padding || "medium";
    p.backgroundColor = p.backgroundColor || "background.paper";
    p.overflow = p.overflow ?? "auto";

    return (
        <Col {...p} sx={sx} spacing="small" overflow="unset">
            {/* .ueca-title rather than a bare <h2>: an unstyled h2 takes the browser default size
                and margin, which sits on no scale and ignores the theme. */}
            <Block className="ueca-title" render={!!p?.title}>
                {p.title}
            </Block>
            <Block fill overflow={p.overflow}>
                {p?.children}
            </Block>
        </Col>
    );
}

export { Card };
export type { CardProps };
