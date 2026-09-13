import * as UECA from "ueca-react";
import { ScreenBaseModel, ScreenBaseParams, ScreenBaseStruct, useScreenBase } from "@components";
import { AppRoute, Breadcrumb, CRUDScreenModel, ScreenRoute, useCRUDScreen } from "@core";
import { ScreenPage, ScreenPager } from "../common/screenPage";
import { ShowcaseTopic, ShowcaseTopicKey, showcaseNeighbours, showcaseTopic } from "./showcaseTopics";
import { ControlsTopic } from "./topics/controlsTopic";
import { DataTopic } from "./topics/dataTopic";
import { DynamicContentTopic } from "./topics/dynamicContentTopic";
import { IconsTopic } from "./topics/iconsTopic";
import { LayoutTopic } from "./topics/layoutTopic";
import { ListsTopic } from "./topics/listsTopic";
import { OverlaysTopic } from "./topics/overlaysTopic";
import { OverviewTopic } from "./topics/overviewTopic";
import { StatusTopic } from "./topics/statusTopic";
import { TokensTopic } from "./topics/tokensTopic";
import "./showcase.css";

// One showcase page. Each topic is its own route and its own entry in the main menu; this screen
// puts the topic's specimens in the shared page frame, with the previous/next links at its foot.
//
// The topic is rendered as JSX from a switch rather than declared as a child. Children are built
// with their owner, so declaring all ten would construct every topic on every visit — the data and
// list topics among them hold tables and virtual lists thousands of rows long. JSX builds only the
// one on show.
type ShowcaseScreenStruct = ScreenBaseStruct<{
    props: {
        topic: ShowcaseTopicKey;
    };

    children: {
        crudScreen: CRUDScreenModel;
    };

    methods: {
        go: (path: string) => Promise<void>;
        _PageView: () => UECA.ReactElement;
    };
}>;

type ShowcaseScreenParams = ScreenBaseParams<ShowcaseScreenStruct>;
type ShowcaseScreenModel = ScreenBaseModel<ShowcaseScreenStruct>;

function useShowcaseScreen(params?: ShowcaseScreenParams): ShowcaseScreenModel {
    const struct: ShowcaseScreenStruct = {
        props: {
            id: useShowcaseScreen.name,
            topic: "overview"
        },

        children: {
            crudScreen: useCRUDScreen({
                intent: "none",
                // The page centres itself on the content band, so it owns its padding.
                contentPaddings: "none",
                breadcrumbs: () => _breadcrumbs(),
                contentView: () => <model._PageView />
            })
        },

        methods: {
            go: async (path) => {
                await model.goToRoute({ path } as AppRoute);
            },

            _PageView: () => (
                <ScreenPage
                    eyebrow={"Showcase"}
                    icon={_topic().icon}
                    title={_topic().title}
                    lead={_topic().lead}
                    footerView={
                        <ScreenPager
                            label={"Showcase pages"}
                            prev={showcaseNeighbours(model.topic).prev}
                            next={showcaseNeighbours(model.topic).next}
                            onGo={(path) => model.go(path)}
                        />
                    }
                >
                    {_topicView(model.topic)}
                </ScreenPage>
            )
        },

        View: () => <model.crudScreen.View />
    };

    const model = useScreenBase(struct, params);
    return model;

    // Private methods
    function _topic(): ShowcaseTopic {
        return showcaseTopic(model.topic) ?? showcaseTopic("overview");
    }

    function _breadcrumbs(): Breadcrumb[] {
        return [
            { route: { path: "/" }, label: "Home" },
            { route: { path: _topic().path } as ScreenRoute, label: `Showcase · ${_topic().title}` }
        ];
    }

    function _topicView(topic: ShowcaseTopicKey): React.ReactNode {
        switch (topic) {
            case "overview":
                return <OverviewTopic id={"overviewTopic"} />;
            case "tokens":
                return <TokensTopic id={"tokensTopic"} />;
            case "layout":
                return <LayoutTopic id={"layoutTopic"} />;
            case "controls":
                return <ControlsTopic id={"controlsTopic"} />;
            case "status":
                return <StatusTopic id={"statusTopic"} />;
            case "icons":
                return <IconsTopic id={"iconsTopic"} />;
            case "overlays":
                return <OverlaysTopic id={"overlaysTopic"} />;
            case "data":
                return <DataTopic id={"dataTopic"} />;
            case "lists":
                return <ListsTopic id={"listsTopic"} />;
            case "dynamic":
                return <DynamicContentTopic id={"dynamicContentTopic"} />;
        }
    }
}

const ShowcaseScreen = UECA.getFC(useShowcaseScreen);

export { ShowcaseScreenParams, ShowcaseScreenModel, useShowcaseScreen, ShowcaseScreen };
