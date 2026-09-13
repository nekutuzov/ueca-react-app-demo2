import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mount, ResizeObserverStub, settle } from "@test";
import { ListsTopic } from "./listsTopic";

const TOPIC = "lists";

function byId(id: string): HTMLElement {
    return document.getElementById(`${TOPIC}.${id}`);
}

function searchReadout(): string {
    return screen.getByText(/^raw value:/).textContent;
}

function rangeReadout(): string {
    return screen.getByText(/^rows \d+/).textContent;
}

function listReadout(): string {
    return screen.getByText(/^selected:/).textContent;
}

function giveHeight(el: HTMLElement, height: number) {
    Object.defineProperty(el, "clientHeight", { configurable: true, value: height });
    act(() => ResizeObserverStub.trigger(el));
}

describe("ListsTopic", () => {
    describe("SearchField", () => {
        // Its readout is its own view boundary: rendered beside the field, every keystroke would
        // remount the input and drop its focus.
        it("tracks the raw text on every keystroke, keeping the same focused input", async () => {
            await mount(ListsTopic, { id: TOPIC });
            const input = byId("demoSearch").querySelector("input");

            await userEvent.type(input, "cedar");

            expect(searchReadout()).toBe("raw value: “cedar” · settled onSearch: “”");
            expect(byId("demoSearch").querySelector("input")).toBe(input);
            expect(input).toHaveFocus();
        });

        it("settles onSearch only once typing has paused", async () => {
            await mount(ListsTopic, { id: TOPIC });
            vi.useFakeTimers({ shouldAdvanceTime: true });
            const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

            await user.type(byId("demoSearch").querySelector("input"), "ridge");
            expect(searchReadout()).toBe("raw value: “ridge” · settled onSearch: “”");

            await act(async () => { await vi.advanceTimersByTimeAsync(300); });
            expect(searchReadout()).toBe("raw value: “ridge” · settled onSearch: “ridge”");
        });

        it("settles at once on Enter, and Escape clears both readouts", async () => {
            await mount(ListsTopic, { id: TOPIC });
            const input = byId("demoSearch").querySelector("input");

            await userEvent.type(input, "north{Enter}");
            expect(searchReadout()).toBe("raw value: “north” · settled onSearch: “north”");

            await userEvent.keyboard("{Escape}");
            expect(searchReadout()).toBe("raw value: “” · settled onSearch: “”");
        });
    });

    describe("VirtualList", () => {
        it("reports the slice of 50,000 rows that is in the DOM", async () => {
            await mount(ListsTopic, { id: TOPIC });
            const items = () => byId("bigList").querySelectorAll(".ueca-virtuallist-item");
            const total = (50000).toLocaleString();

            // No height yet: the first row plus the overscan.
            expect(rangeReadout()).toBe(`rows 1–7 of ${total} in the DOM (7 divs)`);
            expect(items()).toHaveLength(7);

            giveHeight(byId("bigList"), 280);
            await settle();

            expect(rangeReadout()).toBe(`rows 1–17 of ${total} in the DOM (17 divs)`);
            expect(items()).toHaveLength(17);
            expect(items()[0]).toHaveTextContent("#1Reading batch 1 — 0 samples");
        });

        it("jumps to row 25,000, centred in the list, and the readout follows", async () => {
            await mount(ListsTopic, { id: TOPIC });
            const list = byId("bigList");
            giveHeight(list, 280);

            await userEvent.click(screen.getByRole("button", { name: "Scroll to row 25,000" }));

            // Row 25,000 is index 24,999; centring puts its 28px box mid-way down the 280px viewport.
            expect(list.scrollTop).toBe(24999 * 28 - (280 - 28) / 2);
            expect(screen.getByText("#25000")).toBeInTheDocument();
            const [, first, last, divs] = rangeReadout().match(/^rows (\d+)–(\d+) of .* \((\d+) divs\)$/);
            expect(Number(first)).toBeLessThanOrEqual(25000);
            expect(Number(last)).toBeGreaterThanOrEqual(25000);
            expect(list.querySelectorAll(".ueca-virtuallist-item")).toHaveLength(Number(divs));
        });
    });

    describe("FilterableList", () => {
        function listSearch(): HTMLInputElement {
            return byId("instrumentList.searchField").querySelector("input");
        }

        it("starts with every instrument matching and nothing selected", async () => {
            await mount(ListsTopic, { id: TOPIC });

            expect(listReadout()).toBe(`selected: —  ·  matches: ${(5000).toLocaleString()}`);
            expect(listSearch()).toHaveAttribute("placeholder", "Filter 5,000 instruments…");
        });

        it("narrows the matches to the settled search", async () => {
            await mount(ListsTopic, { id: TOPIC });

            await userEvent.type(listSearch(), "TI-{Enter}");
            expect(listReadout()).toBe(`selected: —  ·  matches: ${(1250).toLocaleString()}`);

            await userEvent.clear(listSearch());
            await userEvent.type(listSearch(), "0001{Enter}");
            expect(listReadout()).toBe("selected: —  ·  matches: 1");
            const rows = screen.getAllByRole("option");
            expect(rows).toHaveLength(1);
            expect(rows[0]).toHaveTextContent("PI-0001Cedar Lake Dam");
        });

        it("reports the instrument a click selects", async () => {
            await mount(ListsTopic, { id: TOPIC });
            await userEvent.type(listSearch(), "IN-0002{Enter}");

            await userEvent.click(screen.getByRole("option"));

            expect(listReadout()).toBe("selected: IN-0002 — inclinometer at Portal West  ·  matches: 1");
            expect(screen.getByRole("option")).toHaveAttribute("aria-selected", "true");
        });

        // Its readout is its own boundary too: beside the list it would remount on every selection,
        // dropping the search field's focus and the list's scroll position.
        it("keeps the list's scroll position and the search field's focus when a row is selected", async () => {
            await mount(ListsTopic, { id: TOPIC });
            const input = listSearch();
            const viewport = byId("instrumentList.virtualList");
            giveHeight(viewport, 320);
            viewport.scrollTop = 300;
            fireEvent.scroll(viewport);
            await settle();
            input.focus();

            // Row 10 (index 9) sits wholly inside the scrolled viewport, so selecting it scrolls nothing.
            fireEvent.click(screen.getByText("IN-0010").closest("[role=option]"));
            await settle();

            expect(listReadout()).toMatch(/^selected: IN-0010 — inclinometer at Tailings Cell 2/);
            expect(byId("instrumentList.virtualList")).toBe(viewport);
            expect(viewport.scrollTop).toBe(300);
            expect(listSearch()).toBe(input);
            expect(input).toHaveFocus();
        });
    });
});
