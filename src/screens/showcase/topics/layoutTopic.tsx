import * as UECA from "ueca-react";
import {
    Block, Card, Col, ColHorizontalAlign, ColVerticalAlign, PaddingSize, Row, RowHorizontalAlign,
    RowVerticalAlign, Spacing, UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase
} from "@components";
import { ShowcaseSection, ShowcaseSpecimen } from "../showcaseSection";

// The semantic 8px-grid steps. The exact-pixel `pxN` tokens share the same scale and are covered
// by a note rather than a specimen each — there are fourteen of them and they read as a table.
const SPACING_STEPS: Spacing[] = ["none", "tiny", "default", "small", "medium", "large", "huge"];
const PADDING_STEPS: PaddingSize[] = ["none", "tiny", "default", "small", "medium", "large"];

const ROW_H_ALIGNS: RowHorizontalAlign[] = ["left", "center", "right", "spaceBetween", "spaceAround", "spaceEvenly"];
const ROW_V_ALIGNS: RowVerticalAlign[] = ["top", "center", "bottom", "stretch", "baseline"];
const COL_H_ALIGNS: ColHorizontalAlign[] = ["left", "center", "right", "stretch"];
const COL_V_ALIGNS: ColVerticalAlign[] = ["top", "center", "bottom", "spaceBetween", "spaceAround", "spaceEvenly"];

// Ratios worth seeing: equal (what several `fill` siblings always give you), and the asymmetric
// splits `fill` alone cannot express.
const FRACTION_SPLITS = [[1, 1], [2, 1], [1, 2, 1], [3, 1]];

type LayoutTopicStruct = UIBaseStruct<{
    methods: {
        _SpacingView: () => React.JSX.Element;
        _PaddingView: () => React.JSX.Element;
        _RowAlignView: () => React.JSX.Element;
        _ColAlignView: () => React.JSX.Element;
        _DividerFillView: () => React.JSX.Element;
        _FractionView: () => React.JSX.Element;
        _CardView: () => React.JSX.Element;
    };
}>;

type LayoutTopicParams = UIBaseParams<LayoutTopicStruct>;
type LayoutTopicModel = UIBaseModel<LayoutTopicStruct>;

