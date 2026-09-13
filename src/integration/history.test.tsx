import { describe, expect, it, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { appMessageBus } from "@core";
import { stubMessages } from "@test";
import {
    APP_NAME, HOME_HEADING, activeMenuGroups, activeMenuItems, appPath, documentTitle, goBack, goForward, menuLink,
    renderApp, send, waitForScreen
} from "./appHarness";

function currentRoute() {
    return send(() => appMessageBus.unicast("App.Router.GetRoute"));
}

describe("Back and Forward", { timeout: 20_000 }, () => {
    it("Back re-renders the previous screen with its title and active item, and Forward returns", async () => {
        await renderApp({ url: "/showcase/overview", signedIn: true });
        await userEvent.click(menuLink("Button"));
        await waitForScreen("Button");
        await waitFor(() => expect(document.title).toBe(documentTitle("Button · Playground")));

        await goBack();

        expect(await waitForScreen("Overview")).toBeInTheDocument();
        expect(location.pathname).toBe(appPath("/showcase/overview"));
        await waitFor(() => expect(document.title).toBe(documentTitle("Overview · Showcase")));
        expect(activeMenuItems()).toEqual(["Overview"]);
        expect(activeMenuGroups()).toEqual(["Showcase"]);
        expect(await currentRoute()).toMatchObject({ path: "/showcase/overview" });

        await goForward();

        expect(await waitForScreen("Button")).toBeInTheDocument();
        expect(location.pathname).toBe(appPath("/playground/button"));
        await waitFor(() => expect(document.title).toBe(documentTitle("Button · Playground")));
        expect(activeMenuItems()).toEqual(["Button"]);
        expect(activeMenuGroups()).toEqual(["Playground"]);
    });

    it("Back through several pages ends on Home with the app name alone as the title", async () => {
        const { historyLength } = await renderApp({ url: "/home", signedIn: true });
        await userEvent.click(menuLink("Controls"));
        await waitForScreen("Controls");
        await userEvent.click(menuLink("Status"));
        await waitForScreen("Status");
        expect(history.length).toBe(historyLength + 2);

        await goBack();
        expect(await waitForScreen("Controls")).toBeInTheDocument();
        await waitFor(() => expect(document.title).toBe(documentTitle("Controls · Showcase")));

        await goBack();
        expect(await waitForScreen(HOME_HEADING)).toBeInTheDocument();
        expect(location.pathname).toBe(appPath("/home"));
        await waitFor(() => expect(document.title).toBe(APP_NAME));
        expect(activeMenuItems()).toEqual(["Home"]);
        // Traversing never adds entries of its own.
        expect(history.length).toBe(historyLength + 2);
    });

    it("Back and Forward move between a page and a section within it, staying on the screen", async () => {
        await renderApp({ url: "/showcase/controls", signedIn: true });
        await waitForScreen("Controls");
        const lengthOnPage = history.length;

        // Moving to a section is somewhere the user chose to go, so it earns an entry of its own.
        await send(() => appMessageBus.unicast("App.Router.SetRouteParams", { section: "buttons" }));
        expect(location.hash).toBe("#buttons");
        expect(history.length).toBe(lengthOnPage + 1);
        expect(await currentRoute()).toMatchObject({ section: "buttons" });

        await goBack();

        await waitFor(() => expect(location.hash).toBe(""));
        expect(await waitForScreen("Controls")).toBeInTheDocument();
        expect((await currentRoute()).section).toBeUndefined();
        expect(activeMenuItems()).toEqual(["Controls"]);

        await goForward();

        await waitFor(() => expect(location.hash).toBe("#buttons"));
        expect(await waitForScreen("Controls")).toBeInTheDocument();
        expect(await currentRoute()).toMatchObject({ path: "/showcase/controls", section: "buttons" });
    });

    // Regression: AppBrowsingHistory.syncWithBrowser stamped the entry the app opens on with index 1
    // (`history.state?.index ?? 1`) whatever its real position, while _navigate numbered each pushed
    // entry by its position. A vetoed Back rolls back by the difference (history.go(rollbackDelta)),
    // which was only right when the app was opened as the tab's second history entry. Opened after a
    // longer history, history.go overshot and did nothing: the address bar stayed on the page the
    // user tried to go back to while the vetoing screen stayed on show, so a reload lost that screen.
    // (Opened in a fresh tab the delta was 0 instead, and the rollback's replaceState overwrote the
    // previous entry with this address.)
    it("a Back that a guard vetoes returns the address to the screen still on show", async () => {
        // jsdom's own first entry and this page (plus whatever earlier tests pushed) precede the app,
        // so it opens past position 1 — where the fixed index 1 was wrong.
        history.pushState(null, "", "/elsewhere");
        await renderApp({ url: "/showcase/overview", signedIn: true });
        await userEvent.click(menuLink("Design tokens"));
        await waitForScreen("Design tokens");
        await stubMessages({ "App.Router.BeforeRouteChange": vi.fn(async () => false) });

        await goBack();

        expect(await waitForScreen("Design tokens")).toBeInTheDocument();
        await waitFor(() => expect(location.pathname).toBe(appPath("/showcase/tokens")), { timeout: 1000 });
    });
});
