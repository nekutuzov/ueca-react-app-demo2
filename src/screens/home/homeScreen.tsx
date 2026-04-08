import * as UECA from "ueca-react";
import { ScreenBaseModel, ScreenBaseParams, ScreenBaseStruct, useScreenBase, Block, useMarkdownPreview, Col, MarkdownPreviewModel } from "@components";
import { Breadcrumb, CRUDScreenModel, useCRUDScreen } from "@core";
import welcome from "./welcome.md?raw";
import architectureContent from "./architecture.md?raw";
import diagramSvg from "./ueca_app_diagram.svg";

type HomeScreenStruct = ScreenBaseStruct<{
    props: {
        page: "welcome" | "architecture" | "diagram";
    };

    children: {
        crudScreen: CRUDScreenModel;
        markdownPreview: MarkdownPreviewModel;
    };

    methods: {
        _pageView: () => React.ReactElement;
    }
}>;

type HomeScreenParams = ScreenBaseParams<HomeScreenStruct>;
type HomeScreenModel = ScreenBaseModel<HomeScreenStruct>;

function useHomeScreen(params?: HomeScreenParams): HomeScreenModel {
    const struct: HomeScreenStruct = {
        props: {
            id: useHomeScreen.name,
            cacheable: false,
            page: "welcome"
        },

        children: {
            crudScreen: useCRUDScreen({
                intent: "none",
                breadcrumbs: () => _breadCrumbs(),
                contentView: () => <model._pageView />
            }),

            markdownPreview: useMarkdownPreview({
                source: () => model.page === "welcome" ? welcome : architectureContent
            })
        },

        methods: {
            _pageView: () => {
                switch (model.page) {
                    case "welcome":
                        return (
                            <Block fill padding="large" sx={{ maxWidth: "1200px", margin: "0 auto" }}>
                                <model.markdownPreview.View />
                            </Block>
                        );
                    case "architecture":
                        return (
                            <Block fill padding="large" sx={{ maxWidth: "1200px", margin: "0 auto" }}>
                                <model.markdownPreview.View />
                            </Block>
                        );
                    case "diagram":
                        return (
                            <Col fill horizontalAlign={"center"} overflow={"auto"}>
                                <img
                                    src={diagramSvg}
                                    alt="UECA Application Architecture Diagram"
                                    style={{
                                        maxWidth: "100%",
                                        height: "auto",
                                        display: "block"
                                    }}
                                />
                            </Col>
                        );
                }
            }
        },

        View: () => <model.crudScreen.View />
    };

    const model = useScreenBase(struct, params);
    return model;

    // Private methods
    function _breadCrumbs(): Breadcrumb[] {
        switch (model.page) {
            case "welcome":
                return [
                    { route: { path: "/" }, label: "Home" }
                ];
            case "architecture":
                return [
                    { route: { path: "/" }, label: "Home" },
                    { route: { path: "/home/architecture" }, label: "Architecture Overview" }
                ];
            case "diagram":
                return [
                    { route: { path: "/" }, label: "Home" },
                    { route: { path: "/home/diagram" }, label: "Architecture Diagram" }
                ];
        }
    }
}

const HomeScreen = UECA.getFC(useHomeScreen);

export { HomeScreenModel, useHomeScreen, HomeScreen };

