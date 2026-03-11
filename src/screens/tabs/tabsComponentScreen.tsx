import * as UECA from "ueca-react";
import { ScreenBaseModel, ScreenBaseParams, ScreenBaseStruct, useScreenBase, Col, Block, TabModel, useTab } from "@components";
import { TabsScreenModel, useTabsScreen, asyncSafe } from "@core";
import { PropertiesTabModel, usePropertiesTab } from "./propertiesTab";

type TabsComponentScreenStruct = ScreenBaseStruct<{
    props: {
        routeParams: { tab?: string }; // Redeclare routeParams to include 'tab' for route management
    };

    children: {
        tabsScreen: TabsScreenModel;
        propertiesTab: TabModel;
        examplesTab: TabModel;
        propertiesTabContent: PropertiesTabModel;
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
            tabsScreen: useTabsScreen({
                intent: "none",
                breadcrumbs: [
                    { route: { path: "/" }, label: "Home" },
                    { route: { path: "/tabs?:tab" }, label: "Tabs Components" }
                ],
                tabs: () => [model.propertiesTab, model.examplesTab],
                selectedTabId: UECA.bind(() => model.routeParams, "tab"),
                onChangeSelectedTabId: (tab) => asyncSafe(async () => await model.updateRouteParams({ tab }, true)) // Update route params when tab changes, using patch to preserve other params
            }),

            propertiesTabContent: usePropertiesTab(),

            propertiesTab: useTab({
                tabId: "properties",
                labelView: "Properties",
                contentView: () => <model.propertiesTabContent.View />
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

        init: async () => {
            await model.updateRouteParams({ tab: model.tabsScreen.selectedTabId }); // Ensure route params are in sync with the screen state on initial load
        },

        View: () => <model.tabsScreen.View />
    }

    const model = useScreenBase(struct, params);
    return model;
}

const TabsComponentScreen = UECA.getFC(useTabsComponentScreen);

export { TabsComponentScreenParams, TabsComponentScreenModel, useTabsComponentScreen, TabsComponentScreen };
