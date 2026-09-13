import * as UECA from "ueca-react";
import { Block, Col, Row, Spacing, UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";
import { HomeIcon } from "@core";
import { ShowcaseSection, ShowcaseSpecimen } from "../showcaseSection";

// Token names per scale. Module scope, not inside the hook: consts declared after `return model`
// sit in the TDZ for early lifecycle hooks like mount, which is exactly where these are read.
const TYPE_STEPS = ["2xs", "xs", "sm", "md", "base", "lg", "xl", "2xl", "3xl", "4xl"];
const WEIGHTS = ["regular", "medium", "semibold", "bold", "extrabold"];
const TRACKING = ["tight", "normal", "wide", "wider", "widest"];
const LEADING = ["tight", "snug", "normal", "relaxed"];
const CONTROL_HEIGHTS = ["xs", "sm", "md", "lg", "xl"];
const ICON_SIZES = ["xs", "sm", "md", "lg", "xl", "2xl"];
const RADII = ["xs", "sm", "md", "lg", "xl", "pill", "circle"];
const SHADOWS = ["1", "2", "3", "4"];
const MOTION = ["fast", "base", "slow", "slower"];
const Z_LAYERS = ["hud", "dropdown", "dialog-backdrop", "drawer", "drawer-panel", "toast"];

// Semantic type roles, each with a sample that suits what the role is actually for.
const TYPE_ROLES = [
    { name: "ueca-title-lg", sample: "Site overview" },
    { name: "ueca-title", sample: "Instrument readings" },
    { name: "ueca-subtitle", sample: "Last 24 hours" },
    { name: "ueca-body", sample: "Readings are sampled once per minute and averaged over the reporting interval." },
    { name: "ueca-caption", sample: "Updated 4 minutes ago" },
    { name: "ueca-label", sample: "Reference elevation" },
    { name: "ueca-value", sample: "-12.4071 mm" }
];

// The spacing scale is declared twice by necessity — once in layout.tsx for JSX, once in tokens.css
// for component CSS — so it is the one scale that can silently drift. Rendering both side by side
// makes a mismatch visible instead of theoretical.
const SPACING_STEPS: Spacing[] = ["tiny", "default", "small", "medium", "large"];

type TokensTopicStruct = UIBaseStruct<{
    props: {
        // Resolved token values, read from the live stylesheet on mount so this page reports what
        // the app actually computes rather than a hand-copied second list that can go stale.
        _values: Record<string, string>;
    };

    methods: {
        _TypeView: () => React.JSX.Element;
        _SpacingView: () => React.JSX.Element;
        _ControlsView: () => React.JSX.Element;
        _ShapeView: () => React.JSX.Element;
        _MotionZView: () => React.JSX.Element;
    };
}>;

type TokensTopicParams = UIBaseParams<TokensTopicStruct>;
type TokensTopicModel = UIBaseModel<TokensTopicStruct>;

function useTokensTopic(params?: TokensTopicParams): TokensTopicModel {
    const struct: TokensTopicStruct = {
        props: {
            id: useTokensTopic.name,
            _values: undefined
        },

        methods: {
            _TypeView: () => (
                <Col spacing="medium">
                    <ShowcaseSection
                        title="Type scale"
                        description="Ten steps, each one something the app actually renders: md is control text, base is
                                     prose, sm is the field label, 2xs the uppercase eyebrow, and the two display
                                     steps are fluid."
                    >
                        <Col spacing="tiny">
                            {TYPE_STEPS.map((step) => (
                                <Row key={step} verticalAlign="baseline" spacing="small">
                                    <Block className="showcase-specimen-label" width={280}>
                                        {`--text-${step}`} · {_value(`--text-${step}`)}
                                    </Block>
                                    <Block sx={{ fontSize: `var(--text-${step})` }}>
                                        Every component, one shape
                                    </Block>
                                </Row>
                            ))}
                        </Col>
                    </ShowcaseSection>

                    <ShowcaseSection title="Weight" description="Archivo is bundled as a variable font covering 400–800, so every step is a real weight.">
                        <Col spacing="tiny">
                            {WEIGHTS.map((w) => (
                                <Row key={w} verticalAlign="baseline" spacing="small">
                                    <Block className="showcase-specimen-label" width={180}>
                                        {`--weight-${w}`} · {_value(`--weight-${w}`)}
                                    </Block>
                                    <Block sx={{ fontSize: "var(--text-lg)", fontWeight: `var(--weight-${w})` }}>
                                        Every component, one shape
                                    </Block>
                                </Row>
                            ))}
                        </Col>
                    </ShowcaseSection>

                    <ShowcaseSection title="Tracking and leading" description="Tracking widens as type gets smaller and more label-like.">
                        <Col spacing="medium">
                            <Col spacing="tiny">
                                {TRACKING.map((t) => (
                                    <Row key={t} verticalAlign="baseline" spacing="small">
                                        <Block className="showcase-specimen-label" width={180}>
                                            {`--tracking-${t}`} · {_value(`--tracking-${t}`)}
                                        </Block>
                                        <Block sx={{ fontSize: "var(--text-sm)", letterSpacing: `var(--tracking-${t})`, textTransform: "uppercase" }}>
                                            Sensor channel
                                        </Block>
                                    </Row>
                                ))}
                            </Col>

                            <Row spacing="small" flexWrap="wrap" verticalAlign="top">
                                {LEADING.map((l) => (
                                    <ShowcaseSpecimen key={l} label={`--leading-${l} · ${_value(`--leading-${l}`)}`} width={230}>
                                        <Block sx={{ fontSize: "var(--text-sm)", lineHeight: `var(--leading-${l})` }}>
                                            Readings are sampled once per minute and averaged over the
                                            reporting interval.
                                        </Block>
                                    </ShowcaseSpecimen>
                                ))}
                            </Row>
                        </Col>
                    </ShowcaseSection>

                    <ShowcaseSection
                        title="Typography roles"
                        description="Named roles built from the scales above, so a component asks for 'this is a
                                     title' instead of picking a font size. They set type only — colour stays a
                                     palette decision at the call site. Combine with a component's own class."
                    >
                        <Col spacing="small" divider>
                            {TYPE_ROLES.map((role) => (
                                <Col key={role.name} spacing="px4">
                                    <Block className="showcase-specimen-label">.{role.name}</Block>
                                    <Block className={role.name}>{role.sample}</Block>
                                </Col>
                            ))}

                            <Col spacing="px4">
                                <Block className="showcase-specimen-label">
                                    .ueca-truncate — inside a flex Row, needs min-width:0 or it overflows instead of ellipsising
                                </Block>
                                <Block className="showcase-frame" width={260} padding="px4">
                                    <Block className="ueca-body ueca-truncate">
                                        Borehole inclinometer 04 — cumulative displacement since installation
                                    </Block>
                                </Block>
                            </Col>
                        </Col>
                    </ShowcaseSection>
                </Col>
            ),

            _SpacingView: () => (
                <ShowcaseSection
                    title="Spacing"
                    description="Declared twice by necessity — layout.tsx drives the JSX props, tokens.css drives
                                 component CSS. Each pair below is the JSX prop above the CSS variable; they must
                                 look identical."
                >
                    <Col spacing="small">
                        {SPACING_STEPS.map((step) => (
                            <Col key={step} spacing="px4">
                                <Block className="showcase-specimen-label">
                                    {`spacing="${step}"`} vs {`var(--space-${step})`} · {_value(`--space-${step}`)}
                                </Block>
                                <Row spacing={step}>
                                    {_swatches(4)}
                                </Row>
                                <Block sx={{ display: "flex", gap: `var(--space-${step})` }}>
                                    {_swatches(4)}
                                </Block>
                            </Col>
                        ))}
                    </Col>
                </ShowcaseSection>
            ),

            _ControlsView: () => (
                <Col spacing="medium">
                    <ShowcaseSection
                        title="Control heights"
                        description="One ladder for everything clickable, so a Button and an IconButton in the same
                                     toolbar line up. xl is app chrome — the top bar."
                    >
                        <Row spacing="small" verticalAlign="bottom" flexWrap="wrap">
                            {CONTROL_HEIGHTS.map((h) => (
                                <ShowcaseSpecimen key={h} label={`--control-h-${h} · ${_value(`--control-h-${h}`)}`}>
                                    <Block
                                        className="showcase-swatch"
                                        width={96}
                                        sx={{ height: `var(--control-h-${h})` }}
                                    />
                                </ShowcaseSpecimen>
                            ))}
                        </Row>
                    </ShowcaseSection>

                    <ShowcaseSection title="Icon sizes" description="Rendered at the token size, not a hand-picked pixel value.">
                        <Row spacing="small" verticalAlign="bottom" flexWrap="wrap">
                            {ICON_SIZES.map((s) => (
                                <ShowcaseSpecimen key={s} label={`--icon-${s} · ${_value(`--icon-${s}`)}`}>
                                    <HomeIcon size={parseInt(_value(`--icon-${s}`), 10) || 16} />
                                </ShowcaseSpecimen>
                            ))}
                        </Row>
                    </ShowcaseSection>
                </Col>
            ),

            _ShapeView: () => (
                <Col spacing="medium">
                    <ShowcaseSection title="Radii" description="Five steps plus pill and circle, replacing the seven ad-hoc values in use.">
                        <Row spacing="small" flexWrap="wrap" verticalAlign="top">
                            {RADII.map((r) => (
                                <ShowcaseSpecimen key={r} label={`--radius-${r} · ${_value(`--radius-${r}`)}`}>
                                    {/* A pill only reads as a pill on a wide box — on a square it is
                                        indistinguishable from a circle. */}
                                    <Block
                                        className="showcase-swatch"
                                        width={r === "pill" ? 128 : 64}
                                        height={64}
                                        sx={{ borderRadius: `var(--radius-${r})` }}
                                    />
                                </ShowcaseSpecimen>
                            ))}
                        </Row>
                    </ShowcaseSection>

                    <ShowcaseSection
                        title="Elevation"
                        description="Shadows carry a colour, so --shadow-color is factored out for a theme to override.
                                     These replace four hardcoded rgba() values, one of which was 0.6 black."
                    >
                        <Row spacing="large" flexWrap="wrap" verticalAlign="top" padding={{ topBottom: "small" }}>
                            {SHADOWS.map((s) => (
                                <ShowcaseSpecimen key={s} label={`--shadow-${s}`}>
                                    <Block
                                        width={120}
                                        height={64}
                                        backgroundColor="background.paper"
                                        sx={{ borderRadius: "var(--radius-lg)", boxShadow: `var(--shadow-${s})` }}
                                    />
                                </ShowcaseSpecimen>
                            ))}
                        </Row>
                    </ShowcaseSection>
                </Col>
            ),

            _MotionZView: () => (
                <Col spacing="medium">
                    <ShowcaseSection
                        title="Motion"
                        description="Durations are tokens mainly so the prefers-reduced-motion override can reach every
                                     animation in the app from one place — it zeroes all four."
                    >
                        <Col spacing="tiny">
                            {MOTION.map((m) => (
                                <Block key={m} className="showcase-specimen-label">
                                    {`--motion-${m}`} · {_value(`--motion-${m}`)}
                                </Block>
                            ))}
                            <Block className="showcase-specimen-label">--ease · {_value("--ease")}</Block>
                        </Col>
                    </ShowcaseSection>

                    <ShowcaseSection
                        title="Overlay ladder"
                        description="Previously prose in a doc plus literals in five component files. `dropdown` is
                                     reserved for the popover/menu layer that doesn't exist yet."
                    >
                        <Col spacing="tiny">
                            {Z_LAYERS.map((z) => (
                                <Block key={z} className="showcase-specimen-label">
                                    {`--z-${z}`} · {_value(`--z-${z}`)}
                                </Block>
                            ))}
                        </Col>
                    </ShowcaseSection>
                </Col>
            )
        },

        mount: () => {
            // Read the resolved values once the document exists. getComputedStyle is DOM-bound, so
            // this belongs in mount, not init.
            const computed = getComputedStyle(document.documentElement);
            const names = [
                ...TYPE_STEPS.map((s) => `--text-${s}`),
                ...WEIGHTS.map((w) => `--weight-${w}`),
                ...TRACKING.map((t) => `--tracking-${t}`),
                ...LEADING.map((l) => `--leading-${l}`),
                ...SPACING_STEPS.map((s) => `--space-${s}`),
                ...CONTROL_HEIGHTS.map((h) => `--control-h-${h}`),
                ...ICON_SIZES.map((s) => `--icon-${s}`),
                ...RADII.map((r) => `--radius-${r}`),
                ...MOTION.map((m) => `--motion-${m}`),
                ...Z_LAYERS.map((z) => `--z-${z}`),
                "--ease"
            ];

            const values: Record<string, string> = {};
            for (const name of names) {
                values[name] = computed.getPropertyValue(name).trim();
            }

            // Reassign the whole object — MobX is shallow, so mutating fields would not re-render.
            model._values = values;
        },

        View: () => (
            <Col id={model.htmlId()} className="showcase-topic" spacing="large">
                <model._TypeView />
                <model._SpacingView />
                <model._ControlsView />
                <model._ShapeView />
                <model._MotionZView />
            </Col>
        )
    };

    const model = useUIBase(struct, params);
    return model;


    // Private methods
    function _value(name: string): string {
        return model._values?.[name] ?? "…";
    }

    function _swatches(count: number): React.JSX.Element[] {
        return Array.from({ length: count }, (_, i) =>
            <Block key={i} className="showcase-swatch" width={36} height={24} />);
    }
}

const TokensTopic = UECA.getFC(useTokensTopic);

export { TokensTopicParams, TokensTopicModel, useTokensTopic, TokensTopic };
