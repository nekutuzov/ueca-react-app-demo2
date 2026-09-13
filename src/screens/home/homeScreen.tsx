import * as UECA from "ueca-react";
import { ScreenBaseModel, ScreenBaseParams, ScreenBaseStruct, useScreenBase, Block } from "@components";
import { Breadcrumb, CRUDScreenModel, useCRUDScreen } from "@core";

// Placeholder while the foundation lands; the landing page is rebuilt in the layout phase.
type HomeScreenStruct = ScreenBaseStruct<{
    children: {
        crudScreen: CRUDScreenModel;
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
                breadcrumbs: () => _breadCrumbs(),
                contentView: () => (
                    <Block padding="large">
                        <h1>UECA-React</h1>
                    </Block>
                )
            })
        },

        View: () => <model.crudScreen.View />
    };

    const model = useScreenBase(struct, params);
    return model;

    // Private methods
    function _breadCrumbs(): Breadcrumb[] {
        return [
            { route: { path: "/" }, label: "Home" }
        ];
    }
}

const HomeScreen = UECA.getFC(useHomeScreen);

export { HomeScreenParams, HomeScreenModel, useHomeScreen, HomeScreen };
