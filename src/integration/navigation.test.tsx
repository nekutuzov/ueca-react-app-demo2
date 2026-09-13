import { describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { appMessageBus } from "@core";
import { PLAYGROUND_TOPICS, SHOWCASE_TOPICS } from "@screens";
import { settle, stubMessages } from "@test";
import {
    APP_NAME, HOME_HEADING, activeMenuGroups, activeMenuItems, appPath, documentTitle, menuLink, pagerLink,
    renderApp, send, topBar, waitForScreen
} from "./appHarness";

// Every card the Home page lists: the showcase topics but the Overview (the section's intro link),
// then the playground pages — built from the same topic lists the page reads.
const HOME_CARDS = [
    ...SHOWCASE_TOPICS.filter((topic) => topic.key !== "overview").map((topic) => ({ ...topic, section: "Showcase" })),
    ...PLAYGROUND_TOPICS.map((topic) => ({ ...topic, section: "Playground" }))
];

describe("Navigating the app", { timeout: 30_000 }, () => {
    it("a menu item routes to its screen, updates address and title, marks itself active and adds a history entry", async () => {
        const { historyLength } = await renderApp({ url: "/home", signedIn: true });

        await userEvent.click(menuLink("Layout"));

        expect(await waitForScreen("Layout")).toBeInTheDocument();
        expect(location.pathname).toBe(appPath("/showcase/layout"));
        await waitFor(() => expect(document.title).toBe(documentTitle("Layout · Showcase")));
        expect(activeMenuItems()).toEqual(["Layout"]);
        expect(activeMenuGroups()).toEqual(["Showcase"]);
        expect(history.length).toBe(historyLength + 1);
    });

    it("gives every menu item the real address of its page", async () => {
        await renderApp({ url: "/home", signedIn: true });

        for (const topic of [...SHOWCASE_TOPICS, ...PLAYGROUND_TOPICS]) {
            await waitFor(() => expect(menuLink(topic.title)).toHaveAttribute("href", `${location.origin}${appPath(topic.path)}`));
        }
        expect(menuLink("Home")).toHaveAttribute("href", `${location.origin}${appPath("/home")}`);
    });

    it("clicking the menu item of the screen on show neither routes again nor adds a history entry", async () => {
        const { historyLength } = await renderApp({ url: "/showcase/controls", signedIn: true });
        await waitForScreen("Controls");
        const bus = await stubMessages({ "App.Router.AfterRouteChange": vi.fn(async () => { }) });

        await userEvent.click(menuLink("Controls"));
        await settle(50);

        expect(bus["App.Router.AfterRouteChange"]).not.toHaveBeenCalled();
        expect(history.length).toBe(historyLength);
        expect(location.pathname).toBe(appPath("/showcase/controls"));

        // The same listener does hear a real navigation, so its silence above means something.
        await userEvent.click(menuLink("Status"));
        await waitForScreen("Status");
        expect(bus["App.Router.AfterRouteChange"]).toHaveBeenCalledWith(expect.objectContaining({ path: "/showcase/status" }));
    });

    it.each(HOME_CARDS)("the Home card for $title opens $path", async ({ title, path, section }) => {
        await renderApp({ url: "/home", signedIn: true });
        const cards = screen.getByRole("region", { name: section });

        await userEvent.click(within(cards).getByRole("link", { name: new RegExp(`^${title}`) }));

        expect(await waitForScreen(title)).toBeInTheDocument();
        expect(location.pathname).toBe(appPath(path));
        expect(activeMenuItems()).toEqual([title]);
        expect(activeMenuGroups()).toEqual([section]);
    });

    it("the Home page's overview link opens the Showcase overview", async () => {
        await renderApp({ url: "/home", signedIn: true });

        await userEvent.click(within(screen.getByRole("region", { name: "Showcase" })).getByRole("link", { name: "overview" }));

        expect(await waitForScreen("Overview")).toBeInTheDocument();
        expect(location.pathname).toBe(appPath("/showcase/overview"));
    });

    it.each([
        ["Browse the showcase", "Overview", "/showcase/overview"],
        ["Open the playground", "Button", "/playground/button"]
    ])("the hero's %s button opens %s", async (button, heading, path) => {
        const { historyLength } = await renderApp({ url: "/home", signedIn: true });

        await userEvent.click(screen.getByRole("button", { name: button }));

        expect(await waitForScreen(heading)).toBeInTheDocument();
        expect(location.pathname).toBe(appPath(path));
        expect(activeMenuItems()).toEqual([heading]);
        expect(history.length).toBe(historyLength + 1);
    });

    it("the breadcrumb trail names the page and links back to Home", async () => {
        await renderApp({ url: "/playground/table", signedIn: true });
        await waitForScreen("Table");
        expect(topBar()).toHaveTextContent("Playground · Table");

        await userEvent.click(within(topBar()).getByRole("link", { name: "Home" }));

        expect(await waitForScreen(HOME_HEADING)).toBeInTheDocument();
        expect(location.pathname).toBe(appPath("/"));
        expect(activeMenuItems()).toEqual(["Home"]);
    });

    it("titles the document after the screen on show, and a screen that names nothing gets the app name alone", async () => {
        await renderApp({ url: "/home", signedIn: true });
        await waitFor(() => expect(document.title).toBe(APP_NAME));

        await userEvent.click(menuLink("Text field"));
        await waitForScreen("Text field");
        await waitFor(() => expect(document.title).toBe(documentTitle("Text field · Playground")));

        // Home sends no name of its own, so the previous page's must not stick.
        await userEvent.click(menuLink("Home"));
        await waitForScreen(HOME_HEADING);
        await waitFor(() => expect(document.title).toBe(APP_NAME));
    });

    it("the showcase pager walks every topic in showcaseTopics order, and back again", async () => {
        const [first, ...rest] = SHOWCASE_TOPICS;
        const { historyLength } = await renderApp({ url: first.path, signedIn: true });
        await waitForScreen(first.title);
        expect(pagerLink("Previous")).toBeNull();

        for (const topic of rest) {
            expect(pagerLink("Next")).toHaveTextContent(topic.title);
            await userEvent.click(pagerLink("Next"));
            await waitForScreen(topic.title);
            expect(location.pathname).toBe(appPath(topic.path));
            expect(activeMenuItems()).toEqual([topic.title]);
        }
        expect(pagerLink("Next")).toBeNull();
        expect(history.length).toBe(historyLength + rest.length);

        for (const topic of [...SHOWCASE_TOPICS].reverse().slice(1)) {
            expect(pagerLink("Previous")).toHaveTextContent(topic.title);
            await userEvent.click(pagerLink("Previous"));
            await waitForScreen(topic.title);
            expect(location.pathname).toBe(appPath(topic.path));
        }
        expect(pagerLink("Previous")).toBeNull();
    });

    it("the playground pager walks the playground pages in playgroundTopics order, and back again", async () => {
        const [first, ...rest] = PLAYGROUND_TOPICS;
        await renderApp({ url: first.path, signedIn: true });
        await waitForScreen(first.title);
        expect(pagerLink("Previous")).toBeNull();

        for (const topic of rest) {
            await userEvent.click(pagerLink("Next"));
            await waitForScreen(topic.title);
            expect(location.pathname).toBe(appPath(topic.path));
            expect(activeMenuGroups()).toEqual(["Playground"]);
        }
        expect(pagerLink("Next")).toBeNull();

        for (const topic of [...PLAYGROUND_TOPICS].reverse().slice(1)) {
            await userEvent.click(pagerLink("Previous"));
            await waitForScreen(topic.title);
        }
        expect(pagerLink("Previous")).toBeNull();
    });

    it("App.Router.GoToRoute routes like a click and answers true", async () => {
        const { historyLength } = await renderApp({ url: "/home", signedIn: true });

        expect(await send(() => appMessageBus.unicast("App.Router.GoToRoute", { path: "/showcase/data" }))).toBe(true);

        expect(await waitForScreen("Data")).toBeInTheDocument();
        expect(location.pathname).toBe(appPath("/showcase/data"));
        expect(activeMenuItems()).toEqual(["Data"]);
        expect(history.length).toBe(historyLength + 1);
    });

    it("App.Router.SetRoute routes without adding a history entry", async () => {
        const { historyLength } = await renderApp({ url: "/home", signedIn: true });

        expect(await send(() => appMessageBus.unicast("App.Router.SetRoute", { path: "/showcase/lists" }))).toBe(true);

        expect(await waitForScreen("Lists")).toBeInTheDocument();
        expect(location.pathname).toBe(appPath("/showcase/lists"));
        expect(history.length).toBe(historyLength);
    });

    // The guard is a broadcast: any subscriber answering false — a screen with unsaved changes —
    // cancels the navigation.
    it("a navigation that a guard vetoes leaves the screen, the address and the history as they were", async () => {
        const { historyLength } = await renderApp({ url: "/home", signedIn: true });
        const guard = await stubMessages({ "App.Router.BeforeRouteChange": vi.fn(async () => false) });

        await userEvent.click(menuLink("Controls"));
        await settle(50);

        expect(guard["App.Router.BeforeRouteChange"]).toHaveBeenCalledWith(expect.objectContaining({ path: "/showcase/controls" }));
        expect(await waitForScreen(HOME_HEADING)).toBeInTheDocument();
        expect(location.pathname).toBe(appPath("/home"));
        expect(activeMenuItems()).toEqual(["Home"]);
        expect(history.length).toBe(historyLength);
        expect(await send(() => appMessageBus.unicast("App.Router.GoToRoute", { path: "/showcase/status" }))).toBe(false);
        expect(location.pathname).toBe(appPath("/home"));
    });
});
