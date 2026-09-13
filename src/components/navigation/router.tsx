import * as React from "react";
import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";
import { AppURL } from "@core";

type RouterStruct = UIBaseStruct<{
    props: {
        routes: Routing;
        route: AnyRoute;
        _currentView: React.ReactNode;
        __regExRoutes: { regExPath: RegExp, path: string, params: Record<string, unknown>; component: RouteComp }[];
    },

    methods: {
        setPath: (path: string) => boolean;
        lookupRoute: (path: string) => AnyRoute;
    }
}>;

//type RouteComp = (p?: Record<string, any>) => React.ReactNode;
type RouteComp = (params?: Record<string, unknown>) => UECA.ReactElement;

type Routing = Record<string, RouteComp>;

// `section` is an anchor within the page — the fragment of the URL. It sits beside the path rather
// than inside it: lookupRoute matches the path with a regular expression, so a "#id" glued onto the
// path would match no route at all.
type Route<R extends Routing> = {
    [K in keyof R]: { path: K, params?: Parameters<R[K]>[0], section?: string }
}[keyof R];

type AnyRoute = Route<Routing>;

// Canonical route identity: ":seg" path tokens are substituted with their values, query (?:...)
// params are ignored. Two routes are "the same screen" only when these keys match — so a different
// path-segment param (e.g. /users/1 vs /users/2) is a DIFFERENT route (switch the screen model), while a
// query-only change keeps the same screen and just patches its params.
//
// `section` is excluded for the same reason a query is: an anchor names a place WITHIN the screen,
// so moving to one must not tear the screen down and rebuild it at the top.
function routeKey(route: AnyRoute): string {
    if (!route) {
        return "";
    }
    const path = route.path.split("?")[0]; // drop the query pattern; query params don't affect screen identity
    return path.replace(/:([^/?]+)/g, (_m, name) => String(route.params?.[name] ?? ""));
}

type RouterParams = UIBaseParams<RouterStruct>;
type RouterModel = UIBaseModel<RouterStruct>;

function useRouter(params?: RouterParams): RouterModel {
    const struct: RouterStruct = {
        props: {
            id: useRouter.name,
            routes: undefined,
            route: undefined,
            _currentView: undefined
        },

        events: {
            onChangeRoutes: () => {
                model.__regExRoutes = undefined; // reset routes cache
                if (model.route && model.routes && !Reflect.has(model.routes, model.route.path)) {
                    model.route = undefined
                }
            },

            onChangingRoute: (newRoute, oldRoute) => {
                if (newRoute && model.routes && Reflect.has(model.routes, newRoute.path)) {
                    return newRoute;
                }
                if (oldRoute && model.routes && Reflect.has(model.routes, oldRoute.path)) {
                    return oldRoute;
                }
                return undefined;
            },

            onChangeRoute: () => {
                if (!model.route || !model.routes) {
                    model._currentView = undefined;
                    return;
                }
                const RouteView: RouteComp = model.routes[model.route.path];
                model._currentView = RouteView(model.route.params);
                //model._currentView = <RouteView p={model.route.params} />;
            }
        },

        methods: {
            lookupRoute: (path) => {
                if (!path) {
                    return;
                }
                const routeMeta = _getRegExRoute(path);
                return routeMeta.regExRoute ? routeMeta.matchedRoute : undefined;
            },

            setPath: (path) => {
                const route = model.lookupRoute(path)
                if (!route) {
                    return false;
                }
                model.route = route;
                return !!model.route;
            }
        },

        View: () => <React.Fragment key={routeKey(model.route)}>{model._currentView}</React.Fragment>
    }

    const _rootURLTag = "/841408C0-C813-4CE9-9CD4-56968B735962/"; // Fake URL base for routes replacing the base. See routes starting with "//"

    const model = useUIBase(struct, params);
    return model;

    // Private methods
    function _prepareRegExRoutes() {
        if (model.__regExRoutes?.length > 0) {
            return;
        }
        const res: typeof model.__regExRoutes = [];

        for (const r of Object.keys(model.routes)) {
            let url = r;
            if (url.startsWith("//")) {
                url = url.replace("//", _rootURLTag);
            }
            const routeUrl = new AppURL(url);
            let regEx = routeUrl.host === "_" ? "" : (routeUrl.protocol + "\\/\\/" + routeUrl.host);
            const rootParams: Record<string, null | undefined> = {};
            const pathParts = routeUrl.pathname.split("/");
            pathParts.splice(0, 1);
            pathParts.map(pathPart => {
                const p = pathPart.split(":");
                if (p.length > 1) {
                    pathPart = p[0] + "([^/?]+)";
                    rootParams[p[1]] = null; // use null for tagging a dynamic path parameter
                }
                regEx += "\\/" + pathPart;
            });
            regEx += "(?:\\?|$)";

            routeUrl.searchParams.forEach((_, key) => {
                if (key.startsWith(":")) {
                    rootParams[key.slice(1)] = undefined;  // a search param
                }
            });

            res.push({ regExPath: new RegExp(regEx, "i"), path: r, params: rootParams, component: model.routes[r] });
        }
        model.__regExRoutes = res;
    }

    function _getRegExRoute(path: string) {
        _prepareRegExRoutes();

        const matchedRoute: AnyRoute = {
            path: path,
            params: undefined
        };

        // Match the route and assign param values
        let regExPath = path;
        if (regExPath.startsWith("//")) {
            regExPath = regExPath.replace("//", _rootURLTag);
        }
        const regExRoute = model.__regExRoutes.find(r => r.regExPath.test(regExPath));
        if (regExRoute) {
            if (regExRoute.params) {
                // Assign values to dynamic path params.
                const dynPathValues: Array<string> = regExRoute.regExPath.exec(regExPath);
                dynPathValues.splice(0, 1);

                // The parameters mached by their position detected by regExPath
                matchedRoute.params = {};
                Object.keys(regExRoute.params).filter(x => regExRoute.params[x] === null).forEach((p, i) => matchedRoute.params[p] = dynPathValues[i]);

                // Read and assign URL search params     
                const url = new AppURL(regExPath);
                Object.keys(regExRoute.params).filter(x => regExRoute.params[x] === undefined).forEach(p => url.searchParams.has(p) && (matchedRoute.params[p] = url.searchParams.get(p)));
            }
            matchedRoute.path = regExRoute.path;
            if (matchedRoute.path.startsWith(_rootURLTag)) {
                matchedRoute.path = matchedRoute.path.replace(_rootURLTag, "//");
            }
        }

        return { regExRoute, matchedRoute };
    }
}

const Router = UECA.getFC(useRouter);

export { Routing, Route, AnyRoute, RouterModel, RouterParams, useRouter, Router, routeKey }
