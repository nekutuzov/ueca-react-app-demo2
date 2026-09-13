import * as UECA from "ueca-react";
import { BaseModel, BaseParams, BaseStruct, useBase, AnyRoute } from "@components";
import { asyncSafe, runAsync } from "./appUtils";
import { resolveRouteURL } from "../misc/routeURL";

type AppBrowsingHistoryStruct = BaseStruct<{
    props: {
        __activePath: string;
        // The anchor within the page, kept beside the path rather than in it - route lookup
        // matches on the path alone.
        __activeSection: string;
        __baseURL: string;
        __appTitle: string;
        __currentHistoryIndex: number;
        // Held so the popstate listener can be detached: syncWithBrowser is callable more than
        // once and there is no destroy hook.
        __popstateHandler: (event: PopStateEvent) => void;
    },

    methods: {
        getActivePath: () => string;
        getActiveSection: () => string | undefined;
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
            // Both halves in one reply. The two methods below stay separate because a method call
            // is synchronous and nothing can interleave; a bus round trip is where time passes, so
            // that is where the address has to be read atomically.
            "App.BrowsingHistory.GetActiveAddress": async () => ({
                path: model.getActivePath(),
                section: model.getActiveSection()
            }),

            "App.BrowsingHistory.Open": async (p) => await model.open(p.path, p.newTab),

            "App.BrowsingHistory.Replace": async (p) => await model.replace(p.path),

            // The URL a route would navigate to, for a link's href. Total, unlike the strict
            // resolution navigation uses: an unresolvable route yields undefined, so a link renders
            // without an href instead of raising. Without this handler every NavLink lost its href —
            // a unicast with no subscriber returns undefined rather than failing.
            "App.BrowsingHistory.ResolveRoute": async (route) => resolveRouteURL(route, model.__baseURL)
        },

        methods: {
            getActivePath: () => model.__activePath,

            getActiveSection: () => model.__activeSection,

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
                // Detach any listener a previous call left behind before adding this one. Without
                // it a second syncWithBrowser() leaves two interceptors racing over one popstate,
                // each rolling back against its own idea of the current index.
                _detachPopstate();
                model.__popstateHandler = () => asyncSafe(async () => await _browserNavigation());
                window.addEventListener("popstate", model.__popstateHandler);
                _syncCurrentPath();
            },

            open: async (route, newTab) => {
                if (UECA.isObject(route)) {
                    route = _routeToURL(route);
                }
                if (newTab) {
                    // noopener closes the reverse-tabnabbing hole: without it the opened page
                    // gets a live window.opener and can navigate this one. Unlike <a
                    // target="_blank">, window.open does not imply it. Passing only these two
                    // features still yields a tab rather than a popup.
                    window.open(route, "_blank", "noopener,noreferrer");
                    return;
                }
                await _navigate(route);
            },

            replace: async (route) => {
                if (UECA.isObject(route)) {
                    route = _routeToURL(route);
                }
                if (_divertCrossOrigin(route)) {
                    return;
                }
                // A hash-only or externally pushed entry carries no index, so read it defensively
                // and fall back to the one we are already on.
                const index = history.state?.index ?? model.__currentHistoryIndex;
                history.replaceState({ index }, "", route);
                // history.state isn't ready yet due to async logic
                runAsync(() => { model.__currentHistoryIndex = history.state?.index ?? index });
                _syncCurrentPath();
            }
        },

        // The active path is derived from window.location alone, so it is established here, in the
        // one-time synchronous constr hook. AppRouter reads it from its own init to resolve the
        // startup route, and init hooks are not ordered between models: doing this in init instead
        // left the router asking for a path that had not been computed yet, which dropped every
        // deep link onto the default screen.
        constr: () => {
            model.syncWithBrowser();
        },

        init: async () => {
            const appInfo = await model.bus.unicast("App.GetInfo");
            model.__appTitle = appInfo?.appName;
            _syncDocumentTitle();
        },

        // Paired with the listener syncWithBrowser installs in constr. deinit is a DEACTIVATION
        // hook rather than destruction - it can fire and be followed by another init - but a
        // listener is cheap to re-add, so pairing is right here.
        deinit: () => {
            _detachPopstate();
        }
    }

    const model = useBase(struct, params);
    return model;

    // Private methods
    function _syncCurrentPath() {
        if (!window.location.pathname.startsWith(model.__baseURL)) {
            model.__activePath = "";
            model.__activeSection = undefined;
            return;
        }
        const path = window.location.pathname.substring(model.__baseURL.length);
        model.__activePath = path + decodeURIComponent(window.location.search);
        model.__activeSection = _currentSection();
        _syncDocumentTitle();
    }

    // The fragment, without its "#" and decoded - the shape a route and getElementById want.
    function _currentSection(): string | undefined {
        return decodeURIComponent(window.location.hash.replace("#", "")) || undefined;
    }

    function _syncDocumentTitle() {
        // The app title arrives asynchronously in init, after the first path sync. Leave the title
        // from index.html alone until it is known, then apply it.
        if (!model.__appTitle) {
            return;
        }
        const path = window.location.pathname.startsWith(model.__baseURL)
            ? window.location.pathname.substring(model.__baseURL.length)
            : "";
        window.document.title = path ? `${model.__appTitle}: ${path}` : model.__appTitle;
    }

    // The counterpart to the listener syncWithBrowser installs. Called from deinit, and again
    // before each re-attach so a repeated syncWithBrowser cannot leave two interceptors behind.
    function _detachPopstate() {
        if (!model.__popstateHandler) {
            return;
        }
        window.removeEventListener("popstate", model.__popstateHandler);
        model.__popstateHandler = undefined;
    }

    // Cross-site history is prohibited: neither pushState nor replaceState can move the document
    // to another origin - they throw a SecurityError - so a foreign URL always becomes a new tab.
    // Both entry points go through here, because a string route may be any URL. Returns true when
    // it took the navigation.
    function _divertCrossOrigin(url: string): boolean {
        // "" is what an empty route resolves to, and means "the current URL" to both history calls.
        if (!url || new URL(url).origin === window.location.origin) {
            return false;
        }
        window.open(url, "_blank", "noopener,noreferrer");
        return true;
    }

    async function _browserNavigation() {
        // Only entries this app pushed carry an index. A hash-only navigation, or one pushed from
        // outside the app, lands here unstamped - adopt the index we are already on, the same
        // repair syncWithBrowser() makes at load, rather than reading `index` off null.
        if (!history.state) {
            history.replaceState({ index: model.__currentHistoryIndex }, "", window.location.href);
        }
        const state_index = history.state.index;
        const section = _currentSection();
        if (model.__currentHistoryIndex === state_index) {
            let path = window.location.pathname.substring(model.__baseURL.length);
            path = path + decodeURIComponent(window.location.search);
            // The section is part of the comparison: two entries on one article differing only
            // by their anchor are different addresses, and skipping here would leave the router
            // unaware that Back had moved between them.
            if (path === model.__activePath && section === model.__activeSection) {
                return;
            }
            console.warn("Unexpected condition: AppBrowsingHistory._browserNavigation()");
        }

        let path = window.location.pathname.substring(model.__baseURL.length);
        path = path + decodeURIComponent(window.location.search);
        const allowThisPath = await model.bus.unicast("App.BrowsingHistory.OnNavigate", { path, section });
        if (UECA.isUndefined(allowThisPath) || allowThisPath) {
            model.__currentHistoryIndex = state_index;
            _syncCurrentPath();
        } else {
            const rollbackDelta = model.__currentHistoryIndex - state_index;
            if (rollbackDelta !== 0) {
                history.go(rollbackDelta);
            } else {
                // No distance to travel back, which is always the case for an entry that arrived
                // without an index of its own (stamped with the current one above). history.go(0)
                // would reload the page and discard the very state the denial protects, so restore
                // the URL in place instead.
                history.replaceState({ index: model.__currentHistoryIndex }, "", model.__baseURL + model.__activePath);
            }
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
        const routeParams = UECA.clone(route.params) || {};

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

        // Only ever set, never cleared. A route object with no section is built from its path
        // alone and so carries no fragment anyway; the one caller that arrives here with a hash
        // already on it is _navigate, re-parsing a URL this function produced a moment ago.
        if (route.section) {
            url.hash = route.section;
        }

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

        if (_divertCrossOrigin(newURL)) {
            return;
        }

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

const AppBrowsingHistory = UECA.getFC(useAppBrowsingHistory);

export { AppBrowsingHistoryModel, useAppBrowsingHistory, AppBrowsingHistory }
