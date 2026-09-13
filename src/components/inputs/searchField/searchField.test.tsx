import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Icon, SearchField } from "@components";
import { mount, ParamsOf, settle } from "@test";

// Mounts on the real clock (mounting under fake timers can hang), then fakes it so the debounce moves
// only when a test says so, to the millisecond. Input goes through fireEvent while the clock is fake:
// user-event (via Testing Library's async wrapper) awaits a timer of its own that would never fire.
async function mountWithClock(params: ParamsOf<typeof SearchField>) {
    const result = await mount(SearchField, params);
    vi.useFakeTimers();
    return result;
}

function elapse(ms: number) {
    act(() => { vi.advanceTimersByTime(ms); });
}

function searchBox(): HTMLInputElement {
    return screen.getByRole("textbox");
}

// One keystroke's worth of change: the whole text after it.
function typeText(text: string) {
    fireEvent.change(searchBox(), { target: { value: text } });
}

function press(key: string) {
    fireEvent.keyDown(searchBox(), { key });
}

function clearButton(): HTMLElement {
    return screen.queryByRole("button", { name: "Clear" });
}

// Records the keydowns that get past the search box to the document — what a host would hear.
function listenOnDocument() {
    const keys: string[] = [];
    const listener = (e: KeyboardEvent) => { keys.push(e.key); };
    document.addEventListener("keydown", listener);
    return { keys, stop: () => document.removeEventListener("keydown", listener) };
}

