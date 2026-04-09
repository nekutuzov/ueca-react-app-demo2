import * as UECA from "ueca-react";
import { Col, UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase, NavItemModel, useNavItem, NavItemExpandableModel, useNavItemExpandable } from "@components";
import { AppRoute } from "@core";
import { HomeIcon, LayoutIcon, ButtonsIcon, InputsIcon, PopupsIcon, NavigationIcon, TabsIcon, MiscIcon, LogoutIcon } from "../misc/icons";

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
        navigationMenuItem: NavItemExpandableModel;
        navLinkMenuItem: NavItemModel;
        navItemMenuItem: NavItemModel;
        tabsMenuItem: NavItemModel;
        miscMenuItem: NavItemModel;
        logoutMenuItem: NavItemModel;
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
            layoutMenuItem: useGroupMenuItem({
                text: "Layout",
                icon: <LayoutIcon />,
                subItems: () => [model.layoutBlockMenuItem, model.layoutRowMenuItem, model.layoutColMenuItem]
            }),
            buttonsMenuItem: useGroupMenuItem({
                text: "Buttons",
                icon: <ButtonsIcon />,
                subItems: () => [model.buttonMenuItem, model.iconButtonMenuItem]
            }),
            inputsMenuItem: useGroupMenuItem({
                text: "Inputs",
                icon: <InputsIcon />,
                subItems: () => [model.textFieldMenuItem, model.selectMenuItem, model.radioGroupMenuItem, model.checkboxMenuItem]
            }),
            popupsMenuItem: useGroupMenuItem({
                text: "Popups",
                icon: <PopupsIcon />,
                subItems: () => [model.dialogMenuItem, model.drawerMenuItem, model.toastMenuItem]
            }),
            navigationMenuItem: useGroupMenuItem({
                text: "Navigation",
                icon: <NavigationIcon />,
                subItems: () => [model.navLinkMenuItem, model.navItemMenuItem]
            }),
            homeMenuItem: useMenuItem({
                text: "Home",
                route: { path: "/home" },
                icon: <HomeIcon />
            }),
            layoutBlockMenuItem: useMenuItem({
                text: "Block",
                route: { path: "/block" }
            }),
            layoutRowMenuItem: useMenuItem({
                text: "Row",
                route: { path: "/row" }
            }),
            layoutColMenuItem: useMenuItem({
                text: "Col",
                route: { path: "/col" }
            }),
            buttonMenuItem: useMenuItem({
                text: "Button",
                route: { path: "/button" }
            }),
            iconButtonMenuItem: useMenuItem({
                text: "IconButton",
                route: { path: "/icon-button" }
            }),
            textFieldMenuItem: useMenuItem({
                text: "TextField",
                route: { path: "/text-field" }
            }),
            selectMenuItem: useMenuItem({
                text: "Select",
                route: { path: "/select" }
            }),
            radioGroupMenuItem: useMenuItem({
                text: "RadioGroup",
                route: { path: "/radio-group" }
            }),
            checkboxMenuItem: useMenuItem({
                text: "Checkbox",
                route: { path: "/checkbox" }
            }),
            dialogMenuItem: useMenuItem({
                text: "Dialog",
                route: { path: "/dialogs" }
            }),
            drawerMenuItem: useMenuItem({
                text: "Drawer",
                route: { path: "/drawer" }
            }),
            toastMenuItem: useMenuItem({
                text: "Toast",
                route: { path: "/toast" }
            }),
            navLinkMenuItem: useMenuItem({
                text: "NavLink",
                route: { path: "/navlink" }
            }),
            navItemMenuItem: useMenuItem({
                text: "NavItem",
                route: { path: "/navitem" }
            }),
            tabsMenuItem: useMenuItem({
                text: "Tabs",
                route: { path: "/tabs?:tab" },
                icon: <TabsIcon />
            }),
            miscMenuItem: useMenuItem({
                text: "Misc",
                route: { path: "/misc" },
                icon: <MiscIcon />
            }),
            logoutMenuItem: useLogoutMenuItem(),
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
                <Col fill verticalAlign="bottom">
                    <model.logoutMenuItem.View />
                </Col>
            </Col>
    }

    const model = useUIBase(struct, params);
    return model;

    //Private methods
    function useMenuItem(params: { text: string; route: AppRoute; icon?: React.ReactNode }): NavItemModel {
        return useNavItem({
            text: params.text,
            route: params.route,
            icon: params.icon,
            active: () => model._activeRoute?.path === params.route.path,
            mode: () => model.iconsOnly ? "icon-only" : "icon-text"
        });
    }

    function useGroupMenuItem(params: { text: string; icon?: React.ReactNode, subItems?: () => NavItemModel[] }): NavItemExpandableModel {
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

    function useLogoutMenuItem(): NavItemModel {
        return useNavItem({
            text: "Logout",
            icon: <LogoutIcon />,
            mode: () => model.iconsOnly ? "icon-only" : "icon-text",
            onClick: async () => {
                await model.bus.unicast("App.Security.Unauthorize", undefined);
            }
        });
    }
}

const AppMenu = UECA.getFC(useAppMenu);

export { AppMenuParams, AppMenuModel, useAppMenu, AppMenu };
