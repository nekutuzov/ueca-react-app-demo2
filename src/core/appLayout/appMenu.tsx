import * as UECA from "ueca-react";
import { Col, UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase, NavItemModel, useNavItem, NavItemExpandableModel, useNavItemExpandable } from "@components";
import { AppRoute } from "@core";
import { HomeIcon, LayoutIcon, ButtonsIcon, InputsIcon, PopupsIcon, NavigationIcon, TabsIcon, MiscIcon } from "../misc/icons";

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
        popupsMenuItem: NavItemExpandableModel;
        dialogMenuItem: NavItemModel;
        drawerMenuItem: NavItemModel;
        toastMenuItem: NavItemModel;
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
                icon: <LayoutIcon />,
                subItems: () => [model.layoutBlockMenuItem, model.layoutRowMenuItem, model.layoutColMenuItem]
            }),
            buttonsMenuItem: _useGroupMenuItem({
                text: "Buttons",
                icon: <ButtonsIcon />,
                subItems: () => [model.buttonMenuItem, model.iconButtonMenuItem]
            }),
            inputsMenuItem: _useGroupMenuItem({
                text: "Inputs",
                icon: <InputsIcon />,
                subItems: () => [model.textFieldMenuItem, model.selectMenuItem, model.radioGroupMenuItem, model.checkboxMenuItem]
            }),
            popupsMenuItem: _useGroupMenuItem({
                text: "Popups",
                icon: <PopupsIcon />,
                subItems: () => [model.dialogMenuItem, model.drawerMenuItem, model.toastMenuItem]
            }),
            homeMenuItem: useNavItem({
                text: "Home",
                route: { path: "/home" },
                icon: <HomeIcon />,
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
            dialogMenuItem: _useMenuItem({
                text: "Dialog",
                route: { path: "/dialogs" }
            }),
            drawerMenuItem: _useMenuItem({
                text: "Drawer",
                route: { path: "/drawer" }
            }),
            toastMenuItem: _useMenuItem({
                text: "Toast",
                route: { path: "/toast" }
            }),
            navigationMenuItem: _useMenuItem({
                text: "Navigation",
                route: { path: "/navigation" },
                icon: <NavigationIcon />
            }),
            tabsMenuItem: _useMenuItem({
                text: "Tabs",
                route: { path: "/tabs" },
                icon: <TabsIcon />
            }),
            miscMenuItem: _useMenuItem({
                text: "Misc",
                route: { path: "/misc" },
                icon: <MiscIcon />
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
