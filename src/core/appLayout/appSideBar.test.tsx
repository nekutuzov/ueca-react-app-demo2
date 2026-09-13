import { afterEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppRoute, AppSideBar, AppSideBarModel, AppSideBarParams } from "@core";
import { mount, settle, stubMessages } from "@test";

// jsdom's window is 1024px wide; the sidebar drops to its icon rail below 860px.
const jsdomInnerWidth = Object.getOwnPropertyDescriptor(window, "innerWidth");

afterEach(() => {
    Object.defineProperty(window, "innerWidth", jsdomInnerWidth);
});

function setViewportWidth(width: number) {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
}

async function resizeViewport(width: number) {
    setViewportWidth(width);
    window.dispatchEvent(new Event("resize"));
    await settle();
}

async function stubShell(current?: AppRoute) {
    return await stubMessages({
        "App.SideBarStateChanged": vi.fn(async () => { }),
        "App.Security.Unauthorize": vi.fn(async () => { }),
        "App.Router.OpenNewTab": vi.fn(async () => { }),
        "App.Router.GoToRoute": vi.fn(async () => true),
        "App.Router.GetRoute": vi.fn(async () => current)
    });
}

async function mountSideBar(params: AppSideBarParams = {}): Promise<AppSideBarModel> {
    const { model } = await mount(AppSideBar, { id: "sideBar", ...params });
    return model;
}

function rail(): HTMLElement {
    return document.getElementById("sideBar");
}

function toggleButtons(): HTMLElement[] {
    return screen.getAllByRole("button").filter((b) => /the menu$/.test(b.getAttribute("aria-label")));
}

function rect(top: number, height: number): DOMRect {
    return { top, height, bottom: top + height, left: 0, width: 240, right: 240, x: 0, y: top, toJSON: () => ({}) } as DOMRect;
}