describe("SearchField", () => {
    describe("rendering", () => {
        it("renders an empty, enabled search box with its glyph and a Search placeholder by default", async () => {
            await mount(SearchField, { id: "search" });

            const root = document.getElementById("search");
            expect(root).toHaveClass("ueca-searchfield");
            expect(root).not.toHaveClass("ueca-searchfield-fullwidth", "ueca-searchfield-disabled");

            const glyph = root.querySelector(".ueca-searchfield-glyph");
            const { container } = render(<Icon name="search" size="sm" className="ueca-searchfield-glyph" />);
            expect(glyph.outerHTML).toBe(container.innerHTML);

            expect(searchBox()).toHaveAttribute("type", "text");
            expect(searchBox()).toHaveAttribute("placeholder", "Search");
            expect(searchBox()).toHaveValue("");
            expect(searchBox()).toBeEnabled();
            expect(searchBox()).not.toHaveFocus();
            expect(clearButton()).toBeNull();
        });

        it("reflects fullWidth, disabled and a custom placeholder", async () => {
            await mount(SearchField, { id: "search", fullWidth: true, disabled: true, placeholder: "Filter users" });

            expect(document.getElementById("search")).toHaveClass("ueca-searchfield-fullwidth", "ueca-searchfield-disabled");
            expect(searchBox()).toBeDisabled();
            expect(searchBox()).toHaveAttribute("placeholder", "Filter users");
        });

        it("takes focus on mount with autoFocus", async () => {
            await mount(SearchField, { id: "search", autoFocus: true });

            expect(searchBox()).toHaveFocus();
        });

        it("shows a clear button, outside the tab order, only while it holds text", async () => {
            const { model } = await mount(SearchField, { id: "search", value: "ada" });

            expect(searchBox()).toHaveValue("ada");
            expect(clearButton()).toHaveAttribute("tabindex", "-1");
            expect(clearButton()).toHaveAttribute("type", "button");

            model.value = "";
            await settle();
            expect(clearButton()).toBeNull();
        });

        // `value ?? ""` keeps the input controlled, so an undefined value empties the box.
        it("shows an empty box when its value becomes undefined", async () => {
            const { model } = await mount(SearchField, { id: "search", value: "ada" });

            model.value = undefined;
            await settle();

            expect(searchBox()).toHaveValue("");
            expect(clearButton()).toBeNull();
        });

        it("takes what the user types on the keyboard", async () => {
            const { model } = await mount(SearchField, { id: "search" });

            await userEvent.type(searchBox(), "ada");

            expect(model.value).toBe("ada");
            expect(clearButton()).not.toBeNull();
        });
    });

    describe("searching", () => {
        it("updates value at once, but fires onSearch once with the settled text 300ms after the last keystroke", async () => {
            const onSearch = vi.fn();
            const { model } = await mountWithClock({ id: "search", onSearch });

            typeText("a");
            typeText("ad");
            typeText("ada");
            expect(model.value).toBe("ada");

            elapse(299);
            expect(onSearch).not.toHaveBeenCalled();

            elapse(1);
            expect(onSearch).toHaveBeenCalledOnce();
            expect(onSearch).toHaveBeenCalledWith("ada", model);
        });

        it("restarts the debounce on every keystroke", async () => {
            const onSearch = vi.fn();
            await mountWithClock({ id: "search", onSearch });

            typeText("a");
            elapse(200);
            typeText("ad");
            elapse(200);
            expect(onSearch).not.toHaveBeenCalled();

            elapse(100);
            expect(onSearch.mock.calls.map(([text]) => text)).toEqual(["ad"]);
        });

        it("honours a custom searchDelay", async () => {
            const onSearch = vi.fn();
            await mountWithClock({ id: "search", searchDelay: 1000, onSearch });

            typeText("a");
            elapse(999);
            expect(onSearch).not.toHaveBeenCalled();

            elapse(1);
            expect(onSearch).toHaveBeenCalledOnce();
        });

        it("fires on every keystroke, with no timer, when searchDelay is 0", async () => {
            const onSearch = vi.fn();
            await mountWithClock({ id: "search", searchDelay: 0, onSearch });

            typeText("a");
            typeText("ad");

            expect(onSearch.mock.calls.map(([text]) => text)).toEqual(["a", "ad"]);
            expect(vi.getTimerCount()).toBe(0);
        });

        it("searches at once on Enter, cancelling the pending search", async () => {
            const onSearch = vi.fn();
            const { model } = await mountWithClock({ id: "search", onSearch });

            typeText("ada");
            press("Enter");
            expect(onSearch).toHaveBeenCalledOnce();
            expect(onSearch).toHaveBeenCalledWith("ada", model);

            elapse(1000);
            expect(onSearch).toHaveBeenCalledOnce();
        });

        // Escape is swallowed only while there is text to clear.
        it("clears on Escape, searching for everything at once and keeping the key from its host", async () => {
            const onSearch = vi.fn();
            const { model } = await mountWithClock({ id: "search", onSearch });
            const host = listenOnDocument();

            typeText("ada");
            press("Escape");
            elapse(1000);
            host.stop();

            expect(model.value).toBe("");
            expect(searchBox()).toHaveValue("");
            expect(onSearch.mock.calls).toEqual([["", model]]);
            expect(host.keys).not.toContain("Escape");
        });

        // An empty box lets Escape bubble, so a host popover or dialog can close on the same key.
        it("lets Escape through to its host from an empty box, without searching", async () => {
            const onSearch = vi.fn();
            await mount(SearchField, { id: "search", onSearch });
            const host = listenOnDocument();

            await userEvent.click(searchBox());
            await userEvent.keyboard("{Escape}");
            host.stop();

            expect(host.keys).toContain("Escape");
            expect(onSearch).not.toHaveBeenCalled();
        });

        it("clears from the clear button, searching at once and cancelling the pending search", async () => {
            const onSearch = vi.fn();
            const { model } = await mountWithClock({ id: "search", onSearch });

            typeText("ada");
            fireEvent.click(clearButton());
            elapse(1000);

            expect(model.value).toBe("");
            expect(clearButton()).toBeNull();
            expect(onSearch.mock.calls).toEqual([["", model]]);
        });

        it("clear() clears and searches from code, cancelling the pending search", async () => {
            const onSearch = vi.fn();
            const { model } = await mountWithClock({ id: "search", onSearch });

            typeText("ada");
            act(() => { model.clear(); });
            elapse(1000);

            expect(searchBox()).toHaveValue("");
            expect(onSearch.mock.calls).toEqual([["", model]]);
        });

        it("drops a pending search when unmounted", async () => {
            const onSearch = vi.fn();
            const { unmount } = await mountWithClock({ id: "search", onSearch });

            typeText("ada");
            unmount();
            // The unmount hook is async: let it run before the clock moves.
            for (let tick = 0; tick < 20; tick++) {
                await Promise.resolve();
            }
            elapse(1000);

            expect(onSearch).not.toHaveBeenCalled();
            expect(vi.getTimerCount()).toBe(0);
        });

        it("works without an onSearch handler", async () => {
            const { model } = await mountWithClock({ id: "search" });

            typeText("ada");
            elapse(300);
            press("Enter");
            press("Escape");

            expect(model.value).toBe("");
        });

        it("does not search when its value is set from code", async () => {
            const onSearch = vi.fn();
            const { model } = await mountWithClock({ id: "search", onSearch });

            act(() => { model.value = "ada"; });
            elapse(1000);

            expect(searchBox()).toHaveValue("ada");
            expect(onSearch).not.toHaveBeenCalled();
        });
    });
});
