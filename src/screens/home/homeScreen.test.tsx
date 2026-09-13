import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import { HomeScreen } from "@screens";
import { mount, stubMessages } from "@test";

async function stubServices() {
    return await stubMessages({
        "App.GetInfo": vi.fn(async () => ({ appName: "UECA-React Showcase", appVersion: "3.0.2" })),
        "App.BrowsingHistory.SetPageTitle": vi.fn(async (_title: string) => { }),
        "App.Theme.GetMode": vi.fn(async () => "light" as const)
    });
}

describe("HomeScreen", () => {
    it("shows the landing page in the screen layout's content box, with no toolbar", async () => {
        await stubServices();
        await mount(HomeScreen, { id: "homeScreen" });

        const content = document.querySelector(".app-content") as HTMLElement;
        expect(within(content).getByRole("heading", { level: 1 })).toHaveTextContent(/Fifty components/);
        expect(within(document.querySelector(".ueca-screen-tools") as HTMLElement).queryAllByRole("button")).toEqual([]);
    });

    // The landing page owns its own band and rhythm, so the layout adds no padding.
    it("leaves the content box unpadded", async () => {
        await stubServices();
        await mount(HomeScreen, { id: "homeScreen" });

        expect(document.querySelector(".app-content").getAttribute("style")).not.toMatch(/padding/);
    });

    // A one-crumb trail is the home page, which takes the app name alone as the document title.
    it("names itself with the one-crumb Home trail, leaving the document title to the app", async () => {
        const bus = await stubServices();
        await mount(HomeScreen, { id: "homeScreen" });

        const trail = screen.getByRole("navigation", { name: "breadcrumb" });
        expect(within(trail).getAllByRole("listitem").map((c) => c.textContent)).toEqual(["Home"]);
        expect(within(trail).queryByRole("link")).toBeNull();
        const titles = bus["App.BrowsingHistory.SetPageTitle"].mock.calls.map(([title]) => title);
        expect(titles.length).toBeGreaterThan(0);
        expect(titles.every((title) => title === undefined)).toBe(true);
    });
});
