import * as UECA from "ueca-react";
import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterableList, FilterableListParams } from "@components";
import { mount, settle } from "@test";

type Instrument = { id: string; name: string; site: string };

const INSTRUMENTS: Instrument[] = [
    { id: "i1", name: "Piezometer P-01", site: "Cedar Lake" },
    { id: "i2", name: "Inclinometer I-02", site: "North Shaft" },
    { id: "i3", name: "Piezometer P-03", site: "Ridge Cut" },
    { id: "i4", name: "Tiltmeter T-04", site: "Cedar Lake" }
];

function instruments(count: number): Instrument[] {
    return Array.from({ length: count }, (_, i) => ({ id: `i${i}`, name: `Item ${i}`, site: "Portal West" }));
}

// getFC erases the item type parameter; restore it so mount() hands back a typed model.
const InstrumentList = FilterableList as unknown as (params: FilterableListParams<Instrument>) => UECA.ReactElement;
const AnyItemList = FilterableList as unknown as (params: FilterableListParams<unknown>) => UECA.ReactElement;

function mountList(params: FilterableListParams<Instrument> = {}) {
    return mount(InstrumentList, { id: "list", items: INSTRUMENTS, itemKeyField: "id", ...params });
}

function optionTexts() {
    return screen.queryAllByRole("option").map((option) => option.textContent);
}

function searchBox() {
    return screen.getByRole("textbox");
}

function selectedOption() {
    return screen.getByRole("option", { selected: true });
}

// The scrolling element of the list's VirtualList child.
function listViewport() {
    return document.getElementById("list.virtualList");
}

