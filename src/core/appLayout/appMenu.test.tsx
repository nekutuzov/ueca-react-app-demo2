import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppMenu, AppMenuModel, AppMenuParams, appMessageBus, AppRoute } from "@core";
import { NavItemExpandableModel, NavItemModel } from "@components";
import { PLAYGROUND_TOPICS, SHOWCASE_TOPICS } from "@screens";
import { mount, settle, stubMessages } from "@test";

const BASE = "/ueca-react-app-demo2";

async function stubRouter(current?: AppRoute) {
    return await stubMessages({
        "App.Router.GetRoute": vi.fn(async () => current),
        "App.Router.ResolveRoute": vi.fn(async (route: AppRoute) => `${BASE}${route.path}`),
        "App.Router.GoToRoute": vi.fn(async () => true)
    });
}

async function routeTo(path: string) {
    await appMessageBus.broadcast(null, "App.Router.AfterRouteChange", { path } as AppRoute);
    await settle();
}

function itemElements(): Element[] {
    return [...document.querySelectorAll(".ueca-nav-item, .ueca-nav-item-expandable")];
}

function itemLabels(): string[] {
    return itemElements().map((e) => e.textContent);
}

function activeLabels(): string[] {
    return itemElements().filter((e) => e.classList.contains("active")).map((e) => e.textContent);
}

function groupHeader(group: NavItemExpandableModel): HTMLElement {
    return document.getElementById(group.htmlId()).querySelector(".ueca-nav-item-expandable");
}

function rect(top: number, height: number): DOMRect {
    return { top, height, bottom: top + height, left: 0, width: 240, right: 240, x: 0, y: top, toJSON: () => ({}) } as DOMRect;
}

// The menu inside a stand-in for the sidebar's scrolling wrapper, which is what it looks for.
async function mountInRail(params: AppMenuParams = {}): Promise<{ model: AppMenuModel; rail: HTMLElement }> {
    const rail = document.createElement("div");
    rail.className = "app-sidebar-scroll";
    document.body.appendChild(rail);
    const { model } = await mount(AppMenu, { id: "menu", ...params }, { container: rail });
    return { model, rail };
}

function place(element: Element, top: number, height: number) {
    vi.spyOn(element, "getBoundingClientRect").mockReturnValue(rect(top, height));
}

function placeItem(item: NavItemModel, top: number, height = 40) {
    place(document.getElementById(item.htmlId()), top, height);
}

