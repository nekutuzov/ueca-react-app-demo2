import * as UECA from "ueca-react";
import { Col, UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase, NavItemModel, useNavItem } from "@components";
import { AppRoute } from "@core";

type AppMenuStruct = UIBaseStruct<{
    props: {
        iconsOnly: boolean;
    };

    children: {
        homeMenuItem: NavItemModel;
        buttonsMenuItem: NavItemModel;
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
                <model.buttonsMenuItem.View />
            </Col>
    }

    const model = useUIBase(struct, params);
    return model;

    // Private methods
    function _syncActiveMenu(route: AppRoute) {
        // Directly access child menu items
        const menuItems = [model.homeMenuItem, model.buttonsMenuItem];
        menuItems.forEach(menuItem => {
            if (menuItem && menuItem.route) {
                menuItem.active = route?.path?.startsWith(menuItem.route.path);
            }
        });
    }
}

const AppMenu = UECA.getFC(useAppMenu);

export { AppMenuParams, AppMenuModel, useAppMenu, AppMenu };
