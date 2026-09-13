import { describe, expect, it, vi } from "vitest";
import type { TableColumn, TableModel } from "@components";
import { derive, hasFilterRow, headerHeight, rowKeyOf, stableColumns, updateWindow } from "./tableDerive";
import { HEADER_ROW_HEIGHT } from "./tableTypes";

type Item = { id?: string | number; name?: string; group?: string; qty?: number; active?: boolean };

// The derivation functions are stateless over a model-shaped object: the props they read, plus the
// __derived memo and the root ref they write.
function tableModel(overrides: Record<string, unknown> = {}): TableModel<Item> {
    return {
        rows: [],
        columns: [],
        filters: {},
        rowKeyField: undefined,
        sortKey: undefined,
        sortDirection: "asc",
        onSortCompare: undefined,
        virtualized: true,
        rowHeight: 40,
        overscan: 6,
        _winStart: 0,
        _winEnd: 0,
        __rootRef: { current: null },
        __derived: { rows: undefined, filters: undefined, sig: undefined, filtered: undefined, sorted: undefined, columns: undefined, viewportH: 0 },
        ...overrides
    } as unknown as TableModel<Item>;
}

const nameColumn: TableColumn<Item> = { key: "name", titleView: "Name", field: "name", sortable: true, filterable: true };
const qtyColumn: TableColumn<Item> = { key: "qty", titleView: "Qty", field: "qty", dataType: "number", sortable: true };

function names(items: Item[]) {
    return items.map((item) => item.name);
}

describe("hasFilterRow and headerHeight", () => {
    it("has a filter row only when some column is filterable", () => {
        expect(hasFilterRow(tableModel({ columns: undefined }))).toBe(false);
        expect(hasFilterRow(tableModel({ columns: [qtyColumn] }))).toBe(false);
        expect(hasFilterRow(tableModel({ columns: [qtyColumn, nameColumn] }))).toBe(true);
    });

    it("counts the filter row into the header the rows scroll under", () => {
        expect(headerHeight(tableModel({ columns: [qtyColumn] }))).toBe(HEADER_ROW_HEIGHT);
        expect(headerHeight(tableModel({ columns: [nameColumn] }))).toBe(2 * HEADER_ROW_HEIGHT);
    });
});

describe("rowKeyOf", () => {
    it("uses the rowKeyField value, as a string", () => {
        expect(rowKeyOf(tableModel({ rowKeyField: "id" }), { id: 42 }, 7)).toBe("42");
    });

    it("keeps a falsy but present key rather than falling back to the index", () => {
        expect(rowKeyOf(tableModel({ rowKeyField: "id" }), { id: 0 }, 7)).toBe("0");
    });

    it("falls back to the row index without a rowKeyField, or when the row has no value in it", () => {
        expect(rowKeyOf(tableModel(), { id: "x" }, 3)).toBe("3");
        expect(rowKeyOf(tableModel({ rowKeyField: "id" }), { id: null }, 3)).toBe("3");
        expect(rowKeyOf(tableModel({ rowKeyField: "id" }), {}, 3)).toBe("3");
    });
});

