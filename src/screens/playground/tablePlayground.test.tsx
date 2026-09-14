import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TablePlayground } from "@screens";
import { mount, settle, stubMessages } from "@test";

const SCREEN = "playground-table";

const INITIAL_LISTING = [
    "// Sorting and filtering are switched on per column:",
    `// { key: "customer", field: "customer",`,
    "//   sortable: true, filterable: true }",
    "children: {",
    "    orders: useTable<Order>({",
    "        rows: () => model.orders,",
    "        columns: () => model.orderColumns(),",
    `        rowKeyField: "id",`,
    "        selectable: true,",
    "        resizableColumns: true,",
    "        onSelectionChange: (row) => model.openOrder(row)",
    "    })",
    "}"
].join("\n");

async function mountPlayground() {
    const bus = await stubMessages({
        "App.BrowsingHistory.SetPageTitle": vi.fn(async () => { }),
        "App.Router.GoToRoute": vi.fn(async () => true)
    });
    const result = await mount(TablePlayground, { id: SCREEN });
    return { ...result, bus };
}

// Editors are children on the screen's model, so each has a DOM id under the screen's own.
function part(child: string): HTMLElement {
    const el = document.getElementById(`${SCREEN}.${child}`);
    expect(el, `#${SCREEN}.${child}`).not.toBeNull();
    return el;
}

function preview(): HTMLElement {
    return part("preview");
}

function bodyRows(): HTMLElement[] {
    return [...preview().querySelectorAll<HTMLElement>(".ueca-table-body-row")];
}

// #, Order, Customer, Status, Items, Total, Created
function cells(row: HTMLElement): string[] {
    return [...row.querySelectorAll("[role=gridcell]:not(.ueca-table-filler)")].map((cell) => cell.textContent);
}

function filterInputs(): HTMLInputElement[] {
    return [...preview().querySelectorAll<HTMLInputElement>(".ueca-table-filter-input")];
}

function listing(): string {
    return part("code").querySelector(".code-sample-body").textContent.trimEnd();
}

function listingLines(): string[] {
    return listing().split("\n").map((line) => line.trim());
}

function status(): string {
    return document.querySelector(".playground-stage-status")?.textContent;
}

async function choose(child: string, option: string) {
    await userEvent.click(part(`${child}-trigger`));
    await userEvent.click(within(part(`${child}-listbox`)).getByRole("option", { name: option }));
}

function switchOf(child: string): HTMLElement {
    return within(part(child)).getByRole("switch");
}

async function toggle(child: string) {
    await userEvent.click(switchOf(child));
}

