import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import * as UECA from "ueca-react";
import { AnyRoute } from "@components";
import { AppBrowsingHistory, appMessageBus } from "@core";
import { mount, settle, stubMessages } from "@test";

const ORIGIN = "http://localhost:5001";
const BASE = "/ueca-react-app-demo2";

type Handlers = Parameters<typeof stubMessages>[0];

function addBase(href = `${BASE}/`) {
    const base = document.createElement("base");
    base.setAttribute("href", href);
    document.head.appendChild(base);
}

// Puts the browser at an address without navigating.
function at(url: string, state: unknown = null) {
    history.replaceState(state, "", url);
}

function currentIndex(): number {
    return history.state?.index;
}

async function address() {
    return await appMessageBus.unicast("App.BrowsingHistory.GetActiveAddress");
}

async function open(path: AnyRoute | string, newTab?: boolean) {
    await act(async () => { await appMessageBus.unicast("App.BrowsingHistory.Open", { path, newTab }); });
}

async function replace(path: AnyRoute | string) {
    await act(async () => { await appMessageBus.unicast("App.BrowsingHistory.Replace", { path }); });
    await settle();
}

async function setPageTitle(title: string) {
    await act(async () => { await appMessageBus.unicast("App.BrowsingHistory.SetPageTitle", title); });
}

// Simulates the browser arriving at a history entry: the address and state change first, then
// popstate fires.
async function arrive(url: string, state: unknown) {
    history.replaceState(state, "", url);
    await act(async () => { window.dispatchEvent(new PopStateEvent("popstate", { state })); });
    await settle();
}

// A real traversal through jsdom's session history, which moves asynchronously and then fires
// popstate.
async function traverse(move: () => void) {
    const popped = new Promise<void>((resolve) => window.addEventListener("popstate", () => resolve(), { once: true }));
    move();
    await act(async () => { await popped; });
    await settle();
}

// Answers App.GetInfo (unless appName is null) and App.BrowsingHistory.OnNavigate (unless
// onNavigate is null), then mounts the service.
async function mountHistory(options: {
    appName?: string | null;
    onNavigate?: ((p: { path: string; section?: string }) => Promise<boolean>) | null;
} = {}) {
    const navigate = options.onNavigate === null ? undefined : vi.fn(options.onNavigate ?? (async () => true));
    const handlers: Handlers = {};
    if (options.appName !== null) {
        handlers["App.GetInfo"] = vi.fn(async () => ({ appName: options.appName ?? "Showcase", appVersion: "3.0" }));
    }
    if (navigate) {
        handlers["App.BrowsingHistory.OnNavigate"] = navigate;
    }
    await stubMessages(handlers);
    const result = await mount(AppBrowsingHistory, { id: "history" });
    return { ...result, navigate };
}

