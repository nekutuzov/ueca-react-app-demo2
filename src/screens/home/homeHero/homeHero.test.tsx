import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppRoute, otherRoutes } from "@core";
import { PLAYGROUND_TOPICS, SHOWCASE_TOPICS } from "@screens";
import { mount, settle, stubMessages } from "@test";
import { HomeHero } from "./homeHero";

const BASE = "/ueca-react-app-demo2";

async function stubServices() {
    return await stubMessages({
        "App.GetInfo": vi.fn(async () => ({ appName: "UECA-React Showcase", appVersion: "3.0.2" })),
        "App.Router.ResolveRoute": vi.fn(async (route: AppRoute) => `${BASE}${route.path}`),
        "App.Router.GoToRoute": vi.fn(async () => true),
        "App.Router.OpenNewTab": vi.fn(async (_route: AppRoute) => { })
    });
}

function section(name: string): HTMLElement {
    return screen.getByRole("region", { name });
}

// title, summary and href of each card in a section, in order.
function cards(sectionName: string): string[][] {
    return within(section(sectionName)).getAllByRole("listitem").map((card) => [
        card.querySelector(".home-card-title").textContent,
        card.querySelector(".home-card-summary").textContent,
        card.querySelector("a").getAttribute("href")
    ]);
}

describe("HomeHero", () => {
    it("shows the app version from App.GetInfo in the eyebrow", async () => {
        await stubServices();
        await mount(HomeHero, { id: "hero" });

        expect(document.querySelector(".home-eyebrow")).toHaveTextContent("UECA-React 3.0.2 · Showcase");
    });

    // Built from the topic lists the menu and the routes read, so a new page shows up here too.
    it("gives every showcase topic but the Overview a card linking to its page", async () => {
        await stubServices();
        await mount(HomeHero, { id: "hero" });

        const topics = SHOWCASE_TOPICS.filter((t) => t.key !== "overview");
        expect(cards("Showcase")).toEqual(topics.map((t) => [t.title, t.summary, `${BASE}${t.path}`]));
        expect(within(section("Showcase")).getByText(`${topics.length} topics`)).toBeInTheDocument();
    });

    // The Overview is about the showcase rather than a part of it: the section's intro links it.
    it("links the Overview from the section's introduction instead", async () => {
        await stubServices();
        await mount(HomeHero, { id: "hero" });

        expect(within(section("Showcase")).getByRole("link", { name: "overview" })).toHaveAttribute("href", `${BASE}/showcase/overview`);
    });

    it("gives every playground topic a card linking to its editor", async () => {
        await stubServices();
        await mount(HomeHero, { id: "hero" });

        expect(cards("Playground")).toEqual(PLAYGROUND_TOPICS.map((t) => [t.title, t.summary, `${BASE}${t.path}`]));
        expect(within(section("Playground")).getByText(`${PLAYGROUND_TOPICS.length} editors`)).toBeInTheDocument();
    });

    it("draws each card with its topic's icon", async () => {
        await stubServices();
        await mount(HomeHero, { id: "hero" });

        for (const card of [...within(section("Showcase")).getAllByRole("listitem"), ...within(section("Playground")).getAllByRole("listitem")]) {
            expect(card.querySelector(".home-card-icon .ueca-icon")).not.toBeNull();
        }
    });

    it("opens a card's page when it is clicked", async () => {
        const bus = await stubServices();
        await mount(HomeHero, { id: "hero" });

        await userEvent.click(within(section("Showcase")).getByRole("link", { name: /^Layout/ }));
        await settle();

        expect(bus["App.Router.GoToRoute"]).toHaveBeenCalledExactlyOnceWith({ path: "/showcase/layout" });
    });

    it.each([
        ["Browse the showcase", "App.Router.GoToRoute", { path: "/showcase/overview" }],
        ["Open the playground", "App.Router.GoToRoute", { path: "/playground/button" }],
        ["GitHub", "App.Router.OpenNewTab", { path: "https://github.com/nekutuzov/ueca-react-app-demo2" }]
    ] as const)("sends \"%s\" through %s", async (name, message, route) => {
        const bus = await stubServices();
        await mount(HomeHero, { id: "hero" });

        await userEvent.click(within(screen.getByRole("banner")).getByRole("button", { name }));
        await settle();

        expect(bus[message]).toHaveBeenCalledExactlyOnceWith(route);
    });

    it("opens each live demo and its source in a new tab, marking this showcase as the one you are in", async () => {
        const bus = await stubServices();
        await mount(HomeHero, { id: "hero" });

        const demos = within(section("Live demos")).getAllByRole("listitem");
        expect(demos.map((demo) => within(demo).getAllByRole("button").map((b) => b.textContent))).toEqual([
            ["Open demo", "Source"],
            ["Source"],
            ["Open demo", "Source"]
        ]);
        expect(within(demos[1]).getByText("You are here")).toBeInTheDocument();

        for (const demoButton of within(section("Live demos")).getAllByRole("button")) {
            await userEvent.click(demoButton);
        }
        await settle();

        const opened = bus["App.Router.OpenNewTab"].mock.calls.map(([route]) => route.path);
        expect(opened).toEqual([
            "https://nekutuzov.github.io/ueca-react-app-demo1",
            "https://github.com/nekutuzov/ueca-react-app-demo1",
            "https://github.com/nekutuzov/ueca-react-app-demo2",
            "https://nekutuzov.github.io/ueca-react-doc/",
            "https://github.com/nekutuzov/ueca-react-doc"
        ]);
        // An address opened with openNewTab has to be registered in otherRoutes.
        for (const path of opened) {
            expect(Object.keys(otherRoutes)).toContain(path);
        }
    });
});
