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

            "App.Router.SetRouteParams": async (p) => await _setRouteParams(p.params, p.patch),

            "App.BrowsingHistory.OnNavigate": async (path) => await _onNavigateBrowsingHistory(path)
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

        const allowRoute = await model.bus.unicast("App.Router.BeforeRouteChange", route);
        if (UECA.isUndefined(allowRoute) || allowRoute) {
            if (historyTrack) {
                await model.bus.unicast("App.BrowsingHistory.Open", { path: route });
            } else {
                await model.bus.unicast("App.BrowsingHistory.Replace", { path: route });
            }

            newLayout.route = route;
            model._activeLayout = newLayout;
            await model.bus.unicast("App.Router.AfterRouteChange", route);
            return true;
        }
        return false;
    }

    async function _setRouteParams(params: Record<string, unknown>, patch: boolean) {
        // Generic method to update route params for the current active layout's route
        const route = UECA.clone(model._activeLayout.route as AnyRoute);
        if (!route) {
            return;
        }
        if (patch) {
            route.params = { ...route.params, ...params };
        } else {
            route.params = { ...params }; // TODO: unnecessery? remove?
        }
        (model._activeLayout.route as AnyRoute).params = route.params;
        await model.bus.unicast("App.BrowsingHistory.Replace", { path: route });
    }

    async function _onNavigateBrowsingHistory(path: string) {
        const route = model.appLayout.lookupRoute(path) || model.otherLayout.lookupRoute(path);
        if (!route) {
            await _changeRoute(undefined, true);
        }
        return await _changeRoute(route, true);
    }

    async function _syncCurrentRoute() {
        const activePath = await model.bus.unicast("App.BrowsingHistory.GetActivePath", undefined);
        const otherLayoutRoute = model.otherLayout.lookupRoute(activePath);
        if (otherLayoutRoute) {
            _changeRoute(otherLayoutRoute, true);
            return;
        }

        const appLayoutRoute = model.appLayout.lookupRoute(activePath);
        if (appLayoutRoute) {
            _changeRoute(appLayoutRoute, false);
            return;
        } else {
            _changeRoute(undefined, false);
        }
    }
}

const AppRouter = UECA.getFC(useAppRouter);

export { AppRouterParams, AppRouterModel, useAppRouter, AppRouter }
