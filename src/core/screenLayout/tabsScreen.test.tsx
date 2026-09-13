import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as UECA from "ueca-react";
import { TabModel, useTab } from "@components";
import { Breadcrumb, TabsScreen, TabsScreenModel, TabsScreenParams } from "@core";
import { mount, settle, stubMessages } from "@test";

const TRAIL: Breadcrumb[] = [
    { route: { path: "/home" }, label: "Home" },
    { route: { path: "/showcase/data" }, label: "Data" },
    { route: { path: "/showcase/lists" }, label: "Settings" }
];

async function stubServices() {
    return await stubMessages({
        "BusyDisplay.Set": vi.fn(async () => { }),
        "Dialog.Warning": vi.fn(async () => { }),
        "Dialog.ActionConfirmation": vi.fn(async () => true),
        "App.Router.GoToRoute": vi.fn(async () => true)
    });
}

// The tab models come from a host that owns them, the way a screen declares its tabs as children.
async function mountTabsScreen(params: TabsScreenParams = {}): Promise<{ screenModel: TabsScreenModel; tabs: TabsHostModel }> {
    const { model: tabs } = await mount(TabsHost, { id: "tabsHost" });
    const { model: screenModel } = await mount(TabsScreen, {
        id: "settings",
        breadcrumbs: TRAIL,
        tabs: [tabs.generalTab, tabs.advancedTab],
        ...params
    });
    return { screenModel, tabs };
}

function tab(name: string): HTMLElement {
    return screen.getByRole("button", { name });
}

