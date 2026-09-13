import * as UECA from "ueca-react";
import { AnyRoute } from "@components";

// Route → URL resolution, extracted from AppBrowsingHistory so the parameter rules below are unit
// testable. That model stays the only caller and supplies its own base URL.
//
// A `path` is ANY URL, and the three branches in _buildURL are what make that true — passing one
// through here preserves what it already is rather than rewriting it:
//
//   "https://docs.example.com/x"  absolute      → used as-is, other origin, base never applied
//   "//admin/x"                   origin-root   → this origin, ignoring the app's base
//   "/sites/demolog"              app-relative  → the ONLY form the base is prepended to
//
// So a caller with a bare string still calls this rather than using the string directly: the
// difference only shows on the third form, and it is the difference between staying inside the app
// and resolving against the origin. `?query` survives every branch (URL parses it off the path);
// the ":name" substitution below then runs over that query, which is a no-op unless a KEY is
// literally ":name" — a shape only a route object with `params` has reason to produce.

type BuildResult = { url?: string, missingParam?: string };

// A parameter is "not set" three ways — missing key, undefined, null — and all three omit it. Only
// an explicit "" is a real (empty) value. Path and query params used to disagree here: the query
// side tested for key presence, so `{ tab: undefined }` emitted a dangling "?tab=" and
// `{ tab: null }` threw on toString().
function _isAbsent(value: unknown): boolean {
    return UECA.isUndefined(value) || value === null;
}

function _buildURL(route: AnyRoute, baseURL: string): BuildResult {
    if (!route?.path) {
        return { url: "" };
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
        url = new URL(baseURL + route.path, window.location.origin);
    }
    const routeParams: Record<string, unknown> = UECA.clone(route.params) || {};

    // Process dynamic path params
    const parts = url.pathname.split("/");
    for (let i = 0; i < parts.length; i++) {
        if (!parts[i].startsWith(":")) {
            continue;
        }
        const name = parts[i].substring(1);
        const value = routeParams[name];
        delete routeParams[name]; // consumed by the path, so the query pass won't see it
        if (_isAbsent(value)) {
            return { missingParam: name };
        }
        parts[i] = String(value);
    }
    url.pathname = parts.join("/"); // update dynamic path with processed path

    // Process search params
    const searchParams = new URLSearchParams(url.search);
    searchParams.forEach((_v, p) => {
        if (!p.startsWith(":")) {
            return; // don't process non-placeholder parameters
        }
        url.searchParams.delete(p); // remove param placeholder
        url.search = decodeURIComponent(url.search);
        const name = p.slice(1); // strip symbol ':' from param placeholder
        const value = routeParams[name];
        if (!_isAbsent(value)) {
            url.searchParams.set(name, String(value));
        }
    });

    // Only ever set, never cleared. A route object built from a path carries no fragment of its
    // own, so there is nothing to clear; the one caller that arrives here with a hash already on
    // the string is AppBrowsingHistory._navigate, re-resolving a URL this function just produced.
    if (route.section) {
        url.hash = route.section;
    }
    return { url: url.href };
}

// Strict. Throws when a ":segment" has no value — for NAVIGATION, where a missing parameter is a
// caller bug that must not be swallowed.
function routeToURL(route: AnyRoute, baseURL: string): string {
    const result = _buildURL(route, baseURL);
    if (result.missingParam) {
        throw Error(`URL parameter "${result.missingParam}" cannot be null`);
    }
    return result.url;
}

// Total. Returns undefined instead of throwing — for resolving a link's href, where an unresolvable
// route means "render no href" rather than an error dialog.
function resolveRouteURL(route: AnyRoute, baseURL: string): string {
    return _buildURL(route, baseURL).url;
}

export { routeToURL, resolveRouteURL };