describe("AppBrowsingHistory", () => {
    beforeEach(() => {
        // A previous test may have traversed back; a push makes the current entry the top of the
        // session history again, so every test starts from the same shape.
        history.pushState(null, "", location.href);
        addBase();
    });

    describe("active address", () => {
        // AppRouter resolves the startup route from its own init, and init hooks are not ordered
        // between models: syncing in init instead dropped every deep link onto the default screen.
        it("is established in constr, before any model's init runs", async () => {
            at(`${BASE}/showcase/overview?tab=2#props`);
            let atConstr: { path: string; section: string };

            await mount(AppBrowsingHistory, {
                id: "history",
                constr: (m) => { atConstr = { path: m.getActivePath(), section: m.getActiveSection() }; }
            });

            expect(atConstr).toEqual({ path: "/showcase/overview?tab=2", section: "props" });
        });

        it.each([
            ["with a trailing slash", `${BASE}/`, `${BASE}/playground/table`, "/playground/table"],
            ["without a trailing slash", BASE, `${BASE}/playground/table`, "/playground/table"],
            ["at the site root", "/", "/playground/table", "/playground/table"]
        ])("strips a <base> %s from the path", async (_case, baseHref, url, path) => {
            document.head.querySelectorAll("base").forEach((b) => b.remove());
            addBase(baseHref);
            at(url);

            const { model } = await mountHistory();

            expect(model.getActivePath()).toBe(path);
        });

        it("decodes the query and the fragment", async () => {
            at(`${BASE}/search?q=a%20b#my%20section`);

            const { model } = await mountHistory();

            expect(model.getActivePath()).toBe("/search?q=a b");
            expect(model.getActiveSection()).toBe("my section");
        });

        it.each([`${BASE}/article`, `${BASE}/article#`])("has no section at %s", async (url) => {
            at(url);

            const { model } = await mountHistory();

            expect(model.getActiveSection()).toBeUndefined();
        });

        it("reports no path for a location outside the base", async () => {
            at("/elsewhere/page#top");

            const { model } = await mountHistory();

            expect(model.getActivePath()).toBe("");
            expect(model.getActiveSection()).toBeUndefined();
        });

        it("falls back to an empty base, with a notice, when <base> is missing", async () => {
            document.head.querySelectorAll("base").forEach((b) => b.remove());
            const info = vi.spyOn(console, "info").mockImplementation(() => { });
            at(`${BASE}/home`);

            const { model } = await mountHistory();

            expect(info).toHaveBeenCalledWith(expect.stringContaining("<base> element is missing"));
            expect(model.getActivePath()).toBe(`${BASE}/home`);
        });

        it("GetActiveAddress answers the path and the section in one reply", async () => {
            at(`${BASE}/showcase/data#table`);
            await mountHistory();

            expect(await address()).toEqual({ path: "/showcase/data", section: "table" });
        });
    });

    describe("Open", () => {
        it("pushes an entry for a route, resolved against the base, and syncs the address", async () => {
            at(`${BASE}/start`);
            await mountHistory();
            const before = history.length;

            await open({ path: "/items/:id?:tab", params: { id: 7, tab: "notes" }, section: "history" });

            expect(location.href).toBe(`${ORIGIN}${BASE}/items/7?tab=notes#history`);
            expect(history.length).toBe(before + 1);
            // The new entry's index is its position in the session history.
            expect(history.state).toEqual({ index: before });
            expect(await address()).toEqual({ path: "/items/7?tab=notes", section: "history" });
        });

        it.each([
            ["an app-relative path, under the base", "/playground/table", `${ORIGIN}${BASE}/playground/table`, "/playground/table"],
            ["an origin-root path, without the base", "//docs/start", `${ORIGIN}/docs/start`, ""],
            ["an absolute URL on this origin", `${ORIGIN}${BASE}/home?x=1`, `${ORIGIN}${BASE}/home?x=1`, "/home?x=1"]
        ])("resolves a string that is %s", async (_case, path, href, activePath) => {
            at(`${BASE}/start`);
            await mountHistory();

            await open(path);

            expect(location.href).toBe(href);
            expect((await address()).path).toBe(activePath);
        });

        it("does nothing when the route resolves to the address already showing", async () => {
            at(`${BASE}/items/7#notes`);
            await mountHistory();
            const before = history.length;
            const push = vi.spyOn(history, "pushState");

            await open({ path: "/items/:id", params: { id: 7 }, section: "notes" });

            expect(push).not.toHaveBeenCalled();
            expect(history.length).toBe(before);
        });

        // pushState cannot move the document to another origin, so a foreign URL always becomes a
        // new tab — with noopener, so the opened page gets no live window.opener.
        it("opens a foreign origin in a new tab instead of pushing", async () => {
            at(`${BASE}/start`);
            await mountHistory();
            const before = history.length;
            const newTab = vi.spyOn(window, "open");

            await open({ path: "https://example.com/docs?x=1" });

            expect(newTab).toHaveBeenCalledExactlyOnceWith("https://example.com/docs?x=1", "_blank", "noopener,noreferrer");
            expect(location.href).toBe(`${ORIGIN}${BASE}/start`);
            expect(history.length).toBe(before);
        });

        it("opens a route in a new tab when asked, leaving this tab's history alone", async () => {
            at(`${BASE}/start`);
            await mountHistory();
            const before = history.length;
            const newTab = vi.spyOn(window, "open");

            await open({ path: "/items/:id", params: { id: 3 } }, true);

            expect(newTab).toHaveBeenCalledExactlyOnceWith(`${ORIGIN}${BASE}/items/3`, "_blank", "noopener,noreferrer");
            expect(location.href).toBe(`${ORIGIN}${BASE}/start`);
            expect(history.length).toBe(before);
        });

        // BUG: a string route is handed to window.open as it is (appBrowsingHistory.ts:106-114), so
        // "/home" opens at the origin root instead of under the app's base, and "//docs/x" becomes
        // a protocol-relative URL on host "docs". routeURL.ts: a bare string must still be resolved
        // "rather than using the string directly".
        it.fails("opens an app-relative string path in a new tab inside the app", async () => {
            at(`${BASE}/start`);
            await mountHistory();
            const newTab = vi.spyOn(window, "open");

            await open("/home", true);

            const [url] = newTab.mock.calls[0];
            expect(new URL(String(url), document.baseURI).href).toBe(`${ORIGIN}${BASE}/home`);
        });

        it("rejects a route whose path parameter has no value, and stays put", async () => {
            at(`${BASE}/start`);
            await mountHistory();

            await expect(appMessageBus.unicast("App.BrowsingHistory.Open", { path: { path: "/items/:id" } }))
                .rejects.toThrow('URL parameter "id" cannot be null');
            expect(location.href).toBe(`${ORIGIN}${BASE}/start`);
        });

        it("omits a query parameter whose value is undefined, as ResolveRoute does", async () => {
            at(`${BASE}/start`);
            await mountHistory();
            const route = { path: "/x?:tab", params: { tab: undefined } };

            await open(route);

            expect(location.href).toBe(`${ORIGIN}${BASE}/x`);
            expect(await appMessageBus.unicast("App.BrowsingHistory.ResolveRoute", route)).toBe(location.href);
        });

        // Regression: navigation resolved through a private copy of the pre-fix rules instead of
        // routeURL.ts, where a null parameter counts as absent. ResolveRoute gave the link an href,
        // but following it threw "Cannot read properties of null (reading 'toString')".
        it("omits a query parameter whose value is null, as ResolveRoute does", async () => {
            at(`${BASE}/start`);
            await mountHistory();
            const route = { path: "/x?:tab", params: { tab: null } };
            const href = await appMessageBus.unicast("App.BrowsingHistory.ResolveRoute", route);

            await open(route);

            expect(href).toBe(`${ORIGIN}${BASE}/x`);
            expect(location.href).toBe(href);
        });

        // Regression: same private copy — a null path parameter failed with a TypeError on toString()
        // instead of the error naming the parameter that routeToURL raises.
        it("rejects a null path parameter by name, as the strict resolver does", async () => {
            at(`${BASE}/start`);
            await mountHistory();

            await expect(appMessageBus.unicast("App.BrowsingHistory.Open", { path: { path: "/items/:id", params: { id: null } } }))
                .rejects.toThrow('URL parameter "id" cannot be null');
        });
    });

    describe("Replace", () => {
        it("rewrites the current entry in place, keeping its index", async () => {
            at(`${BASE}/start`);
            await mountHistory();
            const before = history.length;
            const index = currentIndex();

            await replace({ path: "/items/:id", params: { id: 1 }, section: "top" });

            expect(location.href).toBe(`${ORIGIN}${BASE}/items/1#top`);
            expect(history.length).toBe(before);
            expect(history.state).toEqual({ index });
            expect(await address()).toEqual({ path: "/items/1", section: "top" });
        });

        it("keeps the index an entry already carries and adopts it as the current one", async () => {
            at(`${BASE}/start`);
            await mountHistory({ onNavigate: async () => false });
            history.replaceState({ index: 42 }, "", location.href);
            const go = vi.spyOn(history, "go").mockImplementation(() => { });

            await replace({ path: "/items" });
            expect(history.state).toEqual({ index: 42 });

            // A vetoed Back to the entry before it now rolls forward from 42.
            await arrive(`${BASE}/previous`, { index: 41 });
            expect(go).toHaveBeenCalledExactlyOnceWith(1);
        });

        it("stamps an entry that carries no index with the current one", async () => {
            at(`${BASE}/start`);
            await mountHistory();
            const index = currentIndex();
            history.replaceState(null, "", `${location.href}#jump`);

            await replace({ path: "/items" });

            expect(history.state).toEqual({ index });
        });

        it("diverts a foreign origin to a new tab", async () => {
            at(`${BASE}/start`);
            await mountHistory();
            const newTab = vi.spyOn(window, "open");

            await replace({ path: "https://example.com/elsewhere" });

            expect(newTab).toHaveBeenCalledExactlyOnceWith("https://example.com/elsewhere", "_blank", "noopener,noreferrer");
            expect(location.href).toBe(`${ORIGIN}${BASE}/start`);
        });

        it("re-stamps the current address for an empty route", async () => {
            at(`${BASE}/start?x=1#here`);
            await mountHistory();

            await replace({ path: "" });

            expect(location.href).toBe(`${ORIGIN}${BASE}/start?x=1#here`);
        });

        // BUG: replace() uses a string route as it is (appBrowsingHistory.ts:120-130), so an
        // app-relative string reaches `new URL(url)` in _divertCrossOrigin without a base and throws
        // "Invalid URL" — where Open resolves the same string under the base.
        it.fails("resolves an app-relative string path the way Open does", async () => {
            at(`${BASE}/start`);
            await mountHistory();

            await replace("/home");

            expect(location.href).toBe(`${ORIGIN}${BASE}/home`);
        });
    });

    describe("ResolveRoute", () => {
        it.each([
            ["path and query parameters and a section", { path: "/items/:id?:tab", params: { id: 5, tab: "log" }, section: "top" }, `${ORIGIN}${BASE}/items/5?tab=log#top`],
            ["an absolute URL, which the base never touches", { path: "https://example.com/a?b=1" }, "https://example.com/a?b=1"],
            ["an origin-root path, without the base", { path: "//other/page" }, `${ORIGIN}/other/page`],
            ["a route missing a path parameter, as undefined rather than an error", { path: "/items/:id" }, undefined],
            ["an empty route, as the current address", { path: "" }, ""]
        ])("resolves %s", async (_case, route, href) => {
            at(`${BASE}/start`);
            await mountHistory();

            expect(await appMessageBus.unicast("App.BrowsingHistory.ResolveRoute", route)).toBe(href);
            expect(location.href).toBe(`${ORIGIN}${BASE}/start`);
        });
    });

    describe("document title", () => {
        it("shows the app's name once App.GetInfo answers", async () => {
            document.title = "From index.html";
            at(`${BASE}/start`);

            await mountHistory({ appName: "UECA-React Showcase" });

            expect(document.title).toBe("UECA-React Showcase");
        });

        it("leaves the title from index.html alone while the app's name is unknown", async () => {
            document.title = "From index.html";
            at(`${BASE}/start`);
            await mountHistory({ appName: null });

            await setPageTitle("Table · Playground");
            await open("/other");

            expect(document.title).toBe("From index.html");
        });

        it("applies a page title that arrived before the app's name", async () => {
            document.title = "From index.html";
            at(`${BASE}/start`);
            type AppInfo = { appName: string; appVersion: string };
            let answer: (info: AppInfo) => void;
            await stubMessages({ "App.GetInfo": vi.fn(() => new Promise<AppInfo>((resolve) => { answer = resolve; })) });
            // Not mount(): it waits for init, which is waiting for App.GetInfo.
            render(<AppBrowsingHistory id="history" />);
            await settle();

            await setPageTitle("Button · Playground");
            expect(document.title).toBe("From index.html");

            await act(async () => { answer({ appName: "Showcase", appVersion: "3.0" }); });
            await settle();
            expect(document.title).toBe("Button · Playground — Showcase");
        });

        it("names the page only while the browser stays at the path it was given for", async () => {
            at(`${BASE}/playground/table`);
            await mountHistory();

            await setPageTitle("Table · Playground");
            expect(document.title).toBe("Table · Playground — Showcase");

            // The same page in another state, or at another anchor, keeps its name...
            await replace({ path: "/playground/table?rows=50" });
            await open({ path: "/playground/table?rows=50", section: "props" });
            expect(document.title).toBe("Table · Playground — Showcase");

            // ...a different page that names nothing gets the app's name alone.
            await open("/playground/button");
            expect(document.title).toBe("Showcase");
        });

        // On Back and Forward the router renders the new screen BEFORE the path is synced, so the
        // screen names itself while the page being left is still the active one.
        it("keeps the name a screen gives itself during Back/Forward, before the path syncs", async () => {
            at(`${BASE}/a`);
            const { model } = await mountHistory({
                onNavigate: async () => {
                    await appMessageBus.unicast("App.BrowsingHistory.SetPageTitle", "Page B");
                    return true;
                }
            });
            await setPageTitle("Page A");
            const index = currentIndex();

            await arrive(`${BASE}/b`, { index: index + 1 });

            expect(model.getActivePath()).toBe("/b");
            expect(document.title).toBe("Page B — Showcase");
        });
    });

    describe("history index", () => {
        // Regression: it was stamped 1 whatever its position — in a fresh tab, where it is entry 0,
        // the same index the page opened next was given.
        it("stamps the entry it starts on with its position when that entry carries no index", async () => {
            at(`${BASE}/start`);

            await mountHistory();

            expect(history.state).toEqual({ index: history.length - 1 });
        });

        // A reload keeps the entry's state, so the index it was given survives.
        it("keeps the index the entry it starts on already carries", async () => {
            at(`${BASE}/start`, { index: 7 });
            await mountHistory({ onNavigate: async () => false });
            const go = vi.spyOn(history, "go").mockImplementation(() => { });

            await arrive(`${BASE}/previous`, { index: 6 });

            expect(history.state).toEqual({ index: 6 });
            expect(go).toHaveBeenCalledExactlyOnceWith(1);
        });

        it("gives each opened entry the next index", async () => {
            at(`${BASE}/start`);
            await mountHistory();
            const before = history.length;

            await open("/a");
            await open("/b");

            expect(history.state).toEqual({ index: before + 1 });
        });

        it("rolls a vetoed Back forward to the entry it left, and a vetoed Forward back", async () => {
            at(`${BASE}/start`);
            const { navigate } = await mountHistory();
            await open("/b");
            await open("/c");

            navigate.mockResolvedValueOnce(true);
            await traverse(() => history.back());
            expect(location.pathname).toBe(`${BASE}/b`);

            const go = vi.spyOn(history, "go").mockImplementation(() => { });
            navigate.mockResolvedValueOnce(false);
            await traverse(() => history.forward());

            expect(go).toHaveBeenCalledExactlyOnceWith(-1);
        });

        // Regression: the entry the app starts on was stamped index 1 ("the top of the list")
        // whatever its real position, while opened entries were indexed by position. Arriving after
        // other pages in the same tab, a vetoed Back to that first entry rolled forward by the wrong
        // distance — here history.go(n > 1), which the browser ignores.
        it("rolls a vetoed Back to the entry the app started on forward by exactly one", async () => {
            // Pages visited in this tab before the app.
            history.pushState(null, "", "/elsewhere/1");
            history.pushState(null, "", "/elsewhere/2");
            at(`${BASE}/start`);
            const { navigate } = await mountHistory();
            await open("/b");
            const go = vi.spyOn(history, "go").mockImplementation(() => { });

            navigate.mockResolvedValueOnce(false);
            await traverse(() => history.back());

            expect(go).toHaveBeenCalledExactlyOnceWith(1);
        });

        // Regression: an opened entry was indexed by the history length before the push, and the
        // resync meant for a truncated history ran only when it was NOT truncated (it tested `=== 1`,
        // the normal case). After going Back and opening another page, the new entry kept the old
        // length as its index, so a vetoed Back from it rolled forward too far — history.go(2) from
        // an entry with one entry ahead of it.
        it("rolls a vetoed Back forward by exactly one after a page reached with Back was left", async () => {
            at(`${BASE}/start`);
            const { navigate } = await mountHistory();
            await open("/b");
            await open("/c");
            await traverse(() => history.back());
            await open("/d");
            const go = vi.spyOn(history, "go").mockImplementation(() => { });

            navigate.mockResolvedValueOnce(false);
            await traverse(() => history.back());

            expect(location.pathname).toBe(`${BASE}/b`);
            expect(go).toHaveBeenCalledExactlyOnceWith(1);
        });

        // Regression: a browser keeps a bounded history (50 entries in Chrome). Once it is full, a
        // push drops the oldest entry and history.length stops growing, so indexing opened entries by
        // the length gave each of them the same index, and a vetoed Back between two of them had no
        // distance to roll back by.
        it("rolls a vetoed Back forward by exactly one once the browser's history is full", async () => {
            at(`${BASE}/start`, { index: 49 });
            const { navigate } = await mountHistory();
            vi.spyOn(history, "length", "get").mockReturnValue(50);
            await open("/b");
            await open("/c");
            const go = vi.spyOn(history, "go").mockImplementation(() => { });

            navigate.mockResolvedValueOnce(false);
            await traverse(() => history.back());

            expect(location.pathname).toBe(`${BASE}/b`);
            expect(go).toHaveBeenCalledExactlyOnceWith(1);
        });
    });

    describe("browser navigation", () => {
        beforeEach(() => {
            // "Unexpected condition" is logged on the same-index paths below.
            vi.spyOn(console, "warn").mockImplementation(() => { });
        });

        it("asks OnNavigate and follows an allowed navigation", async () => {
            at(`${BASE}/a`);
            const { model, navigate } = await mountHistory();
            const index = currentIndex();

            await arrive(`${BASE}/b?x=1#part`, { index: index + 1 });

            expect(navigate).toHaveBeenCalledExactlyOnceWith({ path: "/b?x=1", section: "part" });
            expect(model.getActivePath()).toBe("/b?x=1");
            expect(model.getActiveSection()).toBe("part");
        });

        it("adopts the index of the entry it followed", async () => {
            at(`${BASE}/a`);
            const { navigate } = await mountHistory();
            const index = currentIndex();
            await arrive(`${BASE}/b`, { index: index + 3 });

            // The same entry again is no longer a move.
            await arrive(`${BASE}/b`, { index: index + 3 });

            expect(navigate).toHaveBeenCalledOnce();
        });

        it("follows the navigation when nobody answers OnNavigate", async () => {
            at(`${BASE}/a`);
            const { model } = await mountHistory({ onNavigate: null });

            await arrive(`${BASE}/b`, { index: currentIndex() + 1 });

            expect(model.getActivePath()).toBe("/b");
        });

        it("skips an entry at the current index that shows the current address", async () => {
            at(`${BASE}/a?x=1#s`);
            const { navigate } = await mountHistory();

            await arrive(`${BASE}/a?x=1#s`, { index: currentIndex() });

            expect(navigate).not.toHaveBeenCalled();
        });

        // Two entries on one article differing only by their anchor are different addresses.
        it("does not skip an entry at the current index whose section differs", async () => {
            at(`${BASE}/a#one`);
            const { model, navigate } = await mountHistory();

            await arrive(`${BASE}/a#two`, { index: currentIndex() });

            expect(navigate).toHaveBeenCalledExactlyOnceWith({ path: "/a", section: "two" });
            expect(model.getActiveSection()).toBe("two");
        });

        // A hash-only navigation, or an entry pushed from outside the app, arrives unstamped.
        it("stamps an entry that arrives without an index with the current one", async () => {
            at(`${BASE}/a`);
            const { navigate } = await mountHistory();
            const index = currentIndex();

            await arrive(`${BASE}/a#jump`, null);

            expect(history.state).toEqual({ index });
            expect(navigate).toHaveBeenCalledExactlyOnceWith({ path: "/a", section: "jump" });
        });

        it.each([
            ["a Back", -1, 1],
            ["a Forward past two entries", 2, -2]
        ])("rolls %s back when the navigation is vetoed", async (_case, offset, delta) => {
            at(`${BASE}/a`);
            const { model } = await mountHistory({ onNavigate: async () => false });
            const go = vi.spyOn(history, "go").mockImplementation(() => { });

            await arrive(`${BASE}/b`, { index: currentIndex() + offset });

            expect(go).toHaveBeenCalledExactlyOnceWith(delta);
            expect(model.getActivePath()).toBe("/a");
        });

        // history.go(0) would reload the page and discard the very state the veto protects.
        it("restores the URL in place, never with history.go(0), when a vetoed entry is no distance away", async () => {
            at(`${BASE}/a?x=1`);
            const { model } = await mountHistory({ onNavigate: async () => false });
            const index = currentIndex();
            const go = vi.spyOn(history, "go").mockImplementation(() => { });

            await arrive(`${BASE}/a?x=1#elsewhere`, null);

            expect(go).not.toHaveBeenCalled();
            expect(location.href).toBe(`${ORIGIN}${BASE}/a?x=1`);
            expect(history.state).toEqual({ index });
            expect(model.getActiveSection()).toBeUndefined();
        });

        // BUG: the in-place rollback rebuilds the URL from the path alone
        // (appBrowsingHistory.ts:250), so the anchor the app is still showing is dropped from the
        // address — although a section is part of the address everywhere else in this service.
        it.fails("restores the section too when rolling a vetoed entry back in place", async () => {
            at(`${BASE}/a#intro`);
            await mountHistory({ onNavigate: async () => false });
            vi.spyOn(history, "go").mockImplementation(() => { });

            await arrive(`${BASE}/a#elsewhere`, null);

            expect(location.href).toBe(`${ORIGIN}${BASE}/a#intro`);
        });
    });

    describe("popstate listener", () => {
        it("does not add a second interceptor when syncWithBrowser runs again", async () => {
            at(`${BASE}/a`);
            const { model, navigate } = await mountHistory();

            await act(async () => { model.syncWithBrowser(); });
            await arrive(`${BASE}/b`, { index: currentIndex() + 1 });

            expect(navigate).toHaveBeenCalledOnce();
        });

        it("detaches the interceptor it attached when unmounted", async () => {
            at(`${BASE}/a`);
            const add = vi.spyOn(window, "addEventListener");
            const remove = vi.spyOn(window, "removeEventListener");
            const { unmount, navigate } = await mountHistory();
            const [, listener] = add.mock.calls.find(([type]) => type === "popstate");

            unmount();
            await settle();
            await arrive(`${BASE}/b`, { index: 1000 });

            expect(remove).toHaveBeenCalledWith("popstate", listener);
            expect(navigate).not.toHaveBeenCalled();
        });

        // BUG: deinit detaches the listener and says a following init may re-add it
        // (appBrowsingHistory.ts:152-157), but only constr — which a cache retrieval skips —
        // attaches it. A model parked in the cache and brought back ignores Back and Forward.
        it.fails("keeps following Back and Forward after being parked in the cache and brought back", async () => {
            at(`${BASE}/a`);
            // Only the host's AppBrowsingHistory may listen, so no mountHistory() here.
            const navigate = vi.fn(async () => true);
            await stubMessages({ "App.BrowsingHistory.OnNavigate": navigate });
            const { model: host } = await mount(HistoryHost, { id: "host" });
            await arrive(`${BASE}/b`, { index: 1000 });
            expect(navigate).toHaveBeenCalledOnce();

            host.showHistory = false;
            await settle();
            host.showHistory = true;
            await settle();
            await arrive(`${BASE}/c`, { index: 2000 });

            expect(navigate).toHaveBeenCalledTimes(2);
        });
    });
});

// Renders AppBrowsingHistory as a cached JSX child that can be deactivated and reactivated.
type HistoryHostStruct = UECA.ComponentStruct<{
    props: { showHistory: boolean };
}>;

function useHistoryHost(params?: UECA.ComponentParams<HistoryHostStruct>) {
    const struct: HistoryHostStruct = {
        props: {
            id: useHistoryHost.name,
            showHistory: true
        },

        View: () => (
            <div id={model.htmlId()}>
                {model.showHistory ? <AppBrowsingHistory id="history" /> : null}
            </div>
        )
    };

    const model = UECA.useComponent(struct, params);
    return model;
}

const HistoryHost = UECA.getFC(useHistoryHost);
