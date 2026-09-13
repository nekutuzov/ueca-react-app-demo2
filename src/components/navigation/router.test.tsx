import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { AnyRoute, Router, routeKey, Routing } from "@components";
import { ModelOf, mount, settle } from "@test";

function view(text: string) {
    return () => <div data-testid="view">{text}</div>;
}

const routes: Routing = {
    "/": view("home"),
    "/users/:id": (p) => <div data-testid="view">user {String(p?.id)}</div>,
    "/org/:orgId/users/:userId": (p) => <div data-testid="view">org {String(p?.orgId)} user {String(p?.userId)}</div>,
    "/list?:tab&:page": (p) => <div data-testid="view">list {String(p?.tab)}</div>,
    "//admin/:section": (p) => <div data-testid="view">admin {String(p?.section)}</div>,
    "https://docs.example.com/guide/:page": (p) => <div data-testid="view">docs {String(p?.page)}</div>
};

const user42: AnyRoute = { path: "/users/:id", params: { id: 42 } };

async function mountRouter(table: Routing = routes) {
    const { model, update } = await mount(Router, { id: "router", routes: table });
    return { router: model, update };
}

async function go(router: ModelOf<typeof Router>, route: AnyRoute) {
    router.route = route;
    await settle();
}

function shown() {
    return screen.queryByTestId("view");
}

describe("routeKey", () => {
    it("is empty for no route", () => {
        expect(routeKey(undefined)).toBe("");
    });

    it("substitutes every :segment with its value", () => {
        expect(routeKey({ path: "/org/:orgId/users/:userId", params: { orgId: 7, userId: "u2" } })).toBe("/org/7/users/u2");
    });

    // A different path-segment value is a different screen...
    it("tells two values of one parametric route apart", () => {
        expect(routeKey({ path: "/users/:id", params: { id: 1 } })).not.toBe(routeKey({ path: "/users/:id", params: { id: 2 } }));
    });

    // ...while a query-only change, or a move to an anchor, keeps the same screen.
    it("ignores the query pattern, query values and the section", () => {
        expect(routeKey({ path: "/list?:tab&:page", params: { tab: "open", page: 2 } })).toBe("/list");
        expect(routeKey({ path: "/list?:tab", params: { tab: "closed" }, section: "top" })).toBe("/list");
    });

    it("substitutes an empty string for a missing value but keeps 0", () => {
        expect(routeKey({ path: "/users/:id" })).toBe("/users/");
        expect(routeKey({ path: "/users/:id", params: { id: 0 } })).toBe("/users/0");
    });

    // Regression: the token pattern /:([^/?]+)/ was not tied to the path, so a port or a mailto
    // address read as a ":param" and was deleted: https://host:8443/guide keyed as https://host/guide,
    // and every mailto: route keyed as "mailto".
    it("keeps the colon of a port or a scheme, which is not a path token", () => {
        expect(routeKey({ path: "https://docs.example.com:8443/guide" })).toBe("https://docs.example.com:8443/guide");
        expect(routeKey({ path: "mailto:someone@example.com" })).toBe("mailto:someone@example.com");
    });

    it("still substitutes the path tokens of an absolute or origin-root route", () => {
        expect(routeKey({ path: "https://docs.example.com:8443/guide/:page", params: { page: "intro" } })).toBe("https://docs.example.com:8443/guide/intro");
        expect(routeKey({ path: "//admin/:section", params: { section: "users" } })).toBe("//admin/users");
    });
});