function useLayoutTopic(params?: LayoutTopicParams): LayoutTopicModel {
    const struct: LayoutTopicStruct = {
        props: {
            id: useLayoutTopic.name
        },

        methods: {
            _SpacingView: () => (
                <ShowcaseSection
                    title="Spacing"
                    description="The gap BETWEEN children of a Row or Col. Note that it defaults to
                                 `default` (8px), not zero — a container converted from CSS gains
                                 8px between every child unless you pass spacing='none'."
                >
                    <Col spacing="small">
                        {SPACING_STEPS.map((step) => (
                            <ShowcaseSpecimen key={step} label={`spacing="${step}"`}>
                                <Row spacing={step}>
                                    {_swatches(3)}
                                </Row>
                            </ShowcaseSpecimen>
                        ))}
                    </Col>
                </ShowcaseSection>
            ),

            _PaddingView: () => (
                <ShowcaseSection
                    title="Padding"
                    description="Space INSIDE the element. Takes a single token, or an object for
                                 per-side control: { topBottom, leftRight } or { top, right, bottom, left }."
                >
                    <Row spacing="small" flexWrap="wrap" verticalAlign="top">
                        {PADDING_STEPS.map((step) => (
                            <ShowcaseSpecimen key={step} label={`padding="${step}"`}>
                                <Block className="showcase-frame" padding={step}>
                                    {_swatch(64, 32)}
                                </Block>
                            </ShowcaseSpecimen>
                        ))}
                    </Row>
                </ShowcaseSection>
            ),

            _RowAlignView: () => (
                <ShowcaseSection
                    title="Row alignment"
                    description="horizontalAlign moves children along the row (main axis);
                                 verticalAlign moves them across it. Careful: setting horizontalAlign
                                 also gives the Row width:100%, which is the usual cause of
                                 'why did this suddenly go full width'."
                >
                    <Col spacing="medium">
                        <Col spacing="small">
                            {ROW_H_ALIGNS.map((align) => (
                                <ShowcaseSpecimen key={align} label={`horizontalAlign="${align}"`}>
                                    <Block className="showcase-frame" width={380} padding="tiny">
                                        <Row horizontalAlign={align} spacing="tiny">
                                            {_swatches(3)}
                                        </Row>
                                    </Block>
                                </ShowcaseSpecimen>
                            ))}
                        </Col>

                        <Row spacing="small" flexWrap="wrap" verticalAlign="top">
                            {ROW_V_ALIGNS.map((align) => (
                                <ShowcaseSpecimen key={align} label={`verticalAlign="${align}"`}>
                                    <Block className="showcase-frame" width={150} height={84} padding="tiny">
                                        <Row verticalAlign={align} spacing="tiny" height="100%">
                                            {_rowVerticalChildren(align)}
                                        </Row>
                                    </Block>
                                </ShowcaseSpecimen>
                            ))}
                        </Row>
                    </Col>
                </ShowcaseSection>
            ),

            _ColAlignView: () => (
                <ShowcaseSection
                    title="Column alignment"
                    description="A Col's axes are swapped: verticalAlign is the main axis (and owns
                                 the spaceBetween/Around/Evenly values), horizontalAlign is the cross
                                 axis (and owns 'stretch'). They are NOT the same token sets as Row's."
                >
                    <Col spacing="medium">
                        <Row spacing="small" flexWrap="wrap" verticalAlign="top">
                            {COL_H_ALIGNS.map((align) => (
                                <ShowcaseSpecimen key={align} label={`horizontalAlign="${align}"`}>
                                    <Block className="showcase-frame" width={140} height={96} padding="tiny">
                                        <Col horizontalAlign={align} spacing="tiny" width="100%">
                                            {_colHorizontalChildren(align)}
                                        </Col>
                                    </Block>
                                </ShowcaseSpecimen>
                            ))}
                        </Row>

                        <Row spacing="small" flexWrap="wrap" verticalAlign="top">
                            {COL_V_ALIGNS.map((align) => (
                                <ShowcaseSpecimen key={align} label={`verticalAlign="${align}"`}>
                                    <Block className="showcase-frame" width={140} height={120} padding="tiny">
                                        <Col verticalAlign={align} spacing="none" height="100%">
                                            {_swatches(3, 44, 18)}
                                        </Col>
                                    </Block>
                                </ShowcaseSpecimen>
                            ))}
                        </Row>
                    </Col>
                </ShowcaseSection>
            ),

            _DividerFillView: () => (
                <ShowcaseSection
                    title="Divider and fill"
                    description="`divider` draws a 1px line in the border.color role between every
                                 pair of children — don't hand-roll separators. `fill` sets flex:1,
                                 so the element takes whatever space is left over."
                >
                    <Row spacing="small" flexWrap="wrap" verticalAlign="top">
                        <ShowcaseSpecimen label="<Row divider>">
                            <Block className="showcase-frame" width={220} padding="tiny">
                                <Row divider spacing="small">
                                    {_swatches(3, 40, 28)}
                                </Row>
                            </Block>
                        </ShowcaseSpecimen>

                        <ShowcaseSpecimen label="<Col divider>">
                            <Block className="showcase-frame" width={140} padding="tiny">
                                <Col divider spacing="tiny">
                                    {_swatches(3, 100, 20)}
                                </Col>
                            </Block>
                        </ShowcaseSpecimen>

                        <ShowcaseSpecimen label="middle child: fill">
                            <Block className="showcase-frame" width={280} padding="tiny">
                                <Row spacing="tiny">
                                    <Block className="showcase-swatch" width={40} height={28} />
                                    <Block className="showcase-swatch" fill height={28} />
                                    <Block className="showcase-swatch" width={40} height={28} />
                                </Row>
                            </Block>
                        </ShowcaseSpecimen>
                    </Row>
                </ShowcaseSection>
            ),

            _FractionView: () => (
                <ShowcaseSection
                    title="Fraction — proportional splits"
                    description="`fill` gives an element flex:1, so several fill siblings always split space equally.
                                 `fraction` sets the flex value directly, so siblings divide space in the ratio of
                                 their fractions. `fill` is simply the shorthand for fraction={1}."
                >
                    <Col spacing="small">
                        {FRACTION_SPLITS.map((split) => (
                            <Col key={split.join(":")} spacing="px4">
                                <Block className="showcase-specimen-label">
                                    {split.map((f) => `fraction={${f}}`).join("  ")}
                                </Block>
                                <Block className="showcase-frame" width={520} padding="tiny">
                                    <Row spacing="tiny">
                                        {split.map((f, i) => (
                                            <Block key={i} className="showcase-swatch" fraction={f} height={28} />
                                        ))}
                                    </Row>
                                </Block>
                            </Col>
                        ))}

                        <Col spacing="px4">
                            <Block className="showcase-specimen-label">
                                width={"{80}"} (no fraction) + fraction={"{1}"} + fraction={"{2}"} — fixed and
                                proportional children mix freely
                            </Block>
                            <Block className="showcase-frame" width={520} padding="tiny">
                                <Row spacing="tiny">
                                    <Block className="showcase-swatch" width={80} height={28} />
                                    <Block className="showcase-swatch" fraction={1} height={28} />
                                    <Block className="showcase-swatch" fraction={2} height={28} />
                                </Row>
                            </Block>
                        </Col>

                        <Block className="showcase-note">
                            Careful with <code>fraction={"{0}"}</code>: CSS <code>flex: 0</code> expands to{" "}
                            <code>0 1 0%</code>, so it collapses the element to nothing even if you also gave
                            it a width. To hold a fixed size, omit the prop — as the row above does.
                        </Block>
                    </Col>
                </ShowcaseSection>
            ),

            _CardView: () => (
                <ShowcaseSection
                    title="Card"
                    description="A titled, padded, elevated surface — a Col underneath, so it takes the same props.
                                 It draws no border of its own, so it composes var(--ring) in front of var(--shadow-2):
                                 on a dark theme the shadow alone leaves it with no visible edge."
                    framed={false}
                >
                    <Row spacing="medium" flexWrap="wrap" verticalAlign="top" padding={{ topBottom: "tiny" }}>
                        <Card title="Borehole 04" width={260}>
                            <Block className="ueca-body">Cumulative displacement since installation.</Block>
                            <Block className="ueca-value">-12.4071 mm</Block>
                        </Card>

                        <Card width={260}>
                            <Block className="ueca-body">Untitled card — the title is optional.</Block>
                        </Card>
                    </Row>
                </ShowcaseSection>
            )
        },

        View: () => (
            <Col id={model.htmlId()} className="showcase-topic" spacing="large">
                <model._SpacingView />
                <model._PaddingView />
                <model._RowAlignView />
                <model._ColAlignView />
                <model._DividerFillView />
                <model._FractionView />
                <model._CardView />

                <Block className="showcase-note">
                    Alongside the semantic steps above there are exact-pixel tokens —{" "}
                    <code>px2 px3 px4 px6 px7 px8 px9 px10 px12 px13 px14 px16 px18</code> — for
                    designs that are not on the 8px grid. If a value you need is missing, add a{" "}
                    <code>pxN</code> to <code>fineSteps</code> in <code>layout.tsx</code> rather
                    than reaching for <code>sx</code>.
                </Block>
            </Col>
        )
    };

    const model = useUIBase(struct, params);
    return model;


    // Private methods
    function _swatch(width: number, height: number, key?: string | number): React.JSX.Element {
        return <Block key={key} className="showcase-swatch" width={width} height={height} />;
    }

    function _swatches(count: number, width = 36, height = 28): React.JSX.Element[] {
        return Array.from({ length: count }, (_, i) => _swatch(width, height, i));
    }

    // A specimen has to be able to DEMONSTRATE its token, and two of the Row values can't when the
    // children carry a fixed size of their own: `stretch` has nothing to stretch into, and
    // `baseline` has no text baseline to align — both then render identically to `top`, which is
    // worse than showing nothing.
    function _rowVerticalChildren(align: RowVerticalAlign): React.JSX.Element[] {
        if (align === "stretch") {
            return Array.from({ length: 3 }, (_, i) =>
                <Block key={i} className="showcase-swatch" width={32} />);
        }

        if (align === "baseline") {
            // Differing font sizes are the whole point here — this is one of the few places a raw
            // size is the specimen rather than a shortcut.
            return [10, 17, 13].map((fontSize, i) =>
                <Block key={i} className="showcase-swatch" padding="px4" sx={{ fontSize }}>Ag</Block>);
        }

        return [20, 36, 28].map((height, i) =>
            <Block key={i} className="showcase-swatch" width={32} height={height} />);
    }

    // Same reasoning on the cross axis: `stretch` needs children with no width of their own.
    function _colHorizontalChildren(align: ColHorizontalAlign): React.JSX.Element[] {
        if (align === "stretch") {
            return Array.from({ length: 2 }, (_, i) =>
                <Block key={i} className="showcase-swatch" height={20} />);
        }

        return [44, 68].map((width, i) =>
            <Block key={i} className="showcase-swatch" width={width} height={20} />);
    }
}

const LayoutTopic = UECA.getFC(useLayoutTopic);

export { LayoutTopicParams, LayoutTopicModel, useLayoutTopic, LayoutTopic };