describe("derive", () => {
    describe("filtering", () => {
        const rows: Item[] = [
            { name: "Alpha", group: "north", qty: 2.5, active: true },
            { name: "alpine", group: "south", qty: 10, active: false },
            { name: "Beta", group: "north", qty: 3, active: true }
        ];
        const columns: TableColumn<Item>[] = [
            nameColumn,
            { key: "group", titleView: "Group", field: "group", filterable: true },
            { key: "qty", titleView: "Qty", field: "qty", dataType: "number", decimals: 2, filterable: true },
            { key: "active", titleView: "Active", field: "active", dataType: "boolean", filterable: true }
        ];

        it("passes the rows through untouched without an active filter", () => {
            const model = tableModel({ rows, columns });

            const { filtered, sorted } = derive(model);

            expect(filtered).toBe(rows);
            expect(sorted).toBe(rows);
        });

        it("ignores blank and whitespace-only filter text", () => {
            const model = tableModel({ rows, columns, filters: { name: "", group: "   " } });

            expect(derive(model).filtered).toBe(rows);
        });

        it("matches a trimmed, case-insensitive substring of the cell text", () => {
            const model = tableModel({ rows, columns, filters: { name: "  ALP " } });

            expect(names(derive(model).filtered)).toEqual(["Alpha", "alpine"]);
        });

        it("matches the formatted text the cell shows, not the raw value", () => {
            expect(names(derive(tableModel({ rows, columns, filters: { active: "yes" } })).filtered)).toEqual(["Alpha", "Beta"]);
            expect(names(derive(tableModel({ rows, columns, filters: { qty: "2.50" } })).filtered)).toEqual(["Alpha"]);
        });

        it("requires every active filter to match", () => {
            const model = tableModel({ rows, columns, filters: { name: "a", group: "north" } });

            expect(names(derive(model).filtered)).toEqual(["Alpha", "Beta"]);
            model.filters = { name: "a", group: "north", active: "no" };
            expect(names(derive(model).filtered)).toEqual([]);
        });

        it("lets a column's onFilter decide, handing it the row and the filter text as typed", () => {
            const onFilter = vi.fn((row: Item) => row.qty > 2.5);
            const model = tableModel({ rows, columns: [{ ...nameColumn, onFilter }], filters: { name: " x " } });

            expect(names(derive(model).filtered)).toEqual(["alpine", "Beta"]);
            expect(onFilter).toHaveBeenCalledWith(rows[0], " x ");
        });

        it("ignores a filter whose key names no column", () => {
            const model = tableModel({ rows, columns, filters: { removed: "zzz" } });

            expect(derive(model).filtered).toHaveLength(3);
        });

        // "A cellView column has no derivable text — give it `onFilter`."
        it("matches nothing through a computed column that has no onFilter", () => {
            const model = tableModel({ rows, columns: [{ key: "computed", titleView: "#", filterable: true }], filters: { computed: "1" } });

            expect(derive(model).filtered).toEqual([]);
        });
    });

    describe("sorting", () => {
        const rows: Item[] = [
            { id: 1, name: "Cedar", group: "b", qty: 3 },
            { id: 2, name: "alder", group: "a", qty: null },
            { id: 3, name: "Birch", group: "b", qty: 1 },
            { id: 4, name: "Aspen", group: "a", qty: 2 }
        ];
        const groupColumn: TableColumn<Item> = { key: "group", titleView: "Group", field: "group", sortable: true };

        function sortedNames(overrides: Record<string, unknown>) {
            return names(derive(tableModel({ rows, columns: [nameColumn, qtyColumn, groupColumn], ...overrides })).sorted);
        }

        it("keeps the filtered order without a sort key, or with one that names no column", () => {
            const model = tableModel({ rows, columns: [nameColumn], sortKey: "missing" });
            const { filtered, sorted } = derive(model);

            expect(sorted).toBe(filtered);
            expect(names(derive(tableModel({ rows, columns: [nameColumn] })).sorted)).toEqual(names(rows));
        });

        it("sorts by the column's field in either direction", () => {
            expect(sortedNames({ sortKey: "name" })).toEqual(["alder", "Aspen", "Birch", "Cedar"]);
            expect(sortedNames({ sortKey: "name", sortDirection: "desc" })).toEqual(["Cedar", "Birch", "Aspen", "alder"]);
        });

        it("sorts a copy and leaves the caller's array in its own order", () => {
            const original = [...rows];

            sortedNames({ sortKey: "name" });

            expect(rows).toEqual(original);
        });

        it("keeps rows with equal values in their original order, in both directions", () => {
            expect(sortedNames({ sortKey: "group" })).toEqual(["alder", "Aspen", "Cedar", "Birch"]);
            expect(sortedNames({ sortKey: "group", sortDirection: "desc" })).toEqual(["Cedar", "Birch", "alder", "Aspen"]);
        });

        // compareValues puts empty values last ASCENDING; the direction flips that like any other order.
        it("puts empty values last ascending and first descending", () => {
            expect(sortedNames({ sortKey: "qty" })).toEqual(["Birch", "Aspen", "Cedar", "alder"]);
            expect(sortedNames({ sortKey: "qty", sortDirection: "desc" })).toEqual(["alder", "Cedar", "Aspen", "Birch"]);
        });

        it("leaves the order alone for a computed column with nothing to compare", () => {
            const model = tableModel({ rows, columns: [{ key: "rowNumber", titleView: "#", sortable: true }], sortKey: "rowNumber", sortDirection: "desc" });

            expect(names(derive(model).sorted)).toEqual(names(rows));
        });

        it("uses a column's own comparator instead of its field, with the direction applied on top", () => {
            const byIdDescending = (a: Item, b: Item) => (b.id as number) - (a.id as number);
            const columns = [{ ...nameColumn, onSortCompare: byIdDescending }];

            expect(names(derive(tableModel({ rows, columns, sortKey: "name" })).sorted)).toEqual(["Aspen", "Birch", "alder", "Cedar"]);
            expect(names(derive(tableModel({ rows, columns, sortKey: "name", sortDirection: "desc" })).sorted)).toEqual(["Cedar", "alder", "Birch", "Aspen"]);
        });

        it("consults the table-wide comparator before the column's own, passing it the sorted column", () => {
            const columnCompare = vi.fn(() => 0);
            const tableCompare = vi.fn((a: Item, b: Item) => (a.id as number) - (b.id as number));
            const byName = { ...nameColumn, onSortCompare: columnCompare };
            const model = tableModel({ rows: [...rows].reverse(), columns: [byName], sortKey: "name", onSortCompare: tableCompare });

            expect(names(derive(model).sorted)).toEqual(names(rows));
            expect(tableCompare).toHaveBeenCalledWith(expect.anything(), expect.anything(), byName);
            expect(columnCompare).not.toHaveBeenCalled();
        });
    });

    describe("memo", () => {
        const rows: Item[] = [{ name: "b", qty: 2 }, { name: "a", qty: 1 }, { name: "c", qty: 3 }];

        // Spies on the per-row work, so a test can tell a recomputation from a cache hit.
        function memoModel(overrides: Record<string, unknown> = {}) {
            const onFilter = vi.fn(() => true);
            const onSortCompare = vi.fn((a: Item, b: Item) => a.qty - b.qty);
            const columns = [{ ...nameColumn, onFilter }, { ...qtyColumn, onSortCompare }];
            const model = tableModel({ rows, columns, filters: { name: "x" }, sortKey: "qty", ...overrides });
            const work = () => onFilter.mock.calls.length + onSortCompare.mock.calls.length;
            return { model, work };
        }

        it("skips the filter scan and the sort while nothing it depends on changed", () => {
            const { model, work } = memoModel();
            const first = derive(model);
            const done = work();

            const again = derive(model);

            expect(work()).toBe(done);
            expect(again.sorted).toBe(first.sorted);
            expect(again.filtered).toBe(first.filtered);
        });

        it.each([
            ["the rows are reassigned", (m: TableModel<Item>) => { m.rows = [...m.rows]; }],
            ["the filters are reassigned", (m: TableModel<Item>) => { m.filters = { name: "y" }; }],
            ["the sort key changes", (m: TableModel<Item>) => { m.sortKey = "name"; }],
            ["the sort direction changes", (m: TableModel<Item>) => { m.sortDirection = "desc"; }],
            ["the column keys change", (m: TableModel<Item>) => { m.columns = [...m.columns, { key: "extra", titleView: "Extra" }]; }]
        ])("recomputes when %s", (_, change) => {
            const { model, work } = memoModel();
            derive(model);
            const done = work();

            change(model);
            derive(model);

            expect(work()).toBeGreaterThan(done);
        });

        // A caller thunk may rebuild the column array on every read; only the keys count.
        it("keeps the cache when only the column array's identity changes", () => {
            const { model, work } = memoModel();
            derive(model);
            const done = work();

            model.columns = [...model.columns];
            derive(model);

            expect(work()).toBe(done);
        });

        // Cache identity is the rows REFERENCE: the table's rows are reassigned whole, never mutated.
        it("does not see a row pushed into the same array", () => {
            // Sorted, so the derived set is a copy rather than the rows array itself.
            const model = tableModel({ rows: [...rows], columns: [qtyColumn], sortKey: "qty" });
            derive(model);

            model.rows.push({ name: "d", qty: 4 });

            expect(derive(model).sorted).toHaveLength(3);
        });
    });
});

