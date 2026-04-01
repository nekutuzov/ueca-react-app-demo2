import * as UECA from "ueca-react";
import { ScreenBaseModel, ScreenBaseParams, ScreenBaseStruct, useScreenBase, Block, useMarkdownPreview } from "@components";
import { CRUDScreenModel, useCRUDScreen } from "@core";
import architectureContent from "./architecture.md?raw";

type HomeScreenStruct = ScreenBaseStruct<{
    children: {
        crudScreen: CRUDScreenModel;
        markdownPreview: ReturnType<typeof useMarkdownPreview>;
    };
}>;

type HomeScreenParams = ScreenBaseParams<HomeScreenStruct>;
type HomeScreenModel = ScreenBaseModel<HomeScreenStruct>;

function useHomeScreen(params?: HomeScreenParams): HomeScreenModel {
    const struct: HomeScreenStruct = {
        props: {
            id: useHomeScreen.name
        },

        children: {
            crudScreen: useCRUDScreen({
                intent: "none",
                breadcrumbs: [
                    { route: { path: "/" }, label: "Home" }
                ],
                contentView: () => (
                    <Block fill padding="large" sx={{ maxWidth: "1200px", margin: "0 auto" }}>
                        <model.markdownPreview.View />
                    </Block>
                )
            }),

            markdownPreview: useMarkdownPreview({
                source: architectureContent
            })
        },   

        View: () => <model.crudScreen.View />
    };

    const model = useScreenBase(struct, params);
    return model;
}

const HomeScreen = UECA.getFC(useHomeScreen);

export { HomeScreenModel, useHomeScreen, HomeScreen };

