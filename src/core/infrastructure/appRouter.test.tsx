import { describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { AppBrowsingHistory, AppRoute, AppRouter, appMessageBus } from "@core";
import { mount, settle, stubMessages } from "@test";

// The real screens are heavy and not what is under test: each route renders a stand-in that
// reports which screen id (and topic) the route table asked for. The topic lists stay real —
// the side bar's menu reads them.
vi.mock("@screens", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@screens")>();
    const React = await import("react");
    const standIn = (props: { id: string; topic?: string }) =>
        React.createElement("div", { "data-testid": "screen", "data-screen": props.id, "data-topic": props.topic });
    return {
        ...actual,
        HomeScreen: standIn,
        ShowcaseScreen: standIn,
        ButtonPlayground: standIn,
        TextFieldPlayground: standIn,
        TablePlayground: standIn
    };
});

const ORIGIN = "http://localhost:5001";
const BASE = "/ueca-react-app-demo2";

type Address = { path: string; section?: string };

function shownScreen() {
    return screen.queryByTestId("screen")?.getAttribute("data-screen");
}

async function goToRoute(route: AppRoute) {
    let result: boolean;
    await act(async () => { result = await appMessageBus.unicast("App.Router.GoToRoute", route); });
    await settle();
    return result;
}

async function setRoute(route: AppRoute) {
    let result: boolean;
    await act(async () => { result = await appMessageBus.unicast("App.Router.SetRoute", route); });
    await settle();
    return result;
}

async function setRouteParams(p: { params?: Record<string, unknown>; patch?: boolean; section?: string }) {
    await act(async () => { await appMessageBus.unicast("App.Router.SetRouteParams", p); });
    await settle();
}

async function onNavigate(p: Address) {
    let result: boolean;
    await act(async () => { result = await appMessageBus.unicast("App.BrowsingHistory.OnNavigate", p); });
    await settle();
    return result;
}

async function getRoute() {
    return await appMessageBus.unicast("App.Router.GetRoute");
}

// Answers the browsing-history side with mocks and mounts the router, which resolves its
// startup route from `address`.
async function mountRouter(address: Address = { path: "/home" }) {
    const history = {
        "App.BrowsingHistory.GetActiveAddress": vi.fn(async () => address),
        "App.BrowsingHistory.Open": vi.fn(async () => { }),
        "App.BrowsingHistory.Replace": vi.fn(async () => { }),
        "App.BrowsingHistory.ResolveRoute": vi.fn(async (): Promise<string> => undefined)
    };
    const afterRouteChange = vi.fn(async () => { });
    await stubMessages({ ...history, "App.Router.AfterRouteChange": afterRouteChange });
    const result = await mount(AppRouter, { id: "router" });
    return { ...result, history, afterRouteChange };
}

// Stands in for the screens and services that guard navigation.
async function guard(answer: (route: AppRoute) => boolean | undefined) {
    const handler = vi.fn(async (route: AppRoute) => answer(route));
    await stubMessages({ "App.Router.BeforeRouteChange": handler });
    return handler;
}

