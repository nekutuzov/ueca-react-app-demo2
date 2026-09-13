import * as UECA from "ueca-react";
import {
    Alert, Block, Col, ProgressBar, Row, StatusIntent, StatusLabel, StatusVariant,
    UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase
} from "@components";
import { ShowcaseSection } from "../showcaseSection";

const INTENTS: StatusIntent[] = ["success", "info", "warning", "error", "primary", "none"];
const VARIANTS: StatusVariant[] = ["soft", "outlined", "solid", "bare"];
const SEVERITIES = ["success", "info", "warning", "error"] as const;
const ALERT_VARIANTS = ["standard", "outlined", "filled"] as const;
const RAMP_STOPS = ["bg", "hover", "border", "ink"];

// Wording that suits each intent — a specimen reading "success / info / warning" tells you nothing
// about whether the colour is doing its job.
const SAMPLE_TEXT: Record<StatusIntent, string> = {
    success: "Online",
    info: "Scheduled",
    warning: "Battery low",
    error: "Comms lost",
    primary: "Active",
    none: "Unknown"
};

type StatusTopicStruct = UIBaseStruct<{
    methods: {
        _RampView: () => React.JSX.Element;
        _ChipsView: () => React.JSX.Element;
        _ProgressView: () => React.JSX.Element;
        _AlertsView: () => React.JSX.Element;
    };
}>;

type StatusTopicParams = UIBaseParams<StatusTopicStruct>;
type StatusTopicModel = UIBaseModel<StatusTopicStruct>;

function useStatusTopic(params?: StatusTopicParams): StatusTopicModel {
    const struct: StatusTopicStruct = {
        props: {
            id: useStatusTopic.name
        },

        methods: {
            _RampView: () => (
                <ShowcaseSection
                    title="The ramps"
                    description="Four derived stops per intent, on top of the base status colour. Everything that
                                 needs a status surface draws from these instead of mixing its own tint."
                >
                    <Col spacing="small">
                        {INTENTS.filter((i) => i !== "none").map((intent) => (
                            <Col key={intent} spacing="px4">
                                <Block className="showcase-specimen-label">{intent}</Block>
                                <Row spacing="tiny" flexWrap="wrap">
                                    <Block
                                        className="showcase-ramp-stop"
                                        sx={{ backgroundColor: `var(--${intent === "primary" ? "accent" : intent})` }}
                                    >
                                        base
                                    </Block>
                                    {RAMP_STOPS.map((stop) => (
                                        <Block
                                            key={stop}
                                            className="showcase-ramp-stop"
                                            sx={{
                                                backgroundColor: stop === "ink"
                                                    ? `var(--${intent}-bg)`
                                                    : `var(--${intent}-${stop})`,
                                                color: `var(--${intent}-ink)`,
                                                borderColor: `var(--${intent}-border)`
                                            }}
                                        >
                                            {stop}
                                        </Block>
                                    ))}
                                </Row>
                            </Col>
                        ))}
                    </Col>
                </ShowcaseSection>
            ),

            _ChipsView: () => (
                <ShowcaseSection
                    title="StatusLabel"
                    description="The row-level state marker. The dot carries the intent at full strength — it is
                                 what stays identifiable when the label truncates in a dense list."
                >
                    <Col spacing="small">
                        {VARIANTS.map((variant) => (
                            <Row key={variant} spacing="small" verticalAlign="center" flexWrap="wrap">
                                <Block className="showcase-specimen-label" width={80}>{variant}</Block>
                                {INTENTS.map((intent) => (
                                    <StatusLabel
                                        key={intent}
                                        id={`chip-${variant}-${intent}`}
                                        intent={intent}
                                        variant={variant}
                                        labelView={SAMPLE_TEXT[intent]}
                                    />
                                ))}
                            </Row>
                        ))}
                    </Col>
                </ShowcaseSection>
            ),

                _ProgressView: () => (
                <ShowcaseSection
                    title="ProgressBar"
                    description="0–100 with an optional percentage label; no value renders the indeterminate
                                 sweep. This is the bar the chunked file upload will drive."
                >
                    <Col spacing="small" maxWidth={420}>
                        <ProgressBar id="pb-quarter" value={25} />
                        <ProgressBar id="pb-labelled" value={60} percentage />
                        <ProgressBar id="pb-done" value={100} percentage color="success.main" />
                        <ProgressBar id="pb-indeterminate" />
                    </Col>
                </ShowcaseSection>
            ),

            _AlertsView: () => (
                <ShowcaseSection
                    title="Alert"
                    description="Now built on the same ramps — the standard and outlined variants used to mix
                                 their own tint and take the raw status colour as text, which is unreadable on
                                 a pale wash in a light theme."
                >
                    <Col spacing="medium">
                        {ALERT_VARIANTS.map((variant) => (
                            <Col key={variant} spacing="tiny">
                                <Block className="showcase-specimen-label">{variant}</Block>
                                {SEVERITIES.map((severity) => (
                                    <Alert
                                        key={severity}
                                        id={`alert-${variant}-${severity}`}
                                        severity={severity}
                                        variant={variant}
                                    >
                                        {`${SAMPLE_TEXT[severity]} — sensor 04 reported at 14:02.`}
                                    </Alert>
                                ))}
                            </Col>
                        ))}
                    </Col>
                </ShowcaseSection>
            )
        },

        View: () => (
            <Col id={model.htmlId()} className="showcase-topic" spacing="large">
                <model._RampView />
                <model._ChipsView />
                <model._ProgressView />
                <model._AlertsView />
            </Col>
        )
    };

    const model = useUIBase(struct, params);
    return model;
}

const StatusTopic = UECA.getFC(useStatusTopic);

export { StatusTopicParams, StatusTopicModel, useStatusTopic, StatusTopic };