describe("Router", () => {
    describe("rendering", () => {
        it("renders nothing until a route is set", async () => {
            const { router } = await mountRouter();

            expect(router.route).toBeUndefined();
            expect(shown()).toBeNull();
        });

        it("renders the view of an assigned route with the route's params", async () => {
            const { router } = await mountRouter();

            await go(router, user42);

            expect(shown()).toHaveTextContent("user 42");
        });

        it("switches views as the route changes", async () => {
            const { router } = await mountRouter();

            await go(router, { path: "/" });
            expect(shown()).toHaveTextContent("home");

            await go(router, { path: "/org/:orgId/users/:userId", params: { orgId: 1, userId: 2 } });
            expect(shown()).toHaveTextContent("org 1 user 2");
        });

        it("follows a route declared in JSX as the declaration changes", async () => {
            const { update } = await mountRouter();

            await update({ id: "router", routes, route: { path: "/" } });
            expect(shown()).toHaveTextContent("home");

            await update({ id: "router", routes, route: user42 });
            expect(shown()).toHaveTextContent("user 42");
        });

        // Regression: _currentView was derived only in onChangeRoute, and change events are suppressed
        // while a model initialises (see NavLink's `mount` comment), so a route present at creation
        // never got a view — nor did a JSX re-render with that same route change anything.
        it("renders the view of a route given at creation", async () => {
            await mount(Router, { id: "router", routes, route: user42 });

            expect(shown()).toHaveTextContent("user 42");
        });

        // Regression: the same suppressed events meant onChangingRoute never vetted a route present at
        // creation, so the router held a route its table does not have.
        it("does not accept an unknown route given at creation", async () => {
            const { model } = await mount(Router, { id: "router", routes, route: { path: "/nowhere" } });

            expect(model.route).toBeUndefined();
            expect(shown()).toBeNull();
        });

        it("follows a route given at creation to the next one", async () => {
            const { model } = await mount(Router, { id: "router", routes, route: user42 });

            await go(model, { path: "/" });

            expect(shown()).toHaveTextContent("home");
        });
    });

    describe("unknown routes", () => {
        it("keeps the current route and view when assigned a route the table does not have", async () => {
            const onChangeRoute = vi.fn();
            const { model: router } = await mount(Router, { id: "router", routes, onChangeRoute });
            await go(router, user42);

            await go(router, { path: "/nowhere" });

            expect(router.route).toEqual(user42);
            expect(shown()).toHaveTextContent("user 42");
            expect(onChangeRoute).toHaveBeenCalledOnce();
        });

        it("stays unset when the first route assigned is unknown", async () => {
            const { router } = await mountRouter();

            await go(router, { path: "/nowhere" });

            expect(router.route).toBeUndefined();
            expect(shown()).toBeNull();
        });

        it("keeps the current route when the route is cleared", async () => {
            const { router } = await mountRouter();
            await go(router, user42);

            await go(router, undefined);

            expect(router.route).toEqual(user42);
            expect(shown()).toHaveTextContent("user 42");
        });

        it("accepts no route at all without a route table", async () => {
            const { model: router } = await mount(Router, { id: "router" });

            await go(router, { path: "/" });

            expect(router.route).toBeUndefined();
        });
    });

    describe("changing the route table", () => {
        it("drops the current route and its view when the new table no longer has it", async () => {
            const { router } = await mountRouter();
            await go(router, user42);

            router.routes = { "/": view("home") };
            await settle();

            expect(router.route).toBeUndefined();
            expect(shown()).toBeNull();
        });

        it("keeps the current route when the new table still has it", async () => {
            const { router } = await mountRouter();
            await go(router, user42);

            router.routes = { ...routes, "/extra": view("extra") };
            await settle();

            expect(router.route).toEqual(user42);
        });

        // Matching is cached; the cache has to be rebuilt from the new table.
        it("matches paths against the new table", async () => {
            const { router } = await mountRouter();
            expect(router.lookupRoute("/extra")).toBeUndefined();

            router.routes = { "/extra": view("extra") };
            await settle();

            expect(router.lookupRoute("/extra")).toEqual({ path: "/extra", params: {} });
            expect(router.lookupRoute("/users/42")).toBeUndefined();
        });

        // BUG: onChangeRoutes resets the match cache and drops a route the table lost, but never
        // rebuilds _currentView (router.tsx:62-67), so a route that survives the change keeps
        // rendering the component of the table that was replaced.
        it.fails("renders the new table's view for a route that survives the change", async () => {
            const { router } = await mountRouter();
            await go(router, { path: "/" });

            router.routes = { "/": view("new home") };
            await settle();

            expect(shown()).toHaveTextContent("new home");
        });
    });

    describe("lookupRoute", () => {
        it.each(["", undefined])("resolves %j to no route", async (path) => {
            const { router } = await mountRouter();

            expect(router.lookupRoute(path)).toBeUndefined();
        });

        it("matches a static route", async () => {
            const { router } = await mountRouter();

            expect(router.lookupRoute("/")).toEqual({ path: "/", params: {} });
        });

        it("reads path params by position, as strings", async () => {
            const { router } = await mountRouter({ "/org/:orgId/users/:userId": view("org user") });

            expect(router.lookupRoute("/org/7/users/u2")).toEqual({
                path: "/org/:orgId/users/:userId",
                params: { orgId: "7", userId: "u2" }
            });
        });

        it("reads the declared query params and ignores the others", async () => {
            const { router } = await mountRouter();

            expect(router.lookupRoute("/list?tab=open&extra=1")).toEqual({ path: "/list?:tab&:page", params: { tab: "open" } });
            expect(router.lookupRoute("/list")).toEqual({ path: "/list?:tab&:page", params: {} });
        });

        it("matches a path carrying a query string its route does not declare", async () => {
            const { router } = await mountRouter();

            expect(router.lookupRoute("/users/5?ref=mail")).toEqual({ path: "/users/:id", params: { id: "5" } });
        });

        it("does not let a param span segments or a route match a longer name", async () => {
            const { router } = await mountRouter({ "/home": view("home"), "/users/:id": view("user") });

            expect(router.lookupRoute("/users/5/edit")).toBeUndefined();
            expect(router.lookupRoute("/homepage")).toBeUndefined();
        });

        it("matches case-insensitively and answers with the table's spelling", async () => {
            const { router } = await mountRouter();

            expect(router.lookupRoute("/USERS/5")).toEqual({ path: "/users/:id", params: { id: "5" } });
        });

        it("matches an absolute URL route, on its own host only", async () => {
            const { router } = await mountRouter();

            expect(router.lookupRoute("https://docs.example.com/guide/intro")).toEqual({
                path: "https://docs.example.com/guide/:page",
                params: { page: "intro" }
            });
            expect(router.lookupRoute("https://other.example.com/guide/intro")).toBeUndefined();
        });

        // Like the YouTube link in otherRoutes: a literal query in the key is part of the address,
        // not a param.
        it("matches a route whose key carries a literal query, without reading it as a param", async () => {
            const { router } = await mountRouter({ "https://youtu.be/SQl8f?si=abc": view("video"), ...routes });

            expect(router.lookupRoute("https://youtu.be/SQl8f?si=abc")).toEqual({ path: "https://youtu.be/SQl8f?si=abc", params: {} });
        });

        it("matches an origin-root route and answers with its // spelling", async () => {
            const { router } = await mountRouter();

            expect(router.lookupRoute("//admin/users")).toEqual({ path: "//admin/:section", params: { section: "users" } });
        });

        // A "//" route is this origin WITHOUT the app base, so it must never answer for the
        // app-relative path of the same shape, nor that route for it.
        it("keeps an origin-root route apart from the app-relative route of the same shape", async () => {
            const { router } = await mountRouter({ "//admin/:section": view("root admin"), "/admin/:section": view("app admin") });

            expect(router.lookupRoute("/admin/users")?.path).toBe("/admin/:section");
            expect(router.lookupRoute("//admin/users")?.path).toBe("//admin/:section");
        });

        // Regression: route patterns were built without a ^ anchor, so a route matched any path that
        // merely ENDED like it. With "/users/:id" listed first, "/org/7/users/u2" resolved to it with
        // id "u2", a mistyped "/typo/users/5" still resolved, and a query value ending in a path
        // answered with the route that value named.
        it("matches a route from the start of the path, not a shorter route its tail resembles", async () => {
            const { router } = await mountRouter();

            expect(router.lookupRoute("/org/7/users/u2")?.path).toBe("/org/:orgId/users/:userId");
            expect(router.lookupRoute("/typo/users/5")).toBeUndefined();
            expect(router.lookupRoute("/list?back=/users/5")?.path).toBe("/list?:tab&:page");
        });

        // Regression: the same missing anchor defeated the tag an origin-root path is rewritten to:
        // an app-relative route listed first matched the tail of the tagged "//admin/users".
        it("never answers an origin-root path with an app-relative route listed before it", async () => {
            const { router } = await mountRouter({ "/admin/:section": view("app admin"), "//admin/:section": view("root admin") });

            expect(router.lookupRoute("//admin/users")?.path).toBe("//admin/:section");
        });
    });

    describe("setPath", () => {
        it("routes to a known path and reports success", async () => {
            const { router } = await mountRouter();

            expect(router.setPath("/users/42")).toBe(true);
            await settle();

            expect(router.route).toEqual({ path: "/users/:id", params: { id: "42" } });
            expect(shown()).toHaveTextContent("user 42");
        });

        it("reports success again for the path already shown", async () => {
            const { router } = await mountRouter();
            router.setPath("/users/42");
            await settle();

            expect(router.setPath("/users/42")).toBe(true);
        });

        it("reports failure for an unknown path and keeps the current route", async () => {
            const { router } = await mountRouter();
            await go(router, user42);

            expect(router.setPath("/nowhere")).toBe(false);
            await settle();

            expect(router.route).toEqual(user42);
        });
    });

    // The view is keyed by routeKey: a new screen identity remounts it, anything else updates the
    // mounted one in place.
    describe("remounting the view", () => {
        it("remounts the view when a path param changes", async () => {
            const { router } = await mountRouter();
            await go(router, { path: "/users/:id", params: { id: 1 } });
            const before = shown();

            await go(router, { path: "/users/:id", params: { id: 2 } });

            expect(shown()).toHaveTextContent("user 2");
            expect(shown()).not.toBe(before);
        });

        it("updates the mounted view in place when only a query param changes", async () => {
            const { router } = await mountRouter();
            await go(router, { path: "/list?:tab&:page", params: { tab: "open" } });
            const before = shown();

            await go(router, { path: "/list?:tab&:page", params: { tab: "closed" } });

            expect(shown()).toHaveTextContent("list closed");
            expect(shown()).toBe(before);
        });

        it("keeps the view mounted when only the section changes", async () => {
            const { router } = await mountRouter();
            await go(router, { ...user42, section: "profile" });
            const before = shown();

            await go(router, { ...user42, section: "orders" });

            expect(router.route.section).toBe("orders");
            expect(shown()).toBe(before);
        });
    });
});
