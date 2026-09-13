import * as UECA from "ueca-react";
import {
    Col, Icon, UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase, NavItemModel, useNavItem,
    NavItemExpandableModel, useNavItemExpandable
} from "@components";
import { AppRoute, IconName, runAsync } from "@core";
import { SHOWCASE_TOPICS, ShowcaseTopicKey, showcaseTopic } from "@screens";
import "./appMenu.css";

type AppMenuStruct = UIBaseStruct<{
    props: {
        iconsOnly: boolean;
        _activeRoute: AppRoute;
        __revealedPath: string;
    };

    children: {
        homeMenuItem: NavItemModel;

        showcaseMenuItem: NavItemExpandableModel;
        overviewMenuItem: NavItemModel;
        tokensMenuItem: NavItemModel;
        layoutMenuItem: NavItemModel;
        controlsMenuItem: NavItemModel;
        statusMenuItem: NavItemModel;
        iconsMenuItem: NavItemModel;
        overlaysMenuItem: NavItemModel;
        dataMenuItem: NavItemModel;
        listsMenuItem: NavItemModel;
        dynamicMenuItem: NavItemModel;
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
                icon: "home"
            }),

            showcaseMenuItem: useGroupMenuItem({
                text: "Showcase",
                icon: "grid",
                expanded: true,
                subItems: () => _showcaseItems()
            }),
            overviewMenuItem: useTopicMenuItem("overview"),
            tokensMenuItem: useTopicMenuItem("tokens"),
            layoutMenuItem: useTopicMenuItem("layout"),
            controlsMenuItem: useTopicMenuItem("controls"),
            statusMenuItem: useTopicMenuItem("status"),
            iconsMenuItem: useTopicMenuItem("icons"),
            overlaysMenuItem: useTopicMenuItem("overlays"),
            dataMenuItem: useTopicMenuItem("data"),
            listsMenuItem: useTopicMenuItem("lists"),
            dynamicMenuItem: useTopicMenuItem("dynamic")
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
                <model.showcaseMenuItem.View />
            </Col>
    };

    const model = useUIBase(struct, params);
    return model;

    // Private methods

    // The showcase items in the order the topic list gives them. Checked against the list itself,
    // so a topic added there without a menu child fails loudly here instead of silently vanishing.
    function _showcaseItems(): NavItemModel[] {
        const byKey: Record<ShowcaseTopicKey, NavItemModel> = {
            overview: model.overviewMenuItem,
            tokens: model.tokensMenuItem,
            layout: model.layoutMenuItem,
            controls: model.controlsMenuItem,
            status: model.statusMenuItem,
            icons: model.iconsMenuItem,
            overlays: model.overlaysMenuItem,
            data: model.dataMenuItem,
            lists: model.listsMenuItem,
            dynamic: model.dynamicMenuItem
        };
        return SHOWCASE_TOPICS.map((t) => byKey[t.key]);
    }

    // Every leaf item, in rail order — what _revealActiveItem searches for the active one.
    function _allItems(): NavItemModel[] {
        return [model.homeMenuItem, ..._showcaseItems()];
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

    function useMenuItem(params: { text: string; route: AppRoute; icon: IconName }): NavItemModel {
        return useNavItem({
            text: params.text,
            route: params.route,
            icon: <Icon name={params.icon} size="lg" />,
            active: () => model._activeRoute?.path === params.route.path || params.route.path === "/home" && model._activeRoute?.path === "/",
            mode: () => model.iconsOnly ? "icon-only" : "icon-text"
        });
    }

    function useTopicMenuItem(key: ShowcaseTopicKey): NavItemModel {
        const topic = showcaseTopic(key);
        return useMenuItem({
            text: topic.title,
            route: { path: topic.path } as AppRoute,
            icon: topic.icon
        });
    }

    function useGroupMenuItem(params: { text: string; icon: IconName, subItems?: () => NavItemModel[], expanded?: boolean }): NavItemExpandableModel {
        const menuItem = useNavItemExpandable({
            text: params.text,
            icon: <Icon name={params.icon} size="lg" />,
            expanded: params.expanded,
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