describe("AppMenu", () => {
    // Laid out from the topic lists — the ones the routes and page headers read — so a page cannot
    // show up in one place and not the other.
    it("lists Home, then the Showcase and Playground groups holding every topic in list order", async () => {
        await stubRouter();
        await mount(AppMenu, { id: "menu" });

        expect(itemLabels()).toEqual([
            "Home",
            "Showcase",
            ...SHOWCASE_TOPICS.map((t) => t.title),
            "Playground",
            ...PLAYGROUND_TOPICS.map((t) => t.title)
        ]);
    });

    it("links every item to its own page", async () => {
        await stubRouter();
        await mount(AppMenu, { id: "menu" });

        expect(screen.getAllByRole("link").map((a) => [a.textContent, a.getAttribute("href")])).toEqual([
            ["Home", `${BASE}/home`],
            ...SHOWCASE_TOPICS.map((t) => [t.title, `${BASE}${t.path}`]),
            ...PLAYGROUND_TOPICS.map((t) => [t.title, `${BASE}${t.path}`])
        ]);
    });

    it("navigates to an item's page when it is clicked", async () => {
        const bus = await stubRouter({ path: "/home" });
        await mount(AppMenu, { id: "menu" });

        await userEvent.click(screen.getByRole("link", { name: "Layout" }));
        await settle();

        expect(bus["App.Router.GoToRoute"]).toHaveBeenCalledExactlyOnceWith({ path: "/showcase/layout" });
    });

    describe("active item", () => {
        it("takes the page showing at start-up from the router", async () => {
            await stubRouter({ path: "/playground/button" });
            await mount(AppMenu, { id: "menu" });

            expect(activeLabels()).toEqual(["Playground", "Button"]);
        });

        it("follows the route announced after each route change, marking the item and its group", async () => {
            await stubRouter({ path: "/home" });
            await mount(AppMenu, { id: "menu" });

            await routeTo("/showcase/data");
            expect(activeLabels()).toEqual(["Showcase", "Data"]);

            await routeTo("/playground/table");
            expect(activeLabels()).toEqual(["Playground", "Table"]);
        });

        it.each(["/home", "/"])("marks Home for %s", async (path) => {
            await stubRouter({ path: "/showcase/data" });
            await mount(AppMenu, { id: "menu" });

            await routeTo(path);

            expect(activeLabels()).toEqual(["Home"]);
        });

        it("marks nothing for a route that has no item", async () => {
            await stubRouter({ path: "/showcase/data" });
            await mount(AppMenu, { id: "menu" });

            await routeTo("/nowhere");

            expect(activeLabels()).toEqual([]);
        });
    });

    describe("groups", () => {
        it("expands a collapsed group when one of its pages becomes active", async () => {
            await stubRouter();
            const { model } = await mount(AppMenu, { id: "menu" });
            fireEvent.click(groupHeader(model.showcaseMenuItem));
            await settle();
            expect(screen.queryByText("Design tokens")).toBeNull();

            await routeTo("/showcase/tokens");

            expect(model.showcaseMenuItem.expanded).toBe(true);
            expect(screen.getByText("Design tokens")).toBeInTheDocument();
        });

        // Only the move INTO a group opens it; moving between its pages respects the reader's choice.
        it("leaves a group the reader collapsed closed while moving between its pages", async () => {
            await stubRouter({ path: "/showcase/data" });
            const { model } = await mount(AppMenu, { id: "menu" });
            fireEvent.click(groupHeader(model.showcaseMenuItem));
            await settle();

            await routeTo("/showcase/lists");

            expect(model.showcaseMenuItem.expanded).toBe(false);
        });

        it("leaves a collapsed group closed in the icon rail when one of its pages becomes active", async () => {
            await stubRouter();
            const { model } = await mount(AppMenu, { id: "menu", iconsOnly: true });
            fireEvent.click(groupHeader(model.showcaseMenuItem));
            await settle();

            await routeTo("/showcase/tokens");

            expect(model.showcaseMenuItem.expanded).toBe(false);
            expect(document.getElementById(model.tokensMenuItem.htmlId())).toBeNull();
        });
    });

    it("draws icons without labels while iconsOnly is set, and labels again once it is cleared", async () => {
        await stubRouter();
        const { model } = await mount(AppMenu, { id: "menu" });

        model.iconsOnly = true;
        await settle();

        // Home and the two group headers, then every topic.
        expect(itemElements()).toHaveLength(3 + SHOWCASE_TOPICS.length + PLAYGROUND_TOPICS.length);
        for (const item of itemElements()) {
            expect(item.textContent).toBe("");
            expect(item.querySelector(".ueca-icon")).not.toBeNull();
        }

        model.iconsOnly = false;
        await settle();

        expect(itemLabels()).toContain("Design tokens");
        expect(itemLabels()[0]).toBe("Home");
    });

    // Its own box never scrolls: the sidebar's wrapper is the single scroller, and a second one
    // here would nest two scrollbars in the same rail.
    it("leaves scrolling to the rail it sits in", async () => {
        await stubRouter();
        const { model } = await mount(AppMenu, { id: "menu" });

        expect(document.getElementById(model.htmlId())).toHaveStyle({ overflow: "visible" });
    });

    describe("keeping the active item in view", () => {
        it("scrolls the rail down just far enough to show an active item below it, never with scrollIntoView", async () => {
            await stubRouter();
            const scrollIntoView = vi.spyOn(Element.prototype, "scrollIntoView");
            const { model, rail } = await mountInRail();
            place(rail, 0, 300);
            placeItem(model.listsMenuItem, 500);
            rail.scrollTop = 0;

            await routeTo("/showcase/lists");

            // 12px of breathing room under the item: (500 + 40) - 300 + 12.
            expect(rail.scrollTop).toBe(252);
            expect(scrollIntoView).not.toHaveBeenCalled();
        });

        it("scrolls the rail up just far enough to show an active item above it", async () => {
            await stubRouter();
            const { model, rail } = await mountInRail();
            place(rail, 100, 300);
            placeItem(model.overviewMenuItem, 40);
            rail.scrollTop = 400;

            await routeTo("/showcase/overview");

            // 12px of breathing room over the item: 400 - (100 + 12 - 40).
            expect(rail.scrollTop).toBe(328);
        });

        // A click on an item already on screen should leave the rail where the reader left it.
        it("leaves the rail alone when the active item is already in sight", async () => {
            await stubRouter();
            const { model, rail } = await mountInRail();
            place(rail, 0, 300);
            placeItem(model.listsMenuItem, 150);
            rail.scrollTop = 77;

            await routeTo("/showcase/lists");

            expect(rail.scrollTop).toBe(77);
        });

        it.each([
            [12, 100],
            [11, 99],
            [248, 100],
            [249, 101]
        ])("keeps a 12px margin inside the rail's edges (item at %ipx)", async (itemTop, scrollTop) => {
            await stubRouter();
            const { model, rail } = await mountInRail();
            place(rail, 0, 300);
            placeItem(model.listsMenuItem, itemTop);
            rail.scrollTop = 100;

            await routeTo("/showcase/lists");

            expect(rail.scrollTop).toBe(scrollTop);
        });

        // A tick late on purpose: until the items have re-rendered, the item reading as active in
        // the DOM is still the one being left.
        it("reveals the item only after the route change has been handled", async () => {
            await stubRouter();
            const { model, rail } = await mountInRail();
            place(rail, 0, 300);
            placeItem(model.listsMenuItem, 500);
            rail.scrollTop = 0;

            await appMessageBus.broadcast(null, "App.Router.AfterRouteChange", { path: "/showcase/lists" });
            expect(rail.scrollTop).toBe(0);

            await settle();
            expect(rail.scrollTop).toBe(252);
        });

        it("does not haul the rail back to an item it has already revealed", async () => {
            await stubRouter();
            const { model, rail } = await mountInRail();
            place(rail, 0, 300);
            placeItem(model.listsMenuItem, 500);
            await routeTo("/showcase/lists");

            rail.scrollTop = 0;
            await routeTo("/showcase/lists");

            expect(rail.scrollTop).toBe(0);
        });

        it("reveals an item again once another page has been shown in between", async () => {
            await stubRouter();
            const { model, rail } = await mountInRail();
            place(rail, 0, 300);
            placeItem(model.listsMenuItem, 500);
            placeItem(model.overviewMenuItem, 60);
            await routeTo("/showcase/lists");
            rail.scrollTop = 0;

            await routeTo("/showcase/overview");
            expect(rail.scrollTop).toBe(0);

            await routeTo("/showcase/lists");
            expect(rail.scrollTop).toBe(252);
        });

        it("reveals the page it starts on, for a deep link", async () => {
            await stubRouter({ path: "/playground/table" });
            const rail = document.createElement("div");
            rail.className = "app-sidebar-scroll";
            document.body.appendChild(rail);
            vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
                if (this === rail) {
                    return rect(0, 300);
                }
                return this.id === "menu.tablePlaygroundMenuItem" ? rect(900, 40) : rect(0, 0);
            });

            await mount(AppMenu, { id: "menu" }, { container: rail });
            await settle();

            expect(rail.scrollTop).toBe(900 + 40 - 300 + 12);
        });

        it("leaves the rail alone when the active item is hidden in a collapsed group", async () => {
            await stubRouter();
            const { model, rail } = await mountInRail({ iconsOnly: true });
            fireEvent.click(groupHeader(model.showcaseMenuItem));
            await settle();
            place(rail, 0, 300);
            rail.scrollTop = 50;

            await routeTo("/showcase/lists");

            expect(rail.scrollTop).toBe(50);
        });

        it("scrolls nothing at all when it is not inside a rail", async () => {
            await stubRouter();
            const scrollIntoView = vi.spyOn(Element.prototype, "scrollIntoView");
            const scrollTo = vi.spyOn(window, "scrollTo");
            const { model } = await mount(AppMenu, { id: "menu" });
            placeItem(model.listsMenuItem, 5000);

            await routeTo("/showcase/lists");

            expect(scrollIntoView).not.toHaveBeenCalled();
            expect(scrollTo).not.toHaveBeenCalled();
        });
    });
});
