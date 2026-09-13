import * as UECA from "ueca-react";
import { ScreenBaseModel, ScreenBaseParams, ScreenBaseStruct, useScreenBase, Icon } from "@components";
import { AppRoute, ArrowLeftIcon, ArrowRightIcon, Breadcrumb, CRUDScreenModel, ScreenRoute, useCRUDScreen } from "@core";
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
// is the frame they share — the header, the content band and the previous/next links — with the
// topic's specimens in the middle.
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
        _PagerView: () => UECA.ReactElement;
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
                <div className="showcase-page">
                    <header className="showcase-page-header">
                        <div className="showcase-eyebrow ueca-eyebrow">
                            <Icon name={_topic().icon} size="sm" />
                            Showcase
                        </div>
                        <h1 className="showcase-page-title">{_topic().title}</h1>
                        <p className="showcase-page-lead">{_topic().lead}</p>
                    </header>
                    {_topicView(model.topic)}
                    <model._PagerView />
                </div>
            ),

            _PagerView: () => {
                const { prev, next } = showcaseNeighbours(model.topic);
                return (
                    <nav className="showcase-pager" aria-label="Showcase pages">
                        {prev ? _pagerLink(prev, "prev") : <span />}
                        {next ? _pagerLink(next, "next") : <span />}
                    </nav>
                );
            }
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

    function _pagerLink(topic: ShowcaseTopic, direction: "prev" | "next"): React.ReactNode {
        return (
            <button
                type="button"
                className={`showcase-pager-link${direction === "next" ? " showcase-pager-next" : ""}`}
                onClick={() => model.go(topic.path)}
            >
                <span className="showcase-pager-dir ueca-eyebrow">
                    {direction === "prev" ? <><ArrowLeftIcon size={13} /> Previous</> : <>Next <ArrowRightIcon size={13} /></>}
                </span>
                <span className="showcase-pager-title">{topic.title}</span>
            </button>
        );
    }
}

const ShowcaseScreen = UECA.getFC(useShowcaseScreen);

export { ShowcaseScreenParams, ShowcaseScreenModel, useShowcaseScreen, ShowcaseScreen };
