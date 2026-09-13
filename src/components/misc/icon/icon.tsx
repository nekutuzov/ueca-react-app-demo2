import { StatusIntent } from "@components";
import { getIconSource, IconName, IconSource, Palette, resolvePaletteColor } from "@core";
import "./icon.css";

// Sizes name a step on the icon scale in tokens.css. A raw number is allowed for the rare case
// that has to match something external, but prefer the token.
// Named IconSizeToken, not IconSize — IconButton already owns `IconSize` for its own
// xsmall/small/medium/large control sizes, which is a different scale entirely.
type IconSizeToken = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

// One component over every icon source. See core/misc/iconRegistry.ts for the design — call sites
// name a ROLE, the registry decides where the glyph comes from.
//
// A PLAIN FUNCTION, like Block/Row/Col: an icon holds no state, and screens render dozens of them.
// When the server-image source lands it becomes async and will need real state; at that point this
// gets promoted to a UECA component (`useIcon`) WITHOUT changing the props below.
type IconProps = {
    // Either a registered role…
    name?: IconName;
    // …or a source supplied directly, for a one-off that does not deserve a registry entry.
    source?: IconSource;
    size?: IconSizeToken | number;
    // Palette token. Ignored for `url` sources, which cannot be recoloured.
    color?: Palette;
    // Tints the icon with a status ramp's readable ink. Loses to `color` if both are given.
    intent?: StatusIntent;
    // Accessible name for a MEANINGFUL icon (role="img"). Emitted as aria-label, never as the DOM
    // `title` attribute: that renders the browser's own hint popup, which this app does not use
    // anywhere. For a hint the reader should SEE, wrap the glyph and use model.tooltipProps.
    label?: string;
    className?: string;
    render?: boolean;
};

function Icon(props: IconProps): React.ReactElement {
    if (props?.render === false) {
        return null;
    }

    const source = props?.source ?? (props?.name ? getIconSource(props.name) : undefined);
    if (!source) {
        return null;
    }

    // The wrapper carries the size as font-size, and each source renders at 1em. That is what lets
    // the icon scale come from tokens.css alone instead of being duplicated as numbers in TS.
    const size = typeof props?.size === "number"
        ? `${props.size}px`
        : `var(--icon-${props?.size ?? "md"})`;

    const style: React.CSSProperties = {
        fontSize: size,
        color: _color(props)
    };

    const className = "ueca-icon" + (props?.className ? " " + props.className : "");

    return (
        <span className={className} style={style} aria-label={props?.label} role={props?.label ? "img" : undefined}>
            {_sourceView(source, props?.label)}
        </span>
    );
}

export { IconSizeToken, IconProps, Icon };


// Private helpers
function _color(props: IconProps): string | undefined {
    if (props?.color) {
        return resolvePaletteColor(props.color);
    }

    if (props?.intent && props.intent !== "none") {
        // The status ramp's ink stop, not the raw status colour: the raw colour is the one that
        // goes unreadable on a light surface (see the ramp note in themes.css).
        return `var(--${props.intent}-ink)`;
    }

    // Inherit, so an icon inside a coloured control follows that control.
    return undefined;
}

function _sourceView(source: IconSource, label?: string): React.ReactNode {
    switch (source.kind) {
        case "svg":
            // currentColor inside the SVG picks up the wrapper's `color`.
            return source.component({ size: "1em", color: "currentColor" });

        case "url":
            // Not monochrome — `color` does not apply, by design.
            return <img className="ueca-icon-image" src={source.src} alt={source.alt ?? label ?? ""} />;
    }
}
