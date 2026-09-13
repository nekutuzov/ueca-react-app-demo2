import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import * as UECA from "ueca-react";
import { BaseModel, BaseParams, BaseStruct, useBase } from "@components";
import { AnchorRect, AppRoute, Placement } from "@core";
import { mount, settle, stubMessages } from "@test";

const route = { path: "/home" } as AppRoute;
const failure = new Error("save failed");
const pickedFiles = [new File(["x"], "notes.txt")];

async function mountTrigger(params?: TriggerProbeParams): Promise<TriggerProbeModel> {
    const { model } = await mount(TriggerProbe, { id: "trigger", ...params });
    return model;
}

async function stubTooltip() {
    return await stubMessages({
        "App.Tooltip.Show": vi.fn(async () => { }),
        "App.Tooltip.Hide": vi.fn(async () => { })
    });
}

function rect(top: number, left: number, width: number, height: number): DOMRect {
    return { top, left, width, height, x: left, y: top, right: left + width, bottom: top + height, toJSON: () => ({}) } as DOMRect;
}

// Tracks a promise's outcome without awaiting it.
function track<T>(promise: Promise<T>) {
    const state = { settled: false, value: undefined as T };
    promise.then((value) => {
        state.settled = true;
        state.value = value;
    });
    return state;
}

type ShorthandCase = {
    name: string;
    call: (model: TriggerProbeModel) => Promise<unknown>;
    message: string;
    payload?: unknown;
    reply?: unknown;
};

const shorthands: ShorthandCase[] = [
    { name: "getRoute", call: (m) => m.getRoute(), message: "App.Router.GetRoute", reply: route },
    { name: "goToRoute", call: (m) => m.goToRoute(route), message: "App.Router.GoToRoute", payload: route, reply: true },
    { name: "setRoute", call: (m) => m.setRoute(route), message: "App.Router.SetRoute", payload: route, reply: false },
    {
        name: "setRouteParams",
        call: (m) => m.setRouteParams({ tab: "api" }, true),
        message: "App.Router.SetRouteParams",
        payload: { params: { tab: "api" }, patch: true }
    },
    { name: "openNewTab", call: (m) => m.openNewTab(route), message: "App.Router.OpenNewTab", payload: route },
    {
        name: "resolveRoute",
        call: (m) => m.resolveRoute(route),
        message: "App.Router.ResolveRoute",
        payload: route,
        reply: "/ueca-react-app-demo2/home"
    },
    {
        name: "dialogInfo",
        call: (m) => m.dialogInfo("Saved", "All changes are stored."),
        message: "Dialog.Information",
        payload: { title: "Saved", message: "All changes are stored." }
    },
    {
        name: "dialogWarning",
        call: (m) => m.dialogWarning("Careful", "Unsaved changes", "3 fields"),
        message: "Dialog.Warning",
        payload: { title: "Careful", message: "Unsaved changes", details: "3 fields" }
    },
    {
        name: "dialogError",
        call: (m) => m.dialogError("Failed", "Could not save", "HTTP 500"),
        message: "Dialog.Error",
        payload: { title: "Failed", message: "Could not save", details: "HTTP 500" }
    },
    {
        name: "dialogException",
        call: (m) => m.dialogException("Unexpected", failure),
        message: "Dialog.Exception",
        payload: { title: "Unexpected", error: failure }
    },
    {
        name: "dialogYesNo",
        call: (m) => m.dialogYesNo("Continue?", "The import takes a while."),
        message: "Dialog.Confirmation",
        payload: { title: "Continue?", message: "The import takes a while." },
        reply: true
    },
    {
        name: "dialogConfirmAction",
        call: (m) => m.dialogConfirmAction("Archive", "Archive this project?", "Archive"),
        message: "Dialog.ActionConfirmation",
        payload: { title: "Archive", message: "Archive this project?", action: "Archive" },
        reply: false
    },
    {
        name: "dialogCustom",
        call: (m) => m.dialogCustom("Pick a colour", "palette", "Choose"),
        message: "Dialog.Custom",
        payload: { title: "Pick a colour", content: "palette", okText: "Choose" },
        reply: true
    },
    { name: "alertInformation", call: (m) => m.alertInformation("Sync started"), message: "Alert.Information", payload: { message: "Sync started" } },
    { name: "alertSuccess", call: (m) => m.alertSuccess("Saved"), message: "Alert.Success", payload: { message: "Saved" } },
    { name: "alertWarning", call: (m) => m.alertWarning("Quota at 90%"), message: "Alert.Warning", payload: { message: "Quota at 90%" } },
    { name: "alertError", call: (m) => m.alertError("Upload failed"), message: "Alert.Error", payload: { message: "Upload failed" } },
    { name: "setAppBusy", call: (m) => m.setAppBusy(true), message: "BusyDisplay.Set", payload: true },
    { name: "clearAppBusy", call: (m) => m.clearAppBusy(), message: "BusyDisplay.Clear" },
    {
        name: "selectFiles",
        call: (m) => m.selectFiles(".txt,.md", true),
        message: "App.SelectFiles",
        payload: { fileMask: ".txt,.md", multiselect: true },
        reply: pickedFiles
    }
];