describe("AppSideBar", () => {
    it("starts expanded on a wide viewport, with the brand, the labels and a collapse button", async () => {
        await stubShell();
        const model = await mountSideBar();

        expect(model.collapsed).toBe(false);
        expect(rail()).toHaveStyle({ width: "var(--sidebar-w)", minWidth: "var(--sidebar-w)", maxWidth: "var(--sidebar-w)" });
        expect(within(rail()).getByText("UECA-React")).toHaveClass("app-sidebar-wordmark");
        expect(within(rail()).getByText("3.0")).toHaveClass("app-sidebar-version");
        expect(toggleButtons().map((b) => b.getAttribute("aria-label"))).toEqual(["Collapse the menu"]);
        expect(screen.getByText("Home")).toBeInTheDocument();
        expect(screen.getByText("Sign out")).toBeInTheDocument();
    });

    // Decided in constr, so the first paint is already on the right side of the breakpoint.
    it("starts collapsed on a narrow viewport, before its first render", async () => {
        await stubShell();
        setViewportWidth(800);
        let collapsedAtConstruction: boolean;

        await mountSideBar({ constr: (m) => { collapsedAtConstruction = m.collapsed; } });

        expect(collapsedAtConstruction).toBe(true);
        expect(rail()).toHaveStyle({ width: "var(--sidebar-w-collapsed)", minWidth: "var(--sidebar-w-collapsed)", maxWidth: "var(--sidebar-w-collapsed)" });
        expect(within(rail()).queryByText("UECA-React")).toBeNull();
        expect(toggleButtons().map((b) => b.getAttribute("aria-label"))).toEqual(["Expand the menu"]);
        expect(screen.queryByText("Home")).toBeNull();
        expect(screen.queryByText("Sign out")).toBeNull();
    });

    it("announces changes of state, not the state it starts in", async () => {
        const bus = await stubShell();
        setViewportWidth(800);

        await mountSideBar();

        expect(bus["App.SideBarStateChanged"]).not.toHaveBeenCalled();
    });

    it.each([
        [859, true],
        [860, false]
    ])("starts on a %ipx-wide viewport collapsed: %s", async (width, collapsed) => {
        await stubShell();
        setViewportWidth(width);

        const model = await mountSideBar();

        expect(model.collapsed).toBe(collapsed);
    });

    it("collapses and expands from its toggle button, announcing each change", async () => {
        const bus = await stubShell();
        const model = await mountSideBar();

        await userEvent.click(screen.getByRole("button", { name: "Collapse the menu" }));
        await settle();
        expect(model.collapsed).toBe(true);
        expect(rail()).toHaveStyle({ width: "var(--sidebar-w-collapsed)" });

        await userEvent.click(screen.getByRole("button", { name: "Expand the menu" }));
        await settle();
        expect(model.collapsed).toBe(false);
        expect(rail()).toHaveStyle({ width: "var(--sidebar-w)" });

        expect(bus["App.SideBarStateChanged"].mock.calls).toEqual([[{ collapsed: true }], [{ collapsed: false }]]);
    });

    it("flips from toggleCollapse as it does from the button", async () => {
        const bus = await stubShell();
        const model = await mountSideBar();

        model.toggleCollapse();
        await settle();

        expect(model.collapsed).toBe(true);
        expect(bus["App.SideBarStateChanged"]).toHaveBeenCalledExactlyOnceWith({ collapsed: true });
    });

    it("turns the menu and the Sign out item into icons while collapsed", async () => {
        await stubShell();
        const model = await mountSideBar();

        model.collapsed = true;
        await settle();

        expect(model.menu.iconsOnly).toBe(true);
        expect(screen.queryByText("Home")).toBeNull();
        expect(screen.queryByText("Sign out")).toBeNull();
        for (const item of rail().querySelectorAll(".ueca-nav-item")) {
            expect(item.querySelector(".ueca-icon")).not.toBeNull();
        }

        model.collapsed = false;
        await settle();

        expect(model.menu.iconsOnly).toBe(false);
        expect(screen.getByText("Sign out")).toBeInTheDocument();
    });

    // An action, not a route: signing out swaps the whole shell for the sign-in form.
    it("signs out over the bus from the Sign out item, labelled or not, without navigating", async () => {
        const bus = await stubShell();
        const model = await mountSideBar();

        await userEvent.click(screen.getByText("Sign out"));
        await settle();
        expect(bus["App.Security.Unauthorize"]).toHaveBeenCalledOnce();

        model.collapsed = true;
        await settle();
        await userEvent.click(document.getElementById(model.signOutItem.htmlId()).querySelector(".ueca-nav-item"));
        await settle();

        expect(bus["App.Security.Unauthorize"]).toHaveBeenCalledTimes(2);
        expect(bus["App.Router.GoToRoute"]).not.toHaveBeenCalled();
    });

    // Regression: Sign out has no route, so its link had no href and no tab stop — a keyboard user
    // could not sign out in either sidebar state.
    it("signs out from the keyboard, expanded and collapsed", async () => {
        const bus = await stubShell();
        const model = await mountSideBar();

        screen.getByRole("button", { name: "Sign out" }).focus();
        await userEvent.keyboard("{Enter}");
        await settle();
        expect(bus["App.Security.Unauthorize"]).toHaveBeenCalledOnce();

        model.collapsed = true;
        await settle();
        screen.getByRole("button", { name: "Sign out" }).focus();
        await userEvent.keyboard(" ");
        await settle();

        expect(bus["App.Security.Unauthorize"]).toHaveBeenCalledTimes(2);
    });

    it("opens the UECA website in a new tab from the logo", async () => {
        const bus = await stubShell();
        await mountSideBar();

        const logoLink = screen.getByRole("img", { name: "UECA-React" }).closest("a");
        expect(logoLink).toHaveAttribute("target", "_blank");
        expect(logoLink).toHaveAttribute("rel", "noopener noreferrer");

        await userEvent.click(logoLink);
        await settle();

        expect(bus["App.Router.OpenNewTab"]).toHaveBeenCalledExactlyOnceWith({ path: "https://cranesoft.net" });
    });

    // overflow is a prop, not a class: Col writes `overflow: visible` inline when it is omitted.
    // x hidden, y auto — an index of chapters has no horizontal axis.
    it("scrolls the menu inside its own rail and pins Sign out below it", async () => {
        await stubShell();
        const model = await mountSideBar();

        const scroller = rail().querySelector(".app-sidebar-scroll") as HTMLElement;
        expect(scroller.style.overflow).toBe("hidden auto");
        expect(scroller.contains(document.getElementById(model.menu.htmlId()))).toBe(true);

        const signOut = document.getElementById(model.signOutItem.htmlId());
        expect(signOut.closest(".app-sidebar-footer")).not.toBeNull();
        expect(scroller.contains(signOut)).toBe(false);
    });

    // The menu finds the rail to scroll by its class, so the two have to agree on the name.
    it("keeps the active menu item of a deep link in view inside its rail", async () => {
        await stubShell({ path: "/playground/table" });
        vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
            if (this.classList.contains("app-sidebar-scroll")) {
                return rect(0, 300);
            }
            return this.id === "sideBar.menu.tablePlaygroundMenuItem" ? rect(900, 40) : rect(0, 0);
        });

        await mountSideBar();
        await settle();

        expect((rail().querySelector(".app-sidebar-scroll") as HTMLElement).scrollTop).toBe(900 + 40 - 300 + 12);
    });

    describe("viewport", () => {
        it("collapses when the viewport narrows past the breakpoint and expands when it widens again", async () => {
            const bus = await stubShell();
            const model = await mountSideBar();

            await resizeViewport(700);
            expect(model.collapsed).toBe(true);

            await resizeViewport(1200);
            expect(model.collapsed).toBe(false);

            expect(bus["App.SideBarStateChanged"].mock.calls).toEqual([[{ collapsed: true }], [{ collapsed: false }]]);
        });

        // Only the crossing counts, so a deliberate toggle survives dragging the window around
        // on one side of the breakpoint.
        it("keeps a collapse the reader chose while the viewport stays wide", async () => {
            await stubShell();
            const model = await mountSideBar();
            await userEvent.click(screen.getByRole("button", { name: "Collapse the menu" }));
            await settle();

            await resizeViewport(1100);
            await resizeViewport(900);

            expect(model.collapsed).toBe(true);
        });

        it("keeps an expand the reader chose while the viewport stays narrow, until the next crossing", async () => {
            await stubShell();
            setViewportWidth(800);
            const model = await mountSideBar();
            await userEvent.click(screen.getByRole("button", { name: "Expand the menu" }));
            await settle();

            await resizeViewport(700);
            expect(model.collapsed).toBe(false);

            await resizeViewport(1000);
            expect(model.collapsed).toBe(false);

            await resizeViewport(800);
            expect(model.collapsed).toBe(true);
        });

        // The listener is built once and kept on the model, so unmount removes the very same
        // function it added — a fresh one would leave the original attached.
        it("stops following the viewport once unmounted, removing the listener it added", async () => {
            await stubShell();
            const addListener = vi.spyOn(window, "addEventListener");
            const removeListener = vi.spyOn(window, "removeEventListener");
            const { model, unmount } = await mount(AppSideBar, { id: "sideBar" });
            const added = addListener.mock.calls.filter(([type]) => type === "resize").map(([, listener]) => listener);
            expect(added).toHaveLength(1);

            unmount();
            await settle();

            const removed = removeListener.mock.calls.filter(([type]) => type === "resize").map(([, listener]) => listener);
            expect(removed).toEqual(added);
            await resizeViewport(700);
            expect(model.collapsed).toBe(false);
        });
    });
});
