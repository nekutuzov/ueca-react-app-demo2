import { describe, expect, it, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import { PLAYGROUND_TOPICS, SHOWCASE_TOPICS, playgroundNeighbours, showcaseNeighbours } from "@screens";
import {
    HOME_HEADING, APP_NAME, activeMenuGroups, activeMenuItems, appPath, documentTitle, pagerLink, renderApp, topBar,
    waitForScreen
} from "./appHarness";

type Neighbour = { title: string } | undefined;

// A page reached by its address, in the real shell. UECA errors fail the test from the shared setup;
// the console is watched here too, since React reports its own warnings there.
async function expectPage(section: "Showcase" | "Playground", page: { title: string; path: string }, prev: Neighbour, next: Neighbour) {
    const heading = await waitForScreen(page.title);

    expect(heading.closest(".screen-page").querySelector(".screen-page-eyebrow")).toHaveTextContent(section);
    expect(location.pathname).toBe(appPath(page.path));
    await waitFor(() => expect(document.title).toBe(documentTitle(`${page.title} · ${section}`)));
    expect(activeMenuItems()).toEqual([page.title]);
    expect(activeMenuGroups()).toEqual([section]);
    expect(topBar()).toHaveTextContent(`${section} · ${page.title}`);

    expect(document.querySelector("nav.screen-pager")).toHaveAttribute("aria-label", `${section} pages`);
    if (prev) {
        expect(pagerLink("Previous")).toHaveTextContent(prev.title);
    } else {
        expect(pagerLink("Previous")).toBeNull();
    }
    if (next) {
        expect(pagerLink("Next")).toHaveTextContent(next.title);
    } else {
        expect(pagerLink("Next")).toBeNull();
    }
}

describe("Every page in the real shell", { timeout: 20_000 }, () => {
    it.each(SHOWCASE_TOPICS)("the $title showcase topic renders at $path", async (topic) => {
        const consoleError = vi.spyOn(console, "error");
        await renderApp({ url: topic.path, signedIn: true });

        const { prev, next } = showcaseNeighbours(topic.key);
        await expectPage("Showcase", topic, prev, next);
        expect(consoleError).not.toHaveBeenCalled();
    });

    it.each(PLAYGROUND_TOPICS)("the $title playground renders at $path", async (topic) => {
        const consoleError = vi.spyOn(console, "error");
        await renderApp({ url: topic.path, signedIn: true });

        const { prev, next } = playgroundNeighbours(topic.key);
        await expectPage("Playground", topic, prev, next);
        expect(consoleError).not.toHaveBeenCalled();
    });

    it("Home renders at /home with its cards and without a pager", async () => {
        const consoleError = vi.spyOn(console, "error");
        await renderApp({ url: "/home", signedIn: true });

        expect(await waitForScreen(HOME_HEADING)).toBeInTheDocument();
        await waitFor(() => expect(document.title).toBe(APP_NAME));
        expect(activeMenuItems()).toEqual(["Home"]);
        expect(document.querySelectorAll(".home-card")).toHaveLength(SHOWCASE_TOPICS.length - 1 + PLAYGROUND_TOPICS.length);
        expect(document.querySelector("nav.screen-pager")).toBeNull();
        expect(consoleError).not.toHaveBeenCalled();
    });
});
