import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as UECA from "ueca-react";
import { Breadcrumb, ScreenLayout, ScreenLayoutModel, ScreenLayoutParams } from "@core";
import { mount, settle, stubMessages } from "@test";

const home: Breadcrumb = { route: { path: "/" }, label: "Home" };
const controls: Breadcrumb = { route: { path: "/showcase/controls" }, label: "Showcase · Controls" };

async function stubShell() {
    return await stubMessages({
        "App.BrowsingHistory.SetPageTitle": vi.fn(async () => { }),
        "App.Theme.GetMode": vi.fn(async () => "light" as const)
    });
}

function rect(top: number, left: number, width: number, height: number): DOMRect {
    return { top, left, width, height, bottom: top + height, right: left + width, x: left, y: top, toJSON: () => ({}) } as DOMRect;
}

function topBar(): HTMLElement {
    return document.querySelector(".app-topbar");
}

function contentBox(): HTMLElement {
    return document.querySelector(".app-content");
}

function precedes(a: Element, b: Element): boolean {
    return !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
}

describe("ScreenLayout", () => {
    it("puts the trail, the screen's tools and the app controls in the top bar, and the content below it", async () => {
        await stubShell();
        await mount(ScreenLayout, {
            id: "layout",
            breadcrumbs: [home, controls],
            toolsView: <button>Export</button>,
            contentView: <p>Body text</p>
        });

        const bar = within(topBar());
        expect(bar.getByRole("navigation", { name: "breadcrumb" })).toHaveTextContent("HomeShowcase · Controls");
        const tool = bar.getByRole("button", { name: "Export" });
        expect(tool.closest(".ueca-screen-tools")).not.toBeNull();
        const themeToggle = bar.getByRole("button", { name: "Switch to dark theme" });
        expect(bar.getByRole("button", { name: "UECA Website" })).toBeInTheDocument();
        // The screen's own tools first, then the app-level controls behind a hairline.
        const divider = topBar().querySelector(".app-topbar-divider");
        expect(precedes(tool, divider)).toBe(true);
        expect(precedes(divider, themeToggle)).toBe(true);

        expect(within(contentBox()).getByText("Body text")).toBeInTheDocument();
        expect(contentBox()).toHaveClass("ueca-screen-content");
        expect(contentBox().contains(topBar())).toBe(false);
    });

    // Both are props rather than CSS: Col writes `overflow: visible` inline when it is omitted,
    // which outranks any stylesheet — the bar would lose its scrollbar gutter and the content
    // would stop scrolling.
    it("scrolls the content box and keeps the top bar a fixed-height, non-scrolling strip", async () => {
        await stubShell();
        await mount(ScreenLayout, { id: "layout", contentView: <p>Body</p> });

        expect(topBar()).toHaveStyle({ overflow: "hidden", height: "var(--topbar-h)" });
        expect(contentBox()).toHaveStyle({ overflow: "auto" });
    });

    describe("content paddings", () => {
        const all = { paddingTop: "24px", paddingBottom: "24px", paddingLeft: "24px", paddingRight: "24px" };

        it.each([
            ["the default", {}, all],
            ["\"default\"", { contentPaddings: "default" }, all],
            ["a custom padding", { contentPaddings: { top: "small" } }, { paddingTop: "16px" }]
        ] as [string, ScreenLayoutParams, Record<string, string>][])("pads the content box for %s", async (_name, params, expected) => {
            await stubShell();
            await mount(ScreenLayout, { id: "layout", ...params });

            expect(contentBox()).toHaveStyle(expected);
            for (const side of ["paddingTop", "paddingBottom", "paddingLeft", "paddingRight"]) {
                if (!(side in expected)) {
                    expect(contentBox().style.getPropertyValue(side.replace(/[A-Z]/, (c) => `-${c.toLowerCase()}`))).toBe("");
                }
            }
        });

        it("leaves the content box unpadded for \"none\", so the screen can own its band", async () => {
            await stubShell();
            await mount(ScreenLayout, { id: "layout", contentPaddings: "none" });

            expect(contentBox().getAttribute("style")).not.toMatch(/padding/);
        });

        it("falls back to the default padding when the setting is cleared at runtime", async () => {
            await stubShell();
            const { model } = await mount(ScreenLayout, { id: "layout", contentPaddings: "none" });

            model.contentPaddings = undefined;
            await settle();

            expect(contentBox()).toHaveStyle(all);
        });
    });

    describe("overflow menu", () => {
        it("shows the \"…\" button only while there is something in the menu", async () => {
            await stubShell();
            const { model } = await mount(ScreenLayout, { id: "layout" });
            expect(screen.queryByRole("button", { name: "More actions" })).toBeNull();

            model.hiddenToolsView = <button>Print</button>;
            await settle();
            expect(within(topBar()).getByRole("button", { name: "More actions" })).toBeInTheDocument();

            model.hiddenToolsView = null;
            await settle();
            expect(screen.queryByRole("button", { name: "More actions" })).toBeNull();
        });

        it("opens the menu anchored under the \"…\" button, holding the screen's items", async () => {
            await stubShell();
            const { model } = await mount(ScreenLayout, { id: "layout", hiddenToolsView: <button>Print</button> });
            const more = screen.getByRole("button", { name: "More actions" });
            vi.spyOn(more, "getBoundingClientRect").mockReturnValue(rect(10, 700, 32, 30));

            await userEvent.click(more);
            await settle();

            const popover = screen.getByRole("dialog");
            expect(popover).toHaveClass("ueca-popover", "ueca-popover-menu");
            expect(within(within(popover).getByRole("menu")).getByRole("button", { name: "Print" })).toBeInTheDocument();
            expect(model.hiddenToolsPopover.anchor).toEqual({ top: 10, left: 700, width: 32, height: 30 });
            expect(model.hiddenToolsPopover.placement).toBe("bottom");
        });

        // Without the trigger exemption the outside-click close (on mousedown) would shut the menu
        // and the click that follows would open it again, so the button could never close it.
        it("closes the menu from the same \"…\" button", async () => {
            await stubShell();
            await mount(ScreenLayout, { id: "layout", hiddenToolsView: <button>Print</button> });
            const more = screen.getByRole("button", { name: "More actions" });

            await userEvent.click(more);
            await settle();
            expect(screen.getByRole("dialog")).toBeInTheDocument();

            await userEvent.click(more);
            await settle();
            expect(screen.queryByRole("dialog")).toBeNull();
        });

        it("closes the menu after an enabled item's own handler has run", async () => {
            await stubShell();
            let openWhenClicked: boolean;
            const { model } = await mount(ScreenLayout, { id: "layout" });
            model.hiddenToolsView = <button onClick={() => { openWhenClicked = model.hiddenToolsPopover.open; }}>Print</button>;
            await settle();

            await userEvent.click(screen.getByRole("button", { name: "More actions" }));
            await settle();
            await userEvent.click(screen.getByRole("button", { name: "Print" }));
            await settle();

            expect(openWhenClicked).toBe(true);
            expect(screen.queryByRole("dialog")).toBeNull();
        });

        // A disabled button swallows its click, so nothing reaches the closing wrapper.
        it("stays open when the click lands on a disabled item", async () => {
            await stubShell();
            await mount(ScreenLayout, { id: "layout", hiddenToolsView: <button disabled>Print</button> });

            await userEvent.click(screen.getByRole("button", { name: "More actions" }));
            await settle();
            await userEvent.click(screen.getByRole("button", { name: "Print" }));
            await settle();

            expect(screen.getByRole("dialog")).toBeInTheDocument();
        });

        it("ignores a click on the \"…\" button while the button is not on screen", async () => {
            await stubShell();
            const { model } = await mount(ScreenLayout, { id: "layout" });

            model.hiddenToolsButton.click();
            await settle();

            expect(model.hiddenToolsPopover.open).toBe(false);
        });
    });

    describe("page title", () => {
        it.each([
            ["the last crumb, most specific part first", [home, controls], "Controls · Showcase"],
            ["every part of a deeper crumb, reversed", [home, { route: { path: "/playground/table" }, label: "Playground · Table · Filters" }], "Filters · Table · Playground"],
            ["a plain last crumb as it is", [home, { route: { path: "/showcase/status" }, label: "Status" }], "Status"],
            ["nothing for the one-crumb home trail", [home], undefined],
            ["nothing for an empty trail", [], undefined],
            ["nothing for a trail taken away altogether", undefined, undefined],
            ["nothing for a crumb drawn as JSX", [home, { route: { path: "/showcase/icons" }, label: <b>Icons</b> }], undefined]
        ] as [string, Breadcrumb[], string][])("names the page by %s", async (_name, breadcrumbs, title) => {
            const bus = await stubShell();

            await mount(ScreenLayout, { id: "layout", breadcrumbs });

            expect(bus["App.BrowsingHistory.SetPageTitle"]).toHaveBeenCalledExactlyOnceWith(title);
        });

        it("names the page again when its trail changes", async () => {
            const bus = await stubShell();
            const { model } = await mount(ScreenLayout, { id: "layout", breadcrumbs: [home] });

            model.breadcrumbs = [home, controls];
            await settle();

            expect(bus["App.BrowsingHistory.SetPageTitle"]).toHaveBeenLastCalledWith("Controls · Showcase");
        });

        // A screen returned to keeps its breadcrumbs, so no change event fires — but the history
        // service cleared the title when the path changed, so mounting has to name the page too.
        it("names the page again when a cached screen is shown again with the same trail", async () => {
            const bus = await stubShell();
            const layouts: ScreenLayoutModel[] = [];
            const { model: host } = await mount(LayoutHost, { id: "host", onLayoutInit: (m) => { layouts.push(m); } });
            const setPageTitle = bus["App.BrowsingHistory.SetPageTitle"];
            expect(setPageTitle).toHaveBeenCalledTimes(1);

            host.shown = false;
            await settle();
            host.shown = true;
            await settle();

            expect(layouts).toHaveLength(2);
            expect(layouts[1]).toBe(layouts[0]);
            expect(setPageTitle).toHaveBeenCalledTimes(2);
            expect(setPageTitle).toHaveBeenLastCalledWith("Controls · Showcase");
        });
    });
});

// Hosts a ScreenLayout as a cached JSX child that can be hidden and shown again.
type LayoutHostStruct = UECA.ComponentStruct<{
    props: { shown: boolean };
    events: { onLayoutInit: (layout: ScreenLayoutModel) => void };
}>;

const HOST_TRAIL: Breadcrumb[] = [home, controls];

function useLayoutHost(params?: UECA.ComponentParams<LayoutHostStruct>) {
    const struct: LayoutHostStruct = {
        props: {
            id: useLayoutHost.name,
            shown: true
        },

        View: () => (
            <div id={model.htmlId()}>
                {model.shown ? <ScreenLayout id={"layout"} breadcrumbs={HOST_TRAIL} init={(m) => model.onLayoutInit?.(m)} /> : null}
            </div>
        )
    };

    const model = UECA.useComponent(struct, params);
    return model;
}

const LayoutHost = UECA.getFC(useLayoutHost);