describe("stableColumns", () => {
    it("hands out the same array while the column keys stay the same", () => {
        const model = tableModel({ columns: [nameColumn, qtyColumn] });
        const first = stableColumns(model);

        model.columns = [nameColumn, qtyColumn];

        expect(stableColumns(model)).toBe(first);
    });

    it("hands out the new array once the keys change", () => {
        const model = tableModel({ columns: [nameColumn, qtyColumn] });
        stableColumns(model);
        const reordered = [qtyColumn, nameColumn];

        model.columns = reordered;

        expect(stableColumns(model)).toBe(reordered);
    });

    // The documented trade-off (tableDerive.ts): columns are configuration, not data.
    it("does not pick up a column edited under an unchanged key", () => {
        const model = tableModel({ columns: [nameColumn] });
        stableColumns(model);

        model.columns = [{ ...nameColumn, align: "right" }];

        expect(stableColumns(model)[0].align).toBeUndefined();
    });

    it("is an empty array for a table without columns", () => {
        expect(stableColumns(tableModel({ columns: undefined }))).toEqual([]);
    });
});

describe("updateWindow", () => {
    function scroller(scrollTop: number, clientHeight = 400) {
        const el = document.createElement("div");
        Object.defineProperty(el, "clientHeight", { configurable: true, value: clientHeight });
        el.scrollTop = scrollTop;
        return el;
    }

    function windowAt(scrollTop: number, overrides: Record<string, unknown> = {}) {
        const model = tableModel({ __rootRef: { current: scroller(scrollTop) }, ...overrides });
        updateWindow(model);
        return [model._winStart, model._winEnd];
    }

    it("does nothing without a rendered element, or when the table is not virtualized", () => {
        const detached = tableModel({ _winStart: 5, _winEnd: 9 });
        updateWindow(detached);
        expect([detached._winStart, detached._winEnd]).toEqual([5, 9]);

        const flat = tableModel({ virtualized: false, _winStart: 5, _winEnd: 9, __rootRef: { current: scroller(4000) } });
        updateWindow(flat);
        expect([flat._winStart, flat._winEnd]).toEqual([5, 9]);
    });

    // 400px viewport − 40px header = 9 rows, +1 for the partly visible one; the end adds 3 quanta of 6.
    it.each([
        [0, 0, 28],
        [479, 0, 28],
        [480, 6, 34],
        [719, 6, 34],
        [720, 12, 40],
        [4000, 90, 118]
    ])("at scrollTop %i renders rows %i to %i, moving once per overscan rows of travel", (scrollTop, start, end) => {
        expect(windowAt(scrollTop)).toEqual([start, end]);
    });

    it("sizes the window to the viewport below the header and filter rows", () => {
        expect(windowAt(0, { __rootRef: { current: scroller(0, 1000) } })).toEqual([0, 25 + 18]);
        // A filter row takes another header's height off the viewport.
        expect(windowAt(0, { columns: [nameColumn] })).toEqual([0, 9 + 18]);
    });

    it("follows the row height", () => {
        // 360px of body at 20px = 18 rows, +1; first visible row 30, snapped back to 24.
        expect(windowAt(600, { rowHeight: 20 })).toEqual([24, 24 + 19 + 18]);
    });

    it("treats an overscan below 1 as 1", () => {
        expect(windowAt(400, { overscan: 0 })).toEqual([9, 9 + 10 + 3]);
    });

    // clientHeight forces a synchronous layout when read mid-scroll; the ResizeObserver caches it.
    it("uses the cached viewport height without reading clientHeight", () => {
        const el = document.createElement("div");
        const clientHeight = vi.fn(() => 400);
        Object.defineProperty(el, "clientHeight", { configurable: true, get: clientHeight });
        const model = tableModel({ __rootRef: { current: el } });
        model.__derived.viewportH = 800;

        updateWindow(model);

        expect(clientHeight).not.toHaveBeenCalled();
        expect(model._winEnd).toBe(19 + 1 + 18);
    });

    it("falls back to clientHeight while no viewport height is cached", () => {
        expect(windowAt(0, { __rootRef: { current: scroller(0, 800) } })).toEqual([0, 19 + 1 + 18]);
    });

    it("always contains every row the viewport shows, at any scroll offset", () => {
        const el = scroller(0, 530);
        const model = tableModel({ rowHeight: 37, overscan: 5, columns: [nameColumn], __rootRef: { current: el } });
        const bodyHeight = 530 - 2 * HEADER_ROW_HEIGHT;

        for (let scrollTop = 0; scrollTop <= 20000; scrollTop += 13) {
            el.scrollTop = scrollTop;
            updateWindow(model);

            const firstVisible = Math.floor(scrollTop / 37);
            const lastVisible = Math.ceil((scrollTop + bodyHeight) / 37) - 1;
            expect(model._winStart).toBeLessThanOrEqual(firstVisible);
            expect(model._winEnd).toBeGreaterThan(lastVisible);
        }
    });

    // The body re-renders from _winStart/_winEnd, so a write per scroll event would re-render it
    // per scroll event — the flicker the quantized window replaced.
    it("writes the window only when it moves", () => {
        const el = scroller(0);
        const model = tableModel({ __rootRef: { current: el } });
        const writes: string[] = [];
        let start = 0;
        let end = 0;
        Object.defineProperty(model, "_winStart", { get: () => start, set: (v: number) => { writes.push(`start ${v}`); start = v; } });
        Object.defineProperty(model, "_winEnd", { get: () => end, set: (v: number) => { writes.push(`end ${v}`); end = v; } });

        updateWindow(model);
        expect(writes).toEqual(["start 0", "end 28"]);

        for (const scrollTop of [40, 200, 479]) {
            el.scrollTop = scrollTop;
            updateWindow(model);
        }
        expect(writes).toHaveLength(2);

        el.scrollTop = 480;
        updateWindow(model);
        expect(writes).toEqual(["start 0", "end 28", "start 6", "end 34"]);
    });
});
