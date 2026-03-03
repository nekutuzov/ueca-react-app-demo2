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
        textFieldMenuItem: NavItemModel;
        selectMenuItem: NavItemModel;
        radioGroupMenuItem: NavItemModel;
        popupsMenuItem: NavItemModel;
        flyoutsMenuItem: NavItemModel;
        navigationMenuItem: NavItemModel;
        tabsMenuItem: NavItemModel;
        miscMenuItem: NavItemModel;
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
                route: { path: "/button" },
                icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
                    </svg>
                ),
                mode: () => model.iconsOnly ? "icon-only" : "icon-text"
            }),
            textFieldMenuItem: useNavItem({
                text: "TextField",
                route: { path: "/text-field" },
                icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M5 4v3h5.5v12h3V7H19V4z"/>
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
            popupsMenuItem: useNavItem({
                text: "Popups",
                route: { path: "/popups" },
                icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-8-2h2v-2h-2v2zm0-4h2V7h-2v6z"/>
                    </svg>
                ),
                mode: () => model.iconsOnly ? "icon-only" : "icon-text"
            }),
            flyoutsMenuItem: useNavItem({
                text: "Flyouts",
                route: { path: "/flyouts" },
                icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                    </svg>
                ),
                mode: () => model.iconsOnly ? "icon-only" : "icon-text"
            }),
            navigationMenuItem: useNavItem({
                text: "Navigation",
                route: { path: "/navigation" },
                icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
                    </svg>
                ),
                mode: () => model.iconsOnly ? "icon-only" : "icon-text"
            }),
            tabsMenuItem: useNavItem({
                text: "Tabs",
                route: { path: "/tabs" },
                icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h10v4h8v10z"/>
                    </svg>
                ),
                mode: () => model.iconsOnly ? "icon-only" : "icon-text"
            }),
            miscMenuItem: useNavItem({
                text: "Misc",
                route: { path: "/misc" },
                icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
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
                <model.textFieldMenuItem.View />
                <model.selectMenuItem.View />
                <model.radioGroupMenuItem.View />
                <model.popupsMenuItem.View />
                <model.flyoutsMenuItem.View />
                <model.navigationMenuItem.View />
                <model.tabsMenuItem.View />
                <model.miscMenuItem.View />
            </Col>
    }

    const model = useUIBase(struct, params);
    return model;

    // Private methods
    function _syncActiveMenu(route: AppRoute) {
        // Directly access child menu items
        const menuItems = [
            model.homeMenuItem, 
            model.layoutMenuItem, 
            model.buttonsMenuItem, 
            model.textFieldMenuItem,
            model.selectMenuItem, 
            model.radioGroupMenuItem,
            model.popupsMenuItem,
            model.flyoutsMenuItem,
            model.navigationMenuItem,
            model.tabsMenuItem,
            model.miscMenuItem
        ];
        menuItems.forEach(menuItem => {
            if (menuItem && menuItem.route) {
                menuItem.active = route?.path?.startsWith(menuItem.route.path);
            }
        });
    }
}

const AppMenu = UECA.getFC(useAppMenu);

export { AppMenuParams, AppMenuModel, useAppMenu, AppMenu };
