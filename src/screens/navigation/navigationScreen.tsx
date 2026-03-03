import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase, Col, Block } from "@components";
import { CRUDScreenModel, useCRUDScreen, Breadcrumb } from "@screens";

type NavigationScreenStruct = UIBaseStruct<{
    props: {};
    children: {
        crudScreen: CRUDScreenModel;
    };
}>;

type NavigationScreenParams = UIBaseParams<NavigationScreenStruct>;
type NavigationScreenModel = UIBaseModel<NavigationScreenStruct>;

function useNavigationScreen(params?: NavigationScreenParams): NavigationScreenModel {
    const struct: NavigationScreenStruct = {
        props: {
            id: useNavigationScreen.name,
        },

        children: {
            crudScreen: useCRUDScreen({
                intent: "none",
                breadcrumbs: [
                    { route: { path: "/" }, label: "Home" },
                    { route: { path: "/navigation" }, label: "Navigation Components" }
                ] as Breadcrumb[],
                contentView: () => (
                    <Col fill overflow={"auto"} padding={"medium"}>
                        <Block>
                            <h1>Navigation Components</h1>
                            <p>Demonstration screens coming soon...</p>
                        </Block>
                    </Col>
                )
            })
        },

        View: () => <model.crudScreen.View />
    }

    const model = useUIBase(struct, params);
    return model;
}

const NavigationScreen = UECA.getFC(useNavigationScreen);

export { NavigationScreenParams, NavigationScreenModel, useNavigationScreen, NavigationScreen };
