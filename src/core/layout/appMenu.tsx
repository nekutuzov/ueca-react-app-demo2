import * as UECA from "ueca-react";
import { Col, UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase, NavItemModel, useNavItem } from "@components";
import { AppRoute } from "@core";

type AppMenuStruct = UIBaseStruct<{
    props: {
        iconsOnly: boolean;
    };

    children: {
        homeMenuItem: NavItemModel;
        layoutMenuItem: NavItemModel;
        buttonsMenuItem: NavItemModel;
        selectMenuItem: NavItemModel;
        radioGroupMenuItem: NavItemModel;
    }
}>;

type AppMenuParams = UIBaseParams<AppMenuStruct>;
type AppMenuModel = UIBaseModel<AppMenuStruct>;

function useAppMenu(params?: AppMenuParams): AppMenuModel {
    const struct: AppMenuStruct = {
        props: {
            id: useAppMenu.name,
            iconsOnly: false
        },

        children: {
            homeMenuItem: useNavItem({
                text: "Home",
                route: { path: "/home" },
                icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                    </svg>
                ),
                mode: () => model.iconsOnly ? "icon-only" : "icon-text"
            }),
            layoutMenuItem: useNavItem({
                text: "Layout",
                route: { path: "/layout" },
                icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z"/>
                    </svg>
                ),
                mode: () => model.iconsOnly ? "icon-only" : "icon-text"
            }),
            buttonsMenuItem: useNavItem({
                text: "Buttons",
                route: { path: "/buttons" },
                icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
                    </svg>
                ),
                mode: () => model.iconsOnly ? "icon-only" : "icon-text"
            }),
            selectMenuItem: useNavItem({
                text: "Select",
                route: { path: "/select" },
                icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7 10l5 5 5-5z"/>
                        <path d="M3 3h18v2H3V3zm0 16h18v2H3v-2zm0-8h18v2H3v-2z"/>
                    </svg>
                ),
                mode: () => model.iconsOnly ? "icon-only" : "icon-text"
            }),
            radioGroupMenuItem: useNavItem({
                text: "RadioGroup",
                route: { path: "/radio-group" },
                icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                        <circle cx="12" cy="12" r="5"/>
                    </svg>
                ),
                mode: () => model.iconsOnly ? "icon-only" : "icon-text"
            }),
        },

        messages: {
            "App.Router.AfterRouteChange": async (route) => _syncActiveMenu(route),
        },

        init: async () => {
            const route = await model.getRoute();
            _syncActiveMenu(route);
        },

        View: () =>
            <Col id={model.htmlId()} fill overflow={"auto"} padding={{ top: "small" }} spacing={"none"}>
                <model.homeMenuItem.View />
                <model.layoutMenuItem.View />
                <model.buttonsMenuItem.View />
                <model.selectMenuItem.View />
                <model.radioGroupMenuItem.View />
            </Col>
    }

    const model = useUIBase(struct, params);
    return model;

    // Private methods
    function _syncActiveMenu(route: AppRoute) {
        // Directly access child menu items
        const menuItems = [model.homeMenuItem, model.layoutMenuItem, model.buttonsMenuItem, model.selectMenuItem, model.radioGroupMenuItem];
        menuItems.forEach(menuItem => {
            if (menuItem && menuItem.route) {
                menuItem.active = route?.path?.startsWith(menuItem.route.path);
            }
        });
    }
}

const AppMenu = UECA.getFC(useAppMenu);

export { AppMenuParams, AppMenuModel, useAppMenu, AppMenu };
