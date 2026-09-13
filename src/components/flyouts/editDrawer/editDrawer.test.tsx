import { describe, expect, it, vi } from "vitest";
import { within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as UECA from "ueca-react";
import { EditBaseModel, EditBaseParams, EditBaseStruct, EditDrawer, EditDrawerModel, useEditBase } from "@components";
import { mount, settle, stubMessages } from "@test";

function drawerPanel(): HTMLElement {
    return document.getElementById("ed.drawer");
}

function footerButtons(): string[] {
    const actions = drawerPanel().querySelector(".drawer-actions") as HTMLElement;
    return within(actions).queryAllByRole("button").map((button) => button.textContent);
}

async function clickInDrawer(name: string) {
    await userEvent.click(within(drawerPanel()).getByRole("button", { name }));
    await settle();
}

// Tracks whether a showModal() promise has settled, and with what.
function track(promise: Promise<boolean>) {
    const state: { settled: boolean; result?: boolean } = { settled: false };
    promise.then((result) => {
        state.settled = true;
        state.result = result;
    });
    return state;
}

async function openModal(model: EditDrawerModel) {
    const outcome = track(model.showModal());
    await settle();
    return outcome;
}

describe("EditDrawer", () => {
    it("renders nothing until shown", async () => {
        const { container } = await mount(EditDrawer, { id: "ed", mode: "edit", titleView: "Edit" });

        expect(container).toBeEmptyDOMElement();
    });

    it("show() opens a right-anchored drawer with its title and content, and hide() closes it", async () => {
        const onOpen = vi.fn();
        const onClose = vi.fn();
        const { model } = await mount(EditDrawer, {
            id: "ed", mode: "edit", titleView: "Edit specimen", contentView: <span>form</span>, width: 480, onOpen, onClose
        });

        model.show();
        await settle();

        expect(model.open).toBe(true);
        expect(drawerPanel()).toHaveClass("ueca-drawer", "drawer-anchor-right", "drawer-open");
        expect(drawerPanel().style.width).toBe("480px");
        expect(drawerPanel().querySelector(".drawer-title")).toHaveTextContent("Edit specimen");
        expect(within(drawerPanel()).getByText("form")).toBeInTheDocument();
        expect(document.querySelector(".ueca-drawer-backdrop")).toBeInTheDocument();
        expect(onOpen).toHaveBeenCalledOnce();

        model.hide();
        await settle();

        expect(drawerPanel()).toBeNull();
        expect(onClose).toHaveBeenCalledOnce();
    });

    it("opens and closes through its open prop, which follows the drawer's own ×", async () => {
        const { model } = await mount(EditDrawer, { id: "ed", mode: "view" });

        model.open = true;
        await settle();
        expect(drawerPanel()).toBeInTheDocument();

        await clickInDrawer("Close");

        expect(model.open).toBe(false);
    });

    describe("footer", () => {
        it.each([
            ["edit", false, ["Cancel", "Save"]],
            ["edit", true, ["Delete", "Cancel", "Save"]],
            ["view", false, ["OK"]],
            // The Delete button belongs to the edit footer only.
            ["view", true, ["OK"]]
        ] as const)("in %s mode (showDeleteButton=%s) offers %o", async (mode, showDeleteButton, expected) => {
            await mount(EditDrawer, { id: "ed", open: true, mode, showDeleteButton });

            expect(footerButtons()).toEqual(expected);
        });

        it("draws footerView when there is no mode", async () => {
            await mount(EditDrawer, {
                id: "ed",
                open: true,
                footerView: <><button type="button">Cancel</button><button type="button">Apply</button></>
            });

            expect(footerButtons()).toEqual(["Cancel", "Apply"]);
        });

        it("redraws the footer when the mode changes", async () => {
            const { model } = await mount(EditDrawer, { id: "ed", open: true, mode: "view" });

            model.mode = "edit";
            await settle();

            expect(footerButtons()).toEqual(["Cancel", "Save"]);
        });
    });

    describe("showModal", () => {
        it("resolves true after onSave when Save succeeds, and closes", async () => {
            const onSave = vi.fn(async () => { });
            const { model } = await mount(EditDrawer, { id: "ed", mode: "edit", onSave });
            const outcome = await openModal(model);

            await clickInDrawer("Save");

            expect(onSave).toHaveBeenCalledOnce();
            expect(outcome).toEqual({ settled: true, result: true });
            expect(model.open).toBe(false);
            expect(drawerPanel()).toBeNull();
        });

        // The owner's own cancel path asks if it needs to — a second prompt here would double up.
        it("resolves false when Cancel is clicked, raising onCancel without asking for confirmation", async () => {
            const bus = await stubMessages({ "Dialog.Confirmation": vi.fn(async () => true) });
            const onCancel = vi.fn();
            const { model } = await mount(EditDrawer, { id: "ed", mode: "edit", onCancel });
            const outcome = await openModal(model);

            await clickInDrawer("Cancel");

            expect(bus["Dialog.Confirmation"]).not.toHaveBeenCalled();
            expect(onCancel).toHaveBeenCalled();
            expect(outcome).toEqual({ settled: true, result: false });
            expect(model.open).toBe(false);
        });

        // "The close X and the backdrop both land here. An edit drawer treats that as a cancel."
        it.each([
            ["the ×", async () => { await clickInDrawer("Close"); }],
            ["the backdrop", async () => {
                await userEvent.click(document.querySelector(".ueca-drawer-backdrop"));
                await settle();
            }]
        ])("treats closing an edit drawer from %s as a cancel", async (_, close) => {
            const onCancel = vi.fn();
            const onClose = vi.fn();
            const { model } = await mount(EditDrawer, { id: "ed", mode: "edit", onCancel, onClose });
            const outcome = await openModal(model);

            await close();

            expect(onCancel).toHaveBeenCalledOnce();
            expect(onClose).toHaveBeenCalledOnce();
            expect(outcome).toEqual({ settled: true, result: false });
        });

        it("resolves false when the owner hides it", async () => {
            const { model } = await mount(EditDrawer, { id: "ed", mode: "edit" });
            const outcome = await openModal(model);

            model.hide();
            await settle();

            expect(outcome).toEqual({ settled: true, result: false });
        });

        it("closes a view drawer from OK without raising onSave or onCancel", async () => {
            const onSave = vi.fn();
            const onCancel = vi.fn();
            const onClose = vi.fn();
            const { model } = await mount(EditDrawer, { id: "ed", mode: "view", onSave, onCancel, onClose });
            const outcome = await openModal(model);

            await clickInDrawer("OK");

            expect(outcome.settled).toBe(true);
            expect(model.open).toBe(false);
            expect(onClose).toHaveBeenCalledOnce();
            expect(onSave).not.toHaveBeenCalled();
            expect(onCancel).not.toHaveBeenCalled();
        });

        // BUG: "showModal() resolves true when the user saved (or acknowledged a view drawer)" —
        // but OK's hide() synchronously runs the drawer's close handler, which settles the promise
        // with false before OK can settle it with true. (Save escapes this only because, in edit
        // mode, that handler awaits onCancel first.)
        it.fails("resolves true when a view drawer is acknowledged with OK", async () => {
            const { model } = await mount(EditDrawer, { id: "ed", mode: "view" });
            const outcome = await openModal(model);

            await clickInDrawer("OK");

            expect(outcome).toEqual({ settled: true, result: true });
        });

        it("resolves false, without a cancel, when a view drawer is closed from its ×", async () => {
            const onCancel = vi.fn();
            const { model } = await mount(EditDrawer, { id: "ed", mode: "view", onCancel });
            const outcome = await openModal(model);

            await clickInDrawer("Close");

            expect(outcome).toEqual({ settled: true, result: false });
            expect(onCancel).not.toHaveBeenCalled();
        });
    });

    describe("validation", () => {
        it("refuses to save or close while a field in modelsToValidate is invalid", async () => {
            const { model: field } = await mount(ProbeField, { id: "name" });
            const onSave = vi.fn();
            const { model } = await mount(EditDrawer, { id: "ed", mode: "edit", modelsToValidate: () => [field], onSave });
            const outcome = await openModal(model);

            await clickInDrawer("Save");

            expect(model.getValidationError()).toBe("Name is required");
            expect(onSave).not.toHaveBeenCalled();
            expect(model.open).toBe(true);
            expect(drawerPanel()).toBeInTheDocument();
            expect(outcome.settled).toBe(false);

            field.value = "Cedar";
            await clickInDrawer("Save");

            expect(onSave).toHaveBeenCalledOnce();
            expect(outcome).toEqual({ settled: true, result: true });
        });

        it("refuses to save while its own onValidate reports an error", async () => {
            const onSave = vi.fn();
            const { model } = await mount(EditDrawer, {
                id: "ed", mode: "edit", onSave, onValidate: async () => "Pick a site first"
            });
            const outcome = await openModal(model);

            await clickInDrawer("Save");

            expect(model.getValidationError()).toBe("Pick a site first");
            expect(onSave).not.toHaveBeenCalled();
            expect(outcome.settled).toBe(false);
        });
    });

    describe("delete", () => {
        it("asks for confirmation, then deletes, closes and resolves false", async () => {
            const bus = await stubMessages({ "Dialog.ActionConfirmation": vi.fn(async () => true) });
            const onDelete = vi.fn(async () => true);
            const { model } = await mount(EditDrawer, { id: "ed", mode: "edit", showDeleteButton: true, onDelete });
            const outcome = await openModal(model);

            await clickInDrawer("Delete");

            expect(bus["Dialog.ActionConfirmation"]).toHaveBeenCalledExactlyOnceWith({
                title: "Warning",
                message: "Are you sure want to delete this item?",
                action: "Delete"
            });
            expect(onDelete).toHaveBeenCalledOnce();
            expect(model.open).toBe(false);
            expect(outcome).toEqual({ settled: true, result: false });
        });

        it("does nothing when the confirmation is declined", async () => {
            await stubMessages({ "Dialog.ActionConfirmation": vi.fn(async () => false) });
            const onDelete = vi.fn(async () => true);
            const { model } = await mount(EditDrawer, { id: "ed", mode: "edit", showDeleteButton: true, onDelete });
            const outcome = await openModal(model);

            await clickInDrawer("Delete");

            expect(onDelete).not.toHaveBeenCalled();
            expect(model.open).toBe(true);
            expect(outcome.settled).toBe(false);
        });

        // "Returning false leaves the drawer open — the delete was refused or failed."
        it("stays open when onDelete reports the delete did not happen", async () => {
            await stubMessages({ "Dialog.ActionConfirmation": vi.fn(async () => true) });
            const { model } = await mount(EditDrawer, {
                id: "ed", mode: "edit", showDeleteButton: true, onDelete: vi.fn(async () => false)
            });
            const outcome = await openModal(model);

            await clickInDrawer("Delete");

            expect(model.open).toBe(true);
            expect(outcome.settled).toBe(false);
        });

        // Asked by the drawer rather than the button: useDeleteButton captures `showDialog` once at
        // creation, while deleteConfirmation is a prop the owner may change later.
        it("follows deleteConfirmation when it changes after creation", async () => {
            const bus = await stubMessages({ "Dialog.ActionConfirmation": vi.fn(async () => false) });
            const onDelete = vi.fn(async () => false);
            const { model } = await mount(EditDrawer, {
                id: "ed", open: true, mode: "edit", showDeleteButton: true, deleteConfirmation: false, onDelete
            });

            await clickInDrawer("Delete");
            expect(bus["Dialog.ActionConfirmation"]).not.toHaveBeenCalled();
            expect(onDelete).toHaveBeenCalledOnce();

            model.deleteConfirmation = true;
            await clickInDrawer("Delete");
            expect(bus["Dialog.ActionConfirmation"]).toHaveBeenCalledOnce();
            // Declined, so the owner was not asked again.
            expect(onDelete).toHaveBeenCalledOnce();
        });
    });

    // BUG: every close of the underlying drawer runs its "× / backdrop is a cancel" handler, and
    // Save, Cancel and a successful Delete all close it through hide() — so the owner's onCancel
    // also fires after a save, twice for one Cancel, and after a delete. showModal() still
    // resolves correctly only because the button settles it first.
    describe("onCancel is raised only when the user cancels", () => {
        it.fails("is not raised by a successful Save", async () => {
            const onCancel = vi.fn();
            const { model } = await mount(EditDrawer, { id: "ed", mode: "edit", onCancel });
            await openModal(model);

            await clickInDrawer("Save");

            expect(onCancel).not.toHaveBeenCalled();
        });

        it.fails("is raised once by Cancel", async () => {
            const onCancel = vi.fn();
            const { model } = await mount(EditDrawer, { id: "ed", mode: "edit", onCancel });
            await openModal(model);

            await clickInDrawer("Cancel");

            expect(onCancel).toHaveBeenCalledOnce();
        });

        it.fails("is not raised by a confirmed Delete", async () => {
            await stubMessages({ "Dialog.ActionConfirmation": vi.fn(async () => true) });
            const onCancel = vi.fn();
            const { model } = await mount(EditDrawer, {
                id: "ed", mode: "edit", showDeleteButton: true, onCancel, onDelete: vi.fn(async () => true)
            });
            await openModal(model);

            await clickInDrawer("Delete");

            expect(onCancel).not.toHaveBeenCalled();
        });
    });
});

// A minimal field for modelsToValidate: invalid while empty.
type ProbeFieldStruct = EditBaseStruct<{ props: { value: string } }>;

function useProbeField(params?: EditBaseParams<ProbeFieldStruct>): EditBaseModel<ProbeFieldStruct> {
    const struct: ProbeFieldStruct = {
        props: {
            id: useProbeField.name,
            value: ""
        },

        events: {
            onInternalValidate: async () => model.value ? undefined : "Name is required"
        },

        View: () => <input id={model.htmlId()} aria-label="Name" value={model.value} readOnly />
    };

    const model = useEditBase(struct, params);
    return model;
}

const ProbeField = UECA.getFC(useProbeField);
