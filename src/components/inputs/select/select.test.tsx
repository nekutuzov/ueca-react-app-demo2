import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FieldLabel, Select, SelectOption } from "@components";
import { mount, settle } from "@test";

const FRUIT: SelectOption[] = [
    { value: "apple", label: "Apple" },
    { value: "banana", label: "Banana" },
    { value: "blueberry", label: "Blueberry", disabled: true },
    { value: "cherry", label: "Cherry" }
];

// For type-ahead: two enabled B's to cycle through.
const BERRIES: SelectOption[] = [
    { value: "apple", label: "Apple" },
    { value: "banana", label: "Banana" },
    { value: "blackberry", label: "Blackberry" },
    { value: "cherry", label: "Cherry" }
];

const THIRTY: SelectOption[] = Array.from({ length: 30 }, (_, i) => ({ value: `v${i}`, label: `Option ${i}` }));

function trigger(): HTMLElement {
    return screen.getByRole("combobox");
}

function listbox(): HTMLElement {
    return screen.queryByRole("listbox");
}

function option(name: string): HTMLElement {
    return screen.getByRole("option", { name });
}

function focusTrigger() {
    act(() => { trigger().focus(); });
}

async function openByClick() {
    await userEvent.click(trigger());
}

function rect(top: number, left: number, width: number, height: number): DOMRect {
    return { top, left, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) } as DOMRect;
}

// jsdom has no layout: rows are 20px tall at their index, the listbox shows 100px of them.
function stubListLayout() {
    vi.spyOn(HTMLElement.prototype, "offsetTop", "get").mockImplementation(function (this: HTMLElement) {
        const row = /-option-(\d+)$/.exec(this.id);
        return row ? Number(row[1]) * 20 : 0;
    });
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(function (this: HTMLElement) {
        return /-option-\d+$/.test(this.id) ? 20 : 0;
    });
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockImplementation(function (this: HTMLElement) {
        return this.getAttribute("role") === "listbox" ? 100 : 0;
    });
}

// Type-ahead words are timed with Date.now(); freeze it so keystrokes never drift apart.
function freezeClock(at = 10_000) {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(at);
}

