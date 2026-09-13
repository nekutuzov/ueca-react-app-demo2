import * as UECA from "ueca-react";
import { AnyRoute, UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";
import { AppRoute, OtherLayoutModel, AppLayoutModel, useAppLayout, useOtherLayout } from "@core";

type AppRouterStruct = UIBaseStruct<{
    props: {
        _activeLayout: AppLayoutModel | OtherLayoutModel;
    },

    children: {
        appLayout: AppLayoutModel;
        otherLayout: OtherLayoutModel;
    }
}>;

type AppRouterParams = UIBaseParams<AppRouterStruct>;
type AppRouterModel = UIBaseModel<AppRouterStruct>;

function useAppRouter(params?: AppRouterParams): AppRouterModel {
    const struct: AppRouterStruct = {
        props: {
            id: useAppRouter.name,
            _activeLayout: undefined
        },

        children: {
            appLayout: useAppLayout(),
            otherLayout: useOtherLayout()
        },

        messages: {
            "App.Router.GetRoute": async () => ({ ...model._activeLayout?.route }),

            "App.Router.GoToRoute": async (route) => await _changeRoute(route, true),

            "App.Router.SetRoute": async (route) => await _changeRoute(route, false),

            "App.Router.OpenNewTab": async (route) => await model.bus.unicast("App.BrowsingHistory.Open", { path: route, newTab: true }),

            "App.Router.ResolveRoute": async (route) => await model.bus.unicast("App.BrowsingHistory.ResolveRoute", route),

            "App.Router.SetRouteParams": async (p) => await _setRouteParams(p),

            "App.BrowsingHistory.OnNavigate": async (p) => await _onNavigateBrowsingHistory(p.path, p.section)
        },

        init: async () => {
            await _syncCurrentRoute();
        },

        View: () => {
            return model._activeLayout ? <model._activeLayout.View /> : null
        }
    }

    const model = useUIBase(struct, params);
    return model;

    // Private methods
    async function _changeRoute(route: AppRoute, historyTrack: boolean) {
        route = UECA.clone(route); // Isolate the object to avoid side effects on outside updates

        let newLayout: typeof model._activeLayout;
        if (model.appLayout.lookupRoute(route?.path)) {
            newLayout = model.appLayout;
        } else if (model.otherLayout.lookupRoute(route?.path)) {
            newLayout = model.otherLayout;
        } else {
            // Setup the default screen
            newLayout = model.appLayout;
            route = { path: "/" }
        }

        // BROADCAST, not unicast. The guard has more than one legitimate subscriber — the active
        // CRUDScreen vetoes on unsaved changes, AppTooltipManager just closes the tooltip — and
        // unicast expects exactly one, throwing before it dispatches anything when more answer.
        // (Older ueca-react versions did not check: unicast ran EVERY handler and returned only the
        // first one's result, so whichever subscriber mounted first silently decided the outcome.)
        //
        // Only an explicit `false` vetoes. A subscriber that returns nothing is a subscriber that
        // reacted to the navigation rather than judging it, which is the common case and must not
        // block — testing for truthiness instead would make a plain `return;` in any future handler
        // freeze routing app-wide, with no error to trace it by.
        const answers = await model.bus.broadcast(null, "App.Router.BeforeRouteChange", route);
        if (answers.every((allow) => allow !== false)) {
            if (historyTrack) {
                await model.bus.unicast("App.BrowsingHistory.Open", { path: route });
            } else {
                await model.bus.unicast("App.BrowsingHistory.Replace", { path: route });
            }

            newLayout.route = route;
            model._activeLayout = newLayout;
            await model.bus.broadcast(null, "App.Router.AfterRouteChange", route);
            return true;
        }
        return false;
    }

    // Patches the address of the screen already on show. Everything here writes THROUGH the live
    // route object rather than replacing it: assigning a new route to the layout is what fires the
    // router's onChangeRoute, rebuilds _currentView and tears the mounted screen down. That is the
    // whole difference between this and _changeRoute, and it is why an anchor belongs here.
    async function _setRouteParams(p: { params?: Record<string, unknown>, patch?: boolean, section?: string }) {
        const activeRoute = model._activeLayout?.route as AnyRoute;
        if (!activeRoute) {
            return;
        }
        const route = UECA.clone(activeRoute);
        if (p.params) {
            route.params = p.patch ? { ...route.params, ...p.params } : { ...p.params };
            activeRoute.params = route.params;
        }

        // A section the user moved to is somewhere they chose to go, so it earns a history entry
        // and Back returns to the anchor they left. A param patch is the same view in a different
        // state, so it rewrites the entry it is already on.
        const sectionChanged = "section" in p && p.section !== activeRoute.section;
        if (sectionChanged) {
            route.section = p.section;
            activeRoute.section = p.section;
        }
        await model.bus.unicast(
            sectionChanged ? "App.BrowsingHistory.Open" : "App.BrowsingHistory.Replace",
            { path: route }
        );

        // Announced only for a section, and only because nothing else would say so: the screen is
        // not rebuilt on a patch. A params patch stays silent as it always has - the screens that
        // track a query param already hear about it from the popstate path, and broadcasting here
        // too would fire this at every param write.
        if (sectionChanged) {
            await model.bus.broadcast(null, "App.Router.AfterRouteChange", route as AppRoute);
        }
    }

    // Back and Forward land here. The section travels with the path, so an entry that names an
    // anchor is restored as that anchor — the browser moved the URL, and the route the app acts on
    // says the same thing the URL does.
    async function _onNavigateBrowsingHistory(path: string, section: string) {
        const route = model.appLayout.lookupRoute(path) || model.otherLayout.lookupRoute(path);
        if (!route) {
            // Return, rather than falling through to navigate a second time: the default-screen
            // fallback inside _changeRoute has already handled an unknown path.
            return await _changeRoute(undefined, true);
        }

        // Back and Forward are TRUE NAVIGATION, always - they replay an address the user chose,
        // and the app routes to it like any other. Only an action the app itself takes within the
        // screen on show ("stay here, update the URL") patches instead; that is _setRouteParams,
        // and history traversal is not that.
        //
        // An earlier version short-circuited a section-only Back into a patch to avoid the
        // rebuild. It looked equivalent and was not: the two paths deliver the section at
        // different moments relative to the render.
        return await _changeRoute(_withSection(route, section), true);
    }

    async function _syncCurrentRoute() {
        const { path: activePath, section: activeSection } = await model.bus.unicast("App.BrowsingHistory.GetActiveAddress");
        const otherLayoutRoute = model.otherLayout.lookupRoute(activePath);
        if (otherLayoutRoute) {
            await _changeRoute(otherLayoutRoute, true);
            return;
        }

        // Carrying the section here is what makes a link to an anchor survive being opened cold:
        // the startup Replace rebuilds the URL from this route, and a route that knows its anchor
        // rebuilds it with the anchor still on.
        const appLayoutRoute = model.appLayout.lookupRoute(activePath);
        if (appLayoutRoute) {
            await _changeRoute(_withSection(appLayoutRoute, activeSection), false);
            return;
        } else {
            await _changeRoute(undefined, false);
        }
    }

    function _withSection(route: AppRoute, section: string): AppRoute {
        return section ? { ...route, section } : route;
    }
}

const AppRouter = UECA.getFC(useAppRouter);

export { AppRouterParams, AppRouterModel, useAppRouter, AppRouter }
