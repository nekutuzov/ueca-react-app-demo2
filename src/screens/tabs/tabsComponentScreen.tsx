import * as UECA from "ueca-react";
import { ScreenBaseModel, ScreenBaseParams, ScreenBaseStruct, useScreenBase, Col, Block, TabModel, useTab } from "@components";
import { TabsScreenModel, useTabsScreen, Breadcrumb, asyncSafe } from "@core";

type TabsComponentScreenStruct = ScreenBaseStruct<{
    props: {
        routeParams: { tab?: string };
    };

    children: {
        tabsScreen: TabsScreenModel;
        propertiesTab: TabModel;
        examplesTab: TabModel;
    };
}>;

type TabsComponentScreenParams = ScreenBaseParams<TabsComponentScreenStruct>;
type TabsComponentScreenModel = ScreenBaseModel<TabsComponentScreenStruct>;

function useTabsComponentScreen(params?: TabsComponentScreenParams): TabsComponentScreenModel {
    const struct: TabsComponentScreenStruct = {
        props: {
            id: useTabsComponentScreen.name,
            routeParams: { tab: "properties" }
        },

        children: {
            tabsScreen: useTabsScreen({
                intent: "none",
                breadcrumbs: [
                    { route: { path: "/" }, label: "Home" },
                    { route: { path: "/tabs" }, label: "Tabs Components" }
                ] as Breadcrumb[],
                tabs: () => [model.propertiesTab, model.examplesTab],
                selectedTabId: UECA.bind(() => model.routeParams, "tab"),
                onChangeSelectedTabId: (tab) => asyncSafe(async () => await model.updateRouteParams({ tab }, true))
            }),

            propertiesTab: useTab({
                tabId: "properties",
                labelView: "Properties",
                contentView: () => (
                    <Col fill overflow="auto" padding="medium">
                        <Block>
                            <h2>Properties</h2>
                            <p>Properties editor coming soon...</p>
                        </Block>
                    </Col>
                )
            }),

            examplesTab: useTab({
                tabId: "examples",
                labelView: "Examples",
                contentView: () => (
                    <Col fill overflow="auto" padding="medium">
                        <Block>
                            <h2>Examples</h2>
                            <p>Examples coming soon...</p>
                        </Block>
                    </Col>
                )
            })
        },

        View: () => <model.tabsScreen.View />
    }

    const model = useScreenBase(struct, params);
    return model;
}

const TabsComponentScreen = UECA.getFC(useTabsComponentScreen);

export { TabsComponentScreenParams, TabsComponentScreenModel, useTabsComponentScreen, TabsComponentScreen };
