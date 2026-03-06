import * as UECA from "ueca-react";
import { ScreenBaseModel, ScreenBaseParams, ScreenBaseStruct, useScreenBase, Col, Block } from "@components";
import { CRUDScreenModel, useCRUDScreen, Breadcrumb } from "@core";

type TabsComponentScreenStruct = ScreenBaseStruct<{
    props: {};
    children: {
        crudScreen: CRUDScreenModel;
    };
}>;

type TabsComponentScreenParams = ScreenBaseParams<TabsComponentScreenStruct>;
type TabsComponentScreenModel = ScreenBaseModel<TabsComponentScreenStruct>;

function useTabsComponentScreen(params?: TabsComponentScreenParams): TabsComponentScreenModel {
    const struct: TabsComponentScreenStruct = {
        props: {
            id: useTabsComponentScreen.name,
        },

        children: {
            crudScreen: useCRUDScreen({
                intent: "none",
                breadcrumbs: [
                    { route: { path: "/" }, label: "Home" },
                    { route: { path: "/tabs" }, label: "Tabs Components" }
                ] as Breadcrumb[],
                contentView: () => (
                    <Col fill overflow={"auto"} padding={"medium"}>
                        <Block>
                            <h1>Tabs Components</h1>
                            <p>Demonstration screens coming soon...</p>
                        </Block>
                    </Col>
                )
            })
        },

        View: () => <model.crudScreen.View />
    }

    const model = useScreenBase(struct, params);
    return model;
}

const TabsComponentScreen = UECA.getFC(useTabsComponentScreen);

export { TabsComponentScreenParams, TabsComponentScreenModel, useTabsComponentScreen, TabsComponentScreen };
