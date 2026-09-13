import { describe, expect, it, vi } from "vitest";
import { act, screen } from "@testing-library/react";
import { AppLayout, otherRoutes, ScreenRoute, screenRoutes } from "@core";
import { PLAYGROUND_TOPICS, SHOWCASE_TOPICS } from "@screens";
import { mount, settle, takeUecaErrors } from "@test";

// The showcase and playground screens are heavy and beside the point here, so they are replaced by
// stand-ins that report what the route table asked for. HomeScreen stays real.
vi.mock("@screens", async (importOriginal) => {
    const screens = await importOriginal<typeof import("@screens")>();
    const standIn = (name: string) => (props: { id: string; topic?: string }) => (
        <div data-testid="screen" data-screen={name} data-screen-id={props.id} data-topic={props.topic}>{name}</div>
    );
    return {
        ...screens,
        ShowcaseScreen: standIn("ShowcaseScreen"),
        ButtonPlayground: standIn("ButtonPlayground"),
        TextFieldPlayground: standIn("TextFieldPlayground"),
        TablePlayground: standIn("TablePlayground")
    };
});

function shownScreen(): DOMStringMap {
    return screen.getByTestId("screen").dataset;
}

describe("AppLayout", () => {
    describe("lookupRoute", () => {
        it("resolves every screen route by its own path", async () => {
            const { model } = await mount(AppLayout, { id: "appLayout" });

            for (const path of Object.keys(screenRoutes)) {
                expect(model.lookupRoute(path)?.path).toBe(path);
            }
        });

        it("resolves a browser address with a query string, whatever its case, to its screen route", async () => {
            const { model } = await mount(AppLayout, { id: "appLayout" });

            expect(model.lookupRoute("/Showcase/Data?row=4")?.path).toBe("/showcase/data");
        });

        it("resolves nothing for an unknown or an empty path", async () => {
            const { model } = await mount(AppLayout, { id: "appLayout" });

            expect(model.lookupRoute("/nowhere")).toBeUndefined();
            expect(model.lookupRoute("")).toBeUndefined();
        });

        // BUG: the route patterns router.tsx builds are not anchored at the start, and "/" becomes
        // /\/(?:\?|$)/ — so any address ending in a slash matches the Home route.
        // "https://nekutuzov.github.io/ueca-react-doc/" and "https://ueca-react.carrd.co/" resolve to
        // { path: "/" }, and AppRouter._changeRoute, which asks this layout first, hands such a
        // GoToRoute to the app layout instead of the other layout.
        it.fails("does not claim an external address, even one ending in a slash", async () => {
            const { model } = await mount(AppLayout, { id: "appLayout" });

            for (const path of Object.keys(otherRoutes)) {
                expect(model.lookupRoute(path), path).toBeUndefined();
            }
        });

        // BUG: same unanchored pattern — a path that merely ends with a screen path resolves to it.
        it.fails("does not claim a path that merely ends with a screen path", async () => {
            const { model } = await mount(AppLayout, { id: "appLayout" });

            expect(model.lookupRoute("/legacy/home")).toBeUndefined();
        });
    });

    it("draws the sidebar beside the screen for its route", async () => {
        const { model } = await mount(AppLayout, { id: "appLayout", route: { path: "/showcase/tokens" } });

        const shell = document.getElementById(model.htmlId());
        expect(shell).toHaveStyle({ overflow: "hidden" });
        const sideBar = document.getElementById(model.sideBar.htmlId());
        const shown = screen.getByTestId("screen");
        expect(shell.contains(sideBar)).toBe(true);
        expect(sideBar.parentElement).toBe(shown.parentElement);
        expect(sideBar.compareDocumentPosition(shown) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(shownScreen()).toMatchObject({ screen: "ShowcaseScreen", screenId: "showcase-tokens", topic: "tokens" });
    });

    it("shows no screen until it is given a route", async () => {
        const { model } = await mount(AppLayout, { id: "appLayout" });

        expect(document.getElementById(model.sideBar.htmlId())).toBeInTheDocument();
        expect(screen.queryByTestId("screen")).toBeNull();
        expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
    });

    it.each(["/", "/home"])("shows the real home screen for %s", async (path) => {
        await mount(AppLayout, { id: "appLayout", route: { path } as ScreenRoute });
        await settle();

        expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Fifty components\.\s*One component shape\./);
    });

    // One route per topic, each with its own screen id, so a topic's page state is its own.
    it("routes every showcase topic to a showcase screen with an id of its own", async () => {
        const { model } = await mount(AppLayout, { id: "appLayout" });
        const ids = new Set<string>();

        for (const topic of SHOWCASE_TOPICS) {
            model.route = { path: topic.path } as ScreenRoute;
            await settle();

            expect(shownScreen()).toMatchObject({ screen: "ShowcaseScreen", topic: topic.key });
            ids.add(shownScreen().screenId);
        }

        expect(ids.size).toBe(SHOWCASE_TOPICS.length);
    });

    it("routes every playground page to its own editor", async () => {
        const { model } = await mount(AppLayout, { id: "appLayout" });
        const editors = { button: "ButtonPlayground", textField: "TextFieldPlayground", table: "TablePlayground" };

        for (const topic of PLAYGROUND_TOPICS) {
            model.route = { path: topic.path } as ScreenRoute;
            await settle();

            expect(shownScreen().screen).toBe(editors[topic.key]);
        }
    });

    // AppRouter answers App.Router.GetRoute from the active layout's route, so the layout's route
    // has to follow a change the router makes itself.
    it("follows the router when the router changes route itself", async () => {
        const { model } = await mount(AppLayout, { id: "appLayout", route: { path: "/showcase/tokens" } });

        expect(model.router.setPath("/showcase/layout")).toBe(true);
        await settle();

        expect(model.route?.path).toBe("/showcase/layout");
        expect(shownScreen().topic).toBe("layout");
    });

    // BUG: `route` is a plain prop, bound two-way into the router's params (appLayout.tsx:33-36),
    // and nothing at that source rejects what the router's onChangingRoute refuses, as UECA's
    // re-convergence guidance asks. The router keeps its screen, but the layout keeps the refused
    // route, and the binding retries until UECA reports "did not settle". AppRouter then answers
    // GetRoute with a route that is not showing. Reachable: AppRouter assigns the raw route of any
    // path lookupRoute claims — see the external-address bug above. OtherLayout, bound through its
    // own struct, stays in step (otherLayout.test.tsx).
    it.fails("keeps its route in step with the router when the router refuses one", async () => {
        const { model } = await mount(AppLayout, { id: "appLayout", route: { path: "/showcase/layout" } });

        // The binding's retries run on timers; run them all rather than guess how long they take.
        vi.useFakeTimers();
        model.route = { path: "https://nekutuzov.github.io/ueca-react-doc/" } as unknown as ScreenRoute;
        await act(async () => { await vi.runAllTimersAsync(); });
        vi.useRealTimers();
        const errors = takeUecaErrors();

        expect(model.route).toEqual(model.router.route);
        expect(errors).toEqual([]);
    });
});