describe("useBase", () => {
    describe("shorthand methods", () => {
        it.each(shorthands)("$name sends $message with its payload and resolves the reply", async ({ call, message, payload, reply }) => {
            const handler = vi.fn(async (_payload?: unknown) => reply);
            await stubMessages({ [message]: handler } as Parameters<typeof stubMessages>[0]);
            const model = await mountTrigger();

            const result = await call(model);

            expect(handler).toHaveBeenCalledOnce();
            expect(handler.mock.calls[0][0]).toEqual(payload);
            expect(result).toBe(reply);
        });

        // Only the anchor of the current address changes, so the screen on show stays mounted.
        it("setRouteSection sends the section alone, without params or patch", async () => {
            const bus = await stubMessages({ "App.Router.SetRouteParams": vi.fn(async (_payload: unknown) => { }) });
            const model = await mountTrigger();

            await model.setRouteSection("install");

            expect(bus["App.Router.SetRouteParams"].mock.calls[0][0]).toStrictEqual({ section: "install" });
        });

        it("dialogConfirmAction asks to confirm a delete when called without arguments", async () => {
            const bus = await stubMessages({ "Dialog.ActionConfirmation": vi.fn(async () => true) });
            const model = await mountTrigger();

            await expect(model.dialogConfirmAction()).resolves.toBe(true);

            expect(bus["Dialog.ActionConfirmation"]).toHaveBeenCalledWith({
                title: "Warning",
                message: "Are you sure want to delete this item?",
                action: "Delete"
            });
        });

        it("dialogConfirmAction keeps the default for each argument left out", async () => {
            const bus = await stubMessages({ "Dialog.ActionConfirmation": vi.fn(async () => false) });
            const model = await mountTrigger();

            await model.dialogConfirmAction("Remove user", undefined, "Remove");

            expect(bus["Dialog.ActionConfirmation"]).toHaveBeenCalledWith({
                title: "Remove user",
                message: "Are you sure want to delete this item?",
                action: "Remove"
            });
        });
    });

    describe("runWithErrorDisplay", () => {
        it("passes params to the action and resolves its result without showing anything", async () => {
            const bus = await stubMessages({ "Dialog.Exception": vi.fn(async () => { }) });
            const model = await mountTrigger();
            const action = vi.fn(async (params?: { id: number }) => `record ${params.id}`);

            await expect(model.runWithErrorDisplay(action, { id: 7 })).resolves.toBe("record 7");

            expect(action).toHaveBeenCalledWith({ id: 7 });
            expect(bus["Dialog.Exception"]).not.toHaveBeenCalled();
        });

        // It resolves rather than rethrowing, so a caller that has to finish — a navigation guard
        // returning a boolean — still does.
        it("shows a failure in an exception dialog titled Error and resolves undefined", async () => {
            const bus = await stubMessages({ "Dialog.Exception": vi.fn(async () => { }) });
            const model = await mountTrigger();

            await expect(model.runWithErrorDisplay(async () => { throw failure; })).resolves.toBeUndefined();

            expect(bus["Dialog.Exception"]).toHaveBeenCalledWith({ title: "Error", error: failure });
        });

        it("resolves only once the exception dialog has been dismissed", async () => {
            let dismiss: () => void;
            const dismissed = new Promise<void>((resolve) => { dismiss = resolve; });
            await stubMessages({ "Dialog.Exception": vi.fn(() => dismissed) });
            const model = await mountTrigger();

            const outcome = track(model.runWithErrorDisplay(async () => { throw failure; }));
            await settle();
            expect(outcome.settled).toBe(false);

            dismiss();
            await settle();
            expect(outcome).toEqual({ settled: true, value: undefined });
        });
    });

    describe("runWithBusyDisplay", () => {
        async function stubBusy(steps: string[]) {
            await stubMessages({ "BusyDisplay.Set": vi.fn(async (busy: boolean) => { steps.push(`busy=${busy}`); }) });
        }

        it("marks the app busy around the action and resolves its result", async () => {
            const steps: string[] = [];
            await stubBusy(steps);
            const model = await mountTrigger();

            const result = await model.runWithBusyDisplay(async () => {
                steps.push("action");
                return 42;
            });

            expect(result).toBe(42);
            expect(steps).toEqual(["busy=true", "action", "busy=false"]);
        });

        // The busy display counts its Set(true) calls, so a missed Set(false) would never clear.
        it("clears busy even when the action throws, and rethrows the error", async () => {
            const steps: string[] = [];
            await stubBusy(steps);
            const model = await mountTrigger();

            await expect(model.runWithBusyDisplay(async () => {
                steps.push("action");
                throw failure;
            })).rejects.toBe(failure);

            expect(steps).toEqual(["busy=true", "action", "busy=false"]);
        });
    });

    describe("copyToClipboard", () => {
        // It was once declared but never implemented, so every caller awaited undefined.
        it("writes the text to the clipboard and waits for it", async () => {
            let finishWrite: () => void;
            const writeText = vi.spyOn(navigator.clipboard, "writeText").mockImplementation(
                () => new Promise<void>((resolve) => { finishWrite = resolve; })
            );
            const model = await mountTrigger();

            const copied = track(model.copyToClipboard("npm i ueca-react"));
            await settle();

            expect(writeText).toHaveBeenCalledWith("npm i ueca-react");
            expect(copied.settled).toBe(false);
            finishWrite();
            await settle();
            expect(copied.settled).toBe(true);
        });

        it("rejects when the browser refuses the write", async () => {
            vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("Document is not focused"));
            const model = await mountTrigger();

            await expect(model.copyToClipboard("text")).rejects.toThrow("Document is not focused");
        });
    });

    describe("tooltipProps", () => {
        // Read from the event target at hover time, not at render, when it is actually correct.
        it("shows the tooltip on mouse enter, anchored to the trigger's rect at that moment", async () => {
            const bus = await stubTooltip();
            await mountTrigger({ tip: "Refresh the list", placement: "bottom", delay: 300 });
            const trigger = screen.getByRole("button");
            vi.spyOn(trigger, "getBoundingClientRect").mockReturnValue(rect(10, 20, 30, 40));

            fireEvent.mouseEnter(trigger);
            await settle();

            expect(bus["App.Tooltip.Show"]).toHaveBeenCalledOnce();
            expect(bus["App.Tooltip.Show"]).toHaveBeenCalledWith({
                token: "trigger",
                anchor: { top: 10, left: 20, width: 30, height: 40 },
                contentView: "Refresh the list",
                placement: "bottom",
                delay: 300
            });
        });

        it("re-reads the anchor on every hover, though nothing re-rendered in between", async () => {
            const bus = await stubTooltip();
            await mountTrigger();
            const trigger = screen.getByRole("button");
            const boundingRect = vi.spyOn(trigger, "getBoundingClientRect").mockReturnValue(rect(10, 10, 50, 20));
            fireEvent.mouseEnter(trigger);
            fireEvent.mouseLeave(trigger);

            boundingRect.mockReturnValue(rect(300, 120, 50, 20));
            fireEvent.mouseEnter(trigger);
            await settle();

            expect(bus["App.Tooltip.Show"]).toHaveBeenCalledTimes(2);
            expect(bus["App.Tooltip.Show"]).toHaveBeenNthCalledWith(2, expect.objectContaining({
                anchor: { top: 300, left: 120, width: 50, height: 20 }
            }));
        });

        it("hides the tooltip with the component's token on mouse leave", async () => {
            const bus = await stubTooltip();
            await mountTrigger();
            const trigger = screen.getByRole("button");

            fireEvent.mouseEnter(trigger);
            fireEvent.mouseLeave(trigger);
            await settle();

            expect(bus["App.Tooltip.Hide"]).toHaveBeenCalledWith({ token: "trigger" });
        });

        // Keyboard users get the tooltip too...
        it("opens on keyboard focus, which :focus-visible identifies", async () => {
            const bus = await stubTooltip();
            await mountTrigger({ tip: "Keyboard tip" });
            const trigger = screen.getByRole("button");
            const matches = vi.spyOn(trigger, "matches").mockImplementation((selector) => selector === ":focus-visible");

            fireEvent.focus(trigger);
            await settle();

            expect(matches).toHaveBeenCalledWith(":focus-visible");
            expect(bus["App.Tooltip.Show"]).toHaveBeenCalledWith(expect.objectContaining({ token: "trigger", contentView: "Keyboard tip" }));
        });

        // ...but a click focuses as well, and the browser restores that focus when the user comes back
        // to the tab, which used to pop the tooltip with the pointer nowhere near the trigger.
        it("stays closed on pointer or restored focus", async () => {
            const bus = await stubTooltip();
            await mountTrigger();
            const trigger = screen.getByRole("button");
            vi.spyOn(trigger, "matches").mockReturnValue(false);

            fireEvent.focus(trigger);
            await settle();

            expect(bus["App.Tooltip.Show"]).not.toHaveBeenCalled();
        });

        it("hides the tooltip on blur", async () => {
            const bus = await stubTooltip();
            await mountTrigger();
            const trigger = screen.getByRole("button");

            fireEvent.blur(trigger);
            await settle();

            expect(bus["App.Tooltip.Hide"]).toHaveBeenCalledWith({ token: "trigger" });
        });
    });

    describe("showTooltip and hideTooltip", () => {
        // The token is what lets the tooltip ignore a late hide from a trigger that is no longer
        // showing; the dotted path keeps same-named triggers under different owners apart.
        it("identify the trigger by its full htmlId", async () => {
            const bus = await stubTooltip();
            const { model: host } = await mount(TriggerHost, { id: "toolbar" });
            const anchor: AnchorRect = { top: 1, left: 2, width: 3, height: 4 };

            await host.trigger.showTooltip(anchor, "Nested tip");
            await host.trigger.hideTooltip();

            expect(bus["App.Tooltip.Show"]).toHaveBeenCalledWith({
                token: "toolbar.trigger",
                anchor,
                contentView: "Nested tip",
                placement: undefined,
                delay: undefined
            });
            expect(bus["App.Tooltip.Hide"]).toHaveBeenCalledWith({ token: "toolbar.trigger" });
        });
    });

    // A trigger removed while its tooltip is up never gets its own mouseleave.
    describe("unmount", () => {
        it("hides the tooltip the component is showing", async () => {
            const bus = await stubTooltip();
            const { unmount } = await mount(TriggerProbe, { id: "trigger" });
            fireEvent.mouseEnter(screen.getByRole("button"));
            await settle();

            unmount();
            await settle();

            expect(bus["App.Tooltip.Hide"]).toHaveBeenCalledOnce();
            expect(bus["App.Tooltip.Hide"]).toHaveBeenCalledWith({ token: "trigger" });
        });

        // The flag is set by showTooltip itself, so a tooltip opened from code is covered as well.
        it("hides a tooltip opened directly with showTooltip", async () => {
            const bus = await stubTooltip();
            const { model, unmount } = await mount(TriggerProbe, { id: "trigger" });
            await model.showTooltip({ top: 0, left: 0, width: 10, height: 10 }, "Revealed");

            unmount();
            await settle();

            expect(bus["App.Tooltip.Hide"]).toHaveBeenCalledWith({ token: "trigger" });
        });

        it("sends no hide when the component never showed a tooltip", async () => {
            const bus = await stubTooltip();
            const { unmount } = await mount(TriggerProbe, { id: "trigger" });

            unmount();
            await settle();

            expect(bus["App.Tooltip.Hide"]).not.toHaveBeenCalled();
        });

        it("sends no second hide once its tooltip was already hidden", async () => {
            const bus = await stubTooltip();
            const { unmount } = await mount(TriggerProbe, { id: "trigger" });
            fireEvent.mouseEnter(screen.getByRole("button"));
            fireEvent.mouseLeave(screen.getByRole("button"));
            await settle();

            unmount();
            await settle();

            expect(bus["App.Tooltip.Hide"]).toHaveBeenCalledOnce();
        });
    });
});

