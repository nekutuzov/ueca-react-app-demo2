import * as UECA from "ueca-react";
import { Col, UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase, NavItemModel, useNavItem } from "@components";
import { AppRoute, runAsync } from "@core";
import { HomeIcon } from "../misc/icons";
import "./appMenu.css";

type AppMenuStruct = UIBaseStruct<{
    props: {
        iconsOnly: boolean;
        _activeRoute: AppRoute;
        __revealedPath: string;
    };

    children: {
        homeMenuItem: NavItemModel;
    }
}>;

type AppMenuParams = UIBaseParams<AppMenuStruct>;
type AppMenuModel = UIBaseModel<AppMenuStruct>;

function useAppMenu(params?: AppMenuParams): AppMenuModel {
    const struct: AppMenuStruct = {
        props: {
            id: useAppMenu.name,
            iconsOnly: false,
            _activeRoute: undefined,
            // Non-reactive: the path the rail has already been scrolled to, so a re-render for
            // any other reason does not keep hauling the reader's scroll position back.
            __revealedPath: undefined
        },

        children: {
            homeMenuItem: useMenuItem({
                text: "Home",
                route: { path: "/home" },
                icon: <HomeIcon />
            })
        },

        messages: {
            "App.Router.AfterRouteChange": async (route) => {
                model._activeRoute = route;
                runAsync(() => _revealActiveItem());
            },
        },

        init: async () => {
            model._activeRoute = await model.getRoute();
            runAsync(() => _revealActiveItem());
        },

        // overflow is visible on purpose: the sidebar's scroll wrapper is the single scroller,
        // and a second one here would nest two scrollbars in the same rail.
        View: () =>
            <Col id={model.htmlId()} fill overflow={"visible"} padding={{ top: "small" }} spacing={"none"}>
                <model.homeMenuItem.View />
            </Col>
    };

    const model = useUIBase(struct, params);
    return model;

    // Private methods

    // Every leaf item, in rail order — what _revealActiveItem searches for the active one.
    function _allItems(): NavItemModel[] {
        return [model.homeMenuItem];
    }

    // Keeps the active item in sight after a deep link or a jump from elsewhere in the app.
    //
    // Called a tick late, on purpose. The items re-render from _activeRoute, and until they have,
    // the item reading as active is still the one being left. There is no draw of this
    // component's own to hook either: AppMenu's View never reads _activeRoute - only the children's
    // `active` bindings do - so AppMenu itself does not re-render when the route changes.
    function _revealActiveItem() {
        const path = model._activeRoute?.path;
        if (!path || path === model.__revealedPath) {
            return;
        }
        const item = _allItems().find((i) => i.active);
        const el = item ? document.getElementById(item.htmlId()) : undefined;
        const rail = el?.closest(".app-sidebar-scroll") as HTMLElement;
        if (!el || !rail) {
            return;
        }
        model.__revealedPath = path;

        // Move the rail itself, never scrollIntoView: that walks every scrollable ancestor and
        // drags the app shell along with it. And only when the item is actually outside - a click
        // on an item already on screen should leave the rail exactly where the reader left it.
        const itemRect = el.getBoundingClientRect();
        const railRect = rail.getBoundingClientRect();
        const margin = 12;
        if (itemRect.top < railRect.top + margin) {
            rail.scrollTop -= railRect.top + margin - itemRect.top;
        } else if (itemRect.bottom > railRect.bottom - margin) {
            rail.scrollTop += itemRect.bottom - railRect.bottom + margin;
        }
    }

    function useMenuItem(params: { text: string; route: AppRoute; icon?: React.ReactNode }): NavItemModel {
        return useNavItem({
            text: params.text,
            route: params.route,
            icon: params.icon,
            active: () => model._activeRoute?.path === params.route.path || params.route.path === "/home" && model._activeRoute?.path === "/",
            mode: () => model.iconsOnly ? "icon-only" : "icon-text"
        });
    }
}

const AppMenu = UECA.getFC(useAppMenu);

export { AppMenuParams, AppMenuModel, useAppMenu, AppMenu };
