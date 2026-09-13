import { Block, BlockProps, Col } from "@components";

// Presentation chrome for one showcase entry: a heading, a sentence of explanation, and the
// specimen itself in a framed well.
//
// This is a PLAIN FUNCTION component, like Block/Row/Col/Card — not a UECA component. A showcase
// topic is a wall of dozens of static specimens; making each one a `children` entry would be pure
// ceremony for something that holds no state. Interactive demo controls (buttons, fields) still
// belong on the topic's model as proper UECA children — only this static wrapper is a function.
type ShowcaseSectionProps = {
    title: string;
    description?: string;
    children?: React.ReactNode;
    // Layout of the specimen well. Defaults suit a row of specimens; override for tall content.
    padding?: BlockProps["padding"];
    // `false` drops the framed well, for specimens that supply their own surface.
    framed?: boolean;
};

function ShowcaseSection(props: ShowcaseSectionProps): React.ReactElement {
    return (
        <Col spacing="tiny">
            <Block className="showcase-section-title">{props.title}</Block>
            <Block className="showcase-section-description" render={!!props.description}>
                {props.description}
            </Block>
            <Block
                className={props.framed === false ? undefined : "showcase-specimen"}
                padding={props.padding ?? "small"}
            >
                {props.children}
            </Block>
        </Col>
    );
}

// A labelled specimen: the demo above, the token/prop name below it in monospace. Used wherever a
// topic walks a scale (spacing steps, alignment values, type sizes).
type ShowcaseSpecimenProps = {
    label: string;
    children?: React.ReactNode;
    width?: number | string;
};

function ShowcaseSpecimen(props: ShowcaseSpecimenProps): React.ReactElement {
    // Capped at its row's width. A specimen shrink-wraps to its demo, so a fixed-width frame inside
    // had nothing to measure a max-width against and pushed the page wider than a phone.
    return (
        <Col spacing="px4" width={props.width} maxWidth={"100%"} minWidth={0}>
            <Block className="showcase-specimen-label">{props.label}</Block>
            {props.children}
        </Col>
    );
}

export { ShowcaseSectionProps, ShowcaseSection, ShowcaseSpecimenProps, ShowcaseSpecimen };
