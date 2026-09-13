import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { appMessageBus } from "@core";
import {
    APP_NAME, HOME_HEADING, activeMenuGroups, activeMenuItems, appPath, documentTitle, renderApp, send, signIn,
    waitForScreen
} from "./appHarness";

function currentRoute() {
    return send(() => appMessageBus.unicast("App.Router.GetRoute"));
}

describe("Deep links", { timeout: 20_000 }, () => {
    it("opens a signed-in visit to /showcase/controls on the Controls topic, with its menu item active", async () => {
        const { historyLength } = await renderApp({ url: "/showcase/controls", signedIn: true });

        expect(await waitForScreen("Controls")).toBeInTheDocument();
        expect(activeMenuItems()).toEqual(["Controls"]);
        expect(activeMenuGroups()).toEqual(["Showcase"]);
        expect(location.pathname).toBe(appPath("/showcase/controls"));
        await waitFor(() => expect(document.title).toBe(documentTitle("Controls · Showcase")));
        expect(await currentRoute()).toMatchObject({ path: "/showcase/controls" });
        // Startup rewrites the entry it opened on; it never adds one.
        expect(history.length).toBe(historyLength);
    });

    it("keeps the #section of a deep link, on the route and in the address", async () => {
        const { historyLength } = await renderApp({ url: "/showcase/controls#buttons", signedIn: true });

        await waitForScreen("Controls");

        expect(await currentRoute()).toMatchObject({ path: "/showcase/controls", section: "buttons" });
        expect(location.pathname).toBe(appPath("/showcase/controls"));
        expect(location.hash).toBe("#buttons");
        expect(activeMenuItems()).toEqual(["Controls"]);
        expect(history.length).toBe(historyLength);
    });

    it.each(["/", "/home"])("shows Home at %s, with the Home item active and the app name as the title", async (path) => {
        await renderApp({ url: path, signedIn: true });

        expect(await waitForScreen(HOME_HEADING)).toBeInTheDocument();
        expect(activeMenuItems()).toEqual(["Home"]);
        expect(activeMenuGroups()).toEqual([]);
        expect(location.pathname).toBe(appPath(path));
        await waitFor(() => expect(document.title).toBe(APP_NAME));
    });

    it("falls back to Home for an unknown address and rewrites it in place", async () => {
        const { historyLength } = await renderApp({ url: "/retired/page?tab=2#notes", signedIn: true });

        expect(await waitForScreen(HOME_HEADING)).toBeInTheDocument();
        expect(location.pathname).toBe(appPath("/"));
        expect(location.search).toBe("");
        expect(location.hash).toBe("");
        expect(history.length).toBe(historyLength);
        expect(activeMenuItems()).toEqual(["Home"]);
        expect(await currentRoute()).toEqual({ path: "/" });
    });

    // Regression: route patterns were not anchored at the start, so an address that merely ENDED
    // like a screen's path opened that screen instead of falling back to Home.
    it("falls back to Home for an address that only ends like a screen's path", async () => {
        const { historyLength } = await renderApp({ url: "/retired/showcase/controls", signedIn: true });

        expect(await waitForScreen(HOME_HEADING)).toBeInTheDocument();
        expect(location.pathname).toBe(appPath("/"));
        expect(history.length).toBe(historyLength);
        expect(await currentRoute()).toEqual({ path: "/" });
    });

    // Regression: the same missing anchor let a query value pick the screen. This address ends in
    // "/home", so it opened Home, and startup rewrote the address to match.
    it("opens the screen its path names, whatever path a query value ends in", async () => {
        await renderApp({ url: "/showcase/controls?from=/home", signedIn: true });

        expect(await waitForScreen("Controls")).toBeInTheDocument();
        expect(location.pathname).toBe(appPath("/showcase/controls"));
        expect(await currentRoute()).toMatchObject({ path: "/showcase/controls" });
    });

    describe("opened while signed out", () => {
        it("keeps the address on the sign-in form, and signing in lands on the linked page and section", async () => {
            const { historyLength } = await renderApp({ url: "/playground/table#columns" });

            expect(screen.getByRole("heading", { level: 1, name: "Sign in" })).toBeInTheDocument();
            expect(location.pathname).toBe(appPath("/playground/table"));
            expect(location.hash).toBe("#columns");

            await signIn();

            // AppRouter is only built once the user is signed in, and routes from the address it finds.
            expect(await waitForScreen("Table")).toBeInTheDocument();
            expect(location.pathname).toBe(appPath("/playground/table"));
            expect(location.hash).toBe("#columns");
            expect(await currentRoute()).toMatchObject({ path: "/playground/table", section: "columns" });
            expect(activeMenuItems()).toEqual(["Table"]);
            expect(activeMenuGroups()).toEqual(["Playground"]);
            await waitFor(() => expect(document.title).toBe(documentTitle("Table · Playground")));
            expect(history.length).toBe(historyLength);
        });

        it("lands on Home after signing in from an unknown address, rewritten in place", async () => {
            const { historyLength } = await renderApp({ url: "/retired/page" });
            expect(location.pathname).toBe(appPath("/retired/page"));

            await signIn();

            expect(await waitForScreen(HOME_HEADING)).toBeInTheDocument();
            expect(location.pathname).toBe(appPath("/"));
            expect(history.length).toBe(historyLength);
        });
    });
});
