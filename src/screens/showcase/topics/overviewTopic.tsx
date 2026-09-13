import * as UECA from "ueca-react";
import { Block, Col, UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";
import { ShowcaseSection } from "../showcaseSection";

type OverviewTopicStruct = UIBaseStruct<object>;

type OverviewTopicParams = UIBaseParams<OverviewTopicStruct>;
type OverviewTopicModel = UIBaseModel<OverviewTopicStruct>;

function useOverviewTopic(params?: OverviewTopicParams): OverviewTopicModel {
    const struct: OverviewTopicStruct = {
        props: {
            id: useOverviewTopic.name
        },

        View: () => (
            <Col id={model.htmlId()} className="showcase-topic" spacing="large">
                <ShowcaseSection
                    title="What this is for"
                    description="Three jobs, in order of how often they come up."
                >
                    <Col spacing="small">
                        <Block className="showcase-note">
                            <b>Reference.</b> Look up the real name of a token instead of guessing a
                            pixel value — <code>spacing="small"</code> rather than{" "}
                            <code>gap: 16px</code>.
                        </Block>
                        <Block className="showcase-note">
                            <b>Verification.</b> A change to a shared component or a theme shows up
                            here immediately, across every specimen at once, which is far more
                            revealing than checking one screen.
                        </Block>
                        <Block className="showcase-note">
                            <b>Theme coverage.</b> The app ships a light theme and a dark one, and a
                            hardcoded colour looks fine in whichever you happened to be using. Toggling
                            the theme from the top bar over any page here is the cheapest way to catch it.
                        </Block>
                    </Col>
                </ShowcaseSection>

                <ShowcaseSection
                    title="Adding a topic"
                    description="Each topic is one file and one route, and wiring a new one is three edits."
                >
                    <Col spacing="small">
                        <Block className="showcase-note">
                            Add <code>src/screens/showcase/topics/&lt;name&gt;Topic.tsx</code>{" "}
                            exporting a <code>&lt;Name&gt;Topic</code> component, describe it in{" "}
                            <code>showcaseTopics.tsx</code>, and render it from the switch in{" "}
                            <code>showcaseScreen.tsx</code>. The route, the menu entry, the page header
                            and the previous/next links all come from that one description. Wrap each
                            specimen in <code>&lt;ShowcaseSection&gt;</code> so the topics stay
                            visually consistent.
                        </Block>
                        <Block className="showcase-note">
                            Specimens are static JSX, so they sit inline. Anything <i>interactive</i>{" "}
                            — a button whose click you want to observe, a bound field — is a real
                            UECA child on the topic's model, exactly as it would be on a screen.
                        </Block>
                    </Col>
                </ShowcaseSection>
            </Col>
        )
    };

    const model = useUIBase(struct, params);
    return model;
}

const OverviewTopic = UECA.getFC(useOverviewTopic);

export { OverviewTopicParams, OverviewTopicModel, useOverviewTopic, OverviewTopic };