describe("TabsScreen", () => {
    it("shows its tabs as the screen's content, under the toolbar its intent calls for", async () => {
        await stubServices();
        await mountTabsScreen({ intent: "edit" });

        const content = within(document.querySelector(".app-content") as HTMLElement);
        expect(content.getByRole("button", { name: "General" })).toHaveClass("ueca-tab", "selected");
        expect(content.getByRole("button", { name: "Advanced" })).not.toHaveClass("selected");
        expect(content.getByText("General settings")).toBeInTheDocument();
        expect(content.queryByText("Advanced settings")).toBeNull();
        for (const name of ["Refresh", "Cancel", "Save"]) {
            expect(screen.getByRole("button", { name })).toBeInTheDocument();
        }
    });

    it("switches the content with the selected tab and reports the tab through selectedTabId", async () => {
        await stubServices();
        const { screenModel } = await mountTabsScreen();
        expect(screenModel.selectedTabId).toBe("generalTab");

        await userEvent.click(tab("Advanced"));
        await settle();

        expect(screen.getByText("Advanced settings")).toBeInTheDocument();
        expect(screen.queryByText("General settings")).toBeNull();
        expect(screenModel.selectedTabId).toBe("advancedTab");
    });

    it("selects the tab named by selectedTabId, at mount and at runtime", async () => {
        await stubServices();
        const { screenModel } = await mountTabsScreen({ selectedTabId: "advancedTab" });
        expect(screen.getByText("Advanced settings")).toBeInTheDocument();

        screenModel.selectedTabId = "generalTab";
        await settle();

        expect(screen.getByText("General settings")).toBeInTheDocument();
        expect(tab("General")).toHaveClass("selected");
    });

    it("refuses to save while a tab is invalid, marking the tab and naming the error", async () => {
        const bus = await stubServices();
        const onSave = vi.fn(async () => { });
        const { screenModel, tabs } = await mountTabsScreen({ intent: "edit", onSave });
        tabs.advancedError = "The port is out of range";
        screenModel.setScreenState({ dataModified: true });

        await screenModel.save();
        await settle();

        expect(onSave).not.toHaveBeenCalled();
        expect(bus["Dialog.Warning"]).toHaveBeenCalledWith(expect.objectContaining({ details: "The port is out of range" }));
        expect(tab("Advanced")).toHaveClass("invalid");
        expect(tab("General")).not.toHaveClass("invalid");

        screenModel.resetValidationErrors();
        await settle();

        expect(tab("Advanced")).not.toHaveClass("invalid");
    });

    it("saves once the tabs are valid", async () => {
        await stubServices();
        const onSave = vi.fn(async () => { });
        const { screenModel } = await mountTabsScreen({ intent: "edit", onSave });
        screenModel.setScreenState({ dataModified: true });
        await settle();

        await userEvent.click(screen.getByRole("button", { name: "Save" }));
        await settle();

        expect(onSave).toHaveBeenCalledOnce();
        expect(screenModel.getScreenState().dataModified).toBe(false);
    });

    it("applies its own onValidate as the screen-level rule", async () => {
        const bus = await stubServices();
        const { screenModel } = await mountTabsScreen({ onValidate: async () => "Pick at least one feature" });

        expect(await screenModel.validateScreen(true)).toBe(false);

        expect(bus["Dialog.Warning"]).toHaveBeenCalledWith(expect.objectContaining({ details: "Pick at least one feature" }));
    });

    it("raises its own events from the CRUD flows it wraps", async () => {
        await stubServices();
        const events = {
            onRefresh: vi.fn(async () => { }),
            onSave: vi.fn(async () => { }),
            onCancel: vi.fn(async () => { }),
            onDelete: vi.fn(async () => { }),
            onModify: vi.fn(async () => { })
        };
        const { screenModel } = await mountTabsScreen({ intent: "add-edit-record", ...events });

        screenModel.setScreenState({ dataModified: true });
        await screenModel.refresh();
        await screenModel.save();
        await screenModel.cancel();
        await screenModel.delete();
        await settle();

        for (const handler of Object.values(events)) {
            expect(handler).toHaveBeenCalledOnce();
        }
    });

    it("reads and writes the state of the CRUD screen it wraps", async () => {
        await stubServices();
        const { screenModel } = await mountTabsScreen({ intent: "edit" });

        screenModel.setScreenState({ dataModified: true });
        await settle();

        expect(screenModel.getScreenState().dataModified).toBe(true);
        expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
    });

    it("hands its intent, trail, tools, overflow items, read-only flag and action text to the CRUD screen", async () => {
        await stubServices();
        const { screenModel } = await mountTabsScreen({
            intent: "action",
            actionButtonText: "Apply",
            toolsView: <button>Import</button>
        });
        expect(screen.getByRole("navigation", { name: "breadcrumb" })).toHaveTextContent("HomeDataSettings");
        expect(screen.getByRole("button", { name: "Import" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Apply" })).toBeInTheDocument();

        screenModel.setScreenState({ dataModified: true });
        screenModel.actionButtonText = "Apply now";
        await settle();
        expect(screen.getByRole("button", { name: "Apply now" })).toBeEnabled();

        screenModel.readonly = true;
        await settle();
        expect(screen.getByRole("button", { name: "Apply now" })).toBeDisabled();

        screenModel.intent = "edit-record";
        screenModel.hiddenToolsView = <button role="menuitem">Export</button>;
        await settle();
        await userEvent.click(screen.getByRole("button", { name: "More actions" }));
        await settle();
        expect(within(screen.getByRole("menu")).getAllByRole("menuitem").map((i) => i.textContent)).toEqual(["Export", "Delete"]);
    });

    // Regression: TabsScreen declares onAdd (CRUDScreenEvents) and accepts the add-* intents that show
    // the Add button, but forwarded every CRUD event to its crudScreen except onAdd — the button did
    // nothing and the screen's handler never ran.
    it("raises onAdd from the Add button of an add intent", async () => {
        await stubServices();
        const onAdd = vi.fn(async () => { });
        await mountTabsScreen({ intent: "add-record", onAdd });

        await userEvent.click(screen.getByRole("button", { name: "Add new" }));
        await settle();

        expect(onAdd).toHaveBeenCalledOnce();
    });

    // Regression: TabsScreenModel's type promises every CRUDScreenMethods member, but the struct
    // forwarded only some of them; add, goToParentScreen, scheduleSetRoute and scheduleGoToRoute were
    // undefined at runtime, so a call that type-checked threw "is not a function".
    it("goes to the parent screen like the CRUD screen it wraps", async () => {
        const bus = await stubServices();
        const { screenModel } = await mountTabsScreen();

        await screenModel.goToParentScreen();
        await settle();

        expect(bus["App.Router.GoToRoute"]).toHaveBeenCalledExactlyOnceWith(TRAIL[1].route);
    });

    it("adds and schedules routes like the CRUD screen it wraps", async () => {
        const bus = await stubServices();
        const setRoute = (await stubMessages({ "App.Router.SetRoute": vi.fn(async () => true) }))["App.Router.SetRoute"];
        const onAdd = vi.fn(async () => { });
        const { screenModel } = await mountTabsScreen({ onAdd });

        await screenModel.add();
        screenModel.scheduleSetRoute({ path: "/home" });
        screenModel.scheduleGoToRoute({ path: "/showcase/overview" });
        await settle(20);

        expect(onAdd).toHaveBeenCalledOnce();
        expect(setRoute).toHaveBeenCalledExactlyOnceWith({ path: "/home" });
        expect(bus["App.Router.GoToRoute"]).toHaveBeenCalledExactlyOnceWith({ path: "/showcase/overview" });
    });

    // Regression: contentPaddings is part of TabsScreen's props type (Omit<CRUDScreenProps,
    // "contentView">) but was neither declared nor bound to the crudScreen, so the value was silently
    // dropped and the tabs always sat in the default padding.
    it("applies the content paddings it is given", async () => {
        await stubServices();
        await mountTabsScreen({ contentPaddings: "none" });

        expect(document.querySelector(".app-content").getAttribute("style")).not.toMatch(/padding/);
    });

    it("follows content paddings that change after mounting", async () => {
        await stubServices();
        const { screenModel } = await mountTabsScreen();
        expect(document.querySelector(".app-content").getAttribute("style")).toMatch(/padding/);

        screenModel.contentPaddings = "none";
        await settle();

        expect(document.querySelector(".app-content").getAttribute("style")).not.toMatch(/padding/);
        expect(screenModel.crudScreen.contentPaddings).toBe("none");
    });
});

type TabsHostStruct = UECA.ComponentStruct<{
    props: { advancedError: string };
    children: { generalTab: TabModel; advancedTab: TabModel };
}>;

type TabsHostModel = UECA.ComponentModel<TabsHostStruct>;

function useTabsHost(params?: UECA.ComponentParams<TabsHostStruct>): TabsHostModel {
    const struct: TabsHostStruct = {
        props: {
            id: useTabsHost.name,
            advancedError: undefined
        },

        children: {
            generalTab: useTab({ labelView: "General", contentView: <p>General settings</p> }),
            advancedTab: useTab({
                labelView: "Advanced",
                contentView: <p>Advanced settings</p>,
                onValidate: async () => model.advancedError
            })
        },

        View: () => null
    };

    const model = UECA.useComponent(struct, params);
    return model;
}

const TabsHost = UECA.getFC(useTabsHost);