describe("FilterableList", () => {
    it("renders a search box over one option per item, in a listbox", async () => {
        await mountList();

        expect(screen.getByRole("listbox")).toHaveAttribute("id", "list");
        expect(searchBox()).toHaveAttribute("placeholder", "Search");
        expect(optionTexts()).toEqual(INSTRUMENTS.map((item) => item.name));
        expect(screen.queryByRole("option", { selected: true })).toBeNull();
    });

    it("sizes its rows with itemSize", async () => {
        const { model } = await mountList({ itemSize: 40 });
        const heights = () => Array.from(document.querySelectorAll<HTMLElement>(".ueca-virtuallist-item")).map((item) => item.style.height);
        expect(heights()).toEqual(["40px", "40px", "40px", "40px"]);

        model.itemSize = 24;
        await settle();

        expect(heights()).toEqual(["24px", "24px", "24px", "24px"]);
    });

    describe("search", () => {
        it("filters once the typed text settles, not on every keystroke", async () => {
            const { model } = await mountList();
            vi.useFakeTimers({ shouldAdvanceTime: true });

            fireEvent.change(searchBox(), { target: { value: "p" } });
            await act(async () => { await vi.advanceTimersByTimeAsync(150); });
            fireEvent.change(searchBox(), { target: { value: "piezo" } });
            await act(async () => { await vi.advanceTimersByTimeAsync(150); });
            expect(model.search).toBe("");
            expect(optionTexts()).toHaveLength(4);

            await act(async () => { await vi.advanceTimersByTimeAsync(150); });

            expect(model.search).toBe("piezo");
            expect(optionTexts()).toEqual(["Piezometer P-01", "Piezometer P-03"]);
        });

        it("matches a case-insensitive substring of the item text, ignoring surrounding spaces", async () => {
            const { model } = await mountList();

            model.search = "  PIEZO ";
            await settle();

            expect(optionTexts()).toEqual(["Piezometer P-01", "Piezometer P-03"]);
            expect(model.filteredItems()).toEqual([INSTRUMENTS[0], INSTRUMENTS[2]]);
        });

        it("reads an object's name, label or value as its text, else its JSON, and anything else as a string", async () => {
            const items: unknown[] = [
                { name: "Named", label: "unused" },
                { name: 5, label: "Labelled" },
                { value: "Valued" },
                { code: 7 },
                "plain",
                42
            ];
            const { model } = await mount(AnyItemList, { id: "list", items });

            expect(optionTexts()).toEqual(["Named", "Labelled", "Valued", "{\"code\":7}", "plain", "42"]);

            model.search = "code";
            await settle();

            expect(optionTexts()).toEqual(["{\"code\":7}"]);
        });

        it("lets onMatchItem decide, handing it each item and the trimmed search", async () => {
            const onMatchItem = vi.fn((item: Instrument, search: string) => item.site.toLowerCase().includes(search));
            const { model } = await mountList({ onMatchItem });

            model.search = " cedar ";
            await settle();

            expect(optionTexts()).toEqual(["Piezometer P-01", "Tiltmeter T-04"]);
            expect(onMatchItem).toHaveBeenCalledWith(INSTRUMENTS[1], "cedar", model);
        });

        it("shows every item for a blank search, without consulting onMatchItem", async () => {
            const onMatchItem = vi.fn(() => false);
            await mountList({ onMatchItem, search: "   " });

            expect(optionTexts()).toHaveLength(4);
            expect(onMatchItem).not.toHaveBeenCalled();
        });

        it("hides the search box and ignores the search while filterable is off", async () => {
            const { model } = await mountList({ filterable: false, search: "piezo" });
            expect(screen.queryByRole("textbox")).toBeNull();
            expect(optionTexts()).toHaveLength(4);

            model.filterable = true;
            await settle();

            expect(searchBox()).toBeInTheDocument();
            expect(optionTexts()).toEqual(["Piezometer P-01", "Piezometer P-03"]);
        });

        // Filtering is a derived read of items + search: refreshed data cannot discard the search.
        it("keeps the search when the items are refreshed", async () => {
            const { model } = await mountList({ search: "piezo" });

            model.items = [...INSTRUMENTS, { id: "i5", name: "Piezometer P-05", site: "Portal West" }];
            await settle();

            expect(optionTexts()).toEqual(["Piezometer P-01", "Piezometer P-03", "Piezometer P-05"]);
        });

        it("shows its empty view when nothing matches", async () => {
            const { model } = await mountList();

            model.search = "gauge";
            await settle();
            expect(optionTexts()).toEqual([]);
            expect(document.querySelector(".ueca-virtuallist-empty")).toHaveTextContent("No matches");

            model.emptyView = "No instruments match";
            await settle();
            expect(document.querySelector(".ueca-virtuallist-empty")).toHaveTextContent("No instruments match");
        });

        it("hands its placeholder to the search box", async () => {
            const { model } = await mountList({ searchPlaceholder: "Filter instruments…" });
            expect(searchBox()).toHaveAttribute("placeholder", "Filter instruments…");

            model.searchPlaceholder = "Find";
            await settle();

            expect(searchBox()).toHaveAttribute("placeholder", "Find");
        });

        // Regression: `search` is documented as assignable so that "a caller can clear or preseed the
        // filter", but nothing carried it into the SearchField. The box then misdescribed the filter
        // the list applies: a preseeded search narrowed the list under an empty box…
        it("shows a preseeded search in the search box", async () => {
            await mountList({ search: "piezo" });

            expect(optionTexts()).toHaveLength(2);
            expect(searchBox()).toHaveValue("piezo");
        });

        // Regression: …and a search the caller cleared stayed in the box, where the next keystroke
        // searched for the old text again. Same cause as above.
        it("empties the search box when a caller clears the search", async () => {
            const { model } = await mountList();
            vi.useFakeTimers({ shouldAdvanceTime: true });
            fireEvent.change(searchBox(), { target: { value: "piezo" } });
            await act(async () => { await vi.advanceTimersByTimeAsync(300); });
            expect(optionTexts()).toHaveLength(2);

            model.search = "";
            await settle();

            expect(optionTexts()).toHaveLength(4);
            expect(searchBox()).toHaveValue("");
        });

        // Typing is not overwritten while the search catches up: between keystrokes the box runs
        // ahead of the settled search, and the list follows once the search settles.
        it("keeps the typed text while its search is still settling", async () => {
            await mountList();
            vi.useFakeTimers({ shouldAdvanceTime: true });

            fireEvent.change(searchBox(), { target: { value: "pie" } });
            await act(async () => { await vi.advanceTimersByTimeAsync(300); });
            fireEvent.change(searchBox(), { target: { value: "piezometer p-03" } });
            await settle();
            expect(searchBox()).toHaveValue("piezometer p-03");

            await act(async () => { await vi.advanceTimersByTimeAsync(300); });

            expect(searchBox()).toHaveValue("piezometer p-03");
            expect(optionTexts()).toEqual(["Piezometer P-03"]);
        });
    });

    describe("selection", () => {
        it("selects a clicked item: activeKey, the active option and onItemSelect", async () => {
            const onItemSelect = vi.fn();
            const { model } = await mountList({ onItemSelect });

            await userEvent.click(screen.getByText("Inclinometer I-02"));

            expect(model.activeKey).toBe("i2");
            expect(onItemSelect).toHaveBeenCalledWith(INSTRUMENTS[1], "i2", model);
            expect(selectedOption()).toHaveTextContent("Inclinometer I-02");
            expect(selectedOption()).toHaveClass("ueca-filterablelist-row", "active");
            expect(screen.getAllByRole("option", { selected: false })).toHaveLength(3);
        });

        it("marks a preset activeKey", async () => {
            await mountList({ activeKey: "i4" });

            expect(selectedOption()).toHaveTextContent("Tiltmeter T-04");
        });

        it("keeps a keyed selection on its item while the search narrows the list", async () => {
            const { model } = await mountList({ activeKey: "i3" });

            model.search = "piezo";
            await settle();

            expect(selectedOption()).toHaveTextContent("Piezometer P-03");
        });

        it("keys a string item by itself, and an item without a key field by its position", async () => {
            const { model } = await mount(AnyItemList, { id: "list", items: ["alpha", { name: "beta" }, "gamma"] });

            await userEvent.click(screen.getByText("gamma"));
            expect(model.activeKey).toBe("gamma");

            await userEvent.click(screen.getByText("beta"));
            expect(model.activeKey).toBe("1");
        });

        it("keys an item by its position when its key field is empty", async () => {
            const { model } = await mountList({ items: [INSTRUMENTS[0], { id: undefined, name: "Unregistered", site: "" }] });

            await userEvent.click(screen.getByText("Unregistered"));

            expect(model.activeKey).toBe("1");
        });

        it("renders onRenderItem's content inside its own row shell, which still selects", async () => {
            const onRenderItem = vi.fn((item: Instrument, row: { index: number; active: boolean }) => (
                <b>{`${item.site} #${row.index}${row.active ? " (active)" : ""}`}</b>
            ));
            const { model } = await mountList({ onRenderItem });
            expect(optionTexts()).toEqual(["Cedar Lake #0", "North Shaft #1", "Ridge Cut #2", "Cedar Lake #3"]);
            expect(onRenderItem).toHaveBeenCalledWith(INSTRUMENTS[2], { index: 2, active: false }, model);

            await userEvent.click(screen.getByText("Ridge Cut #2"));

            expect(model.activeKey).toBe("i3");
            expect(selectedOption()).toHaveTextContent("Ridge Cut #2 (active)");
        });

        it("renders no row for an index outside the filtered items", async () => {
            const { model } = await mountList({ search: "piezo" });

            expect(model.virtualList.onRenderItem(2, model.virtualList)).toBeNull();
        });
    });

    describe("a long list", () => {
        // 200 items of 32px in a 320px viewport.
        function mountLongList(params: FilterableListParams<Instrument> = {}) {
            vi.spyOn(Element.prototype, "clientHeight", "get").mockReturnValue(320);
            return mountList({ items: instruments(200), ...params });
        }

        it("renders a window of it, in a scroll area sized by the filtered count", async () => {
            const { model } = await mountLongList();
            const spacerHeight = () => document.querySelector<HTMLElement>(".ueca-virtuallist-spacer").style.height;
            expect(screen.getAllByRole("option")).toHaveLength(17);
            expect(spacerHeight()).toBe(`${200 * 32}px`);

            model.search = "Item 1";
            await settle();

            // "Item 1", "Item 10"–"Item 19" and "Item 100"–"Item 199".
            expect(spacerHeight()).toBe(`${111 * 32}px`);
        });

        // The active row starts off-screen when the list mounts, so it is centred.
        it("centres a preset active item when it mounts", async () => {
            await mountLongList({ activeKey: "i100" });

            expect(listViewport().scrollTop).toBe(100 * 32 - (320 - 32) / 2);
            expect(selectedOption()).toHaveTextContent("Item 100");
        });

        it("scrolls an assigned activeKey just far enough into view", async () => {
            const { model } = await mountLongList();

            model.activeKey = "i100";
            await settle();

            expect(listViewport().scrollTop).toBe(101 * 32 - 320);
            expect(selectedOption()).toHaveTextContent("Item 100");
        });

        // "Nearest" by default, so selecting an already-visible row does not shove the list around.
        it("leaves the list where it is when a visible item is clicked", async () => {
            await mountLongList();
            listViewport().scrollTop = 64;
            fireEvent.scroll(listViewport());
            await settle();

            await userEvent.click(screen.getByText("Item 5"));

            expect(selectedOption()).toHaveTextContent("Item 5");
            expect(listViewport().scrollTop).toBe(64);
        });

        it("scrollToActive finds the active item among the filtered items", async () => {
            const { model } = await mountLongList({ activeKey: "i150" });
            model.search = "Item 1";
            await settle();

            model.scrollToActive("start");

            // "Item 1", "Item 10"–"Item 19" and "Item 100"–"Item 149" come before it.
            expect(listViewport().scrollTop).toBe((1 + 10 + 50) * 32);
        });

        it("scrollToActive stays put without an active item, or when the search hides it", async () => {
            const { model } = await mountLongList();
            listViewport().scrollTop = 96;

            model.scrollToActive("start");
            expect(listViewport().scrollTop).toBe(96);

            model.search = "Item 1";
            model.activeKey = "i2";
            await settle();
            model.scrollToActive("start");
            expect(listViewport().scrollTop).toBe(96);
        });
    });
});
