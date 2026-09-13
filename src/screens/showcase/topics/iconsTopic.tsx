import * as UECA from "ueca-react";
import {
    Block, Col, Icon, IconSizeToken, Row, StatusIntent,
    UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase
} from "@components";
import { ICONS, IconName, iconNames } from "@core";
import { ShowcaseSection, ShowcaseSpecimen } from "../showcaseSection";

const SIZES: IconSizeToken[] = ["xs", "sm", "md", "lg", "xl", "2xl"];
const INTENTS: StatusIntent[] = ["success", "info", "warning", "error", "primary"];

// A tiny inline SVG that is in no registry — proof that `source` works for a one-off. Drawn in the
// outline family's stroke so it sits comfortably beside the registered glyphs.
const AD_HOC_SOURCE = {
    kind: "svg" as const,
    component: (p?: { size?: number | string; color?: string }) => (
        <svg
            width={p?.size ?? "1em"}
            height={p?.size ?? "1em"}
            viewBox="0 0 24 24"
            fill="none"
            color={p?.color}
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinejoin="round"
        >
            <path d="M12 3.5 14.6 9l6 .6-4.5 4 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.5-4 6-.6z" />
        </svg>
    )
};

type IconsTopicStruct = UIBaseStruct<{
    methods: {
        _SizeView: () => React.JSX.Element;
        _ColourView: () => React.JSX.Element;
        _RegistryView: () => React.JSX.Element;
    };
}>;

type IconsTopicParams = UIBaseParams<IconsTopicStruct>;
type IconsTopicModel = UIBaseModel<IconsTopicStruct>;

function useIconsTopic(params?: IconsTopicParams): IconsTopicModel {
    const struct: IconsTopicStruct = {
        props: {
            id: useIconsTopic.name
        },

        methods: {
            _SizeView: () => (
                <ShowcaseSection
                    title="One size scale"
                    description="The wrapper carries the size as font-size and each source renders at 1em, so every
                                 glyph occupies exactly the same box at a given step — an outline icon and an image
                                 alike. That is also why the scale lives only in tokens.css: no pixel numbers are
                                 duplicated in TypeScript."
                >
                    <Col spacing="small">
                        {[
                            { label: "refresh", name: "refresh" as IconName },
                            { label: "settings", name: "settings" as IconName }
                        ].map((row) => (
                            <Row key={row.name} spacing="medium" verticalAlign="bottom" flexWrap="wrap">
                                <Block className="showcase-specimen-label" width={160}>{row.label}</Block>
                                {SIZES.map((size) => (
                                    <ShowcaseSpecimen key={size} label={size}>
                                        <Icon name={row.name} size={size} />
                                    </ShowcaseSpecimen>
                                ))}
                            </Row>
                        ))}
                    </Col>
                </ShowcaseSection>
            ),

            _ColourView: () => (
                <ShowcaseSection
                    title="Colour and intent"
                    description="Monochrome sources follow `color` (a palette token) or `intent` (the status ramp's
                                 readable ink). With neither they inherit, so an icon inside a coloured control
                                 follows that control. An image source cannot be recoloured and ignores both."
                >
                    <Col spacing="medium">
                        <Row spacing="medium" verticalAlign="center" flexWrap="wrap">
                            <Block className="showcase-specimen-label" width={160}>intent</Block>
                            {INTENTS.map((intent) => (
                                <ShowcaseSpecimen key={intent} label={intent}>
                                    <Icon name="warning" size="lg" intent={intent} />
                                </ShowcaseSpecimen>
                            ))}
                        </Row>

                        <Row spacing="medium" verticalAlign="center" flexWrap="wrap">
                            <Block className="showcase-specimen-label" width={160}>palette color</Block>
                            <ShowcaseSpecimen label="primary.main">
                                <Icon name="database" size="lg" color="primary.main" />
                            </ShowcaseSpecimen>
                            <ShowcaseSpecimen label="text.secondary">
                                <Icon name="database" size="lg" color="text.secondary" />
                            </ShowcaseSpecimen>
                            <ShowcaseSpecimen label="inherited">
                                <Block color="text.disabled">
                                    <Icon name="database" size="lg" />
                                </Block>
                            </ShowcaseSpecimen>
                            <ShowcaseSpecimen label="ad-hoc source">
                                <Icon source={AD_HOC_SOURCE} size="lg" intent="warning" />
                            </ShowcaseSpecimen>
                        </Row>
                    </Col>
                </ShowcaseSection>
            ),

            _RegistryView: () => (
                <ShowcaseSection
                    title="The registry"
                    description="Every registered role, with the source backing it. Call sites name the role only —
                                 redrawing a glyph, or backing a role with a server image instead, is an edit in
                                 iconRegistry.ts and nothing else."
                >
                    <Row spacing="small" flexWrap="wrap" verticalAlign="top">
                        {iconNames().map((name) => (
                            <Col key={name} className="showcase-icon-cell" spacing="px4" horizontalAlign="center">
                                <Icon name={name} size="lg" />
                                <Block className="showcase-specimen-label">{name}</Block>
                                <Block className="showcase-icon-kind">{ICONS[name].kind}</Block>
                            </Col>
                        ))}
                    </Row>
                </ShowcaseSection>
            )
        },

        View: () => (
            <Col id={model.htmlId()} className="showcase-topic" spacing="large">
                <model._SizeView />
                <model._ColourView />
                <model._RegistryView />
            </Col>
        )
    };

    const model = useUIBase(struct, params);
    return model;
}

const IconsTopic = UECA.getFC(useIconsTopic);

export { IconsTopicParams, IconsTopicModel, useIconsTopic, IconsTopic };
