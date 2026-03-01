import * as UECA from "ueca-react";
import { BaseModel, BaseParams, BaseStruct, useBase, AnyRoute } from "@components";
import { asyncSafe, runAsync } from "./appUtils";

type AppBrowsingHistoryStruct = BaseStruct<{
    props: {
        __activePath: string;
        __baseURL: string;
        __appTitle: string;
        __currentHistoryIndex: number;
    },

    methods: {
        getActivePath: () => string;
        syncWithBrowser: () => void;
        open: (route: AnyRoute | string, newTab?: boolean) => Promise<void>;
        replace: (route: AnyRoute | string) => Promise<void>;
    }
}>;

type AppBrowsingHistoryModel = BaseModel<AppBrowsingHistoryStruct>;

function useAppBrowsingHistory(params?: BaseParams<AppBrowsingHistoryStruct>): AppBrowsingHistoryModel {
    const struct: AppBrowsingHistoryStruct = {
        props: {
            id: useAppBrowsingHistory.name
        },

        messages: {
            "App.BrowsingHistory.GetActivePath": async () => model.getActivePath(),

            "App.BrowsingHistory.Open": async (p) => await model.open(p.path, p.newTab),

            "App.BrowsingHistory.Replace": async (p) => await model.replace(p.path)
        },

        methods: {
            getActivePath: () => model.__activePath,

            syncWithBrowser: () => {
                // Set initial history index (the top of the list)
                model.__currentHistoryIndex = window.history.state?.index ?? 1;
                history.replaceState({ index: model.__currentHistoryIndex }, "", window.location.href);

                // Setup the browser's navigation interceptor
                const baseElement = document.getElementsByTagName("base")[0];
                if (baseElement) {
                    let baseURL = baseElement.getAttribute("href");
                    if (baseURL?.endsWith("/")) {
                        baseURL = baseURL.slice(0, -1);
                    }
                    model.__baseURL = baseURL;
                } else {
                    console.info("<base> element is missing in index.html. Using empty string as base URL.");  
                    model.__baseURL = "";
                }  
                window.addEventListener("popstate", () => asyncSafe(async () => await _browserNavigation()));
                _syncCurrentPath();
            },

            open: async (route, newTab) => {
                if (UECA.isObject(route)) {
                    route = _routeToURL(route);
                }
                if (newTab) {
                    window.open(route, "_blank");
                    return;
                }
                await _navigate(route);
            },

            replace: async (route) => {
                if (UECA.isObject(route)) {
                    route = _routeToURL(route);
                }
                history.replaceState({ index: history.state.index }, "", route);
                // history.state isn't ready yet due to async logic
                runAsync(() => { model.__currentHistoryIndex = history.state.index });
                _syncCurrentPath();
            }
        },

        init: async () => {
            const appInfo = await model.bus.unicast("App.GetInfo", undefined);
            model.__appTitle = appInfo?.appName;
            model.syncWithBrowser();
        }
    }

    const model = useBase(struct, params);
    return model;

    // Private methods
    function _syncCurrentPath() {
        if (!window.location.pathname.startsWith(model.__baseURL)) {
            model.__activePath = "";
            return;
        }
        const path = window.location.pathname.substring(model.__baseURL.length);
        model.__activePath = path + decodeURIComponent(window.location.search);
        window.document.title = path ? `${model.__appTitle}: ${path}` : model.__appTitle;
    }

    async function _browserNavigation() {
        const state_index = history.state.index;
        if (model.__currentHistoryIndex === state_index) {
            let path = window.location.pathname.substring(model.__baseURL.length);
            path = path + decodeURIComponent(window.location.search);
            if (path === model.__activePath) {
                return;
            }
            console.warn("Unexpected condition: AppBrowsingHistory._browserNavigation()");
        }

        let path = window.location.pathname.substring(model.__baseURL.length);
        path = path + decodeURIComponent(window.location.search);
        const allowThisPath = await model.bus.unicast("App.BrowsingHistory.OnNavigate", path);
        if (UECA.isUndefined(allowThisPath) || allowThisPath) {
            model.__currentHistoryIndex = state_index;
            _syncCurrentPath();
        } else {
            const rollbackDelta = model.__currentHistoryIndex - state_index;
            history.go(rollbackDelta);
        }
    }

    function _routeToURL(route: AnyRoute): string {
        if (!route?.path) {
            return "";
        }

        let url: URL;

        if (!route.path.startsWith("/")) {
            // Other origin URL
            url = new URL(route.path);
        } else if (route.path.startsWith("//")) {
            // Current origin new base URL
            url = new URL(route.path.substring(2), window.location.origin);
        } else {
            // Current origin current base URL
            url = new URL(model.__baseURL + route.path, window.location.origin);
        }
        const routeParams = UECA.clone(route.params);

        // Process dynamic path params
        const parts = url.pathname.split("/");
        parts.map((p, i) => {
            if (p.startsWith(":")) {
                p = p.replace(':', "");
                parts[i] = UECA.isUndefined(routeParams[p]) ? undefined : routeParams[p].toString();
                if (parts[i] == null) {
                    throw Error(`URL parameter "${p}" cannot be null`);
                }
                delete routeParams[p];
            }
        });
        url.pathname = parts.join("/"); // update dynamic path with processed path

        // Process search params            
        const searchParams = new URLSearchParams(url.search);
        searchParams.forEach((_v, p) => {
            if (!p.startsWith(":")) {
                return; // don't process non-placeholder parameters
            }
            url.searchParams.delete(p); // remove param placeholder
            url.search = decodeURIComponent(url.search);
            p = p.slice(1); // strip symbol ':' from param placeholder
            if (Object.prototype.hasOwnProperty.call(routeParams, p)) {
                url.searchParams.set(p, UECA.isUndefined(routeParams[p]) ? "" : routeParams[p].toString()); // set parameter value
            }
        })
        return url.href;
    }

    async function _navigate(route: string) {
        const newURL = _routeToURL({ path: route });
        if (newURL === window.location.href) {
            return
        }

        const url = new URL(newURL);
        if (url.origin !== window.location.origin) {
            window.open(newURL, "_blank"); // Cross-site history is prohibited. Always open a new tab.
        } else {
            model.__currentHistoryIndex = history.length;
            history.pushState({ index: model.__currentHistoryIndex }, "", newURL);
            if (history.length - model.__currentHistoryIndex === 1) {
                // History was truncated or abnormally changes by the browser. Synchronize the state.
                model.__currentHistoryIndex = history.length - 1;
                history.replaceState({ index: model.__currentHistoryIndex }, "", newURL);
            }
            _syncCurrentPath();
        }
    }
}

const AppBrowsingHistory = UECA.getFC(useAppBrowsingHistory);

export { AppBrowsingHistoryModel, useAppBrowsingHistory, AppBrowsingHistory }