// A button wired with tooltipProps — the way every trigger in the app uses the base.
type TriggerProbeStruct = BaseStruct<{
    props: {
        tip: React.ReactNode;
        placement: Placement;
        delay: number;
    };
}>;

type TriggerProbeParams = BaseParams<TriggerProbeStruct>;
type TriggerProbeModel = BaseModel<TriggerProbeStruct>;

function useTriggerProbe(params?: TriggerProbeParams): TriggerProbeModel {
    const struct: TriggerProbeStruct = {
        props: {
            id: useTriggerProbe.name,
            tip: "Tip",
            placement: undefined,
            delay: undefined
        },

        View: () => (
            <button
                id={model.htmlId()}
                {...model.tooltipProps(model.tip, { placement: model.placement, delay: model.delay })}
            >
                trigger
            </button>
        )
    };

    const model = useBase(struct, params);
    return model;
}

const TriggerProbe = UECA.getFC(useTriggerProbe);

// Owns a trigger as a child, so the trigger's htmlId is a dotted path.
type TriggerHostStruct = BaseStruct<{
    children: { trigger: TriggerProbeModel };
}>;

function useTriggerHost(params?: BaseParams<TriggerHostStruct>): BaseModel<TriggerHostStruct> {
    const struct: TriggerHostStruct = {
        props: {
            id: useTriggerHost.name
        },

        children: {
            trigger: useTriggerProbe()
        },

        View: () => <div id={model.htmlId()}><model.trigger.View /></div>
    };

    const model = useBase(struct, params);
    return model;
}

const TriggerHost = UECA.getFC(useTriggerHost);
