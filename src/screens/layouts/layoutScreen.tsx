import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useTab, useUIBase } from "@components";
import { TabsScreenModel, useTabsScreen, Breadcrumb } from "@screens";
import { BlockDemos } from "./blockDemos";
import { RowDemos } from "./rowDemos";
import { ColDemos } from "./colDemos";

type LayoutScreenStruct = UIBaseStruct<{
    children: {
        tabsScreen: TabsScreenModel;
    };
}>;

type LayoutScreenParams = UIBaseParams<LayoutScreenStruct>;
type LayoutScreenModel = UIBaseModel<LayoutScreenStruct>;

function useLayoutScreen(params?: LayoutScreenParams): LayoutScreenModel {
    const struct: LayoutScreenStruct = {
        props: {
            id: useLayoutScreen.name,
        },

        children: {
            tabsScreen: useTabsScreen({
                intent: "none",
                breadcrumbs: [
                    { route: { path: "/" }, label: "Home" },
                    { route: { path: "/layout" }, label: "Layout Components" }
                ] as Breadcrumb[],
                tabs: [
                    useTab({
                        tabId: "block",
                        labelView: "Block",
                        contentView: <BlockDemos />
                    }),
                    useTab({
                        tabId: "row",
                        labelView: "Row",
                        contentView: <RowDemos />
                    }),
                    useTab({
                        tabId: "col",
                        labelView: "Col",
                        contentView: <ColDemos />
                    })
                ],
                selectedTabId: "block"
            })
        },

        View: () => <model.tabsScreen.View />
    };

    const model = useUIBase(struct, params);
    return model;
}

const LayoutScreen = UECA.getFC(useLayoutScreen);

export { LayoutScreenParams, LayoutScreenModel, useLayoutScreen, LayoutScreen };
