import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { NavItem } from "@components";
import { AppRoute } from "@core";
import { mount, settle, stubMessages } from "@test";

const HOME: AppRoute = { path: "/home" };
const TOKENS: AppRoute = { path: "/showcase/tokens" };

// Answers the router messages an item's link sends. The current route defaults to the root screen,
// so a click on any other item is a real navigation.
async function stubRouter(overrides?: Parameters<typeof stubMessages>[0]) {
    return await stubMessages({
        "App.Router.ResolveRoute": vi.fn(async (route: AppRoute) => `/ueca-react-app-demo2${route.path}`),
        "App.Router.GetRoute": vi.fn(async () => ({ path: "/" }) as AppRoute),
        "App.Router.GoToRoute": vi.fn(async () => true),
        "App.Router.OpenNewTab": vi.fn(async () => { }),
        ...overrides
    });
}

// The item's own box, drawn inside its link.
function itemBox(): HTMLElement {
    return document.querySelector(".ueca-nav-item");
}

describe("NavItem", () => {
    it("draws its icon and text inside a real link to its route", async () => {
        await stubRouter();
        await mount(NavItem, { id: "item", route: HOME, text: "Home", icon: <svg data-testid="icon" /> });

        const link = screen.getByRole("link", { name: "Home" });
        expect(link).toHaveAttribute("id", "item.navLink");
        expect(link).toHaveAttribute("href", "/ueca-react-app-demo2/home");
        expect(link).toHaveClass("nav-link-underline-none");
        expect(document.getElementById("item")).toContainElement(link);

        const box = itemBox();
        expect(link).toContainElement(box);
        expect(box).toContainElement(screen.getByTestId("icon"));
        expect(box).toHaveTextContent("Home");
        expect(box).not.toHaveClass("active", "disabled");
        expect(box).toHaveStyle({ cursor: "pointer" });
        // The menu tints come in as variables, so a theme switch restyles the item without a render.
        expect(box.style.getPropertyValue("--nav-item-hover")).toBe("var(--hover)");
        expect(box.style.getPropertyValue("--nav-item-active")).toBe("var(--selected)");
        expect(box.style.getPropertyValue("--nav-item-disabled")).toBe("var(--disabled-ink)");
    });

    it.each([
        ["icon-text", { icon: true, text: true, justifyContent: "flex-start", gap: "16px", paddingLeft: "16px" }],
        ["text-only", { icon: false, text: true, justifyContent: "flex-start", gap: "16px", paddingLeft: "16px" }],
        ["icon-only", { icon: true, text: false, justifyContent: "center", gap: "0px", paddingLeft: "" }]
    ] as const)("lays out %s mode", async (mode, expected) => {
        await stubRouter();
        await mount(NavItem, { id: "item", route: HOME, text: "Home", icon: <svg data-testid="icon" />, mode });

        const box = itemBox();
        const row = box.firstElementChild as HTMLElement;
        expect(screen.queryByTestId("icon") !== null).toBe(expected.icon);
        expect(box.textContent.includes("Home")).toBe(expected.text);
        expect(row.style.justifyContent).toBe(expected.justifyContent);
        expect(row.style.gap).toBe(expected.gap);
        expect(box.style.paddingLeft).toBe(expected.paddingLeft);
        expect(box.style.paddingTop).toBe("16px");
    });

    it("follows mode changes at runtime", async () => {
        await stubRouter();
        const { model } = await mount(NavItem, { id: "item", route: HOME, text: "Home", icon: <svg data-testid="icon" /> });

        model.mode = "icon-only";
        await settle();
        expect(itemBox()).not.toHaveTextContent("Home");

        model.mode = "text-only";
        await settle();
        expect(itemBox()).toHaveTextContent("Home");
        expect(screen.queryByTestId("icon")).toBeNull();
    });

    it("marks the active item", async () => {
        await stubRouter();
        const { model } = await mount(NavItem, { id: "item", route: HOME, text: "Home", active: true });
        expect(itemBox()).toHaveClass("active");

        model.active = false;
        await settle();

        expect(itemBox()).not.toHaveClass("active");
    });

    it("draws a disabled item as inert text that does not navigate", async () => {
        const bus = await stubRouter();
        await mount(NavItem, { id: "item", route: HOME, text: "Home", disabled: true });

        expect(screen.queryByRole("link")).toBeNull();
        const box = itemBox();
        expect(box).toHaveClass("disabled");
        expect(box).toHaveStyle({ cursor: "default" });

        fireEvent.click(box);
        await settle();
        expect(bus["App.Router.GoToRoute"]).not.toHaveBeenCalled();
    });

    it("sizes the item from extent", async () => {
        await stubRouter();
        await mount(NavItem, { id: "item", route: HOME, text: "Home", extent: { width: 240, height: "3rem" } });

        expect(itemBox()).toHaveStyle({ width: "240px", height: "3rem" });
    });

    // The item is a wrapper: route, disabled, newTab and text live on its NavLink, bound both ways.
    describe("bindings to its link", () => {
        it("passes the route to the link, which resolves its href, and reads a route set on the link", async () => {
            await stubRouter();
            const { model } = await mount(NavItem, { id: "item", route: HOME, text: "Home" });
            expect(model.navLink.route).toEqual(HOME);
            expect(screen.getByRole("link")).toHaveAttribute("href", "/ueca-react-app-demo2/home");

            model.route = TOKENS;
            await settle();
            expect(model.navLink.route).toEqual(TOKENS);
            expect(screen.getByRole("link")).toHaveAttribute("href", "/ueca-react-app-demo2/showcase/tokens");

            model.navLink.route = HOME;
            await settle();
            expect(model.route).toEqual(HOME);
        });

        it("makes text the link's title and shows a title set on the link as its text", async () => {
            await stubRouter();
            const { model } = await mount(NavItem, { id: "item", route: HOME, text: "Home" });
            expect(model.navLink.title).toBe("Home");

            model.text = "Start";
            await settle();
            expect(model.navLink.title).toBe("Start");
            expect(itemBox()).toHaveTextContent("Start");

            model.navLink.title = "Begin";
            await settle();
            expect(model.text).toBe("Begin");
            expect(itemBox()).toHaveTextContent("Begin");
        });

        it("keeps disabled in step with the link", async () => {
            await stubRouter();
            const { model } = await mount(NavItem, { id: "item", route: HOME, text: "Home" });

            model.disabled = true;
            await settle();
            expect(model.navLink.disabled).toBe(true);
            expect(screen.queryByRole("link")).toBeNull();

            model.navLink.disabled = false;
            await settle();
            expect(model.disabled).toBe(false);
            expect(itemBox()).not.toHaveClass("disabled");
            expect(screen.getByRole("link")).toBeInTheDocument();
        });

        it("keeps newTab in step with the link", async () => {
            const bus = await stubRouter();
            const { model } = await mount(NavItem, { id: "item", route: HOME, text: "Home" });

            model.newTab = true;
            await settle();
            expect(model.navLink.newTab).toBe(true);
            expect(screen.getByRole("link")).toHaveAttribute("target", "_blank");

            fireEvent.click(screen.getByRole("link"));
            await settle();
            expect(bus["App.Router.OpenNewTab"]).toHaveBeenCalledWith(HOME);

            model.navLink.newTab = false;
            await settle();
            expect(model.newTab).toBe(false);
        });
    });

    describe("clicks", () => {
        it("navigate to the item's route", async () => {
            const bus = await stubRouter();
            await mount(NavItem, { id: "item", route: HOME, text: "Home" });

            const notPrevented = fireEvent.click(screen.getByRole("link"));
            await settle();

            expect(notPrevented).toBe(false);
            expect(bus["App.Router.GoToRoute"]).toHaveBeenCalledOnce();
            expect(bus["App.Router.GoToRoute"]).toHaveBeenCalledWith(HOME);
        });

        it("do not navigate again to the route already on show", async () => {
            const bus = await stubRouter({ "App.Router.GetRoute": vi.fn(async () => ({ path: "/home" }) as AppRoute) });
            await mount(NavItem, { id: "item", route: HOME, text: "Home" });

            fireEvent.click(screen.getByRole("link"));
            await settle();

            expect(bus["App.Router.GetRoute"]).toHaveBeenCalled();
            expect(bus["App.Router.GoToRoute"]).not.toHaveBeenCalled();
        });

        // Identity is the resolved path: compared on the raw pattern, a parametric item would read as
        // "already here" for every value of its parameter and silently swallow the click.
        it("navigate when only a path parameter differs from the current route", async () => {
            const current = { path: "/docs/:article", params: { article: "intro" } } as unknown as AppRoute;
            const target = { path: "/docs/:article", params: { article: "tabs" } } as unknown as AppRoute;
            const bus = await stubRouter({ "App.Router.GetRoute": vi.fn(async () => current) });
            await mount(NavItem, { id: "item", route: target, text: "Tabs" });

            fireEvent.click(screen.getByRole("link"));
            await settle();

            expect(bus["App.Router.GoToRoute"]).toHaveBeenCalledWith(target);
        });

        it("raise onClick with the item's own model, then navigate", async () => {
            const bus = await stubRouter();
            const onClick = vi.fn();
            const { model } = await mount(NavItem, { id: "item", route: HOME, text: "Home", onClick });

            fireEvent.click(screen.getByRole("link"));
            await settle();

            expect(onClick).toHaveBeenCalledOnce();
            expect(onClick).toHaveBeenCalledWith(model);
            expect(bus["App.Router.GoToRoute"]).toHaveBeenCalledWith(HOME);
        });

        it("on an item without a route only raise onClick", async () => {
            const bus = await stubRouter();
            const onClick = vi.fn();
            await mount(NavItem, { id: "item", text: "Sign out", onClick });

            fireEvent.click(itemBox());
            await settle();

            expect(onClick).toHaveBeenCalledOnce();
            expect(bus["App.Router.GetRoute"]).not.toHaveBeenCalled();
            expect(bus["App.Router.GoToRoute"]).not.toHaveBeenCalled();
        });
    });

    describe("tooltip", () => {
        it("names an icon-only item to the right of the rail on hover", async () => {
            const bus = await stubMessages({
                "App.Tooltip.Show": vi.fn(async () => { }),
                "App.Tooltip.Hide": vi.fn(async () => { })
            });
            await mount(NavItem, { id: "item", text: "Home", icon: <svg />, mode: "icon-only" });

            fireEvent.mouseEnter(itemBox());
            await settle();
            expect(bus["App.Tooltip.Show"]).toHaveBeenCalledWith(expect.objectContaining({
                token: "item",
                contentView: "Home",
                placement: "right"
            }));

            fireEvent.mouseLeave(itemBox());
            await settle();
            expect(bus["App.Tooltip.Hide"]).toHaveBeenCalledWith({ token: "item" });
        });

        // With the label on screen a tooltip would only repeat it.
        it("is not offered while the text is visible, nor without text", async () => {
            const bus = await stubMessages({ "App.Tooltip.Show": vi.fn(async () => { }) });
            const { model } = await mount(NavItem, { id: "item", text: "Home", icon: <svg /> });

            fireEvent.mouseEnter(itemBox());
            await settle();

            model.mode = "icon-only";
            model.text = undefined;
            await settle();
            fireEvent.mouseEnter(itemBox());
            await settle();

            expect(bus["App.Tooltip.Show"]).not.toHaveBeenCalled();
        });
    });

    // Regression: navItem.tsx said an icon-only item is tooltipped for the mouse only because "keyboard
    // users get the aria-label" on the enclosing <a> — but nothing set one. The icons are aria-hidden,
    // so the link had no accessible name at all once the label was hidden: every link in the collapsed
    // sidebar was announced as just "link".
    it("gives an icon-only item's link its text as the accessible name", async () => {
        await stubRouter();
        await mount(NavItem, { id: "item", route: HOME, text: "Home", icon: <svg aria-hidden="true" />, mode: "icon-only" });

        expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("aria-label", "Home");
    });

    // With the label on screen, the content already names the link; an aria-label would only
    // duplicate it, and would go stale if the two ever differed.
    it("labels the link only while the label is hidden, following mode and text", async () => {
        await stubRouter();
        const { model } = await mount(NavItem, { id: "item", route: HOME, text: "Home", icon: <svg aria-hidden="true" /> });
        const link = () => document.getElementById("item.navLink");
        expect(link()).not.toHaveAttribute("aria-label");
        expect(screen.getByRole("link", { name: "Home" })).toBe(link());

        model.mode = "icon-only";
        await settle();
        expect(link()).toHaveAttribute("aria-label", "Home");

        model.text = "Start";
        await settle();
        expect(screen.getByRole("link", { name: "Start" })).toBe(link());

        model.mode = "icon-text";
        await settle();
        expect(link()).not.toHaveAttribute("aria-label");
    });
});