describe("AppRouter", () => {
    describe("startup", () => {
        // Carrying the section is what lets a link to an anchor survive being opened cold: the
        // startup Replace rebuilds the URL from this route.
        it("shows the screen for the address and replaces its entry, anchor included", async () => {
            const { model, history, afterRouteChange } = await mountRouter({ path: "/showcase/data", section: "table" });

            expect(shownScreen()).toBe("showcase-data");
            expect(screen.getByTestId("screen")).toHaveAttribute("data-topic", "data");
            expect(model._activeLayout?.id).toBe("appLayout");
            expect(history["App.BrowsingHistory.Replace"]).toHaveBeenCalledExactlyOnceWith({
                path: expect.objectContaining({ path: "/showcase/data", section: "table" })
            });
            expect(history["App.BrowsingHistory.Open"]).not.toHaveBeenCalled();
            expect(afterRouteChange).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ path: "/showcase/data", section: "table" }));
        });

        it("renders the app layout around the screen", async () => {
            await mountRouter({ path: "/home" });

            expect(document.getElementById("router.appLayout")).toContainElement(screen.getByTestId("screen"));
            expect(document.getElementById("router.appLayout.sideBar")).toBeInTheDocument();
        });

        it("routes an address the other layout owns with a history entry", async () => {
            const { history } = await mountRouter({ path: "https://github.com/nekutuzov/ueca-react-app-demo2" });

            expect(history["App.BrowsingHistory.Open"]).toHaveBeenCalledExactlyOnceWith({
                path: expect.objectContaining({ path: "https://github.com/nekutuzov/ueca-react-app-demo2" })
            });
            expect(history["App.BrowsingHistory.Replace"]).not.toHaveBeenCalled();
            expect((await getRoute()).path).toBe("https://github.com/nekutuzov/ueca-react-app-demo2");
        });

        it.each([
            ["an unknown address", "/no/such/page"],
            ["an address outside the app", ""]
        ])("falls back to the default screen for %s", async (_case, path) => {
            const { history } = await mountRouter({ path, section: "ignored" });

            expect(shownScreen()).toBe("homeScreen");
            expect(history["App.BrowsingHistory.Replace"]).toHaveBeenCalledExactlyOnceWith({ path: { path: "/" } });
            expect(await getRoute()).toEqual({ path: "/" });
        });

        it("shows no layout while no route has been allowed, and recovers on the next navigation", async () => {
            let allow = false;
            await guard(() => allow);
            const { model } = await mountRouter({ path: "/playground/button" });

            expect(model._activeLayout).toBeUndefined();
            expect(document.getElementById("router.appLayout")).toBeNull();
            expect(await getRoute()).toEqual({});

            allow = true;
            await goToRoute({ path: "/playground/button" });
            expect(shownScreen()).toBe("playground-button");
        });

        it("answers nothing about the route and patches nothing before the startup route is known", async () => {
            let answer: (address: Address) => void;
            const history = {
                "App.BrowsingHistory.GetActiveAddress": vi.fn(() => new Promise<Address>((resolve) => { answer = resolve; })),
                "App.BrowsingHistory.Open": vi.fn(async () => { }),
                "App.BrowsingHistory.Replace": vi.fn(async () => { })
            };
            await stubMessages(history);
            // Not mount(): it waits for init, which is waiting for the address.
            render(<AppRouter id="router" />);
            await settle();

            expect(await getRoute()).toEqual({});
            await setRouteParams({ params: { tab: "x" }, section: "s" });
            expect(history["App.BrowsingHistory.Open"]).not.toHaveBeenCalled();
            expect(history["App.BrowsingHistory.Replace"]).not.toHaveBeenCalled();

            await act(async () => { answer({ path: "/home" }); });
            await settle();
            expect(shownScreen()).toBe("homeScreen");
        });
    });

    describe("GoToRoute and SetRoute", () => {
        it("GoToRoute opens a history entry and shows the screen", async () => {
            const { history, afterRouteChange } = await mountRouter();
            afterRouteChange.mockClear();

            expect(await goToRoute({ path: "/playground/button" })).toBe(true);

            expect(shownScreen()).toBe("playground-button");
            expect(history["App.BrowsingHistory.Open"]).toHaveBeenCalledExactlyOnceWith({ path: { path: "/playground/button" } });
            expect(history["App.BrowsingHistory.Replace"]).toHaveBeenCalledOnce(); // startup only
            expect(afterRouteChange).toHaveBeenCalledExactlyOnceWith({ path: "/playground/button" });
            expect(await getRoute()).toEqual({ path: "/playground/button" });
        });

        it("SetRoute replaces the history entry instead", async () => {
            const { history } = await mountRouter();
            history["App.BrowsingHistory.Replace"].mockClear();

            expect(await setRoute({ path: "/playground/table" })).toBe(true);

            expect(shownScreen()).toBe("playground-table");
            expect(history["App.BrowsingHistory.Replace"]).toHaveBeenCalledExactlyOnceWith({ path: { path: "/playground/table" } });
            expect(history["App.BrowsingHistory.Open"]).not.toHaveBeenCalled();
        });

        it("sends an unknown route to the default screen", async () => {
            const { history } = await mountRouter({ path: "/playground/button" });
            const before = await guard(() => true);

            expect(await goToRoute({ path: "/retired/page" } as never)).toBe(true);

            expect(shownScreen()).toBe("homeScreen");
            expect(before).toHaveBeenCalledWith({ path: "/" });
            expect(history["App.BrowsingHistory.Open"]).toHaveBeenCalledExactlyOnceWith({ path: { path: "/" } });
        });

        // Isolates the object, so a caller changing its route afterwards cannot move the app.
        it("keeps its own copy of the route it was given", async () => {
            await mountRouter();
            const route = { path: "/showcase/data", params: { tab: "a" }, section: "top" } as AppRoute;
            await goToRoute(route);

            route.path = "/playground/table";
            (route.params as Record<string, string>).tab = "b";
            route.section = "bottom";

            expect(await getRoute()).toEqual({ path: "/showcase/data", params: { tab: "a" }, section: "top" });
            expect(shownScreen()).toBe("showcase-data");
        });

        it("GetRoute hands out a copy of the active route", async () => {
            await mountRouter({ path: "/showcase/data", section: "table" });
            const copy = await getRoute();

            copy.path = "/playground/table";
            copy.section = "elsewhere";

            expect(await getRoute()).toEqual(expect.objectContaining({ path: "/showcase/data", section: "table" }));
        });

        // Regression: an absolute URL is an OtherLayout route, so GoToRoute made OtherLayout — whose
        // routes render nothing — the active layout, while AppBrowsingHistory diverted the foreign URL
        // to a new tab. The screen on show was replaced by a blank page. appRoutes.tsx: "an absolute URL
        // opens in a new tab and never mounts OtherLayout".
        it("opens an external route without blanking the screen on show", async () => {
            document.head.appendChild(Object.assign(document.createElement("base"), { href: `${BASE}/` }));
            history.replaceState(null, "", `${BASE}/home`);
            await mount(AppBrowsingHistory, { id: "history" });
            const { model } = await mount(AppRouter, { id: "router" });
            const newTab = vi.spyOn(window, "open");

            await goToRoute({ path: "https://github.com/nekutuzov/ueca-react-app-demo2" });

            expect(newTab).toHaveBeenCalledWith("https://github.com/nekutuzov/ueca-react-app-demo2", "_blank", "noopener,noreferrer");
            expect(model._activeLayout?.id).toBe("appLayout");
            expect(shownScreen()).toBe("homeScreen");
        });

        // Nothing on show is left, so there is nothing for a guard to veto or to announce.
        it.each([
            ["GoToRoute", goToRoute],
            ["SetRoute", setRoute]
        ])("%s to a foreign address opens a new tab, asking no guard and announcing nothing", async (_message, send) => {
            const { history, afterRouteChange } = await mountRouter({ path: "/showcase/data" });
            const beforeRouteChange = await guard(() => false);
            afterRouteChange.mockClear();

            expect(await send({ path: "mailto:cranesoft@protonmail.com" })).toBe(true);

            expect(history["App.BrowsingHistory.Open"]).toHaveBeenLastCalledWith({ path: { path: "mailto:cranesoft@protonmail.com" }, newTab: true });
            expect(history["App.BrowsingHistory.Replace"]).not.toHaveBeenCalledWith({ path: { path: "mailto:cranesoft@protonmail.com" } });
            expect(beforeRouteChange).not.toHaveBeenCalled();
            expect(afterRouteChange).not.toHaveBeenCalled();
            expect(shownScreen()).toBe("showcase-data");
        });
    });

    describe("BeforeRouteChange", () => {
        // A BROADCAST: the active CRUD screen vetoes on unsaved changes while the tooltip just
        // closes, and unicast would throw on the second subscriber.
        it("asks every subscriber, with the route about to be shown", async () => {
            await mountRouter();
            const first = await guard(() => true);
            const second = await guard(() => true);

            await goToRoute({ path: "/showcase/lists", section: "virtual" });

            expect(first).toHaveBeenCalledExactlyOnceWith({ path: "/showcase/lists", section: "virtual" });
            expect(second).toHaveBeenCalledExactlyOnceWith({ path: "/showcase/lists", section: "virtual" });
            expect(shownScreen()).toBe("showcase-lists");
        });

        // A subscriber that returns nothing reacted to the navigation rather than judging it;
        // testing for truthiness would let one plain `return;` freeze routing app-wide.
        it("proceeds when subscribers answer true or nothing at all", async () => {
            await mountRouter();
            await guard(() => undefined);
            await guard(() => true);

            expect(await goToRoute({ path: "/playground/button" })).toBe(true);

            expect(shownScreen()).toBe("playground-button");
        });

        it("is vetoed by a single explicit false, leaving everything as it was", async () => {
            const { history, afterRouteChange } = await mountRouter({ path: "/home" });
            await guard(() => true);
            await guard(() => false);
            afterRouteChange.mockClear();

            expect(await goToRoute({ path: "/playground/button" })).toBe(false);
            expect(await setRoute({ path: "/playground/table" })).toBe(false);

            expect(shownScreen()).toBe("homeScreen");
            expect(await getRoute()).toEqual(expect.objectContaining({ path: "/home" }));
            expect(history["App.BrowsingHistory.Open"]).not.toHaveBeenCalled();
            expect(history["App.BrowsingHistory.Replace"]).toHaveBeenCalledOnce(); // startup only
            expect(afterRouteChange).not.toHaveBeenCalled();
        });

        it("announces AfterRouteChange only once the new route is the active one", async () => {
            await mountRouter();
            const seen: AppRoute[] = [];
            await stubMessages({
                "App.Router.AfterRouteChange": vi.fn(async () => { seen.push(await getRoute()); })
            });

            await goToRoute({ path: "/playground/text-field" });

            expect(seen).toEqual([{ path: "/playground/text-field" }]);
        });
    });

    // Patches the address of the screen on show: everything writes THROUGH the live route, because
    // assigning a new route would tear the mounted screen down.
    describe("SetRouteParams", () => {
        it("patches or replaces the params with a Replace, silently and without rebuilding the screen", async () => {
            const { history, afterRouteChange } = await mountRouter({ path: "/showcase/data" });
            const screenElement = screen.getByTestId("screen");
            history["App.BrowsingHistory.Replace"].mockClear();
            afterRouteChange.mockClear();

            await setRouteParams({ params: { sort: "name" } });
            expect((await getRoute()).params).toEqual({ sort: "name" });

            await setRouteParams({ params: { page: 2 }, patch: true });
            expect((await getRoute()).params).toEqual({ sort: "name", page: 2 });
            expect(history["App.BrowsingHistory.Replace"]).toHaveBeenLastCalledWith({
                path: { path: "/showcase/data", params: { sort: "name", page: 2 } }
            });

            await setRouteParams({ params: { filter: "x" } });
            expect((await getRoute()).params).toEqual({ filter: "x" });

            expect(history["App.BrowsingHistory.Replace"]).toHaveBeenCalledTimes(3);
            expect(history["App.BrowsingHistory.Open"]).not.toHaveBeenCalled();
            expect(afterRouteChange).not.toHaveBeenCalled();
            expect(screen.getByTestId("screen")).toBe(screenElement);
        });

        // A section the user moved to earns a history entry, so Back returns to the anchor left.
        it("opens a history entry for a new section and announces it", async () => {
            const { history, afterRouteChange } = await mountRouter({ path: "/showcase/data", section: "intro" });
            const screenElement = screen.getByTestId("screen");
            const before = await guard(() => true);
            afterRouteChange.mockClear();

            await setRouteParams({ section: "table" });

            expect(history["App.BrowsingHistory.Open"]).toHaveBeenCalledExactlyOnceWith({
                path: { path: "/showcase/data", params: {}, section: "table" }
            });
            expect(afterRouteChange).toHaveBeenCalledExactlyOnceWith({ path: "/showcase/data", params: {}, section: "table" });
            expect((await getRoute()).section).toBe("table");
            // Moving within the screen is not a navigation away from it.
            expect(before).not.toHaveBeenCalled();
            expect(screen.getByTestId("screen")).toBe(screenElement);
        });

        it("treats clearing the section as a move, and the same section again as a patch", async () => {
            const { history, afterRouteChange } = await mountRouter({ path: "/showcase/data", section: "intro" });
            history["App.BrowsingHistory.Replace"].mockClear();
            afterRouteChange.mockClear();

            await setRouteParams({ section: "intro" });
            expect(history["App.BrowsingHistory.Replace"]).toHaveBeenCalledOnce();
            expect(history["App.BrowsingHistory.Open"]).not.toHaveBeenCalled();
            expect(afterRouteChange).not.toHaveBeenCalled();

            await setRouteParams({ section: undefined });
            expect(history["App.BrowsingHistory.Open"]).toHaveBeenCalledOnce();
            expect(afterRouteChange).toHaveBeenCalledOnce();
            expect((await getRoute()).section).toBeUndefined();
        });

        it("patches params and moves to a section in one step", async () => {
            const { history } = await mountRouter({ path: "/showcase/data" });

            await setRouteParams({ params: { sort: "name" }, patch: true, section: "table" });

            expect(history["App.BrowsingHistory.Open"]).toHaveBeenCalledExactlyOnceWith({
                path: { path: "/showcase/data", params: { sort: "name" }, section: "table" }
            });
        });
    });

    // Back and Forward land here.
    describe("App.BrowsingHistory.OnNavigate", () => {
        it("routes to the address as a true navigation, restoring its anchor", async () => {
            const { history, afterRouteChange } = await mountRouter({ path: "/home" });
            const before = await guard(() => true);
            afterRouteChange.mockClear();

            expect(await onNavigate({ path: "/playground/table", section: "rows" })).toBe(true);

            expect(shownScreen()).toBe("playground-table");
            const route = expect.objectContaining({ path: "/playground/table", section: "rows" });
            expect(before).toHaveBeenCalledExactlyOnceWith(route);
            expect(history["App.BrowsingHistory.Open"]).toHaveBeenCalledExactlyOnceWith({ path: route });
            expect(afterRouteChange).toHaveBeenCalledExactlyOnceWith(route);
        });

        // An earlier version short-circuited a section-only Back into a patch; history traversal is
        // navigation, so the guard still gets its say.
        it("treats a Back that only moves the anchor as a navigation too", async () => {
            await mountRouter({ path: "/showcase/data", section: "table" });
            const before = await guard(() => true);

            await onNavigate({ path: "/showcase/data", section: "intro" });

            expect(before).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ path: "/showcase/data", section: "intro" }));
            expect((await getRoute()).section).toBe("intro");
        });

        it("resolves a path the other layout owns", async () => {
            const { history } = await mountRouter({ path: "/home" });

            await onNavigate({ path: "https://github.com/nekutuzov/ueca-react-app-demo2" });

            expect(history["App.BrowsingHistory.Open"]).toHaveBeenCalledExactlyOnceWith({
                path: expect.objectContaining({ path: "https://github.com/nekutuzov/ueca-react-app-demo2" })
            });
        });

        // The default-screen fallback inside the navigation has already handled an unknown path;
        // falling through would navigate a second time.
        it("sends an unknown path to the default screen exactly once", async () => {
            const { history } = await mountRouter({ path: "/playground/button" });

            expect(await onNavigate({ path: "/gone", section: "x" })).toBe(true);

            expect(shownScreen()).toBe("homeScreen");
            expect(history["App.BrowsingHistory.Open"]).toHaveBeenCalledExactlyOnceWith({ path: { path: "/" } });
        });

        it("answers false when the navigation is vetoed", async () => {
            const { history } = await mountRouter({ path: "/home" });
            await guard(() => false);

            expect(await onNavigate({ path: "/playground/table" })).toBe(false);

            expect(shownScreen()).toBe("homeScreen");
            expect(history["App.BrowsingHistory.Open"]).not.toHaveBeenCalled();
        });
    });

    describe("delegation", () => {
        it("OpenNewTab asks the history for a new tab without leaving the screen on show", async () => {
            const { history } = await mountRouter({ path: "/home" });
            const before = await guard(() => true);

            await act(async () => { await appMessageBus.unicast("App.Router.OpenNewTab", { path: "https://www.npmjs.com/package/ueca-react" }); });

            expect(history["App.BrowsingHistory.Open"]).toHaveBeenCalledExactlyOnceWith({
                path: { path: "https://www.npmjs.com/package/ueca-react" },
                newTab: true
            });
            expect(before).not.toHaveBeenCalled();
            expect(shownScreen()).toBe("homeScreen");
        });

        it("ResolveRoute answers with the history's resolution of the route", async () => {
            const { history } = await mountRouter();
            history["App.BrowsingHistory.ResolveRoute"].mockResolvedValue(`${ORIGIN}${BASE}/playground/table`);

            const href = await appMessageBus.unicast("App.Router.ResolveRoute", { path: "/playground/table" });

            expect(href).toBe(`${ORIGIN}${BASE}/playground/table`);
            expect(history["App.BrowsingHistory.ResolveRoute"]).toHaveBeenCalledWith({ path: "/playground/table" });
        });
    });

    // Against the real AppBrowsingHistory.
    describe("with the browsing history", () => {
        async function mountWithHistory(url: string) {
            document.head.appendChild(Object.assign(document.createElement("base"), { href: `${BASE}/` }));
            history.replaceState(null, "", url);
            await mount(AppBrowsingHistory, { id: "history" });
            return await mount(AppRouter, { id: "router" });
        }

        it("opens a deep link to an anchor cold, keeping the anchor in the address", async () => {
            const before = history.length;

            await mountWithHistory(`${BASE}/showcase/lists#virtual`);

            expect(shownScreen()).toBe("showcase-lists");
            expect(location.href).toBe(`${ORIGIN}${BASE}/showcase/lists#virtual`);
            expect(history.length).toBe(before);
        });

        it("moves the address with each navigation and follows Back to the previous screen", async () => {
            history.pushState(null, "", location.href);
            await mountWithHistory(`${BASE}/home`);

            await goToRoute({ path: "/playground/button" });
            expect(location.pathname).toBe(`${BASE}/playground/button`);

            await setRouteParams({ section: "props" });
            expect(location.hash).toBe("#props");

            const popped = new Promise<void>((resolve) => window.addEventListener("popstate", () => resolve(), { once: true }));
            history.back();
            await act(async () => { await popped; });
            await settle();
            expect(location.hash).toBe("");
            expect((await getRoute()).section).toBeUndefined();
            expect(shownScreen()).toBe("playground-button");
        });
    });
});
