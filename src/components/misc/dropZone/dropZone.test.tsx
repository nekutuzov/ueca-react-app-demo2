import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { DropZone } from "@components";
import { mount, settle, stubMessages } from "@test";

function zone(): HTMLElement {
    return document.getElementById("drop");
}

function file(name: string, type = "text/plain"): File {
    return new File(["content"], name, { type });
}

// jsdom has no DragEvent, so fireEvent.dragLeave cannot carry a relatedTarget; a MouseEvent can,
// and React reads relatedTarget off it the same way.
function dragLeave(target: Element, relatedTarget: Element | null) {
    return fireEvent(target, new MouseEvent("dragleave", { bubbles: true, cancelable: true, relatedTarget }));
}

describe("DropZone", () => {
    it("renders its content inside the drop target", async () => {
        await mount(DropZone, { id: "drop", contentView: <p>Drop a file here</p> });

        expect(zone()).toHaveClass("ueca-dropzone");
        expect(zone()).not.toHaveClass("hidden", "over");
        expect(zone()).toContainElement(screen.getByText("Drop a file here"));
    });

    it("marks itself hidden, and shows again, as hidden changes", async () => {
        const { model } = await mount(DropZone, { id: "drop", hidden: true });
        expect(zone()).toHaveClass("hidden");

        model.hidden = false;
        await settle();

        expect(zone()).not.toHaveClass("hidden");
    });

    describe("dragging", () => {
        // A drop target has to cancel dragenter/dragover, or the browser refuses the drop.
        it.each([
            ["dragenter", fireEvent.dragEnter],
            ["dragover", fireEvent.dragOver]
        ])("%s shows the drag-over state and accepts the drag", async (_, fire) => {
            await mount(DropZone, { id: "drop" });

            const notCancelled = fire(zone());
            await settle();

            expect(notCancelled).toBe(false);
            expect(zone()).toHaveClass("over");
        });

        it("clears the drag-over state when the drag leaves the zone", async () => {
            await mount(DropZone, { id: "drop" });
            fireEvent.dragEnter(zone());
            await settle();

            dragLeave(zone(), null);
            await settle();

            expect(zone()).not.toHaveClass("over");
        });

        // dragleave also fires when the pointer moves onto the zone's own content, which must not
        // make the highlight flicker off.
        it("keeps the drag-over state when the drag only moves onto its content", async () => {
            await mount(DropZone, { id: "drop", contentView: <p>Drop a file here</p> });
            fireEvent.dragEnter(zone());
            await settle();

            dragLeave(zone(), screen.getByText("Drop a file here"));
            await settle();

            expect(zone()).toHaveClass("over");
        });
    });

    describe("dropping", () => {
        it("hands the dropped files to onDrop as an array, with its own model", async () => {
            const onDrop = vi.fn();
            const { model } = await mount(DropZone, { id: "drop", onDrop });
            const files = [file("a.txt"), file("b.png", "image/png")];
            fireEvent.dragOver(zone());
            await settle();

            const notCancelled = fireEvent.drop(zone(), { dataTransfer: { files } });
            await settle();

            expect(notCancelled).toBe(false);
            expect(zone()).not.toHaveClass("over");
            expect(onDrop).toHaveBeenCalledOnce();
            const [dropped, source] = onDrop.mock.calls[0];
            expect(Array.isArray(dropped)).toBe(true);
            expect(dropped).toEqual(files);
            expect(source).toBe(model);
        });

        // fileMask is the click-to-pick dialog's accept filter; a drop is taken as given.
        it("does not filter dropped files by fileMask", async () => {
            const onDrop = vi.fn();
            await mount(DropZone, { id: "drop", fileMask: ".png", onDrop });
            const files = [file("notes.txt")];

            fireEvent.drop(zone(), { dataTransfer: { files } });
            await settle();

            expect(onDrop).toHaveBeenCalledWith(files, expect.anything());
        });

        it.each([
            ["an empty file list", { dataTransfer: { files: [] as File[] } }],
            ["no dataTransfer", {}]
        ])("ignores a drop with %s but still clears the drag-over state", async (_, init) => {
            const onDrop = vi.fn();
            await mount(DropZone, { id: "drop", onDrop });
            fireEvent.dragEnter(zone());
            await settle();

            fireEvent.drop(zone(), init);
            await settle();

            expect(onDrop).not.toHaveBeenCalled();
            expect(zone()).not.toHaveClass("over");
        });

        it("accepts a drop without an onDrop handler", async () => {
            await mount(DropZone, { id: "drop" });

            fireEvent.drop(zone(), { dataTransfer: { files: [file("a.txt")] } });
            await settle();

            expect(zone()).not.toHaveClass("over");
        });
    });

    describe("openPicker", () => {
        it("asks for any single file by default and emits the pick through onDrop", async () => {
            const picked = [file("report.pdf", "application/pdf")];
            const bus = await stubMessages({ "App.SelectFiles": vi.fn(async () => picked) });
            const onDrop = vi.fn();
            const { model } = await mount(DropZone, { id: "drop", onDrop });

            await model.openPicker();

            expect(bus["App.SelectFiles"]).toHaveBeenCalledWith({ fileMask: "*", multiselect: false });
            expect(onDrop).toHaveBeenCalledWith(picked, model);
        });

        it("passes its fileMask and multiple settings to the picker", async () => {
            const bus = await stubMessages({ "App.SelectFiles": vi.fn(async () => [file("a.png", "image/png")]) });
            const { model } = await mount(DropZone, { id: "drop", fileMask: ".png,.jpg", multiple: true });

            await model.openPicker();

            expect(bus["App.SelectFiles"]).toHaveBeenCalledWith({ fileMask: ".png,.jpg", multiselect: true });
        });

        it("waits for an async onDrop to finish", async () => {
            const steps: string[] = [];
            await stubMessages({ "App.SelectFiles": vi.fn(async () => [file("a.txt")]) });
            const { model } = await mount(DropZone, {
                id: "drop",
                onDrop: async () => {
                    await settle(5);
                    steps.push("onDrop finished");
                }
            });

            await model.openPicker();
            steps.push("openPicker resolved");

            expect(steps).toEqual(["onDrop finished", "openPicker resolved"]);
        });

        it.each([
            ["cancelled", undefined],
            ["returned no files", [] as File[]]
        ])("emits nothing when the picker is %s", async (_, reply) => {
            await stubMessages({ "App.SelectFiles": vi.fn(async () => reply) });
            const onDrop = vi.fn();
            const { model } = await mount(DropZone, { id: "drop", onDrop });

            await model.openPicker();

            expect(onDrop).not.toHaveBeenCalled();
        });
    });
});
