import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Breadcrumb, breadcrumbLabel, LocationBreadcrumbs } from "@core";
import { mount, settle, stubMessages } from "@test";

const home: Breadcrumb = { route: { path: "/" }, label: "Home" };
const overview: Breadcrumb = { route: { path: "/showcase/overview" }, label: "Showcase" };
const controls: Breadcrumb = { route: { path: "/showcase/controls" }, label: "Controls" };

// A link only has an href once the router has resolved its route.
async function stubRouteResolution() {
    return await stubMessages({
        "App.Router.ResolveRoute": vi.fn(async (route) => `/ueca-react-app-demo2${route.path}`),
        "App.Router.GoToRoute": vi.fn(async () => true)
    });
}

function crumbs(): HTMLElement[] {
    return within(screen.getByRole("navigation", { name: "breadcrumb" })).queryAllByRole("listitem");
}

describe("LocationBreadcrumbs", () => {
    it("draws one crumb per item, in order, with a separator between neighbours", async () => {
        await stubRouteResolution();
        await mount(LocationBreadcrumbs, { id: "trail", items: [home, overview, controls] });

        expect(crumbs().map((c) => c.textContent)).toEqual(["Home", "Showcase", "Controls"]);
        expect(screen.getByRole("navigation", { name: "breadcrumb" }).querySelectorAll(".ueca-breadcrumbs-separator")).toHaveLength(2);
    });

    it("links every crumb but the last, which names the current page without linking it", async () => {
        await stubRouteResolution();
        await mount(LocationBreadcrumbs, { id: "trail", items: [home, overview, controls] });

        expect(screen.getAllByRole("link").map((a) => [a.textContent, a.getAttribute("href")])).toEqual([
            ["Home", "/ueca-react-app-demo2/"],
            ["Showcase", "/ueca-react-app-demo2/showcase/overview"]
        ]);
        const current = crumbs()[2].firstElementChild;
        expect(current.tagName).toBe("SPAN");
        expect(current).toHaveClass("ueca-nav-link-disabled");
        expect(current).toHaveTextContent("Controls");
    });

    it("navigates to a crumb's route when it is clicked", async () => {
        const bus = await stubRouteResolution();
        await mount(LocationBreadcrumbs, { id: "trail", items: [home, overview, controls] });

        await userEvent.click(screen.getByRole("link", { name: "Showcase" }));
        await settle();

        expect(bus["App.Router.GoToRoute"]).toHaveBeenCalledExactlyOnceWith({ path: "/showcase/overview" });
    });

    it("follows items assigned at runtime, moving the current page to the new last crumb", async () => {
        await stubRouteResolution();
        const { model } = await mount(LocationBreadcrumbs, { id: "trail", items: [home, controls] });
        expect(screen.queryByRole("link", { name: "Controls" })).toBeNull();

        model.items = [home, controls, { route: { path: "/playground/table" }, label: "Table" }];
        await settle();

        expect(crumbs().map((c) => c.textContent)).toEqual(["Home", "Controls", "Table"]);
        expect(screen.getByRole("link", { name: "Controls" })).toBeInTheDocument();
        expect(screen.queryByRole("link", { name: "Table" })).toBeNull();

        model.items = [home];
        await settle();

        expect(crumbs().map((c) => c.textContent)).toEqual(["Home"]);
        expect(screen.queryAllByRole("link")).toHaveLength(0);
    });

    it("draws an empty trail for no items, or for items taken away altogether", async () => {
        const { model } = await mount(LocationBreadcrumbs, { id: "trail" });
        expect(crumbs()).toHaveLength(0);

        model.items = [home, controls];
        await settle();
        expect(crumbs()).toHaveLength(2);

        model.items = undefined;
        await settle();
        expect(crumbs()).toHaveLength(0);
    });

    it("draws a label built with breadcrumbLabel inside the crumb's link", async () => {
        await stubRouteResolution();
        await mount(LocationBreadcrumbs, {
            id: "trail",
            items: [{ route: { path: "/" }, label: breadcrumbLabel("home", "Home") }, controls]
        });

        const link = screen.getByRole("link", { name: "Home" });
        expect(link.querySelector(".ueca-icon")).not.toBeNull();
    });
});

describe("breadcrumbLabel", () => {
    // 6px, not the 4px "tiny" step: the outline glyphs carry their own padding, and at 4px the
    // label read as crowding the icon.
    it("puts the section glyph before the text on one centred row, 6px apart", () => {
        const { container } = render(<>{breadcrumbLabel("grid", "Showcase")}</>);

        const row = container.firstElementChild as HTMLElement;
        expect(row).toHaveStyle({ display: "flex", flexDirection: "row", alignItems: "center", gap: "6px" });
        const [icon, text] = [...row.childNodes];
        expect(icon).toHaveClass("ueca-icon");
        expect(icon).toHaveStyle({ fontSize: "var(--icon-sm)" });
        expect(text.textContent).toBe("Showcase");
    });

    it("accepts a label drawn as JSX", () => {
        render(<>{breadcrumbLabel("code", <strong>Playground</strong>)}</>);

        expect(screen.getByText("Playground").tagName).toBe("STRONG");
    });
});
