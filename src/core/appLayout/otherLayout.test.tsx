import { describe, expect, it } from "vitest";
import { OtherLayout, OtherRoute, otherRoutes, screenRoutes } from "@core";
import { mount, settle } from "@test";

// The registered addresses lookupRoute cannot find — each is pinned by an it.fails test below.
const UNRESOLVABLE = ["https://cranesoft.net", "mailto:cranesoft@protonmail.com"];

describe("OtherLayout", () => {
    describe("lookupRoute", () => {
        it("resolves each registered external address to its own route", async () => {
            const { model } = await mount(OtherLayout, { id: "otherLayout" });

            const addresses = Object.keys(otherRoutes).filter((path) => !UNRESOLVABLE.includes(path));
            expect(addresses.length).toBeGreaterThan(0);
            for (const path of addresses) {
                expect(model.lookupRoute(path)?.path, path).toBe(path);
            }
        });

        it("resolves no screen path", async () => {
            const { model } = await mount(OtherLayout, { id: "otherLayout" });

            for (const path of Object.keys(screenRoutes)) {
                expect(model.lookupRoute(path), path).toBeUndefined();
            }
        });

        // BUG: router.tsx builds the pattern from the parsed URL, whose pathname for an origin-only
        // address is "/", so it demands a trailing slash the registered key does not have. A
        // GoToRoute to "https://cranesoft.net" is claimed by neither layout and AppRouter falls back
        // to the home screen.
        it.fails("resolves an origin-only address by its own key", async () => {
            const { model } = await mount(OtherLayout, { id: "otherLayout" });

            expect(model.lookupRoute("https://cranesoft.net")?.path).toBe("https://cranesoft.net");
        });

        // BUG: router.tsx builds every absolute pattern as protocol + "//" + host + path, and drops
        // the first path segment as the empty one before a leading slash. A mailto address has no
        // "//" and its whole address is that first segment, so the pattern is /^mailto:\/\/(?:\?|$)/.
        it.fails("resolves a mailto address by its own key", async () => {
            const { model } = await mount(OtherLayout, { id: "otherLayout" });

            expect(model.lookupRoute("mailto:cranesoft@protonmail.com")?.path).toBe("mailto:cranesoft@protonmail.com");
        });
    });

    // External addresses open in a new tab; their route components are placeholders.
    it("draws nothing for an external route", async () => {
        const { container } = await mount(OtherLayout, {
            id: "otherLayout",
            route: { path: "https://github.com/nekutuzov/ueca-react-app-demo2" }
        });

        expect(container).toBeEmptyDOMElement();
    });

    it("hands the route it is given to its router, and reads a route the router changes back", async () => {
        const { model } = await mount(OtherLayout, { id: "otherLayout" });

        model.route = { path: "https://github.com/nekutuzov/ueca-react-doc" };
        await settle();
        expect(model.router.route?.path).toBe("https://github.com/nekutuzov/ueca-react-doc");

        model.router.setPath("https://www.npmjs.com/package/ueca-react");
        await settle();
        expect(model.route?.path).toBe("https://www.npmjs.com/package/ueca-react");
    });

    it("keeps the route it had, in step with its router, when given one outside its table", async () => {
        const { model } = await mount(OtherLayout, {
            id: "otherLayout",
            route: { path: "https://github.com/nekutuzov/ueca-react-app-demo1" }
        });

        model.route = { path: "/home" } as unknown as OtherRoute;
        await settle();

        expect(model.route?.path).toBe("https://github.com/nekutuzov/ueca-react-app-demo1");
        expect(model.router.route?.path).toBe("https://github.com/nekutuzov/ueca-react-app-demo1");
    });
});
