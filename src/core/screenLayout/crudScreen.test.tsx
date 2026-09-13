import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TextField } from "@components";
import { appMessageBus, Breadcrumb, CRUDScreen, CRUDScreenModel, CRUDScreenParams } from "@core";
import { mount, settle, stubMessages } from "@test";

const homeCrumb: Breadcrumb = { route: { path: "/home" }, label: "Home" };
const listCrumb: Breadcrumb = { route: { path: "/showcase/data" }, label: "Data" };
const detailCrumb: Breadcrumb = { route: { path: "/showcase/lists" }, label: "Lists" };
const TRAIL = [homeCrumb, listCrumb, detailCrumb];

const CLEAN_STATE = {
    dataNew: false,
    dataModified: false,
    dataLoading: false,
    dataValidating: false,
    dataSaving: false,
    dataCanceling: false
};

// The services a CRUD screen talks to. `trace` records the busy display and whatever the screen's
// own handlers push, in order, so a test can see what ran inside the busy bracket.
async function stubServices(answers: { leave?: boolean; delete?: boolean } = {}) {
    const trace: string[] = [];
    const bus = await stubMessages({
        "BusyDisplay.Set": vi.fn(async (busy: boolean) => { trace.push(busy ? "busy" : "idle"); }),
        "BusyDisplay.Clear": vi.fn(async () => { trace.push("busy cleared"); }),
        "Dialog.Confirmation": vi.fn(async () => answers.leave),
        "Dialog.ActionConfirmation": vi.fn(async () => answers.delete),
        "Dialog.Warning": vi.fn(async () => { }),
        "Dialog.Exception": vi.fn(async () => { }),
        "App.Router.GoToRoute": vi.fn(async () => true),
        "App.Router.SetRoute": vi.fn(async () => true)
    });
    return { bus, trace };
}

async function mountScreen(params: CRUDScreenParams = {}): Promise<CRUDScreenModel> {
    const { model } = await mount(CRUDScreen, { id: "crud", breadcrumbs: TRAIL, ...params });
    return model;
}

async function leave(): Promise<boolean[]> {
    return await appMessageBus.broadcast(null, "App.Router.BeforeRouteChange", { path: "/home" });
}

function toolbarButtons(): string[] {
    return within(document.querySelector(".ueca-screen-tools") as HTMLElement)
        .getAllByRole("button")
        .map((b) => b.getAttribute("aria-label") ?? b.textContent);
}

function button(name: string): HTMLElement {
    return screen.queryByRole("button", { name });
}

async function openMoreMenu() {
    await userEvent.click(screen.getByRole("button", { name: "More actions" }));
    await settle();
}