describe("Select", () => {
    describe("rendering", () => {
        it("renders a closed, full-width, outlined combobox showing an empty placeholder by default", async () => {
            await mount(Select, { id: "s", options: FRUIT });

            const root = document.getElementById("s");
            expect(root).toHaveClass("ueca-select", "ueca-select-outlined", "ueca-select-medium");
            expect(root).not.toHaveClass("ueca-select-error", "ueca-select-disabled", "ueca-select-readonly", "ueca-select-open");
            expect(root.style.width).toBe("100%");
            expect(root.style.getPropertyValue("--select-color")).toBe("var(--accent)");

            const combobox = trigger();
            expect(combobox).toHaveAttribute("id", "s-trigger");
            expect(combobox).toHaveAttribute("type", "button");
            expect(combobox).toHaveAttribute("aria-haspopup", "listbox");
            expect(combobox).toHaveAttribute("aria-expanded", "false");
            expect(combobox).toHaveAttribute("aria-controls", "s-listbox");
            expect(combobox).not.toHaveAttribute("aria-activedescendant");
            expect(combobox).not.toHaveAttribute("aria-labelledby");
            expect(combobox).not.toHaveAttribute("aria-required");
            expect(combobox).not.toHaveAttribute("aria-invalid");
            expect(combobox).toBeEnabled();
            expect(combobox.querySelector(".ueca-select-value")).toHaveClass("ueca-select-value-placeholder");
            expect(listbox()).toBeNull();
        });

        // An unchosen value shows the placeholder, never the first option, so nothing looks picked.
        it("shows the selected option's label, and the placeholder when no option matches", async () => {
            const { model } = await mount(Select, { id: "s", options: FRUIT, value: "banana", placeholder: "Pick a fruit" });
            const valueText = () => trigger().querySelector(".ueca-select-value");
            expect(valueText()).toHaveTextContent(/^Banana$/);
            expect(valueText()).not.toHaveClass("ueca-select-value-placeholder");

            model.value = "durian";
            await settle();

            expect(valueText()).toHaveTextContent(/^Pick a fruit$/);
            expect(valueText()).toHaveClass("ueca-select-value-placeholder");
        });

        it.each([
            ["filled", "small"],
            ["standard", "medium"]
        ] as const)("reflects the %s variant and %s size in its classes", async (variant, size) => {
            await mount(Select, { id: "s", options: FRUIT, variant, size });

            expect(document.getElementById("s")).toHaveClass(`ueca-select-${variant}`, `ueca-select-${size}`);
        });

        it("takes extent.width when not full-width, and a palette colour", async () => {
            await mount(Select, { id: "s", options: FRUIT, fullWidth: false, extent: { width: 180 }, color: "error.main" });

            const root = document.getElementById("s");
            expect(root.style.width).toBe("180px");
            expect(root.style.getPropertyValue("--select-color")).toBe("var(--error)");
        });

        // A combobox names itself from its label PLUS its own text: "Fruit, Banana". (jsdom's name
        // computation drops the self-reference, so the wiring is asserted rather than the full name.)
        it("is labelled by its label and its current text, with a leading asterisk when required", async () => {
            const { model } = await mount(Select, { id: "s", options: FRUIT, value: "banana", labelView: "Fruit" });

            expect(screen.getByRole("combobox", { name: /^Fruit/ })).toBe(trigger());
            expect(trigger()).toHaveAttribute("aria-labelledby", "s-label s-trigger");
            expect(document.getElementById("s-label")).toHaveTextContent(/^Fruit$/);
            expect(document.getElementById("s-trigger")).toHaveTextContent(/^Banana$/);

            model.required = true;
            await settle();

            const label = document.getElementById("s-label");
            expect(label.firstElementChild).toHaveClass("ueca-select-required");
            expect(label).toHaveTextContent(/^\*Fruit$/);
            expect(trigger()).toHaveAttribute("aria-required", "true");
            // The asterisk is for the eye: the name stays "Fruit", and aria-required says the rest.
            expect(label.firstElementChild).toHaveAttribute("aria-hidden", "true");
            expect(screen.getByRole("combobox", { name: /^Fruit/ })).toBe(trigger());
        });

        it("disables the trigger when disabled, and does not open", async () => {
            await mount(Select, { id: "s", options: FRUIT, disabled: true });

            expect(document.getElementById("s")).toHaveClass("ueca-select-disabled");
            expect(trigger()).toBeDisabled();
            await userEvent.click(trigger());
            expect(listbox()).toBeNull();
        });

        // Not editable but still readable in full ink: disabled trigger, repainted by the READONLY class.
        it("disables the trigger when read-only, painted read-only rather than disabled", async () => {
            await mount(Select, { id: "s", options: FRUIT, value: "apple", readOnly: true });

            const root = document.getElementById("s");
            expect(root).toHaveClass("ueca-select-readonly");
            expect(root).not.toHaveClass("ueca-select-disabled");
            expect(trigger()).toBeDisabled();
        });

        it("shows helper text, not styled as an error", async () => {
            await mount(Select, { id: "s", options: FRUIT, helperTextView: "Seasonal only" });

            const helper = document.querySelector(".ueca-select-helper-text");
            expect(helper).toHaveTextContent("Seasonal only");
            expect(helper).not.toHaveClass("ueca-select-helper-text-error");
        });
    });

    describe("opening and closing", () => {
        it("opens a listbox of its options on click, and closes it on a second click", async () => {
            await mount(Select, { id: "s", options: FRUIT, labelView: "Fruit" });

            await openByClick();

            expect(trigger()).toHaveAttribute("aria-expanded", "true");
            expect(document.getElementById("s")).toHaveClass("ueca-select-open");
            expect(screen.getByRole("dialog")).toHaveClass("ueca-popover", "ueca-select-popover");
            expect(listbox()).toHaveAttribute("id", "s-listbox");
            expect(listbox()).toHaveAttribute("aria-labelledby", "s-label");
            expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Apple", "Banana", "Blueberry", "Cherry"]);

            // The trigger's mousedown is not an outside click, or it could never toggle the list shut.
            await openByClick();

            expect(listbox()).toBeNull();
            expect(trigger()).toHaveAttribute("aria-expanded", "false");
        });

        // positionOverlay centres on the anchor; the list takes the trigger's width, which makes
        // centring and left-aligning the same thing.
        it("lines the list up under the trigger, at the trigger's width", async () => {
            vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
                if (this.getAttribute("role") === "combobox") {
                    return rect(100, 50, 200, 30);
                }
                if (this.classList.contains("ueca-popover")) {
                    return rect(0, 0, 200, 120);
                }
                return rect(0, 0, 0, 0);
            });
            await mount(Select, { id: "s", options: FRUIT });

            await openByClick();

            const popover = screen.getByRole("dialog");
            expect(popover.style.top).toBe(`${100 + 30 + 6}px`);
            expect(popover.style.left).toBe("50px");
            expect(popover.style.visibility).toBe("visible");
            expect(listbox().style.width).toBe("200px");
        });

        it("marks the selected option and starts the active row on it", async () => {
            await mount(Select, { id: "s", options: FRUIT, value: "cherry" });

            await openByClick();

            const cherry = option("Cherry");
            expect(cherry).toHaveAttribute("id", "s-option-3");
            expect(cherry).toHaveAttribute("aria-selected", "true");
            expect(cherry).toHaveClass("ueca-select-option", "selected", "active");
            expect(option("Apple")).toHaveAttribute("aria-selected", "false");
            expect(trigger()).toHaveAttribute("aria-activedescendant", "s-option-3");
        });

        it("starts the active row on the first enabled option when nothing is selected", async () => {
            const options = [{ value: "x", label: "Unavailable", disabled: true }, ...FRUIT];
            await mount(Select, { id: "s", options });

            await openByClick();

            expect(option("Apple")).toHaveClass("active");
            expect(trigger()).toHaveAttribute("aria-activedescendant", "s-option-1");
        });

        it("marks disabled options", async () => {
            await mount(Select, { id: "s", options: FRUIT });

            await openByClick();

            expect(option("Blueberry")).toHaveAttribute("aria-disabled", "true");
            expect(option("Blueberry")).toHaveClass("disabled");
            expect(option("Banana")).not.toHaveAttribute("aria-disabled");
        });

        it.each([
            ["Escape", () => userEvent.keyboard("{Escape}")],
            ["a mousedown outside", async () => { fireEvent.mouseDown(document.body); }],
            ["a scroll outside", async () => { fireEvent.scroll(window); }],
            ["a window resize", async () => { fireEvent(window, new Event("resize")); }]
        ])("closes on %s", async (_case, dismiss) => {
            await mount(Select, { id: "s", options: FRUIT });
            await openByClick();

            await dismiss();
            await settle();

            expect(listbox()).toBeNull();
        });

        it("stays open while the list itself scrolls", async () => {
            await mount(Select, { id: "s", options: THIRTY });
            await openByClick();

            fireEvent.scroll(listbox());
            await settle();

            expect(listbox()).not.toBeNull();
        });

        it("raises onFocus, and on Tab away closes the list and raises onBlur", async () => {
            const onFocus = vi.fn();
            const onBlur = vi.fn();
            const { model } = await mount(Select, { id: "s", options: FRUIT, onFocus, onBlur });

            await openByClick();
            expect(onFocus).toHaveBeenCalledWith(model);

            await userEvent.tab();

            expect(listbox()).toBeNull();
            expect(onBlur).toHaveBeenCalledWith(model);
        });
    });

    describe("choosing with the pointer", () => {
        // The row suppresses its own mousedown: otherwise the trigger blurs, which closes the list
        // before the click can land.
        it("chooses a clicked option, closing the list and keeping focus on the trigger", async () => {
            const onChange = vi.fn();
            const { model } = await mount(Select, { id: "s", options: FRUIT, onChange });
            await openByClick();

            await userEvent.click(option("Cherry"));

            expect(model.value).toBe("cherry");
            expect(onChange).toHaveBeenCalledOnce();
            expect(onChange).toHaveBeenCalledWith("cherry", model);
            expect(listbox()).toBeNull();
            expect(trigger()).toHaveFocus();
            expect(trigger()).toHaveTextContent("Cherry");
        });

        it("moves the active row with the pointer, without choosing", async () => {
            const { model } = await mount(Select, { id: "s", options: FRUIT, value: "apple" });
            await openByClick();

            fireEvent.mouseEnter(option("Banana"));
            await settle();

            expect(option("Banana")).toHaveClass("active");
            expect(option("Apple")).not.toHaveClass("active");
            expect(trigger()).toHaveAttribute("aria-activedescendant", "s-option-1");
            expect(model.value).toBe("apple");
        });

        it("ignores a click on a disabled option", async () => {
            const onChange = vi.fn();
            const { model } = await mount(Select, { id: "s", options: FRUIT, value: "apple", onChange });
            await openByClick();

            await userEvent.click(option("Blueberry"));

            expect(model.value).toBe("apple");
            expect(onChange).not.toHaveBeenCalled();
        });

        // The active row lives in its own *View methods: read by the main View, every hover re-rendered
        // the whole Select, re-created the popover and replayed its fade-in — the blink.
        it("does not re-render the main View while the pointer moves over the rows", async () => {
            const draw = vi.fn();
            await mount(Select, { id: "s", options: FRUIT, draw });
            await openByClick();
            const draws = draw.mock.calls.length;

            fireEvent.mouseEnter(option("Banana"));
            fireEvent.mouseEnter(option("Cherry"));
            await settle();

            expect(option("Cherry")).toHaveClass("active");
            expect(draw).toHaveBeenCalledTimes(draws);
        });
    });

    describe("keyboard on a closed select", () => {
        // Native <select>: closed, a movement key moves the VALUE and opens nothing.
        it("moves the value with the arrows without opening, skipping disabled options", async () => {
            const onChange = vi.fn();
            const { model } = await mount(Select, { id: "s", options: FRUIT, value: "banana", onChange });
            focusTrigger();

            await userEvent.keyboard("{ArrowDown}");
            expect(model.value).toBe("cherry");
            expect(listbox()).toBeNull();

            await userEvent.keyboard("{ArrowUp}");
            expect(model.value).toBe("banana");
            expect(onChange.mock.calls.map(([value]) => value)).toEqual(["cherry", "banana"]);
        });

        // Guarded: arrowing into the end of the list must not re-fire onChange with the value it
        // already has — it reaches a screen's save state.
        it("raises no onChange when arrowing past either end", async () => {
            const onChange = vi.fn();
            const { model } = await mount(Select, { id: "s", options: FRUIT, value: "cherry", onChange });
            focusTrigger();

            await userEvent.keyboard("{ArrowDown}{End}");
            model.value = "apple";
            await settle();
            await userEvent.keyboard("{ArrowUp}{Home}");

            expect(onChange).not.toHaveBeenCalled();
        });

        it("jumps to the first and last enabled options with Home and End", async () => {
            const options = [{ value: "x", label: "Gone", disabled: true }, ...FRUIT, { value: "y", label: "Later", disabled: true }];
            const { model } = await mount(Select, { id: "s", options, value: "banana" });
            focusTrigger();

            await userEvent.keyboard("{End}");
            expect(model.value).toBe("cherry");

            await userEvent.keyboard("{Home}");
            expect(model.value).toBe("apple");
        });

        it("moves ten rows with PageDown and PageUp, stopping at the ends", async () => {
            const { model } = await mount(Select, { id: "s", options: THIRTY, value: "v0" });
            focusTrigger();

            await userEvent.keyboard("{PageDown}");
            expect(model.value).toBe("v10");

            await userEvent.keyboard("{PageDown}{PageDown}");
            expect(model.value).toBe("v29");

            await userEvent.keyboard("{PageUp}");
            expect(model.value).toBe("v19");
        });

        it("enters the list from the end the key implies when nothing is selected", async () => {
            const { model } = await mount(Select, { id: "s", options: FRUIT });
            focusTrigger();

            await userEvent.keyboard("{ArrowDown}");
            expect(model.value).toBe("apple");

            model.value = undefined;
            await settle();
            await userEvent.keyboard("{ArrowUp}");
            expect(model.value).toBe("cherry");
        });

        it.each([["Enter", "{Enter}"], ["Space", " "]])("opens with %s without changing the value", async (_key, keys) => {
            const onChange = vi.fn();
            const { model } = await mount(Select, { id: "s", options: FRUIT, value: "banana", onChange });
            focusTrigger();

            await userEvent.keyboard(keys);

            expect(listbox()).not.toBeNull();
            expect(model.value).toBe("banana");
            expect(onChange).not.toHaveBeenCalled();
        });

        it("opens with Alt+ArrowDown without moving the value, and ignores Alt+ArrowUp", async () => {
            const { model } = await mount(Select, { id: "s", options: FRUIT, value: "banana" });
            focusTrigger();

            await userEvent.keyboard("{Alt>}{ArrowUp}{/Alt}");
            expect(listbox()).toBeNull();
            expect(model.value).toBe("banana");

            await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");
            expect(listbox()).not.toBeNull();
            expect(model.value).toBe("banana");
            expect(option("Banana")).toHaveClass("active");
        });

        // A closed native select changes its value as you type, without opening.
        it("changes the value by type-ahead without opening", async () => {
            const onChange = vi.fn();
            const { model } = await mount(Select, { id: "s", options: FRUIT, value: "apple", onChange });
            focusTrigger();

            await userEvent.keyboard("c");

            expect(model.value).toBe("cherry");
            expect(onChange).toHaveBeenCalledWith("cherry", model);
            expect(listbox()).toBeNull();
        });

        it("ignores type-ahead that matches nothing", async () => {
            const onChange = vi.fn();
            const { model } = await mount(Select, { id: "s", options: FRUIT, value: "apple", onChange });
            focusTrigger();

            await userEvent.keyboard("z");

            expect(model.value).toBe("apple");
            expect(onChange).not.toHaveBeenCalled();
        });
    });

    describe("keyboard on an open select", () => {
        // Open, a movement key moves the ACTIVE row and commits nothing until Enter, Space or a click.
        it("moves the active row, not the value, with the arrows", async () => {
            const onChange = vi.fn();
            const { model } = await mount(Select, { id: "s", options: FRUIT, value: "banana", onChange });
            await openByClick();

            await userEvent.keyboard("{ArrowDown}");

            expect(option("Cherry")).toHaveClass("active");
            expect(option("Banana")).not.toHaveClass("active");
            expect(trigger()).toHaveAttribute("aria-activedescendant", "s-option-3");
            expect(model.value).toBe("banana");
            expect(onChange).not.toHaveBeenCalled();
        });

        it("moves the active row with Home, End, PageUp and PageDown", async () => {
            await mount(Select, { id: "s", options: THIRTY });
            await openByClick();
            const active = () => trigger().getAttribute("aria-activedescendant");

            await userEvent.keyboard("{End}");
            expect(active()).toBe("s-option-29");
            await userEvent.keyboard("{PageUp}");
            expect(active()).toBe("s-option-19");
            await userEvent.keyboard("{Home}");
            expect(active()).toBe("s-option-0");
            await userEvent.keyboard("{PageDown}");
            expect(active()).toBe("s-option-10");
        });

        it.each([["Enter", "{Enter}"], ["Space", " "]])("chooses the active row with %s and closes", async (_key, keys) => {
            const onChange = vi.fn();
            const { model } = await mount(Select, { id: "s", options: FRUIT, value: "apple", onChange });
            await openByClick();

            await userEvent.keyboard(`{ArrowDown}${keys}`);

            expect(model.value).toBe("banana");
            expect(onChange).toHaveBeenCalledOnce();
            expect(listbox()).toBeNull();
            expect(trigger()).toHaveFocus();
        });

        it("closes with Alt+ArrowUp without choosing", async () => {
            const { model } = await mount(Select, { id: "s", options: FRUIT, value: "apple" });
            await openByClick();

            await userEvent.keyboard("{ArrowDown}{Alt>}{ArrowUp}{/Alt}");

            expect(listbox()).toBeNull();
            expect(model.value).toBe("apple");
        });

        it("moves the active row by type-ahead, cycling on a repeated letter, without choosing", async () => {
            freezeClock();
            const { model } = await mount(Select, { id: "s", options: BERRIES, value: "apple" });
            await openByClick();

            await userEvent.keyboard("b");
            expect(option("Banana")).toHaveClass("active");

            await userEvent.keyboard("b");
            expect(option("Blackberry")).toHaveClass("active");

            await userEvent.keyboard("b");
            expect(option("Banana")).toHaveClass("active");
            expect(model.value).toBe("apple");
            expect(listbox()).not.toBeNull();
        });

        it("starts a new type-ahead word after a pause", async () => {
            freezeClock();
            await mount(Select, { id: "s", options: BERRIES });
            await openByClick();

            await userEvent.keyboard("b");
            vi.setSystemTime(10_000 + 5_000);
            await userEvent.keyboard("c");

            expect(option("Cherry")).toHaveClass("active");
        });

        // "NEW ZEALAND" is unreachable if Space always chooses: once a word is being typed, it is
        // part of the word.
        it("treats Space as part of a word being typed", async () => {
            freezeClock();
            const countries = [
                { value: "nl", label: "Netherlands" },
                { value: "nc", label: "New Caledonia" },
                { value: "nz", label: "New Zealand" }
            ];
            const { model } = await mount(Select, { id: "s", options: countries });
            await openByClick();

            await userEvent.keyboard("new z");

            expect(option("New Zealand")).toHaveClass("active");
            expect(model.value).toBeUndefined();
            expect(listbox()).not.toBeNull();

            await userEvent.keyboard("{Enter}");
            expect(model.value).toBe("nz");
        });

        // onClose clears the word, so typing on the select once it has closed starts a fresh one.
        it("forgets the type-ahead word when the list closes", async () => {
            freezeClock();
            const { model } = await mount(Select, { id: "s", options: BERRIES });
            await openByClick();
            await userEvent.keyboard("b{Escape}");
            expect(listbox()).toBeNull();

            await userEvent.keyboard("a");

            expect(model.value).toBe("apple");
        });

        // BUG: Space chooses the active row only while the type-ahead buffer is EMPTY, and the buffer
        // is cleared only on open/close — never by the reset timeout. After typing "b" and pausing,
        // no word is being typed any more, yet the stale buffer still sends Space to type-ahead, where
        // it starts a new word " " that matches nothing and leaves the key to the button, whose native
        // click toggles the list shut without choosing.
        it.fails("chooses the active row with Space after a pause in typing", async () => {
            freezeClock();
            const { model } = await mount(Select, { id: "s", options: BERRIES });
            await openByClick();
            await userEvent.keyboard("b");
            expect(option("Banana")).toHaveClass("active");

            vi.setSystemTime(10_000 + 5_000);
            await userEvent.keyboard(" ");

            expect(model.value).toBe("banana");
            expect(listbox()).toBeNull();
        });
    });

    describe("scrolling the active row into view", () => {
        it("scrolls the selected row into view when the list opens", async () => {
            stubListLayout();
            await mount(Select, { id: "s", options: THIRTY, value: "v25" });

            await openByClick();

            // Row 25 spans 500–520px; the 100px list scrolls so its bottom edge is visible.
            expect(listbox().scrollTop).toBe(520 - 100);
        });

        it("leaves the scroll alone when the selected row is already visible", async () => {
            stubListLayout();
            await mount(Select, { id: "s", options: THIRTY, value: "v2" });

            await openByClick();

            expect(listbox().scrollTop).toBe(0);
        });

        // Regression: _scrollActiveIntoView ran only from `draw`, which follows only the MAIN View's
        // renders — and the main View deliberately reads nothing that changes while the list is open
        // (see the hover test above). Keyboard moves set _scrollActive but no draw followed, so
        // arrowing past the visible rows left the active row out of sight.
        it("scrolls the active row into view as the keyboard moves it", async () => {
            stubListLayout();
            await mount(Select, { id: "s", options: THIRTY });
            await openByClick();

            await userEvent.keyboard("{ArrowDown>8/}");
            expect(trigger()).toHaveAttribute("aria-activedescendant", "s-option-8");

            // Row 8 spans 160–180px.
            expect(listbox().scrollTop).toBe(180 - 100);
        });

        it("scrolls back up when the keyboard moves above the visible rows", async () => {
            stubListLayout();
            await mount(Select, { id: "s", options: THIRTY, value: "v25" });
            await openByClick();
            expect(listbox().scrollTop).toBe(520 - 100);

            await userEvent.keyboard("{Home}");

            expect(trigger()).toHaveAttribute("aria-activedescendant", "s-option-0");
            expect(listbox().scrollTop).toBe(0);
        });

        it("follows a type-ahead jump in the open list", async () => {
            stubListLayout();
            freezeClock();
            await mount(Select, { id: "s", options: THIRTY });
            await openByClick();

            await userEvent.keyboard("option 25");

            expect(trigger()).toHaveAttribute("aria-activedescendant", "s-option-25");
            expect(listbox().scrollTop).toBe(520 - 100);
        });

        // Hovering moves the active row too, but the pointer is already over it: scrolling would
        // pull the list out from under the pointer.
        it("does not scroll when the pointer moves the active row", async () => {
            stubListLayout();
            await mount(Select, { id: "s", options: THIRTY });
            await openByClick();

            fireEvent.mouseEnter(document.getElementById("s-option-8"));
            await settle();

            expect(trigger()).toHaveAttribute("aria-activedescendant", "s-option-8");
            expect(listbox().scrollTop).toBe(0);
        });
    });

    describe("validation", () => {
        it("reports a required select without a value, flagging the trigger aria-invalid", async () => {
            const { model } = await mount(Select, { id: "s", options: FRUIT, labelView: "Fruit", required: true, helperTextView: "Seasonal only" });

            await model.validate();
            await settle();

            expect(model.getValidationError()).toBe("Fruit cannot be empty");
            expect(document.getElementById("s")).toHaveClass("ueca-select-error");
            const helper = document.querySelector(".ueca-select-helper-text");
            expect(helper).toHaveClass("ueca-select-helper-text-error");
            expect(helper).toHaveTextContent(/^Fruit cannot be empty$/);
            expect(trigger()).toHaveAttribute("aria-invalid", "true");
        });

        it.each([
            ["a FieldLabel's own label", <FieldLabel labelView="Fruit" secondaryView="(seasonal)" />, "Fruit"],
            ["'This field' without a text label", <b>Fruit</b>, "This field"],
            ["'This field' without a label", undefined, "This field"]
        ])("names the field in its message by %s", async (_case, labelView, fieldName) => {
            const { model } = await mount(Select, { id: "s", options: FRUIT, labelView, required: true });

            await model.validate();

            expect(model.getValidationError()).toBe(`${fieldName} cannot be empty`);
        });

        it("accepts a required select with a value", async () => {
            const { model } = await mount(Select, { id: "s", options: FRUIT, required: true, value: "apple" });

            await model.validate();

            expect(model.isValid()).toBe(true);
        });

        it("clears the error once an option is chosen", async () => {
            const { model } = await mount(Select, { id: "s", options: FRUIT, labelView: "Fruit", required: true });
            await model.validate();
            await settle();
            focusTrigger();

            await userEvent.keyboard("{ArrowDown}");

            expect(model.isValid()).toBe(true);
            expect(trigger()).not.toHaveAttribute("aria-invalid");
            expect(document.querySelector(".ueca-select-helper-text")).toBeNull();
        });

        // BUG: `!model.value` treats 0 as empty, although the Select itself shows the option whose
        // value is 0 as chosen (_isSelected checks `value != null`).
        it.fails("does not report a required select holding the option 0 as empty", async () => {
            const levels = [{ value: 0, label: "None" }, { value: 1, label: "Low" }] as unknown as SelectOption[];
            const { model } = await mount(Select, { id: "s", options: levels, value: 0 as unknown as string, labelView: "Level", required: true });
            expect(trigger()).toHaveTextContent("None");

            await model.validate();

            expect(model.getValidationError()).toBeUndefined();
        });
    });

    it("commits option values of their own type", async () => {
        const levels = [{ value: 1, label: "Low" }, { value: 2, label: "High" }] as unknown as SelectOption[];
        const onChange = vi.fn();
        const { model } = await mount(Select, { id: "s", options: levels, onChange });
        await openByClick();

        await userEvent.click(option("High"));

        expect(model.value).toBe(2);
        expect(onChange).toHaveBeenCalledWith(2, model);
    });
});
