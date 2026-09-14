import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as UECA from "ueca-react";
import { TabModel, TabParams, TabsContainer, TabsContainerModel, useTab, useTabsContainer } from "@components";
import { AppMessage, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon } from "@core";
import { mount, settle } from "@test";

function tab(id: string, label: string, extra?: Partial<TabParams>): TabParams {
    return { id, labelView: label, contentView: <p>{`${id} content`}</p>, ...extra };
}

const GENERAL = tab("general", "General");
const ADVANCED = tab("advanced", "Advanced");
const HELP = tab("help", "Help");

// The DOM ids (tab model paths) of the tab buttons drawn as selected.
function selectedButtonIds(): string[] {
    return Array.from(document.querySelectorAll("button.ueca-tab.selected")).map((b) => b.id);
}

// The text of the content panel under the strip.
function panelText(): string {
    return document.querySelector(".ueca-focus-bleed").textContent;
}

function scroller(): HTMLElement {
    return document.querySelector(".ueca-tabs-scroller");
}

function scrollButtons(): HTMLElement[] {
    return Array.from(document.querySelectorAll(".ueca-tabs-scroll-button"));
}

// jsdom has no layout, so the strip's measurements are stubbed on the scroller.
function measureScroller(size: { scrollWidth?: number; clientWidth?: number; scrollHeight?: number; clientHeight?: number }) {
    for (const [key, value] of Object.entries(size)) {
        Object.defineProperty(scroller(), key, { configurable: true, value });
    }
}

async function resizeWindow() {
    fireEvent(window, new Event("resize"));
    await settle();
}

function markupOf(element: React.ReactElement): string {
    const { container, unmount } = render(element);
    const html = container.innerHTML;
    unmount();
    return html;
}

// The content panel, found by its place under the strip rather than by the class it wears.
function panel(): HTMLElement {
    return document.querySelector(".ueca-tabs-header").nextElementSibling as HTMLElement;
}

// Stylesheets are read from disk because Vitest empties every CSS import, `?raw` included. The test
// tsconfig carries no Node typings, so the one Node API used is typed here.
declare const process: { getBuiltinModule(id: "node:fs"): { readFileSync(path: string, encoding: "utf8"): string } };

function projectFile(path: string): string {
    const dir = (import.meta as ImportMeta & { dirname: string }).dirname;
    return process.getBuiltinModule("node:fs").readFileSync(`${dir}/../../../../${path}`, "utf8");
}

