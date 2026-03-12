import * as UECA from "ueca-react";
import { ScreenBaseModel, ScreenBaseParams, ScreenBaseStruct, useScreenBase, TabModel, useTab } from "@components";
import { TabsScreenModel, useTabsScreen, asyncSafe } from "@core";
import { PropertiesTabModel, usePropertiesTab } from "./propertiesTab";
import { TabExamplesModel, useTabExamples } from "./tabExamples";

type TabsComponentScreenStruct = ScreenBaseStruct<{
    props: {
        routeParams: { tab?: string }; // Redeclare routeParams to include 'tab' for route management
    };

    children: {
        tabsScreen: TabsScreenModel;
        propertiesTab: TabModel;
        examplesTab: TabModel;
        propertiesTabContent: PropertiesTabModel;
        examplesTabContent: TabExamplesModel;
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

            examplesTabContent: useTabExamples(),

            propertiesTab: useTab({
                tabId: "properties",
                labelView: "Properties",
                contentView: () => <model.propertiesTabContent.View />
            }),

            examplesTab: useTab({
                tabId: "examples",
                labelView: "Examples",
                contentView: () => <model.examplesTabContent.View />
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