describe("TablePlayground", () => {
    it("starts with 100 sortable, filterable, selectable orders", async () => {
        await mountPlayground();

        expect(bodyRows()).toHaveLength(100);
        expect(within(preview()).getByRole("columnheader", { name: "Order" })).toHaveAttribute("aria-sort", "none");
        expect(filterInputs()).toHaveLength(3);
        expect(preview().querySelector(".ueca-table-resize-handle")).not.toBeNull();
        expect(status()).toBe("100 rows · 0 selected");
    });

    it("lists the starting table with every prop at its default left out", async () => {
        const { model } = await mountPlayground();

        expect(model.code.code).toBe(INITIAL_LISTING);
        expect(listing()).toBe(INITIAL_LISTING);
    });

    it("titles the page from the Playground topic", async () => {
        const { bus } = await mountPlayground();

        expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Table");
        expect(bus["App.BrowsingHistory.SetPageTitle"]).toHaveBeenLastCalledWith("Table · Playground");
    });

    // Deterministic sample data — the table reads the same on every reload.
    it("draws the same sample orders every time", async () => {
        await mountPlayground();

        expect(bodyRows().slice(0, 5).map((row) => cells(row).slice(0, 6))).toEqual([
            ["1", "10001", "Northwind Traders", "paid", "1", "15.00"],
            ["2", "10002", "Wide World Importers", "paid", "8", "15.97"],
            ["3", "10003", "Fabrikam", "paid", "3", "16.94"],
            ["4", "10004", "Litware", "refunded", "10", "17.91"],
            ["5", "10005", "Tailspin Toys", "pending", "5", "18.88"]
        ]);
    });

    it("colours each status by its intent", async () => {
        await mountPlayground();

        const statusChip = (row: number) => bodyRows()[row].querySelector(".ueca-status-label");
        expect(statusChip(0)).toHaveClass("ueca-status-label-success", "ueca-status-label-soft");
        expect(statusChip(3)).toHaveClass("ueca-status-label-error");
        expect(statusChip(4)).toHaveClass("ueca-status-label-warning");
    });

    // The # column is computed from the displayed order, so it renumbers on sort.
    it("numbers the rows in displayed order after a sort", async () => {
        await mountPlayground();
        const orderHeader = within(preview()).getByRole("columnheader", { name: "Order" });

        await userEvent.click(orderHeader);
        await userEvent.click(orderHeader);

        expect(orderHeader).toHaveAttribute("aria-sort", "descending");
        expect(cells(bodyRows()[0]).slice(0, 2)).toEqual(["1", "10100"]);
    });

    // jsdom lays nothing out, so the room is worked out from the type: the table's 13px digits are
    // 7.8px wide, and a cell keeps 16px of padding on each side. At 64px row 10,000 read "1000".
    it("leaves the row-number column room for the largest row count", async () => {
        await mountPlayground();

        expect(parseFloat(preview().style.gridTemplateColumns)).toBeGreaterThanOrEqual(2 * 16 + String(10000).length * 7.8);
    });

    // Cached per size: rebuilding 10,000 rows on every render would be wasted work.
    it("reuses the orders it built for a row count it has shown before", async () => {
        const { model } = await mountPlayground();
        // The prop holds its own observable copy of the array, so identity is checked on the rows.
        const [first, , third] = model.preview.rows;

        await choose("rowCountInput", "10 rows");
        expect(model.preview.rows).toHaveLength(10);
        await choose("rowCountInput", "100 rows");

        expect(model.preview.rows[0]).toBe(first);
        expect(model.preview.rows[2]).toBe(third);
    });

    describe("row count", () => {
        it("changes the data set and the status line", async () => {
            await mountPlayground();

            await choose("rowCountInput", "10 rows");

            expect(bodyRows()).toHaveLength(10);
            expect(status()).toBe("10 rows · 0 selected");
        });

        // A fresh data set has none of the old keys, so a stale selection would linger.
        it("clears the selection", async () => {
            const { model } = await mountPlayground();
            await userEvent.click(bodyRows()[2]);
            expect(status()).toBe("100 rows · 1 selected");

            await choose("rowCountInput", "1,000 rows");

            expect(model.preview.selectedKey).toBeUndefined();
            expect(status()).toBe(`${(1000).toLocaleString()} rows · 0 selected`);
        });

        it("warns that a large non-virtualised table renders only its first 2,000 rows", async () => {
            await mountPlayground();
            await toggle("virtualizedInput");
            await choose("rowCountInput", "10,000 rows");
            const rows = (10000).toLocaleString();
            expect(status()).toBe(`${rows} rows · 0 selected`);

            await toggle("virtualizedInput");

            expect(status()).toBe(`${rows} rows · first ${(2000).toLocaleString()} rendered — turn on Virtualized · 0 selected`);
            expect(bodyRows()).toHaveLength(2000);
        }, 30000);
    });

    describe("columns", () => {
        // The table keeps applying a sort the columns no longer offer, so switching sorting off
        // has to clear it — or the rows would stay sorted with nothing left to undo it.
        it("switching sorting off clears the sort and the header controls", async () => {
            const { model } = await mountPlayground();
            const orderHeader = within(preview()).getByRole("columnheader", { name: "Order" });
            await userEvent.click(orderHeader);
            await userEvent.click(orderHeader);
            expect(cells(bodyRows()[0])[1]).toBe("10100");

            await toggle("sortableInput");

            expect(model.preview.sortKey).toBeUndefined();
            expect(model.preview.sortDirection).toBe("asc");
            expect(cells(bodyRows()[0])[1]).toBe("10001");
            expect(within(preview()).getByRole("columnheader", { name: "Order" })).not.toHaveAttribute("aria-sort");
        });

        // Same reasoning for filters: a narrowed table with no filter box left to explain it.
        it("switching filtering off clears the filters and removes the filter row", async () => {
            const { model } = await mountPlayground();
            await userEvent.type(filterInputs()[1], "Contoso");
            expect(status()).toBe("12 of 100 rows · 0 selected");

            await toggle("filterableInput");

            expect(model.preview.filters).toEqual({});
            expect(filterInputs()).toHaveLength(0);
            expect(status()).toBe("100 rows · 0 selected");
        });

        it.each([
            ["sortableInput", "//   filterable: true }"],
            ["filterableInput", "//   sortable: true }"]
        ])("switching %s off leaves only the other flag in the listing's column hint", async (child, hint) => {
            await mountPlayground();

            await toggle(child);

            expect(listing().split("\n")[2]).toBe(hint);
        });

        it("brings sorting, filtering and selection back, starting clean, when they are switched on again", async () => {
            await mountPlayground();
            const features = ["sortableInput", "filterableInput", "selectableInput"];
            for (const child of features) {
                await toggle(child);
            }

            for (const child of features) {
                await toggle(child);
            }

            expect(within(preview()).getByRole("columnheader", { name: "Order" })).toHaveAttribute("aria-sort", "none");
            expect(filterInputs().map((input) => input.value)).toEqual(["", "", ""]);
            expect(status()).toBe("100 rows · 0 selected");
            expect(listing()).toBe(INITIAL_LISTING);
        });

        it("drops the column hint from the listing when neither flag is on", async () => {
            await mountPlayground();

            await toggle("sortableInput");
            await toggle("filterableInput");

            expect(listing()).toMatch(/^children: \{\n/);
            expect(listing()).not.toContain("//");
        });

        it("switching resizing off removes the handles and the listing entry", async () => {
            await mountPlayground();

            await toggle("resizableInput");

            expect(preview().querySelector(".ueca-table-resize-handle")).toBeNull();
            expect(listing()).not.toContain("resizableColumns");
        });

        it("pins the first column and lists stickyFirstColumn", async () => {
            await mountPlayground();

            await toggle("stickyInput");

            expect(preview()).toHaveClass("sticky-first");
            expect(listingLines()).toContain("stickyFirstColumn: true,");
        });
    });

    describe("selection", () => {
        it("counts the selected rows in the status line", async () => {
            await mountPlayground();

            await userEvent.click(bodyRows()[0]);

            expect(bodyRows()[0]).toHaveAttribute("aria-selected", "true");
            expect(status()).toBe("100 rows · 1 selected");
        });

        it("switching selection off clears it, disables multi-select and drops it from the listing", async () => {
            const { model } = await mountPlayground();
            await userEvent.click(bodyRows()[0]);
            expect(switchOf("multiSelectInput")).toBeEnabled();

            await toggle("selectableInput");

            expect(model.preview.selectedKey).toBeUndefined();
            expect(status()).toBe("100 rows");
            expect(switchOf("multiSelectInput")).toBeDisabled();
            expect(listing()).not.toContain("selectable");
            expect(listing()).not.toContain("onSelectionChange");
        });

        it("multi-select applies only while rows are selectable", async () => {
            const { model } = await mountPlayground();

            await toggle("multiSelectInput");
            expect(model.preview.multiSelect).toBe(true);
            expect(listingLines()).toContain("multiSelect: true,");

            await toggle("selectableInput");
            expect(model.preview.multiSelect).toBe(false);
            expect(listing()).not.toContain("multiSelect");
        });

        it("counts every row picked with Ctrl+click under multi-select", async () => {
            await mountPlayground();
            await toggle("multiSelectInput");
            // One instance, so the held Control key applies to the clicks that follow.
            const user = userEvent.setup();

            await user.click(bodyRows()[0]);
            await user.keyboard("{Control>}");
            await user.click(bodyRows()[1]);
            await user.click(bodyRows()[2]);
            await user.keyboard("{/Control}");

            expect(status()).toBe("100 rows · 3 selected");
        });
    });

    it("lists virtualized and renders a windowed table when it is switched on", async () => {
        await mountPlayground();

        await toggle("virtualizedInput");

        expect(preview()).toHaveClass("virtualized");
        expect(bodyRows().length).toBeLessThan(100);
        expect(listingLines()).toContain("virtualized: true,");
    });

    it("Reset restores the starting table and clears its sort, filters, selection and column widths", async () => {
        const { model } = await mountPlayground();
        await userEvent.click(within(preview()).getByRole("columnheader", { name: "Customer" }));
        await userEvent.type(filterInputs()[0], "1");
        await userEvent.click(bodyRows()[0]);
        await toggle("stickyInput");
        await toggle("virtualizedInput");
        await choose("rowCountInput", "1,000 rows");
        model.preview._columnWidths = { customer: 320 };
        await settle();

        await userEvent.click(part("resetButton"));

        expect(model.preview.sortKey).toBeUndefined();
        expect(model.preview.filters).toEqual({});
        expect(model.preview.selectedKey).toBeUndefined();
        expect(model.preview._columnWidths).toEqual({});
        expect(switchOf("stickyInput")).not.toBeChecked();
        expect(part("rowCountInput-trigger")).toHaveTextContent("100 rows");
        expect(bodyRows()).toHaveLength(100);
        expect(status()).toBe("100 rows · 0 selected");
        expect(listing()).toBe(INITIAL_LISTING);
    });

    it("links back to the Text field page, with no page after it", async () => {
        const { bus } = await mountPlayground();
        const pager = screen.getByRole("navigation", { name: "Playground pages" });

        const links = within(pager).getAllByRole("button");
        expect(links).toHaveLength(1);
        expect(links[0]).toHaveTextContent("Previous");

        await userEvent.click(links[0]);

        expect(bus["App.Router.GoToRoute"]).toHaveBeenCalledWith({ path: "/playground/text-field" });
    });
});
