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
    // Tokens are substituted after the scheme and host only. Matched over the whole address, the
    // pattern read a port or a mailto: scheme as a ":param" and deleted it: https://host:8443/guide
    // keyed as https://host/guide, and every mailto: route keyed as "mailto".
    const origin = path.match(ROUTE_ORIGIN)?.[0] ?? "";
    return origin + path.slice(origin.length).replace(/:([^/?]+)/g, (_m, name) => String(route.params?.[name] ?? ""));
}

// The scheme and host that start an absolute route ("https://host:8443", "mailto:"), where a colon is
// not a token.
const ROUTE_ORIGIN = /^[a-z][a-z\d+.-]*:(?:\/\/[^/?#]*)?/i;

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

        events: {
            onChangeRoutes: () => {
                model.__regExRoutes = undefined; // reset routes cache
                if (model.route && model.routes && !Reflect.has(model.routes, model.route.path)) {
                    model.route = undefined
                    return;
                }
                // A route the new table still has is drawn from the new table. The view used to be
                // rebuilt only when the route changed, so a surviving route kept rendering the
                // component of the table that was replaced.
                _drawRoute();
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
                _drawRoute();
            }
        },

        // A route present at creation raised no change events — they are suppressed while a model
        // initialises — so it was never vetted against the table and never drawn: the router showed
        // nothing, or held a route it does not have. By mount the route has landed.
        mount: () => {
            if (model.route && !_hasRoute(model.route)) {
                model.route = undefined;
                return;
            }
            _drawRoute();
        },

        View: () => <React.Fragment key={routeKey(model.route)}>{model._currentView}</React.Fragment>
    }

    const _rootURLTag = "/841408C0-C813-4CE9-9CD4-56968B735962/"; // Fake URL base for routes replacing the base. See routes starting with "//"

    const model = useUIBase(struct, params);
    return model;

    // Private methods
    function _hasRoute(route: AnyRoute): boolean {
        return !!model.routes && Reflect.has(model.routes, route.path);
    }

    function _drawRoute() {
        if (!model.route || !model.routes) {
            model._currentView = undefined;
            return;
        }
        const RouteView: RouteComp = model.routes[model.route.path];
        model._currentView = RouteView(model.route.params);
    }

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
            // "^": a route names the whole path, not its tail. Unanchored, "/home" also answered
            // "/retired/home" and "/showcase/controls?from=/home", and an app-relative route answered
            // the tagged form of an origin-root path.
            let regEx = "^";
            const rootParams: Record<string, null | undefined> = {};
            if (!routeUrl.host && !routeUrl.pathname.startsWith("/")) {
                // An address with no host, such as mailto:, is its whole path, matched as written.
                // Built like a URL with a host, the address was dropped as the empty segment before a
                // leading slash, and every mailto: route became /^mailto:\/\/(?:\?|$)/.
                regEx += _escapeRegExp(routeUrl.protocol + routeUrl.pathname);
            } else {
                regEx += routeUrl.host === "_" ? "" : (routeUrl.protocol + "\\/\\/" + routeUrl.host);
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
                if (routeUrl.host !== "_" && routeUrl.pathname === "/" && !r.split("?")[0].endsWith("/")) {
                    // An origin-only address ("https://cranesoft.net") parses with the path "/", which
                    // its key does not have, so the slash is optional — required, the key did not
                    // match itself.
                    regEx += "?";
                }
            }
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

    function _escapeRegExp(text: string): string {
        return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