// The declarations of the stylesheet rule for exactly this selector, comments dropped.
function ruleDeclarations(css: string, selector: string): Record<string, string> {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const body = new RegExp(`(?:^|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`).exec(css.replace(/\/\*[\s\S]*?\*\//g, ""))?.[1] ?? "";
    return Object.fromEntries(body.split(";").map((d) => d.trim()).filter(Boolean).map((d) => {
        const colon = d.indexOf(":");
        return [d.slice(0, colon).trim(), d.slice(colon + 1).trim()];
    }));
}

describe("TabsContainer", () => {
    it("renders its config tabs, selecting the first and showing its content", async () => {
        const { model } = await mount(TabsContainer, { id: "tabs", tabsConfig: [GENERAL, ADVANCED] });

        expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual(["General", "Advanced"]);
        expect(selectedButtonIds()).toEqual(["tabs.general"]);
        expect(panelText()).toBe("general content");
        expect(model.selectedTab).toBe(model.getTab("general"));
        expect(model.selectedTabId).toBe("general");
        expect(model.selectedTabIndex).toBe(0);
        expect(model.tabs.every((t) => t.container === model)).toBe(true);
    });

    it("selects nothing and shows no content without tabs", async () => {
        const { model } = await mount(TabsContainer, { id: "tabs" });

        expect(screen.queryAllByRole("button")).toHaveLength(0);
        expect(model.selectedTab).toBeUndefined();
        expect(model.selectedTabIndex).toBe(-1);
        expect(panelText()).toBe("");
    });

    it("selects a clicked tab: one selected mark, its content on show, and onChange raised", async () => {
        const selectedAtOnChange: string[] = [];
        const onChange = vi.fn((source: TabsContainerModel) => { selectedAtOnChange.push(source.selectedTab?.getTabId()); });
        const { model } = await mount(TabsContainer, { id: "tabs", tabsConfig: [GENERAL, ADVANCED], onChange });

        await userEvent.click(screen.getByRole("button", { name: "Advanced" }));
        await settle();

        expect(selectedButtonIds()).toEqual(["tabs.advanced"]);
        expect(model.tabs.map((t) => t.selected)).toEqual([false, true]);
        expect(panelText()).toBe("advanced content");
        expect(model.selectedTabId).toBe("advanced");
        expect(model.selectedTabIndex).toBe(1);
        expect(onChange).toHaveBeenLastCalledWith(model);
        expect(selectedAtOnChange[selectedAtOnChange.length - 1]).toBe("advanced");
    });

    it("raises the clicked tab's own onClick with the tab's model", async () => {
        const onClick = vi.fn();
        const { model } = await mount(TabsContainer, { id: "tabs", tabsConfig: [GENERAL, tab("advanced", "Advanced", { onClick })] });

        await userEvent.click(screen.getByRole("button", { name: "Advanced" }));
        await settle();

        expect(onClick).toHaveBeenCalledOnce();
        expect(onClick).toHaveBeenCalledWith(model.getTab("advanced"));
    });

    it("does not select a disabled tab", async () => {
        await mount(TabsContainer, { id: "tabs", tabsConfig: [GENERAL, tab("advanced", "Advanced", { disabled: true })] });

        fireEvent.click(screen.getByRole("button", { name: "Advanced" }));
        await settle();

        expect(selectedButtonIds()).toEqual(["tabs.general"]);
        expect(panelText()).toBe("general content");
    });

    it("selects by selectedTabId and selectedTabIndex, and an empty id selects the first tab", async () => {
        const { model } = await mount(TabsContainer, { id: "tabs", tabsConfig: [GENERAL, ADVANCED, HELP] });

        model.selectedTabId = "help";
        await settle();
        expect(selectedButtonIds()).toEqual(["tabs.help"]);
        expect(panelText()).toBe("help content");
        expect(model.selectedTabIndex).toBe(2);

        model.selectedTabIndex = 1;
        await settle();
        expect(selectedButtonIds()).toEqual(["tabs.advanced"]);
        expect(model.selectedTabId).toBe("advanced");

        model.selectedTabId = "";
        await settle();
        expect(selectedButtonIds()).toEqual(["tabs.general"]);
    });

    it("looks tabs up by tab id, which wins over the component id", async () => {
        const { model } = await mount(TabsContainer, {
            id: "tabs",
            tabsConfig: [GENERAL, tab("adv", "Advanced", { tabId: "advanced" })]
        });

        expect(model.getTab("advanced")).toBe(model.tabs[1]);
        expect(model.getTabIndex("advanced")).toBe(1);
        expect(model.getTab("adv")).toBeUndefined();
        expect(model.getTabIndex("missing")).toBe(-1);
    });

    // Regression: selectedTabId's setter only guarded the moment before tabs exist, while _initTabs
    // (which falls back to the first tab "when nothing is selected") runs on tab changes alone. So an
    // id that names no tab — a stale ?tab= in a route a TabsScreen binds — deselected every tab and
    // blanked the panel, although the same id given at start-up falls back to the first tab.
    it("keeps a tab selected when selectedTabId is set to an id that names no tab", async () => {
        const { model } = await mount(TabsContainer, { id: "tabs", tabsConfig: [GENERAL, ADVANCED] });

        model.selectedTabId = "missing";
        await settle();

        expect(selectedButtonIds()).toHaveLength(1);
        expect(panelText()).not.toBe("");
    });

    it("falls back to the first tab, and reports it, for an id that names no tab", async () => {
        const { model } = await mount(TabsContainer, { id: "tabs", tabsConfig: [GENERAL, ADVANCED] });
        model.selectedTabId = "advanced";
        await settle();

        model.selectedTabId = "missing";
        await settle();

        expect(selectedButtonIds()).toEqual(["tabs.general"]);
        expect(model.selectedTabId).toBe("general");
    });

    describe("with tab models from its owner", () => {
        it("starts on the tab its owner binds and writes the user's choice back", async () => {
            const { model } = await mount(TabsHost, { id: "host", selected: "advanced" });
            expect(selectedButtonIds()).toEqual(["host.advanced"]);
            expect(panelText()).toBe("advanced content");

            await userEvent.click(screen.getByRole("button", { name: "Help" }));
            await settle();
            expect(model.selected).toBe("help");

            model.selected = "general";
            await settle();
            expect(selectedButtonIds()).toEqual(["host.general"]);
        });

        it("falls back to the first tab when the id it starts on names no tab", async () => {
            await mount(TabsHost, { id: "host", selected: "missing" });

            expect(selectedButtonIds()).toEqual(["host.general"]);
            expect(panelText()).toBe("general content");
        });

        // Removing the selected tab used to leave it selected, with its content still on screen.
        it("selects the first remaining tab when the selected one is removed", async () => {
            const { model } = await mount(TabsHost, { id: "host", selected: "advanced" });

            model.shown = ["general", "help"];
            await settle();

            expect(model.tabs.tabs.map((t) => t.getTabId())).toEqual(["general", "help"]);
            expect(selectedButtonIds()).toEqual(["host.general"]);
            expect(panelText()).toBe("general content");
            expect(model.selected).toBe("general");
        });

        it("adopts tabs added later, keeping the selection", async () => {
            const { model } = await mount(TabsHost, { id: "host", shown: ["general"] });

            model.shown = ["general", "help"];
            await settle();
            expect(selectedButtonIds()).toEqual(["host.general"]);
            expect(model.help.container).toBe(model.tabs);

            await userEvent.click(screen.getByRole("button", { name: "Help" }));
            await settle();
            expect(selectedButtonIds()).toEqual(["host.help"]);
        });
    });

    describe("with a changing tabsConfig", () => {
        // Cached tab models never re-announce themselves, so rebuilding the list on a config change
        // lost track of them and every tab kept its selected flag, underlining all of them.
        it("keeps the existing tab models and a single selected mark when a tab is added", async () => {
            const { model } = await mount(TabsContainer, { id: "tabs", tabsConfig: [GENERAL, ADVANCED] });
            await userEvent.click(screen.getByRole("button", { name: "Advanced" }));
            const [general, advanced] = model.tabs;

            model.tabsConfig = [GENERAL, ADVANCED, HELP];
            await settle();
            expect(model.tabs.map((t) => t.getTabId())).toEqual(["general", "advanced", "help"]);
            expect(model.tabs[0]).toBe(general);
            expect(model.tabs[1]).toBe(advanced);
            expect(selectedButtonIds()).toEqual(["tabs.advanced"]);

            await userEvent.click(screen.getByRole("button", { name: "Help" }));
            await settle();
            expect(selectedButtonIds()).toEqual(["tabs.help"]);
            expect(model.tabs.filter((t) => t.selected).map((t) => t.getTabId())).toEqual(["help"]);
        });

        // The selected tab's content used to stay on screen after its config was removed.
        it("selects the first remaining tab and shows its content when the selected tab is removed", async () => {
            const { model } = await mount(TabsContainer, { id: "tabs", tabsConfig: [GENERAL, ADVANCED, HELP] });
            await userEvent.click(screen.getByRole("button", { name: "Advanced" }));

            model.tabsConfig = [GENERAL, HELP];
            await settle();

            expect(document.getElementById("tabs.advanced")).toBeNull();
            expect(model.tabs.map((t) => t.getTabId())).toEqual(["general", "help"]);
            expect(selectedButtonIds()).toEqual(["tabs.general"]);
            expect(panelText()).toBe("general content");
        });

        it("clears the selection when every tab is removed and selects the next tab added", async () => {
            const { model } = await mount(TabsContainer, { id: "tabs", tabsConfig: [GENERAL, ADVANCED] });

            model.tabsConfig = [];
            await settle();
            expect(screen.queryAllByRole("button")).toHaveLength(0);
            expect(model.selectedTab).toBeUndefined();
            expect(panelText()).toBe("");

            model.tabsConfig = [HELP];
            await settle();
            expect(selectedButtonIds()).toEqual(["tabs.help"]);
            expect(panelText()).toBe("help content");
        });

        it("treats a missing tabsConfig as no tabs", async () => {
            const { model } = await mount(TabsContainer, { id: "tabs", tabsConfig: [GENERAL, ADVANCED] });

            model.tabsConfig = undefined;
            await settle();

            expect(model.tabs).toEqual([]);
            expect(screen.queryAllByRole("button")).toHaveLength(0);
            expect(panelText()).toBe("");
        });

        // A config may give its tab id as a getter; compared unresolved, the tab would be dropped
        // from the list for good, since its cached model never announces itself again.
        it("keeps a tab whose id is given as a getter", async () => {
            const beta = tab("b", "Beta", { tabId: () => "beta" });
            const { model } = await mount(TabsContainer, { id: "tabs", tabsConfig: [GENERAL, beta] });
            const betaTab = model.getTab("beta");
            expect(betaTab).toBeDefined();

            model.tabsConfig = [GENERAL, beta, HELP];
            await settle();

            expect(model.getTab("beta")).toBe(betaTab);
            expect(model.tabs).toHaveLength(3);
        });

        // Regression: init ran _initTabs before any config tab existed (config tabs are created by the
        // first render), so the id parked in _defaultTabId was looked up in an empty list and
        // discarded. The first tab was selected instead — and a bound selectedTabId source was
        // overwritten with it.
        it("starts on the selectedTabId it was given among its config tabs", async () => {
            await mount(TabsContainer, { id: "tabs", tabsConfig: [GENERAL, ADVANCED], selectedTabId: "advanced" });

            expect(selectedButtonIds()).toEqual(["tabs.advanced"]);
            expect(panelText()).toBe("advanced content");
        });

        it("starts on the first config tab when the selectedTabId it was given names none", async () => {
            await mount(TabsContainer, { id: "tabs", tabsConfig: [GENERAL, ADVANCED], selectedTabId: "missing" });

            expect(selectedButtonIds()).toEqual(["tabs.general"]);
            expect(panelText()).toBe("general content");
        });

        // Regression: the id waiting for its tab was a non-reactive prop, and selectedTabId reads it
        // first, so once it was used up nothing told the read to look again: a start-up id that named
        // no tab went on being reported after the first tab was selected, and a bound source was never
        // corrected to the tab on show.
        it("reports the tab it fell back to through selectedTabId", async () => {
            const { model } = await mount(TabsContainer, { id: "tabs", tabsConfig: [GENERAL, ADVANCED], selectedTabId: "missing" });

            expect(model.selectedTabId).toBe("general");
        });
    });

    describe("layout", () => {
        it("is horizontal by default", async () => {
            await mount(TabsContainer, { id: "tabs", tabsConfig: [GENERAL] });

            expect(document.getElementById("tabs")).toHaveAttribute("class", "ueca-tabs-container horizontal");
            expect(document.querySelector(".ueca-tabs-header")).not.toHaveClass("ueca-tabs-vertical");
            expect(document.querySelector(".ueca-tabs-list")).toHaveAttribute("class", "ueca-tabs-list");
        });

        it("marks the container, header and list when vertical", async () => {
            const { model } = await mount(TabsContainer, { id: "tabs", tabsConfig: [GENERAL], orientation: "vertical" });

            expect(document.getElementById("tabs")).toHaveAttribute("class", "ueca-tabs-container vertical");
            expect(document.querySelector(".ueca-tabs-header")).toHaveClass("ueca-tabs-vertical");
            expect(document.querySelector(".ueca-tabs-list")).toHaveClass("ueca-tabs-vertical");

            model.orientation = "horizontal";
            await settle();
            expect(document.getElementById("tabs")).toHaveClass("horizontal");
            expect(document.querySelector(".ueca-tabs-list")).not.toHaveClass("ueca-tabs-vertical");
        });

        it.each([
            [undefined, "ueca-tabs-list", "ueca-tabs-scroller"],
            ["standard", "ueca-tabs-list", "ueca-tabs-scroller"],
            ["scrollable", "ueca-tabs-list", "ueca-tabs-scroller scrollable"],
            ["fullWidth", "ueca-tabs-list fullWidth", "ueca-tabs-scroller"]
        ] as const)("styles the %s variant", async (variant, listClass, scrollerClass) => {
            await mount(TabsContainer, { id: "tabs", tabsConfig: [GENERAL], variant });

            expect(document.querySelector(".ueca-tabs-list")).toHaveAttribute("class", listClass);
            expect(scroller()).toHaveAttribute("class", scrollerClass);
        });

        it("centres the tab list", async () => {
            await mount(TabsContainer, { id: "tabs", tabsConfig: [GENERAL], centered: true });

            expect(document.querySelector(".ueca-tabs-list")).toHaveAttribute("class", "ueca-tabs-list centered");
        });

        // The panel clips and tab content sits flush against its edge, so it wears ueca-focus-bleed. The
        // class used to be worn with nothing defining it: the panel reserved no room, and a control at its
        // edge lost its focus ring on three sides.
        it("reserves the focus bleed around its panel, with a rule theme.css defines", async () => {
            await mount(TabsContainer, { id: "tabs", tabsConfig: [GENERAL] });

            expect(panel()).toHaveClass("ueca-focus-bleed");
            expect(ruleDeclarations(projectFile("src/theme.css"), ".ueca-focus-bleed")).toEqual({
                padding: "var(--focus-bleed)",
                margin: "calc(-1 * var(--focus-bleed))",
                "scroll-padding": "var(--focus-bleed)"
            });
            expect(projectFile("src/tokens.css")).toMatch(/--focus-bleed:\s*\d+px;/);
        });

        // fill's width: 100% held the panel to the container's width, so the bleed's negative margins
        // shifted it left instead of widening it, and its content came in twice the bleed on the right.
        it("lets its panel stretch, so the bleed's margins widen it rather than shift it", async () => {
            await mount(TabsContainer, { id: "tabs", tabsConfig: [GENERAL] });

            expect(panel().style.width).toBe("auto");
        });
    });

    describe("scroll buttons", () => {
        it("flank a scrollable strip when scrollButtons is true, pointing back and forward", async () => {
            await mount(TabsContainer, { id: "tabs", tabsConfig: [GENERAL, ADVANCED], variant: "scrollable", scrollButtons: true });

            const parts = Array.from(document.querySelector(".ueca-tabs-wrapper").children);
            expect(parts.map((part) => part.className)).toEqual([
                "ueca-tabs-scroll-button", "ueca-tabs-scroller scrollable", "ueca-tabs-scroll-button"
            ]);
            expect(parts[0]).toHaveAttribute("type", "button");
            expect(parts[0].innerHTML).toBe(markupOf(<ChevronLeftIcon />));
            expect(parts[2].innerHTML).toBe(markupOf(<ChevronRightIcon />));
        });

        it.each([
            ["standard", true],
            ["fullWidth", true],
            ["standard", "auto"],
            ["scrollable", false],
            ["scrollable", undefined]
        ] as const)("are not shown for a %s strip with scrollButtons %s, even when it overflows", async (variant, buttonsSetting) => {
            await mount(TabsContainer, { id: "tabs", tabsConfig: [GENERAL, ADVANCED], variant, scrollButtons: buttonsSetting });

            measureScroller({ scrollWidth: 800, clientWidth: 300 });
            await resizeWindow();

            expect(scrollButtons()).toHaveLength(0);
        });

        it("in auto mode appear while the tabs overflow and go when they fit, rechecked on window resize", async () => {
            const { model } = await mount(TabsContainer, { id: "tabs", tabsConfig: [GENERAL, ADVANCED], variant: "scrollable", scrollButtons: "auto" });
            expect(scrollButtons()).toHaveLength(0);

            measureScroller({ scrollWidth: 800, clientWidth: 300 });
            await resizeWindow();
            expect(model._hasOverflow).toBe(true);
            expect(scrollButtons()).toHaveLength(2);

            measureScroller({ scrollWidth: 300, clientWidth: 300 });
            await resizeWindow();
            expect(scrollButtons()).toHaveLength(0);
        });

        it("in auto mode measure a vertical strip by height, and point up and down", async () => {
            await mount(TabsContainer, {
                id: "tabs", tabsConfig: [GENERAL, ADVANCED], variant: "scrollable", scrollButtons: "auto", orientation: "vertical"
            });

            measureScroller({ scrollWidth: 800, clientWidth: 300, scrollHeight: 100, clientHeight: 100 });
            await resizeWindow();
            expect(scrollButtons()).toHaveLength(0);

            measureScroller({ scrollHeight: 500 });
            await resizeWindow();
            const [back, forward] = scrollButtons();
            expect(back.innerHTML).toBe(markupOf(<ChevronUpIcon />));
            expect(forward.innerHTML).toBe(markupOf(<ChevronDownIcon />));
        });

        it("scroll a horizontal strip 200px per click, never before its start", async () => {
            await mount(TabsContainer, { id: "tabs", tabsConfig: [GENERAL, ADVANCED], variant: "scrollable", scrollButtons: true });
            const [back, forward] = scrollButtons();

            fireEvent.click(forward);
            fireEvent.click(forward);
            expect(scroller().scrollLeft).toBe(400);

            fireEvent.click(back);
            expect(scroller().scrollLeft).toBe(200);

            fireEvent.click(back);
            fireEvent.click(back);
            expect(scroller().scrollLeft).toBe(0);
            expect(scroller().scrollTop).toBe(0);
        });

        it("scroll a vertical strip along its height", async () => {
            await mount(TabsContainer, {
                id: "tabs", tabsConfig: [GENERAL, ADVANCED], variant: "scrollable", scrollButtons: true, orientation: "vertical"
            });
            const [back, forward] = scrollButtons();

            fireEvent.click(forward);
            expect(scroller().scrollTop).toBe(200);

            fireEvent.click(back);
            fireEvent.click(back);
            expect(scroller().scrollTop).toBe(0);
            expect(scroller().scrollLeft).toBe(0);
        });

        it("are safe to call through the model once the strip is gone", async () => {
            const { model, unmount } = await mount(TabsContainer, { id: "tabs", tabsConfig: [GENERAL], variant: "scrollable" });
            unmount();
            await settle();

            expect(() => {
                model.scrollLeft();
                model.scrollRight();
            }).not.toThrow();
        });

        it("in auto mode re-measure when the orientation changes", async () => {
            const { model } = await mount(TabsContainer, { id: "tabs", tabsConfig: [GENERAL, ADVANCED], variant: "scrollable", scrollButtons: "auto" });
            measureScroller({ scrollWidth: 800, clientWidth: 300, scrollHeight: 100, clientHeight: 100 });
            await resizeWindow();
            expect(scrollButtons()).toHaveLength(2);

            model.orientation = "vertical";
            await settle(10);

            expect(model._hasOverflow).toBe(false);
            expect(scrollButtons()).toHaveLength(0);
        });

        it("in auto mode re-measure when the strip becomes scrollable", async () => {
            const { model } = await mount(TabsContainer, { id: "tabs", tabsConfig: [GENERAL, ADVANCED], variant: "standard", scrollButtons: "auto" });
            measureScroller({ scrollWidth: 800, clientWidth: 300 });

            model.variant = "scrollable";
            await settle(10);

            expect(scrollButtons()).toHaveLength(2);
        });
    });

    it("listens for window resizes only while mounted", async () => {
        const addListener = vi.spyOn(window, "addEventListener");
        const removeListener = vi.spyOn(window, "removeEventListener");
        const { model, unmount } = await mount(TabsContainer, { id: "tabs", tabsConfig: [GENERAL] });
        const onResize = addListener.mock.calls.find(([type]) => type === "resize")?.[1];
        expect(onResize).toBe(model._checkOverflow);
        expect(removeListener).not.toHaveBeenCalledWith("resize", onResize);

        unmount();
        await settle();

        expect(removeListener).toHaveBeenCalledWith("resize", onResize);
    });

    describe("validation", () => {
        it("validates its tabs and marks the invalid one", async () => {
            const { model } = await mount(TabsContainer, {
                id: "tabs",
                tabsConfig: [GENERAL, tab("advanced", "Advanced", { onValidate: async () => "Timeout is required" })]
            });

            await model.validate();
            await settle();

            expect(model.isValid()).toBe(false);
            expect(model.getValidationError()).toBe("Timeout is required");
            expect(document.getElementById("tabs.advanced")).toHaveClass("invalid");
            expect(document.getElementById("tabs.general")).not.toHaveClass("invalid");

            model.resetValidationErrors();
            await settle();
            expect(model.isValid()).toBe(true);
            expect(document.getElementById("tabs.advanced")).not.toHaveClass("invalid");
        });

        it("stops answering for a tab once its config is removed", async () => {
            const { model } = await mount(TabsContainer, {
                id: "tabs",
                tabsConfig: [GENERAL, tab("advanced", "Advanced", { onValidate: async () => "Timeout is required" })]
            });
            await model.validate();
            expect(model.isValid()).toBe(false);

            model.tabsConfig = [GENERAL];
            await settle();

            expect(model.isValid()).toBe(true);
        });
    });
});

// An owner that builds its own tab models and hands a filtered list of them to the container, with
// the selection bound to one of its props — the shape TabsScreen gives a route-driven screen.
type TabsHostStruct = UECA.ComponentStruct<{
    props: {
        selected: string;
        shown: string[];
    };

    children: {
        general: TabModel;
        advanced: TabModel;
        help: TabModel;
        tabs: TabsContainerModel;
    };
}, AppMessage>;

function useTabsHost(params?: UECA.ComponentParams<TabsHostStruct, AppMessage>) {
    const struct: TabsHostStruct = {
        props: {
            id: useTabsHost.name,
            selected: undefined,
            shown: ["general", "advanced", "help"]
        },

        children: {
            general: useTab({ tabId: "general", labelView: "General", contentView: <p>general content</p> }),
            advanced: useTab({ tabId: "advanced", labelView: "Advanced", contentView: <p>advanced content</p> }),
            help: useTab({ tabId: "help", labelView: "Help", contentView: <p>help content</p> }),

            tabs: useTabsContainer({
                tabs: () => [model.general, model.advanced, model.help].filter((t) => t && model.shown.includes(t.tabId)),
                selectedTabId: UECA.bind(() => model, "selected")
            })
        },

        View: () => (
            <div id={model.htmlId()}>
                <model.tabs.View />
            </div>
        )
    };

    const model = UECA.useComponent(struct, params);
    return model;
}

const TabsHost = UECA.getFC(useTabsHost);
