import { describe, expect, it } from "vitest";
import { AnyRoute } from "@components";
import { resolveRouteURL, routeToURL } from "@core";

// What AppBrowsingHistory passes: the <base> href without its trailing slash. The test URL puts the
// app at http://localhost:5001/ueca-react-app-demo2/, as the dev server does.
const BASE = "/ueca-react-app-demo2";
const ORIGIN = "http://localhost:5001";
const APP = `${ORIGIN}${BASE}`;

function route(path: string, params?: Record<string, unknown>, section?: string): AnyRoute {
    return { path, params, section };
}

describe("resolveRouteURL", () => {
    describe("path forms", () => {
        it("prepends the base to an app-relative path", () => {
            expect(resolveRouteURL(route("/sites/demolog"), BASE)).toBe(`${APP}/sites/demolog`);
        });

        it("resolves an origin-root path against this origin, ignoring the base", () => {
            expect(resolveRouteURL(route("//admin/users"), BASE)).toBe(`${ORIGIN}/admin/users`);
        });

        it("keeps an absolute URL on its own origin and never applies the base", () => {
            expect(resolveRouteURL(route("https://docs.example.com/guide"), BASE)).toBe("https://docs.example.com/guide");
        });

        it("resolves an app-relative path at the origin root when there is no base", () => {
            expect(resolveRouteURL(route("/sites/demolog"), "")).toBe(`${ORIGIN}/sites/demolog`);
        });

        it.each([
            ["app-relative", "/users/:id", `${APP}/users/7`],
            ["origin-root", "//admin/users/:id", `${ORIGIN}/admin/users/7`],
            ["absolute", "https://api.example.com/users/:id", "https://api.example.com/users/7"]
        ])("substitutes path params in an %s path", (_form, path, expected) => {
            expect(resolveRouteURL(route(path, { id: 7 }), BASE)).toBe(expected);
        });

        it.each([
            ["no route", undefined],
            ["an empty path", route("")]
        ])("resolves %s to an empty string", (_case, empty) => {
            expect(resolveRouteURL(empty, BASE)).toBe("");
            expect(routeToURL(empty, BASE)).toBe("");
        });
    });

    describe("path params", () => {
        it("substitutes every :segment", () => {
            expect(resolveRouteURL(route("/users/:userId/orders/:orderId", { userId: 7, orderId: "A-1" }), BASE))
                .toBe(`${APP}/users/7/orders/A-1`);
        });

        it.each([0, false])("treats %s as a value, not as absent", (value) => {
            expect(resolveRouteURL(route("/flags/:flag", { flag: value }), BASE)).toBe(`${APP}/flags/${value}`);
        });

        // Only an explicit "" is a real (empty) value.
        it("substitutes an explicit empty string", () => {
            expect(resolveRouteURL(route("/users/:id/edit", { id: "" }), BASE)).toBe(`${APP}/users//edit`);
        });

        it.each([
            ["a missing key", {}],
            ["undefined", { id: undefined }],
            ["null", { id: null }],
            ["no params at all", undefined]
        ])("cannot resolve a path param given %s", (_case, params) => {
            expect(resolveRouteURL(route("/users/:id", params), BASE)).toBeUndefined();
        });

        it("does not consume the caller's params", () => {
            const params = { id: 7, tab: "orders" };

            resolveRouteURL(route("/users/:id?:tab", params), BASE);

            expect(params).toEqual({ id: 7, tab: "orders" });
        });
    });

    describe("query placeholders", () => {
        it("fills ?:name placeholders from params", () => {
            expect(resolveRouteURL(route("/list?:tab&:page", { tab: "open", page: 2 }), BASE)).toBe(`${APP}/list?tab=open&page=2`);
        });

        // Path and query params used to disagree: { tab: undefined } emitted a dangling "?tab=" and
        // { tab: null } threw on toString().
        it.each([
            ["a missing key", {}],
            ["undefined", { tab: undefined }],
            ["null", { tab: null }]
        ])("omits a query param given %s", (_case, params) => {
            expect(resolveRouteURL(route("/list?:tab", params), BASE)).toBe(`${APP}/list`);
        });

        it("omits only the absent placeholders", () => {
            expect(resolveRouteURL(route("/list?:tab&:page&:sort", { page: 3, sort: null }), BASE)).toBe(`${APP}/list?page=3`);
        });

        it("keeps an explicit empty string as an empty value", () => {
            expect(resolveRouteURL(route("/list?:tab", { tab: "" }), BASE)).toBe(`${APP}/list?tab=`);
        });

        it.each([0, false])("keeps %s as a query value", (value) => {
            expect(resolveRouteURL(route("/list?:page", { page: value }), BASE)).toBe(`${APP}/list?page=${value}`);
        });

        it("does not repeat a param the path already consumed", () => {
            expect(resolveRouteURL(route("/users/:id?:id&:tab", { id: 7, tab: "orders" }), BASE)).toBe(`${APP}/users/7?tab=orders`);
        });

        it("passes query params that are not placeholders through unchanged", () => {
            const url = new URL(resolveRouteURL(route("/list?mode=full&:tab", { tab: "open" }), BASE));

            expect(url.pathname).toBe(`${BASE}/list`);
            expect([...url.searchParams]).toEqual([["mode", "full"], ["tab", "open"]]);
        });

        // The substitution looks at KEYS only; a value that happens to look like a placeholder is data.
        it("leaves a placeholder-looking query value alone", () => {
            expect(resolveRouteURL(route("/list?ref=:id", { id: 5 }), BASE)).toBe(`${APP}/list?ref=:id`);
        });

        it("fills placeholders on an absolute URL", () => {
            expect(resolveRouteURL(route("https://api.example.com/search?:q", { q: "ueca" }), BASE)).toBe("https://api.example.com/search?q=ueca");
        });

        // BUG: after deleting each placeholder, _buildURL runs decodeURIComponent over the WHOLE search
        // string (routeURL.ts:72), so a value set for an earlier placeholder is decoded again: its "&"
        // re-parses as a separator and "+" as a space, and q comes back as "tom ". The navigation
        // path's private copy does the same (appBrowsingHistory.ts:299).
        it.fails("keeps an earlier placeholder's value intact when another placeholder follows", () => {
            const url = new URL(resolveRouteURL(route("/search?:q&:page", { q: "tom & jerry + co", page: 1 }), BASE));

            expect(url.searchParams.get("q")).toBe("tom & jerry + co");
            expect(url.searchParams.get("page")).toBe("1");
        });

        // BUG: the same decodeURIComponent (routeURL.ts:72) decodes a literal query value on the path
        // once the route also has a placeholder, although "?query survives every branch".
        it.fails("keeps an encoded literal query value intact when the route has a placeholder", () => {
            const url = new URL(resolveRouteURL(route("/list?filter=a%26b&:tab", { tab: "open" }), BASE));

            expect(url.searchParams.get("filter")).toBe("a&b");
        });
    });

    describe("sections", () => {
        it("puts the section in the fragment, after the query", () => {
            expect(resolveRouteURL(route("/users/:id?:tab", { id: 7, tab: "orders" }, "history"), BASE))
                .toBe(`${APP}/users/7?tab=orders#history`);
        });

        it("adds no fragment for an empty section", () => {
            expect(resolveRouteURL(route("/docs", undefined, ""), BASE)).toBe(`${APP}/docs`);
        });

        it("adds a section to an origin-root and an absolute URL", () => {
            expect(resolveRouteURL(route("//admin", undefined, "top"), BASE)).toBe(`${ORIGIN}/admin#top`);
            expect(resolveRouteURL(route("https://docs.example.com/guide", undefined, "install"), BASE)).toBe("https://docs.example.com/guide#install");
        });
    });
});

describe("routeToURL", () => {
    it("resolves the same URL as resolveRouteURL", () => {
        const sample = route("/users/:id?:tab&mode=full", { id: 7, tab: "orders" }, "history");

        expect(routeToURL(sample, BASE)).toBe(resolveRouteURL(sample, BASE));
        expect(routeToURL(sample, BASE)).toBe(`${APP}/users/7?mode=full&tab=orders#history`);
    });

    // Strict for navigation: a missing path param is a caller bug that must not be swallowed.
    it.each([
        ["a missing key", {}],
        ["undefined", { id: undefined }],
        ["null", { id: null }]
    ])("throws for a path param given %s", (_case, params) => {
        expect(() => routeToURL(route("/users/:id/orders/:orderId", { ...params, orderId: 1 }), BASE))
            .toThrow('URL parameter "id" cannot be null');
    });

    it("does not throw for an absent query placeholder", () => {
        expect(routeToURL(route("/list?:tab"), BASE)).toBe(`${APP}/list`);
    });
});
