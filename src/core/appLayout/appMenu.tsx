import * as UECA from "ueca-react";
import { Col, UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase, NavItemModel, useNavItem, NavItemExpandableModel, useNavItemExpandable } from "@components";
import { AppRoute } from "@core";

type AppMenuStruct = UIBaseStruct<{
    props: {
        iconsOnly: boolean;
        _activeRoute: AppRoute;
    };

    children: {
        homeMenuItem: NavItemModel;
        layoutMenuItem: NavItemExpandableModel;
        layoutBlockMenuItem: NavItemModel;
        layoutRowMenuItem: NavItemModel;
        layoutColMenuItem: NavItemModel;
        buttonsMenuItem: NavItemExpandableModel;
        buttonMenuItem: NavItemModel;
        iconButtonMenuItem: NavItemModel;
        inputsMenuItem: NavItemExpandableModel;
        textFieldMenuItem: NavItemModel;
        selectMenuItem: NavItemModel;
        radioGroupMenuItem: NavItemModel;
        checkboxMenuItem: NavItemModel;
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
            iconsOnly: false,
            _activeRoute: undefined
        },

        children: {
            layoutMenuItem: _useGroupMenuItem({
                text: "Layout",
                icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z" />
                    </svg>
                ),
                subItems: () => [model.layoutBlockMenuItem, model.layoutRowMenuItem, model.layoutColMenuItem]
            }),
            buttonsMenuItem: _useGroupMenuItem({
                text: "Buttons",
                icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" />
                    </svg>
                ),
                subItems: () => [model.buttonMenuItem, model.iconButtonMenuItem]
            }),
            inputsMenuItem: _useGroupMenuItem({
                text: "Inputs",
                icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                    </svg>
                ),
                subItems: () => [model.textFieldMenuItem, model.selectMenuItem, model.radioGroupMenuItem, model.checkboxMenuItem]
            }),
            homeMenuItem: useNavItem({
                text: "Home",
                route: { path: "/home" },
                icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                    </svg>
                ),
                active: () => model._activeRoute?.path === "/home" || model._activeRoute?.path === "/",
                mode: () => model.iconsOnly ? "icon-only" : "icon-text"
            }),
            layoutBlockMenuItem: _useMenuItem({
                text: "Block",
                route: { path: "/block" }
            }),
            layoutRowMenuItem: _useMenuItem({
                text: "Row",
                route: { path: "/row" }
            }),
            layoutColMenuItem: _useMenuItem({
                text: "Col",
                route: { path: "/col" }
            }),
            buttonMenuItem: _useMenuItem({
                text: "Button",
                route: { path: "/button" }
            }),
            iconButtonMenuItem: _useMenuItem({
                text: "IconButton",
                route: { path: "/icon-button" }
            }),
            textFieldMenuItem: _useMenuItem({
                text: "TextField",
                route: { path: "/text-field" }
            }),
            selectMenuItem: _useMenuItem({
                text: "Select",
                route: { path: "/select" }
            }),
            radioGroupMenuItem: _useMenuItem({
                text: "RadioGroup",
                route: { path: "/radio-group" }
            }),
            checkboxMenuItem: _useMenuItem({
                text: "Checkbox",
                route: { path: "/checkbox" }
            }),
            popupsMenuItem: _useMenuItem({
                text: "Popups",
                route: { path: "/dialogs" },
                icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-8-2h2v-2h-2v2zm0-4h2V7h-2v6z" />
                    </svg>
                )
            }),
            flyoutsMenuItem: _useMenuItem({
                text: "Flyouts",
                route: { path: "/flyouts" },
                icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
                    </svg>
                )
            }),
            navigationMenuItem: _useMenuItem({
                text: "Navigation",
                route: { path: "/navigation" },
                icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
                    </svg>
                )
            }),
            tabsMenuItem: _useMenuItem({
                text: "Tabs",
                route: { path: "/tabs" },
                icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h10v4h8v10z" />
                    </svg>
                )
            }),
            miscMenuItem: _useMenuItem({
                text: "Misc",
                route: { path: "/misc" },
                icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                    </svg>
                )
            }),
        },

        messages: {
            "App.Router.AfterRouteChange": async (route) => {
                model._activeRoute = route;
            },
        },

        init: async () => {
            model._activeRoute = await model.getRoute();
        },

        View: () =>
            <Col id={model.htmlId()} fill overflow={"auto"} padding={{ top: "small" }} spacing={"none"}>
                <model.homeMenuItem.View />
                <model.layoutMenuItem.View />
                <model.buttonsMenuItem.View />
                <model.inputsMenuItem.View />
                <model.popupsMenuItem.View />
                <model.flyoutsMenuItem.View />
                <model.navigationMenuItem.View />
                <model.tabsMenuItem.View />
                <model.miscMenuItem.View />
            </Col>
    }

    const model = useUIBase(struct, params);
    return model;

    //Private methods
    function _useMenuItem(params: { text: string; route: AppRoute; icon?: React.ReactNode }): NavItemModel {
        return useNavItem({
            text: params.text,
            route: params.route,
            icon: params.icon,
            active: () => model._activeRoute?.path === params.route.path,
            mode: () => model.iconsOnly ? "icon-only" : "icon-text"
        });
    }

    function _useGroupMenuItem(params: { text: string; icon?: React.ReactNode, subItems?: () => NavItemModel[] }): NavItemExpandableModel {
        const menuItem = useNavItemExpandable({
            text: params.text,
            icon: params.icon,
            active: () => params.subItems?.().some(item => item.active),
            mode: () => model.iconsOnly ? "icon-only" : "icon-text",
            subItems: params.subItems,
            onChangeActive: (active) => {
                if (active && !model.iconsOnly) {
                    menuItem.expanded = true;
                }
            }
        });
        return menuItem;
    }
}

const AppMenu = UECA.getFC(useAppMenu);

export { AppMenuParams, AppMenuModel, useAppMenu, AppMenu };
