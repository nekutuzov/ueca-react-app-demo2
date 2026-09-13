import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent } from "@testing-library/react";
import * as UECA from "ueca-react";
import { BaseModel, BaseParams, BaseStruct, FileSelector, FileSelectorModel, useBase, useFileSelector } from "@components";
import { mount, settle } from "@test";

function fileInput(): HTMLInputElement {
    return document.getElementById("selector") as HTMLInputElement;
}

function file(name: string): File {
    return new File(["content"], name, { type: "text/plain" });
}

// What the browser does when the user confirms the dialog: the input holds the files, then change.
function pickFiles(input: HTMLInputElement, files: File[]) {
    Object.defineProperty(input, "files", { configurable: true, value: files });
    fireEvent.change(input);
}

// The dialog closing hands focus back to the window — the only signal a cancel gives.
// (document.body.onfocus is a window-reflecting handler, so this is what fires it.)
function returnFocusToWindow() {
    window.dispatchEvent(new FocusEvent("focus"));
}

async function advance(ms: number) {
    await act(async () => { await vi.advanceTimersByTimeAsync(ms); });
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

describe("FileSelector", () => {
    afterEach(() => {
        // select() installs a focus handler that lives until the window regains focus.
        document.body.onfocus = null;
    });

    it("renders a hidden file input", async () => {
        await mount(FileSelector, { id: "selector" });

        expect(fileInput()).toHaveAttribute("type", "file");
        expect(fileInput()).toHaveAttribute("hidden");
    });

    it("configures the input from the mask and multiselect, then opens the dialog", async () => {
        const { model } = await mount(FileSelector, { id: "selector" });
        const input = fileInput();
        const click = vi.fn();
        input.addEventListener("click", click);

        void model.select(".png,.jpg", true);
        await settle();

        expect(input.accept).toBe(".png,.jpg");
        expect(input.multiple).toBe(true);
        expect(click).toHaveBeenCalledOnce();
    });

    it("selects a single file unless multiselect is asked for", async () => {
        const { model } = await mount(FileSelector, { id: "selector" });
        fileInput().multiple = true;

        void model.select("*");
        await settle();

        expect(fileInput().multiple).toBe(false);
    });

    // A native file input only fires change when the selection differs from last time.
    it("clears the previous selection before opening, so picking the same file again still counts", async () => {
        const { model } = await mount(FileSelector, { id: "selector" });
        const input = fileInput();
        const steps: string[] = [];
        vi.spyOn(input, "value", "set").mockImplementation((value) => { steps.push(`value=${JSON.stringify(value)}`); });
        vi.spyOn(input, "focus").mockImplementation(() => { steps.push("focus"); });
        input.addEventListener("click", () => steps.push("click"));

        void model.select("*");
        await settle();

        expect(steps).toEqual(['value=""', "focus", "click"]);
    });

    it("resolves with the picked files as an array", async () => {
        const { model } = await mount(FileSelector, { id: "selector" });
        const files = [file("a.txt"), file("b.txt")];

        const selection = model.select("*", true);
        await settle();
        pickFiles(fileInput(), files);

        const selected = await selection;
        expect(Array.isArray(selected)).toBe(true);
        expect(selected).toEqual(files);
    });

    it("resolves undefined when the change carries no files", async () => {
        const { model } = await mount(FileSelector, { id: "selector" });

        const selection = model.select("*");
        await settle();
        pickFiles(fileInput(), []);

        expect(await selection).toBeUndefined();
    });

    describe("cancel", () => {
        it("resolves undefined shortly after the window regains focus with nothing picked", async () => {
            const { model } = await mount(FileSelector, { id: "selector" });
            vi.useFakeTimers({ shouldAdvanceTime: true });
            const selection = track(model.select("*"));
            await advance(0);

            returnFocusToWindow();
            await advance(100);

            expect(selection).toEqual({ settled: true, value: undefined });
        });

        // Focus can come back before change is delivered; the short wait lets the pick win.
        it("still delivers a pick that arrives just after focus returns", async () => {
            const { model } = await mount(FileSelector, { id: "selector" });
            vi.useFakeTimers({ shouldAdvanceTime: true });
            const files = [file("late.txt")];
            const selection = track(model.select("*"));
            await advance(0);

            returnFocusToWindow();
            pickFiles(fileInput(), files);
            await advance(200);

            expect(selection).toEqual({ settled: true, value: files });
        });

        it("hands the focus handler back to whoever had it", async () => {
            const { model } = await mount(FileSelector, { id: "selector" });
            const previous = vi.fn();
            document.body.onfocus = previous;

            void model.select("*");
            await settle();
            expect(document.body.onfocus).not.toBe(previous);

            returnFocusToWindow();

            expect(document.body.onfocus).toBe(previous);
        });
    });

    it("rejects when its input is not in the document", async () => {
        const { model } = await mount(SelectorHost, { id: "host" });

        await expect(model.fileSelector.select("*")).rejects.toThrow('DOM element id="host.fileSelector" not found');
    });
});

// Owns a FileSelector but never renders its View, so the selector has no input to open.
type SelectorHostStruct = BaseStruct<{
    children: { fileSelector: FileSelectorModel };
}>;

function useSelectorHost(params?: BaseParams<SelectorHostStruct>): BaseModel<SelectorHostStruct> {
    const struct: SelectorHostStruct = {
        props: {
            id: useSelectorHost.name
        },

        children: {
            fileSelector: useFileSelector()
        },

        View: () => <div id={model.htmlId()} />
    };

    const model = useBase(struct, params);
    return model;
}

const SelectorHost = UECA.getFC(useSelectorHost);