describe("CRUDScreen", () => {
    describe("toolbar", () => {
        // The "…" button tracks the slot being null: a record flow folds Delete into it, every
        // other intent passes the screen's own (here absent) items through untouched.
        it.each([
            ["none", { add: false, refresh: false, cancel: false, save: false, action: false, more: false }],
            ["view", { add: false, refresh: true, cancel: false, save: false, action: false, more: false }],
            ["edit", { add: false, refresh: true, cancel: true, save: true, action: false, more: false }],
            ["edit-record", { add: false, refresh: true, cancel: true, save: true, action: false, more: true }],
            ["action", { add: false, refresh: true, cancel: true, save: false, action: true, more: false }],
            ["add-record", { add: true, refresh: true, cancel: true, save: true, action: false, more: false }],
            ["add-edit-record", { add: true, refresh: true, cancel: true, save: true, action: false, more: true }]
        ] as const)("shows the controls intent %s calls for", async (intent, shown) => {
            await stubServices();
            await mountScreen({ intent, actionButtonText: "Run" });

            expect({
                add: !!button("Add new"),
                refresh: !!button("Refresh"),
                cancel: !!button("Cancel"),
                save: !!button("Save"),
                action: !!button("Run"),
                more: !!button("More actions")
            }).toEqual(shown);
        });

        it("orders the toolbar: the screen's own tools, Add, Refresh, then Cancel and Save", async () => {
            await stubServices();
            await mountScreen({ intent: "add-edit-record", toolsView: <button>Import</button> });

            expect(toolbarButtons()).toEqual(["Import", "Add new", "Refresh", "Cancel", "Save", "More actions"]);
        });

        it("pairs Cancel with the action button for the action intent", async () => {
            await stubServices();
            await mountScreen({ intent: "action", actionButtonText: "Run" });

            expect(toolbarButtons()).toEqual(["Refresh", "Cancel", "Run"]);
        });

        it("adds Delete after the screen's own overflow items in a record flow", async () => {
            await stubServices();
            await mountScreen({ intent: "edit-record", hiddenToolsView: <button role="menuitem">Export</button> });

            await openMoreMenu();

            expect(within(screen.getByRole("menu")).getAllByRole("menuitem").map((i) => i.textContent)).toEqual(["Export", "Delete"]);
        });

        it("passes the screen's own overflow items through without Delete outside a record flow", async () => {
            await stubServices();
            await mountScreen({ intent: "edit", hiddenToolsView: <button role="menuitem">Export</button> });

            await openMoreMenu();

            expect(within(screen.getByRole("menu")).getAllByRole("menuitem").map((i) => i.textContent)).toEqual(["Export"]);
        });

        it("follows the intent when it changes at runtime", async () => {
            await stubServices();
            const model = await mountScreen({ intent: "none" });
            expect(button("Refresh")).toBeNull();

            model.intent = "edit";
            await settle();
            expect(button("Save")).toBeInTheDocument();

            model.intent = "none";
            await settle();
            expect(button("Refresh")).toBeNull();
            expect(button("Save")).toBeNull();
        });
    });

    describe("toolbar state", () => {
        it.each([
            ["a clean record", {}, false, { add: true, refresh: true, cancel: false, save: false, delete: true }],
            ["a modified record", { dataModified: true }, false, { add: true, refresh: false, cancel: true, save: true, delete: true }],
            // A brand-new record is savable and cancelable before any field is edited.
            ["a new record", { dataNew: true }, false, { add: false, refresh: false, cancel: true, save: true, delete: false }],
            ["a record being saved", { dataModified: true, dataSaving: true }, false, { add: false, refresh: false, cancel: false, save: false, delete: false }],
            ["a record being loaded", { dataLoading: true }, false, { add: false, refresh: false, cancel: false, save: false, delete: true }],
            ["a read-only record", {}, true, { add: false, refresh: true, cancel: false, save: false, delete: false }],
            ["a read-only modified record", { dataModified: true }, true, { add: false, refresh: false, cancel: false, save: false, delete: false }]
        ])("enables the right controls for %s", async (_name, state, readonly, enabled) => {
            await stubServices();
            const model = await mountScreen({ intent: "add-edit-record", readonly });

            model.setScreenState(state);
            await settle();
            await openMoreMenu();

            expect({
                add: !(button("Add new") as HTMLButtonElement).disabled,
                refresh: !(button("Refresh") as HTMLButtonElement).disabled,
                cancel: !(button("Cancel") as HTMLButtonElement).disabled,
                save: !(button("Save") as HTMLButtonElement).disabled,
                delete: !(screen.getByRole("menuitem", { name: "Delete" }) as HTMLButtonElement).disabled
            }).toEqual(enabled);
        });

        it.each([
            ["keeps the action button disabled on a clean screen", {}, false, false],
            ["enables the action button once the screen is modified", { dataModified: true }, false, true],
            ["keeps the action button disabled for a new record that nothing has modified", { dataNew: true }, false, false],
            ["disables the action button while saving", { dataModified: true, dataSaving: true }, false, false],
            ["disables the action button on a read-only screen", { dataModified: true }, true, false]
        ])("%s", async (_name, state, readonly, enabled) => {
            await stubServices();
            const model = await mountScreen({ intent: "action", actionButtonText: "Run", readonly });

            model.setScreenState(state);
            await settle();

            expect((button("Run") as HTMLButtonElement).disabled).toBe(!enabled);
        });
    });

    describe("screen state", () => {
        it("merges a partial state into the current one", async () => {
            await stubServices();
            const model = await mountScreen();

            model.setScreenState({ dataModified: true });
            model.setScreenState({ dataLoading: true });

            expect(model.getScreenState()).toEqual({ ...CLEAN_STATE, dataModified: true, dataLoading: true });
        });

        it("hands out a copy, so changing it does not change the screen", async () => {
            await stubServices();
            const model = await mountScreen({ intent: "edit" });

            const state = model.getScreenState();
            state.dataModified = true;
            await settle();

            expect(model.getScreenState().dataModified).toBe(false);
            expect((button("Save") as HTMLButtonElement).disabled).toBe(true);
        });

        it("raises onModify when the screen becomes modified, not on every write while it stays so", async () => {
            await stubServices();
            const onModify = vi.fn(async () => { });
            const model = await mountScreen({ onModify });

            model.setScreenState({ dataModified: true });
            model.setScreenState({ dataModified: true, dataLoading: true });
            await settle();
            expect(onModify).toHaveBeenCalledOnce();

            model.setScreenState({ dataModified: false });
            model.setScreenState({ dataModified: true });
            await settle();
            expect(onModify).toHaveBeenCalledTimes(2);
        });
    });

    describe("add", () => {
        it("raises onAdd from the Add button", async () => {
            await stubServices();
            const onAdd = vi.fn(async () => { });
            await mountScreen({ intent: "add-record", onAdd });

            await userEvent.click(button("Add new"));
            await settle();

            expect(onAdd).toHaveBeenCalledOnce();
        });
    });

    describe("refresh", () => {
        it("reloads through onRefresh behind the busy display, flagged as loading, and leaves the record clean", async () => {
            const { trace } = await stubServices();
            const model: CRUDScreenModel = await mountScreen({
                onRefresh: async () => { trace.push(`refresh loading=${model.getScreenState().dataLoading}`); }
            });
            model.setScreenState({ dataModified: true });

            await model.refresh();

            expect(trace).toEqual(["busy", "refresh loading=true", "idle"]);
            expect(model.getScreenState()).toEqual(CLEAN_STATE);
        });

        it("clears the validation errors of the previous attempt", async () => {
            await stubServices();
            const model = await mountScreen({ onValidate: async () => "Broken" });
            await model.validateScreen();
            expect(model.isValid()).toBe(false);

            await model.refresh();

            expect(model.isValid()).toBe(true);
        });

        it("keeps a new record savable after reloading it", async () => {
            await stubServices();
            const model = await mountScreen({ onRefresh: async () => { } });
            model.setScreenState({ dataNew: true });

            await model.refresh();

            expect(model.getScreenState()).toEqual({ ...CLEAN_STATE, dataNew: true, dataModified: true });
        });

        it("touches neither the busy display nor the loading flag without an onRefresh handler", async () => {
            const { bus } = await stubServices();
            const model = await mountScreen();
            model.setScreenState({ dataModified: true });

            await model.refresh();

            expect(bus["BusyDisplay.Set"]).not.toHaveBeenCalled();
            expect(model.getScreenState()).toEqual(CLEAN_STATE);
        });

        it("clears the loading flag and the busy display when onRefresh fails, leaving the record as it was", async () => {
            const { trace } = await stubServices();
            const model = await mountScreen({ onRefresh: async () => { throw new Error("offline"); } });
            model.setScreenState({ dataModified: true });

            await expect(model.refresh()).rejects.toThrow("offline");

            expect(trace).toEqual(["busy", "idle"]);
            expect(model.getScreenState()).toEqual({ ...CLEAN_STATE, dataModified: true });
        });

        it("reloads from the Refresh button", async () => {
            await stubServices();
            const onRefresh = vi.fn(async () => { });
            await mountScreen({ intent: "view", onRefresh });

            await userEvent.click(button("Refresh"));
            await settle();

            expect(onRefresh).toHaveBeenCalledOnce();
        });
    });

    describe("validateScreen", () => {
        it("passes a valid screen without a dialog, flagged as validating behind the busy display", async () => {
            const { bus, trace } = await stubServices();
            const model: CRUDScreenModel = await mountScreen({
                onValidate: async () => { trace.push(`validate validating=${model.getScreenState().dataValidating}`); return undefined; }
            });

            expect(await model.validateScreen(true)).toBe(true);

            expect(trace).toEqual(["busy", "validate validating=true", "idle"]);
            expect(model.getScreenState().dataValidating).toBe(false);
            expect(bus["Dialog.Warning"]).not.toHaveBeenCalled();
        });

        it("fails on the screen's own rule and explains it in a warning dialog", async () => {
            const { bus } = await stubServices();
            const model = await mountScreen({ onValidate: async () => "The end date is before the start date" });

            expect(await model.validateScreen(true)).toBe(false);

            expect(bus["Dialog.Warning"]).toHaveBeenCalledExactlyOnceWith({
                title: "Warning",
                message: "There are validation errors. Please review your input.",
                details: "The end date is before the start date"
            });
        });

        it("fails without a dialog unless asked for one", async () => {
            const { bus } = await stubServices();
            const model = await mountScreen({ onValidate: async () => "Broken" });

            expect(await model.validateScreen()).toBe(false);

            expect(bus["Dialog.Warning"]).not.toHaveBeenCalled();
        });

        it("checks the registered fields as well, listing their errors before the screen's own", async () => {
            const { bus } = await stubServices();
            const { model: nameField } = await mount(TextField, { id: "name", labelView: "Name", required: true });
            const model = await mountScreen({ modelsToValidate: [nameField], onValidate: async () => "The record is locked" });

            expect(await model.validateScreen(true)).toBe(false);

            expect(bus["Dialog.Warning"]).toHaveBeenCalledWith(expect.objectContaining({
                details: "Name cannot be empty\r\nThe record is locked"
            }));
        });

        it("clears the validating flag and the busy display when a rule throws", async () => {
            const { trace } = await stubServices();
            const model = await mountScreen({ onValidate: async () => { throw new Error("rule crashed"); } });

            await expect(model.validateScreen(true)).rejects.toThrow("rule crashed");

            expect(trace).toEqual(["busy", "idle"]);
            expect(model.getScreenState().dataValidating).toBe(false);
        });
    });

    describe("save", () => {
        it("validates, then saves through onSave behind the busy display, and leaves the record clean", async () => {
            const { trace } = await stubServices();
            const model: CRUDScreenModel = await mountScreen({
                onValidate: async () => { trace.push("validate"); return undefined; },
                onSave: async () => { trace.push(`save saving=${model.getScreenState().dataSaving}`); }
            });
            model.setScreenState({ dataNew: true, dataModified: true });

            await model.save();

            expect(trace).toEqual(["busy", "validate", "idle", "busy", "save saving=true", "idle"]);
            expect(model.getScreenState()).toEqual(CLEAN_STATE);
        });

        it("does not save an invalid record, which stays modified", async () => {
            const { bus } = await stubServices();
            const onSave = vi.fn(async () => { });
            const model = await mountScreen({ onSave, onValidate: async () => "Broken" });
            model.setScreenState({ dataModified: true });

            await model.save();

            expect(onSave).not.toHaveBeenCalled();
            expect(bus["Dialog.Warning"]).toHaveBeenCalledOnce();
            expect(model.getScreenState().dataModified).toBe(true);
        });

        it("keeps the record modified, so it can be saved again, when onSave fails", async () => {
            const { trace } = await stubServices();
            const model = await mountScreen({ onSave: async () => { throw new Error("conflict"); } });
            model.setScreenState({ dataModified: true });

            await expect(model.save()).rejects.toThrow("conflict");

            expect(trace).toEqual(["busy", "idle", "busy", "idle"]);
            expect(model.getScreenState()).toEqual({ ...CLEAN_STATE, dataModified: true });
        });

        it("marks the record clean after validating when there is no onSave handler", async () => {
            const { trace } = await stubServices();
            const model = await mountScreen();
            model.setScreenState({ dataNew: true, dataModified: true });

            await model.save();

            expect(trace).toEqual(["busy", "idle"]);
            expect(model.getScreenState()).toEqual(CLEAN_STATE);
        });

        it.each([
            ["the Save button", "edit", "Save"],
            ["the action button", "action", "Run"]
        ] as const)("saves from %s", async (_name, intent, buttonName) => {
            await stubServices();
            const onSave = vi.fn(async () => { });
            const model = await mountScreen({ intent, actionButtonText: "Run", onSave });
            model.setScreenState({ dataModified: true });
            await settle();

            await userEvent.click(button(buttonName));
            await settle();

            expect(onSave).toHaveBeenCalledOnce();
        });
    });

    describe("cancel", () => {
        it("discards the changes through onCancel behind the busy display, clearing validation errors", async () => {
            const { trace } = await stubServices();
            const model: CRUDScreenModel = await mountScreen({
                onValidate: async () => "Broken",
                onCancel: async () => { trace.push(`cancel canceling=${model.getScreenState().dataCanceling}`); }
            });
            await model.validateScreen();
            model.setScreenState({ dataModified: true });
            trace.length = 0;

            await model.cancel();

            expect(trace).toEqual(["busy", "cancel canceling=true", "idle"]);
            expect(model.getScreenState()).toEqual(CLEAN_STATE);
            expect(model.isValid()).toBe(true);
        });

        // Add-* intents restore their own context; only record-detail flows go back to the parent
        // when a brand-new record is abandoned.
        it.each([
            ["returns to the parent screen after abandoning a new record in a record-detail flow", "edit-record", true, true],
            ["stays after cancelling edits to an existing record", "edit-record", false, false],
            ["stays after abandoning a new record on an add-record screen", "add-record", true, false],
            ["stays after abandoning a new record on an add-edit-record screen", "add-edit-record", true, false]
        ] as const)("%s", async (_name, intent, dataNew, navigates) => {
            const { bus } = await stubServices();
            const model = await mountScreen({ intent });
            model.setScreenState({ dataNew, dataModified: true });

            await model.cancel();
            await settle();

            if (navigates) {
                expect(bus["App.Router.GoToRoute"]).toHaveBeenCalledExactlyOnceWith(listCrumb.route);
            } else {
                expect(bus["App.Router.GoToRoute"]).not.toHaveBeenCalled();
            }
        });

        it("cancels from the Cancel button", async () => {
            await stubServices();
            const onCancel = vi.fn(async () => { });
            const model = await mountScreen({ intent: "edit", onCancel });
            model.setScreenState({ dataModified: true });
            await settle();

            await userEvent.click(button("Cancel"));
            await settle();

            expect(onCancel).toHaveBeenCalledOnce();
            expect(model.getScreenState().dataModified).toBe(false);
        });
    });

    describe("delete", () => {
        it("asks first and changes nothing when the user declines", async () => {
            const { bus, trace } = await stubServices({ delete: false });
            const onDelete = vi.fn(async () => { });
            const model = await mountScreen({ intent: "edit-record", onDelete });
            model.setScreenState({ dataModified: true });

            await model.delete();
            await settle();

            expect(bus["Dialog.ActionConfirmation"]).toHaveBeenCalledExactlyOnceWith({
                title: "Warning",
                message: "Are you sure want to delete this item?",
                action: "Delete"
            });
            expect(onDelete).not.toHaveBeenCalled();
            expect(trace).toEqual([]);
            expect(model.getScreenState().dataModified).toBe(true);
            expect(bus["App.Router.GoToRoute"]).not.toHaveBeenCalled();
        });

        it("deletes through onDelete behind the busy display, then returns to the parent screen", async () => {
            const { bus, trace } = await stubServices({ delete: true });
            const model: CRUDScreenModel = await mountScreen({
                intent: "edit-record",
                onDelete: async () => { trace.push(`delete saving=${model.getScreenState().dataSaving}`); }
            });
            model.setScreenState({ dataModified: true });

            await model.delete();
            await settle();

            expect(trace).toEqual(["busy", "delete saving=true", "idle"]);
            expect(model.getScreenState()).toEqual(CLEAN_STATE);
            expect(bus["App.Router.GoToRoute"]).toHaveBeenCalledExactlyOnceWith(listCrumb.route);
        });

        it("stays on an add screen after deleting, so the screen can pick the next record", async () => {
            const { bus } = await stubServices({ delete: true });
            const onDelete = vi.fn(async () => { });
            const model = await mountScreen({ intent: "add-edit-record", onDelete });

            await model.delete();
            await settle();

            expect(onDelete).toHaveBeenCalledOnce();
            expect(bus["App.Router.GoToRoute"]).not.toHaveBeenCalled();
        });

        it("without an onDelete handler neither asks nor deletes, but still returns to the parent screen", async () => {
            const { bus } = await stubServices({ delete: true });
            const model = await mountScreen({ intent: "edit-record" });
            model.setScreenState({ dataModified: true });

            await model.delete();
            await settle();

            expect(bus["Dialog.ActionConfirmation"]).not.toHaveBeenCalled();
            expect(model.getScreenState()).toEqual(CLEAN_STATE);
            expect(bus["App.Router.GoToRoute"]).toHaveBeenCalledExactlyOnceWith(listCrumb.route);
        });

        it("clears the saving flag and stays on the screen when onDelete fails", async () => {
            const { bus, trace } = await stubServices({ delete: true });
            const model = await mountScreen({ intent: "edit-record", onDelete: async () => { throw new Error("in use"); } });

            await expect(model.delete()).rejects.toThrow("in use");
            await settle();

            expect(trace).toEqual(["busy", "idle"]);
            expect(model.getScreenState().dataSaving).toBe(false);
            expect(bus["App.Router.GoToRoute"]).not.toHaveBeenCalled();
        });

        it("deletes from the Delete row of the \"…\" menu", async () => {
            await stubServices({ delete: true });
            const onDelete = vi.fn(async () => { });
            await mountScreen({ intent: "edit-record", onDelete });

            await openMoreMenu();
            await userEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
            await settle();

            expect(onDelete).toHaveBeenCalledOnce();
        });
    });

    describe("goToParentScreen", () => {
        it.each([
            ["the crumb before the current one", TRAIL, listCrumb.route],
            ["the first crumb of a two-crumb trail", [homeCrumb, detailCrumb], homeCrumb.route],
            ["the root for a one-crumb trail", [detailCrumb], { path: "/" }],
            ["the root for an empty trail", [], { path: "/" }]
        ] as [string, Breadcrumb[], object][])("goes to %s", async (_name, breadcrumbs, route) => {
            const { bus } = await stubServices();
            const model = await mountScreen({ breadcrumbs });

            await model.goToParentScreen();
            await settle();

            expect(bus["App.Router.GoToRoute"]).toHaveBeenCalledExactlyOnceWith(route);
        });

        it("replaces the address instead of adding a history entry when redirecting", async () => {
            const { bus } = await stubServices();
            const model = await mountScreen();

            await model.goToParentScreen(true);
            await settle();

            expect(bus["App.Router.SetRoute"]).toHaveBeenCalledExactlyOnceWith(listCrumb.route);
            expect(bus["App.Router.GoToRoute"]).not.toHaveBeenCalled();
        });

        // Deferred, never awaited: the route change unmounts the screen, so navigating inline would
        // tear the model down while the method that asked for it is still on the stack.
        it("navigates only after the method that asked for it has returned", async () => {
            const { bus } = await stubServices();
            const model = await mountScreen();

            await model.goToParentScreen();
            expect(bus["App.Router.GoToRoute"]).not.toHaveBeenCalled();

            await settle();
            expect(bus["App.Router.GoToRoute"]).toHaveBeenCalledOnce();
        });
    });

    describe("leaving the screen", () => {
        it("lets navigation go without asking when nothing is unsaved, clearing the busy display", async () => {
            const { bus } = await stubServices();
            await mountScreen();

            expect(await leave()).toEqual([true]);

            expect(bus["Dialog.Confirmation"]).not.toHaveBeenCalled();
            expect(bus["BusyDisplay.Clear"]).toHaveBeenCalledOnce();
        });

        it.each([
            ["loading", { dataLoading: true }],
            ["saving", { dataModified: true, dataSaving: true }]
        ])("holds navigation while %s, without asking", async (_name, state) => {
            const { bus } = await stubServices({ leave: true });
            const model = await mountScreen();
            model.setScreenState(state);

            expect(await leave()).toEqual([false]);

            expect(bus["Dialog.Confirmation"]).not.toHaveBeenCalled();
            expect(bus["BusyDisplay.Clear"]).not.toHaveBeenCalled();
        });

        it("asks before discarding unsaved changes and stays when the user declines", async () => {
            const { bus } = await stubServices({ leave: false });
            const onCancel = vi.fn(async () => { });
            const model = await mountScreen({ onCancel });
            model.setScreenState({ dataModified: true });

            expect(await leave()).toEqual([false]);

            expect(bus["Dialog.Confirmation"]).toHaveBeenCalledExactlyOnceWith({
                title: "Unsaved",
                message: "All unsaved changes will be lost! Would you like to leave current screen?"
            });
            expect(onCancel).not.toHaveBeenCalled();
            expect(model.getScreenState().dataModified).toBe(true);
            expect(bus["BusyDisplay.Clear"]).not.toHaveBeenCalled();
        });

        it("discards the changes and lets navigation go when the user agrees", async () => {
            const { bus } = await stubServices({ leave: true });
            const onCancel = vi.fn(async () => { });
            const model = await mountScreen({ onCancel });
            model.setScreenState({ dataModified: true });

            expect(await leave()).toEqual([true]);

            expect(onCancel).toHaveBeenCalledOnce();
            expect(model.getScreenState()).toEqual(CLEAN_STATE);
            expect(bus["BusyDisplay.Clear"]).toHaveBeenCalledOnce();
        });

        // Leaving loses a brand-new record just as surely as it loses edits.
        it("treats a new record that nothing has modified as unsaved", async () => {
            const { bus } = await stubServices({ leave: false });
            const model = await mountScreen();
            model.setScreenState({ dataNew: true });

            expect(await leave()).toEqual([false]);

            expect(bus["Dialog.Confirmation"]).toHaveBeenCalledOnce();
        });

        it("stays when nobody answers the confirmation", async () => {
            await stubMessages({ "BusyDisplay.Set": vi.fn(async () => { }) });
            const model = await mountScreen();
            model.setScreenState({ dataModified: true });

            expect(await leave()).toEqual([false]);
        });

        // runWithErrorDisplay resolves instead of rethrowing, so the guard still answers.
        it("shows a failure to discard the changes and still lets navigation go", async () => {
            const { bus } = await stubServices({ leave: true });
            const failure = new Error("could not roll back");
            const model = await mountScreen({ onCancel: async () => { throw failure; } });
            model.setScreenState({ dataModified: true });

            expect(await leave()).toEqual([true]);

            expect(bus["Dialog.Exception"]).toHaveBeenCalledExactlyOnceWith({ title: "Error", error: failure });
        });
    });

    describe("layout", () => {
        it("hands its trail, content and paddings to the screen layout", async () => {
            const bus = await stubMessages({ "App.BrowsingHistory.SetPageTitle": vi.fn(async () => { }) });
            const model = await mountScreen({ contentView: <p>First body</p>, contentPaddings: "none" });

            expect(screen.getByRole("navigation", { name: "breadcrumb" })).toHaveTextContent("HomeDataLists");
            expect(bus["App.BrowsingHistory.SetPageTitle"]).toHaveBeenLastCalledWith("Lists");
            const content = document.querySelector(".app-content");
            expect(content).toHaveTextContent("First body");
            expect(content.getAttribute("style")).not.toMatch(/padding/);

            model.contentView = <p>Second body</p>;
            model.contentPaddings = "default";
            await settle();

            expect(content).toHaveTextContent("Second body");
            expect(content).toHaveStyle({ paddingTop: "24px" });
        });
    });
});
