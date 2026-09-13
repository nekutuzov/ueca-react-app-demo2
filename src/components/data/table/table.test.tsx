import * as UECA from "ueca-react";
import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Icon, Table, TableColumn, TableParams } from "@components";
import { IconName, resolvePaletteColor } from "@core";
import { mount, ResizeObserverStub, settle, stubMessages } from "@test";

type Site = { id: string; name: string; status: string; qty: number };

const SITES: Site[] = [
    { id: "s0", name: "Cedar", status: "online", qty: 5 },
    { id: "s1", name: "Alder", status: "offline", qty: 3 },
    { id: "s2", name: "Birch", status: "online", qty: 9 }
];

const nameColumn: TableColumn<Site> = { key: "name", titleView: "Name", field: "name", sortable: true, filterable: true };
const statusColumn: TableColumn<Site> = { key: "status", titleView: "Status", field: "status" };
const qtyColumn: TableColumn<Site> = { key: "qty", titleView: "Qty", field: "qty", dataType: "number", sortable: true };
const COLUMNS = [nameColumn, statusColumn, qtyColumn];

function sites(count: number): Site[] {
    return Array.from({ length: count }, (_, i) => ({ id: `s${i}`, name: `Site ${i}`, status: i % 2 ? "offline" : "online", qty: i }));
}

// getFC erases the row type parameter; restore it so mount() hands back a TableModel<Site>.
const SiteTable = Table as unknown as (params: TableParams<Site>) => UECA.ReactElement;

function mountTable(params: TableParams<Site> = {}) {
    return mount(SiteTable, { id: "sites", rows: SITES, columns: COLUMNS, rowKeyField: "id", ...params });
}

function grid() {
    return screen.getByRole("grid");
}

function bodyRows() {
    return Array.from(document.querySelectorAll<HTMLElement>(".ueca-table-body-row"));
}

function rowKeys() {
    return bodyRows().map((row) => row.dataset.rowkey);
}

function rowOf(key: string) {
    return document.querySelector<HTMLElement>(`.ueca-table-body-row[data-rowkey="${key}"]`);
}

function cellsOf(key: string) {
    return within(rowOf(key)).getAllByRole("gridcell");
}

function header(name: string) {
    return screen.getByRole("columnheader", { name });
}

function footer() {
    return document.querySelector<HTMLElement>(".ueca-table-footer");
}

function spacerHeights() {
    return Array.from(document.querySelectorAll<HTMLElement>(".ueca-table-spacer")).map((spacer) => spacer.style.height);
}

function selectionFlags() {
    return bodyRows().map((row) => row.getAttribute("aria-selected"));
}

// A column whose cellView counts renders per row — the visible trace of the memoized row view
// rendering, or bailing out.
function countingColumn(renders: Map<string, number>): TableColumn<Site> {
    return {
        key: "name",
        titleView: "Name",
        field: "name",
        cellView: (cell) => {
            renders.set(cell.row.id, (renders.get(cell.row.id) ?? 0) + 1);
            return cell.row.name;
        }
    };
}

// The markup Icon draws for a role, to tell which glyph a header shows.
function glyph(name: IconName) {
    const { container, unmount } = render(<Icon name={name} />);
    const markup = container.querySelector(".ueca-icon").innerHTML;
    unmount();
    return markup;
}

describe("Table", () => {
    describe("rendering", () => {
        it("renders a grid of column headers and a row of cells per record", async () => {
            await mountTable();

            expect(grid()).toHaveAttribute("id", "sites");
            expect(screen.getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Name", "Status", "Qty"]);
            expect(rowKeys()).toEqual(["s0", "s1", "s2"]);
            expect(cellsOf("s1").map((cell) => cell.textContent)).toEqual(["Alder", "offline", "3"]);
        });

        it("keys the rows by position when there is no rowKeyField", async () => {
            await mountTable({ rowKeyField: undefined });

            expect(rowKeys()).toEqual(["0", "1", "2"]);
        });

        it("lays the columns out from their authored widths, then a filler track", async () => {
            await mountTable({
                columns: [
                    { key: "a", titleView: "A" },
                    { key: "b", titleView: "B", width: 120 },
                    { key: "c", titleView: "C", width: "2fr" },
                    { key: "d", titleView: "D", width: { min: 80, max: "1fr" } },
                    { key: "e", titleView: "E", width: { max: 200 } },
                    { key: "f", titleView: "F", width: {} }
                ]
            });

            expect(grid().style.gridTemplateColumns).toBe(
                "auto 120px 2fr minmax(80px, 1fr) minmax(auto, 200px) minmax(auto, auto) var(--table-filler-track, 1fr)"
            );
        });

        it("aligns header and body cells by data type, unless the column says otherwise", async () => {
            await mountTable({ columns: [nameColumn, { ...statusColumn, align: "center" }, qtyColumn] });

            expect(header("Name")).toHaveClass("align-left");
            expect(header("Status")).toHaveClass("align-center");
            expect(header("Qty")).toHaveClass("align-right");
            expect(cellsOf("s0")[0]).toHaveClass("align-left");
            expect(cellsOf("s0")[1]).toHaveClass("align-center");
            expect(cellsOf("s0")[2]).toHaveClass("align-right");
        });

        it("pins the first column's header, filter and body cells when stickyFirstColumn is on", async () => {
            const { model } = await mountTable();
            const firstColumnCells = () => [header("Name"), document.querySelector(".ueca-table-filter-cell"), cellsOf("s0")[0], cellsOf("s2")[0]];
            expect(grid()).not.toHaveClass("sticky-first");
            firstColumnCells().forEach((cell) => expect(cell).not.toHaveClass("col-sticky"));

            model.stickyFirstColumn = true;
            await settle();

            expect(grid()).toHaveClass("sticky-first");
            firstColumnCells().forEach((cell) => expect(cell).toHaveClass("col-sticky", "col-sticky-first"));
            expect(header("Status")).not.toHaveClass("col-sticky");
            expect(cellsOf("s0")[1]).not.toHaveClass("col-sticky");
        });

        it("hands the row height to the cells as --table-row-h", async () => {
            const { model } = await mountTable();
            expect(grid().style.getPropertyValue("--table-row-h")).toBe("40px");

            model.rowHeight = 28;
            await settle();

            expect(grid().style.getPropertyValue("--table-row-h")).toBe("28px");
        });

        it("keeps its headers and shows the empty view when there are no rows", async () => {
            const { model } = await mountTable({ rows: [] });

            expect(screen.getAllByRole("columnheader")).toHaveLength(3);
            expect(bodyRows()).toHaveLength(0);
            expect(document.querySelector(".ueca-table-empty")).toHaveTextContent("No rows to show");

            model.emptyView = "No sites match the current filter";
            await settle();

            expect(document.querySelector(".ueca-table-empty")).toHaveTextContent("No sites match the current filter");
        });

        it("numbers a computed column in the displayed order", async () => {
            await mountTable({
                columns: [{ key: "number", titleView: "#", cellView: (cell) => `#${cell.rowNumber}` }, nameColumn],
                sortKey: "name"
            });

            expect(rowKeys()).toEqual(["s1", "s2", "s0"]);
            expect(bodyRows().map((row) => within(row).getAllByRole("gridcell")[0].textContent)).toEqual(["#1", "#2", "#3"]);
        });
    });

    describe("row actions", () => {
        const actionColumn: TableColumn<Site> = { ...nameColumn, actionView: (cell) => <button>Edit {cell.row.name}</button> };

        it("renders the actions of the hovered row alone", async () => {
            await mountTable({ columns: [actionColumn, qtyColumn] });
            expect(screen.queryAllByRole("button")).toHaveLength(0);

            fireEvent.mouseEnter(rowOf("s1"));
            await settle();
            expect(screen.getAllByRole("button").map((button) => button.textContent)).toEqual(["Edit Alder"]);
            expect(within(rowOf("s1")).getByRole("button")).toBeInTheDocument();

            fireEvent.mouseLeave(rowOf("s1"));
            await settle();
            expect(screen.queryAllByRole("button")).toHaveLength(0);
        });

        // So a row reached by the arrow keys shows its actions and they can be tabbed into.
        it("shows the current row's actions when nothing is hovered, and a hovered row's over them", async () => {
            const { model } = await mountTable({ columns: [actionColumn], selectable: true, selectedKey: "s2" });
            expect(screen.getByRole("button")).toHaveTextContent("Edit Birch");
            expect(model.activeRow()).toBe(SITES[2]);

            fireEvent.mouseEnter(rowOf("s0"));
            await settle();

            expect(screen.getByRole("button")).toHaveTextContent("Edit Cedar");
            expect(model.activeRowKey()).toBe("s0");
        });

        it("has no current row to show actions for when rows are not selectable", async () => {
            const { model } = await mountTable({ columns: [actionColumn], selectedKey: "s2" });

            expect(screen.queryByRole("button")).toBeNull();
            expect(model.activeRowKey()).toBeUndefined();
            expect(model.activeRow()).toBeUndefined();
        });

        it("hands actionView the cell of its own row", async () => {
            const actionView = vi.fn(() => null);
            await mountTable({ columns: [nameColumn, { ...qtyColumn, actionView }], selectable: true, selectedKey: "s1" });

            expect(actionView).toHaveBeenCalledWith({ column: expect.objectContaining({ key: "qty" }), row: SITES[1], rowIndex: 1, rowNumber: 2 });
        });

        // Leaving row A for row B fires A's mouseleave AFTER B's mouseenter.
        it("keeps the new row's hover when the old row's leave arrives late", async () => {
            const { model } = await mountTable({ columns: [actionColumn] });

            fireEvent.mouseEnter(rowOf("s0"));
            fireEvent.mouseEnter(rowOf("s1"));
            fireEvent.mouseLeave(rowOf("s0"));
            await settle();

            expect(model.activeRowKey()).toBe("s1");
            expect(screen.getByRole("button")).toHaveTextContent("Edit Alder");
        });

        // A row action that navigates away unmounts the row before its mouseleave fires; the model
        // is cached, so it would come back with actions on a row the pointer is nowhere near.
        it("forgets the hovered row when it unmounts", async () => {
            const { model, unmount } = await mountTable({ columns: [actionColumn] });
            fireEvent.mouseEnter(rowOf("s1"));
            await settle();

            unmount();
            await settle();

            expect(model.activeRowKey()).toBeUndefined();
        });
    });

    describe("sorting", () => {
        it("sorts ascending on a header click, descending on the next and ascending again after that", async () => {
            const onSortChange = vi.fn();
            const { model } = await mountTable({ onSortChange });

            await userEvent.click(header("Name"));
            expect(rowKeys()).toEqual(["s1", "s2", "s0"]);
            expect(header("Name")).toHaveAttribute("aria-sort", "ascending");
            expect(onSortChange).toHaveBeenLastCalledWith("name", "asc", model);

            await userEvent.click(header("Name"));
            expect(rowKeys()).toEqual(["s0", "s2", "s1"]);
            expect(header("Name")).toHaveAttribute("aria-sort", "descending");
            expect(onSortChange).toHaveBeenLastCalledWith("name", "desc", model);

            // There is no unsorted state to return to.
            await userEvent.click(header("Name"));
            expect(rowKeys()).toEqual(["s1", "s2", "s0"]);
            expect(onSortChange).toHaveBeenLastCalledWith("name", "asc", model);
        });

        it("starts another column ascending, whichever way the previous one was sorted", async () => {
            const { model } = await mountTable({ sortKey: "name", sortDirection: "desc" });

            await userEvent.click(header("Qty"));

            expect([model.sortKey, model.sortDirection]).toEqual(["qty", "asc"]);
            expect(rowKeys()).toEqual(["s1", "s0", "s2"]);
            expect(header("Name")).toHaveAttribute("aria-sort", "none");
            expect(header("Qty")).toHaveAttribute("aria-sort", "ascending");
        });

        it("ignores a click on a header that is not sortable", async () => {
            const onSortChange = vi.fn();
            const { model } = await mountTable({ onSortChange });

            await userEvent.click(header("Status"));

            expect(onSortChange).not.toHaveBeenCalled();
            expect(model.sortKey).toBeUndefined();
            expect(rowKeys()).toEqual(["s0", "s1", "s2"]);
            expect(header("Status")).not.toHaveAttribute("aria-sort");
            expect(header("Status")).not.toHaveClass("sortable");
        });

        it("points the sorted column's icon the way it sorts and dims the others", async () => {
            const { model } = await mountTable({ sortKey: "qty" });
            const icon = (name: string) => header(name).querySelector<HTMLElement>(".ueca-icon");

            expect(icon("Qty").innerHTML).toBe(glyph("chevronUp"));
            expect(icon("Qty").style.color).toBe(resolvePaletteColor("primary.main"));
            expect(icon("Name").innerHTML).toBe(glyph("sort"));
            expect(icon("Name").style.color).toBe(resolvePaletteColor("text.disabled"));
            expect(icon("Status")).toBeNull();

            model.sortDirection = "desc";
            await settle();

            expect(icon("Qty").innerHTML).toBe(glyph("chevronDown"));
        });

        it("keeps the selection on the same record when rows are keyed by field", async () => {
            const { model } = await mountTable({ selectable: true, selectedKey: "s0" });

            await userEvent.click(header("Qty"));

            expect(rowOf("s0")).toHaveAttribute("aria-selected", "true");
            expect(model.selectedRows()).toEqual([SITES[0]]);
        });
    });

    describe("filter row", () => {
        it("adds a filter input under each filterable column", async () => {
            await mountTable();

            const filterCells = document.querySelectorAll<HTMLElement>(".ueca-table-filter-cell:not(.ueca-table-filler)");
            expect(filterCells).toHaveLength(3);
            expect(within(filterCells[0]).getByPlaceholderText("Filter")).toBeInTheDocument();
            expect(filterCells[1]).toBeEmptyDOMElement();
            expect(filterCells[2]).toBeEmptyDOMElement();
        });

        it("has no filter row when no column is filterable", async () => {
            await mountTable({ columns: [statusColumn, qtyColumn] });

            expect(document.querySelector(".ueca-table-filter-row")).toBeNull();
        });

        it("narrows the rows as the user types, and says so in the footer", async () => {
            await mountTable();

            await userEvent.type(screen.getByPlaceholderText("Filter"), "E");

            expect(rowKeys()).toEqual(["s0", "s1"]);
            expect(footer()).toHaveTextContent("Showing 2 of 3 rows (filtered)");
            expect(footer()).not.toHaveClass("capped");
        });

        it("shows the model's filter text, so a screen can preseed or clear it", async () => {
            const { model } = await mountTable({ filters: { name: "bir" } });
            expect(screen.getByPlaceholderText("Filter")).toHaveValue("bir");
            expect(rowKeys()).toEqual(["s2"]);

            model.filters = {};
            await settle();

            expect(screen.getByPlaceholderText("Filter")).toHaveValue("");
            expect(rowKeys()).toEqual(["s0", "s1", "s2"]);
            expect(footer()).toBeNull();
        });

        it("clears the filter on Escape", async () => {
            const { model } = await mountTable();
            const input = screen.getByPlaceholderText("Filter");
            await userEvent.type(input, "bir");

            await userEvent.type(input, "{Escape}");

            expect(input).toHaveValue("");
            expect(model.filters).toEqual({ name: "" });
            expect(rowKeys()).toHaveLength(3);
        });

        it("keeps the keys typed into a filter inside the filter", async () => {
            const outside = vi.fn();
            document.body.addEventListener("keydown", outside);
            try {
                const { model } = await mountTable({ selectable: true, selectedKey: "s0" });

                await userEvent.type(screen.getByPlaceholderText("Filter"), "{ArrowDown}");

                expect(model.selectedKey).toBe("s0");
                expect(outside).not.toHaveBeenCalled();
            } finally {
                document.body.removeEventListener("keydown", outside);
            }
        });
    });

    describe("selection", () => {
        it("selects a clicked row: aria-selected, highlight, current row and onSelectionChange", async () => {
            const onSelectionChange = vi.fn();
            const { model } = await mountTable({ selectable: true, onSelectionChange });

            await userEvent.click(screen.getByText("Alder"));

            expect(selectionFlags()).toEqual(["false", "true", "false"]);
            expect(rowOf("s1")).toHaveClass("selected", "current", "selectable");
            expect(rowOf("s0")).not.toHaveClass("selected");
            expect(rowOf("s0")).not.toHaveClass("current");
            expect(onSelectionChange).toHaveBeenCalledWith(SITES[1], "s1", model);
        });

        it("marks no selection in a table that is not selectable, yet reports row clicks", async () => {
            const onRowClick = vi.fn();
            const { model } = await mountTable({ onRowClick, selectedKey: "s1" });

            await userEvent.click(screen.getByText("Birch"));

            expect(bodyRows().some((row) => row.hasAttribute("aria-selected"))).toBe(false);
            expect(document.querySelector(".ueca-table-body-row.selected, .ueca-table-body-row.current, .ueca-table-body-row.selectable")).toBeNull();
            expect(onRowClick).toHaveBeenCalledWith(SITES[2], "s2", model);
        });

        it("is a tab stop only while its rows can be selected", async () => {
            const { model } = await mountTable();
            expect(grid()).not.toHaveAttribute("tabindex");

            model.selectable = true;
            await settle();
            expect(grid()).toHaveAttribute("tabindex", "0");

            model.selectable = false;
            model.multiSelect = true;
            await settle();
            expect(grid()).toHaveAttribute("tabindex", "0");
        });

        it("ranges and toggles through modified clicks in a multi-select table", async () => {
            const onChangeSelectedKeys = vi.fn();
            const { model } = await mountTable({ multiSelect: true, onChangeSelectedKeys });

            fireEvent.click(screen.getByText("Cedar"));
            fireEvent.click(screen.getByText("Birch"), { shiftKey: true });
            await settle();
            expect(selectionFlags()).toEqual(["true", "true", "true"]);

            fireEvent.click(screen.getByText("Alder"), { ctrlKey: true });
            await settle();
            expect(selectionFlags()).toEqual(["true", "false", "true"]);
            expect(rowOf("s1")).toHaveClass("current");
            expect([...model.selectedKeys]).toEqual(["s0", "s2"]);
            // selectedKeys is reassigned whole on every change: that is how a parent observes it.
            expect(onChangeSelectedKeys).toHaveBeenCalledTimes(3);
        });

        it("suppresses the text selection a Shift+mousedown would start in a multi-select table", async () => {
            await mountTable({ multiSelect: true });

            expect(fireEvent.mouseDown(screen.getByText("Alder"), { shiftKey: true })).toBe(false);
            expect(fireEvent.mouseDown(screen.getByText("Alder"))).toBe(true);
        });

        it("isRowSelected reads the set in a multi-select table and the current row otherwise", async () => {
            const { model } = await mountTable({ selectable: true, selectedKey: "s1", selectedKeys: ["s0", "s2"] });
            expect(["s0", "s1", "s2"].map((key) => model.isRowSelected(key))).toEqual([false, true, false]);

            model.multiSelect = true;

            expect(["s0", "s1", "s2"].map((key) => model.isRowSelected(key))).toEqual([true, false, true]);
        });

        it("selectedRows lists the selected records among the displayed rows, in displayed order", async () => {
            const { model } = await mountTable({ multiSelect: true, selectedKeys: ["s2", "s0"] });
            expect(model.selectedRows()).toEqual([SITES[0], SITES[2]]);

            model.filters = { name: "bir" };

            expect(model.selectedRows()).toEqual([SITES[2]]);
        });

        // With no rowKeyField a key is a displayed index; resolving it against model.rows would
        // return a different record as soon as the rows are sorted.
        it("resolves index keys against the sorted order when there is no rowKeyField", async () => {
            const { model } = await mountTable({ rowKeyField: undefined, selectable: true, sortKey: "name" });
            expect(model.selectedRows()).toEqual([]);

            model.selectedKey = "0";

            expect(model.selectedRows()).toEqual([SITES[1]]);
            expect(model.activeRow()).toBe(SITES[1]);
        });

        it("selectAllDisplayed selects what is displayed; clearSelection empties the set and the current row", async () => {
            const { model } = await mountTable({ multiSelect: true, maxRows: 2, selectedKey: "s1" });

            model.selectAllDisplayed();
            await settle();
            expect([...model.selectedKeys]).toEqual(["s0", "s1"]);
            expect(selectionFlags()).toEqual(["true", "true"]);

            model.clearSelection();
            await settle();
            expect([...model.selectedKeys]).toEqual([]);
            expect(model.selectedKey).toBeUndefined();
            expect(document.querySelector(".ueca-table-body-row.selected, .ueca-table-body-row.current")).toBeNull();
        });

        // Selection arrives as row PROPS, so the memoized rows compare flags: a click re-renders only
        // the rows that flipped, not every row that reads the selection.
        it("re-renders only the rows whose selection flipped", async () => {
            const renders = new Map<string, number>();
            await mountTable({ columns: [countingColumn(renders)], selectable: true });

            renders.clear();
            fireEvent.click(screen.getByText("Alder"));
            await settle();
            expect(Object.fromEntries(renders)).toEqual({ s1: 1 });

            renders.clear();
            fireEvent.click(screen.getByText("Birch"));
            await settle();
            expect(Object.fromEntries(renders)).toEqual({ s1: 1, s2: 1 });
        });
    });

    describe("keyboard", () => {
        it("moves the selection with the arrow keys while the grid has focus", async () => {
            await mountTable({ selectable: true });
            grid().focus();

            await userEvent.keyboard("{ArrowDown}{ArrowDown}");

            expect(selectionFlags()).toEqual(["false", "true", "false"]);
            expect(rowOf("s1")).toHaveClass("current");
        });

        it("ignores keys pressed on a control inside a row", async () => {
            const { model } = await mountTable({
                columns: [{ ...nameColumn, actionView: () => <button>Edit</button> }],
                selectable: true,
                selectedKey: "s1"
            });

            fireEvent.keyDown(screen.getByRole("button", { name: "Edit" }), { key: "ArrowDown" });
            await settle();

            expect(model.selectedKey).toBe("s1");
        });
    });

    describe("resizable columns", () => {
        function handleOf(name: string) {
            return header(name).querySelector<HTMLElement>(".ueca-table-resize-handle");
        }

        it("gives each header a resize handle, except a column that opts out", async () => {
            const { model } = await mountTable({ columns: [nameColumn, statusColumn, { ...qtyColumn, resizable: false }] });
            expect(document.querySelector(".ueca-table-resize-handle")).toBeNull();

            model.resizableColumns = true;
            await settle();

            expect(handleOf("Name")).not.toBeNull();
            expect(handleOf("Status")).not.toBeNull();
            expect(handleOf("Qty")).toBeNull();
        });

        it("resizes a column by dragging its handle; a double-click restores the authored width", async () => {
            await mountTable({ resizableColumns: true, columns: [{ ...nameColumn, width: 150 }, qtyColumn] });
            vi.spyOn(header("Name"), "getBoundingClientRect").mockReturnValue({ width: 150 } as DOMRect);
            const handle = handleOf("Name");

            fireEvent.pointerDown(handle, { pointerId: 1, clientX: 300 });
            fireEvent.pointerMove(handle, { pointerId: 1, clientX: 340 });
            fireEvent.pointerUp(handle, { pointerId: 1, clientX: 340 });
            fireEvent.pointerMove(handle, { pointerId: 1, clientX: 400 });
            await settle();
            expect(grid().style.gridTemplateColumns).toBe("190px auto var(--table-filler-track, 1fr)");

            fireEvent.doubleClick(handle);
            await settle();
            expect(grid().style.gridTemplateColumns).toBe("150px auto var(--table-filler-track, 1fr)");
        });

        it("does not sort the column when its handle is clicked", async () => {
            const onSortChange = vi.fn();
            await mountTable({ resizableColumns: true, onSortChange });

            fireEvent.click(handleOf("Name"));
            await settle();

            expect(onSortChange).not.toHaveBeenCalled();
            expect(header("Name")).toHaveAttribute("aria-sort", "none");
        });

        it("resetColumnWidths restores every authored width", async () => {
            const { model } = await mountTable({
                resizableColumns: true,
                columns: [{ ...nameColumn, width: 150 }, qtyColumn],
                _columnWidths: { name: 90, qty: 60 }
            });
            expect(grid().style.gridTemplateColumns).toBe("90px 60px var(--table-filler-track, 1fr)");

            model.resetColumnWidths();
            await settle();

            expect(grid().style.gridTemplateColumns).toBe("150px auto var(--table-filler-track, 1fr)");
        });

        it("explains the gestures through the app tooltip", async () => {
            const bus = await stubMessages({ "App.Tooltip.Show": vi.fn(async () => { }) });
            await mountTable({ resizableColumns: true });

            fireEvent.mouseEnter(handleOf("Name"));
            await settle();

            expect(bus["App.Tooltip.Show"]).toHaveBeenCalledWith(expect.objectContaining({ contentView: "Drag to resize · double-click to reset" }));
        });

        // Regression: every handle spread the table's own tooltipProps and so shared its token; a late
        // leave from one handle could close the tooltip another had just opened.
        it("gives each column's handle a tooltip token of its own", async () => {
            const show = vi.fn(async (_p: { token: string }) => { });
            await stubMessages({ "App.Tooltip.Show": show });
            await mountTable({ resizableColumns: true });

            fireEvent.mouseEnter(handleOf("Name"));
            fireEvent.mouseEnter(handleOf("Qty"));
            await settle();

            const [name, qty] = show.mock.calls.map(([p]) => p.token);
            expect(name).not.toBe(qty);
        });
    });

    describe("row cap and footer", () => {
        it("shows no footer while every row is displayed", async () => {
            await mountTable();

            expect(footer()).toBeNull();
        });

        // Silently showing the first N of a large set is how someone concludes a record is missing.
        it("renders at most maxRows rows and says what it withheld", async () => {
            const { model } = await mountTable({ maxRows: 2 });

            expect(rowKeys()).toEqual(["s0", "s1"]);
            expect(model.displayRows()).toEqual(SITES.slice(0, 2));
            expect(footer()).toHaveClass("capped");
            expect(footer()).toHaveTextContent("Showing 2 of 3 rows — narrow the selection to see the rest.");
        });

        it("reports a set that is both filtered and capped as both", async () => {
            await mountTable({ maxRows: 1, filters: { name: "e" } });

            expect(rowKeys()).toEqual(["s0"]);
            expect(footer()).toHaveTextContent("Showing 1 of 3 rows (filtered) — narrow the selection to see the rest.");
        });

        it("does not cap a virtualized table, whose rows are all reachable by scrolling", async () => {
            const { model } = await mountTable({ virtualized: true, maxRows: 1 });

            expect(model.displayRows()).toHaveLength(3);
            expect(footer()).toBeNull();
        });

        it("writes the counts in the user's number format", async () => {
            await mountTable({ rows: sites(2500), columns: [nameColumn, { ...statusColumn, filterable: true }], virtualized: true, filters: { status: "offline" } });

            expect(footer()).toHaveTextContent(`Showing ${(1250).toLocaleString()} of ${(2500).toLocaleString()} rows (filtered)`);
        });
    });

    describe("virtualization", () => {
        // No filterable column, so a single 40px header row sits over the rows.
        const plainColumns: TableColumn<Site>[] = [{ key: "name", titleView: "Name", field: "name" }, qtyColumn];

        async function mountVirtualized(params: TableParams<Site> = {}, viewportHeight = 400) {
            const mounted = await mountTable({ rows: sites(100), columns: plainColumns, virtualized: true, ...params });
            const el = grid();
            Object.defineProperty(el, "clientHeight", { configurable: true, value: viewportHeight });
            await act(async () => { ResizeObserverStub.trigger(el); });
            return { ...mounted, el };
        }

        function scrollGrid(el: HTMLElement, scrollTop: number) {
            el.scrollTop = scrollTop;
            fireEvent.scroll(el);
        }

        it("renders the rows in its window only, with a spacer holding the place of the rest", async () => {
            await mountVirtualized();

            // 400px − 40px header = 9 rows, +1 partly visible, +3 × overscan (6).
            expect(rowKeys()).toEqual(sites(28).map((site) => site.id));
            expect(spacerHeights()).toEqual([`${72 * 40}px`]);
            expect(grid()).toHaveClass("virtualized");
        });

        it("moves the window as the grid scrolls, with spacers above and below", async () => {
            const { el } = await mountVirtualized();

            scrollGrid(el, 480);
            await settle();

            expect(rowKeys()).toEqual(sites(34).slice(6).map((site) => site.id));
            expect(spacerHeights()).toEqual([`${6 * 40}px`, `${66 * 40}px`]);
        });

        it("ends the window at the last row", async () => {
            const { el } = await mountVirtualized();

            scrollGrid(el, 3600);
            await settle();

            expect(rowKeys()).toEqual(sites(100).slice(84).map((site) => site.id));
            expect(spacerHeights()).toEqual([`${84 * 40}px`]);
        });

        // The body depends on the quantized window, never on scrollTop: the common scroll event
        // re-renders nothing, and a window shift pays only for the rows entering it.
        it("re-renders no row for a scroll within the window, and only the entering rows for a shift", async () => {
            const renders = new Map<string, number>();
            const { el } = await mountVirtualized({ columns: [countingColumn(renders)] });

            renders.clear();
            scrollGrid(el, 200);
            await settle();
            expect(renders.size).toBe(0);

            scrollGrid(el, 480);
            await settle();
            expect([...renders.keys()]).toEqual(["s28", "s29", "s30", "s31", "s32", "s33"]);
        });

        it("resizes the window when the ResizeObserver reports a new viewport height", async () => {
            const { el } = await mountVirtualized();

            Object.defineProperty(el, "clientHeight", { configurable: true, value: 1000 });
            await act(async () => { ResizeObserverStub.trigger(el); });

            // 1000px − 40px header = 24 rows, +1, +18.
            expect(rowKeys()).toHaveLength(43);
        });

        it("measures the viewport when it mounts", async () => {
            vi.spyOn(Element.prototype, "clientHeight", "get").mockReturnValue(1000);

            await mountTable({ rows: sites(100), columns: plainColumns, virtualized: true });

            expect(rowKeys()).toHaveLength(43);
        });

        it("observes its size while mounted and disconnects the observer on unmount", async () => {
            const { unmount } = await mountTable({ rows: sites(100), virtualized: true });
            const observer = [...ResizeObserverStub.instances].find((o) => o.targets.has(grid()));
            expect(observer).toBeDefined();

            unmount();
            await settle();

            expect(ResizeObserverStub.instances.has(observer)).toBe(false);
        });

        it("observes nothing when it is not virtualized", async () => {
            await mountTable({ rows: sites(100) });

            expect([...ResizeObserverStub.instances].some((o) => o.targets.has(grid()))).toBe(false);
        });

        // "Clamped, because a filter can shrink the data under a deep scroll position before the
        // clamp-scroll event lands."
        it("still renders the last rows when a filter shrinks the data under a deep scroll position", async () => {
            const { el, model } = await mountVirtualized();
            scrollGrid(el, 3000);
            await settle();

            // Site 1 and Site 10–19: eleven rows, far above the window at rows 66–94.
            model.filters = { name: "Site 1" };
            await settle();

            expect(document.querySelector(".ueca-table-empty")).toBeNull();
            expect(rowKeys()).toEqual(["s19"]);
            expect(spacerHeights()).toEqual([`${10 * 40}px`]);
        });

        it("falls back to a first page of 30 rows when switched on after mounting, until it scrolls", async () => {
            const { model } = await mountTable({ rows: sites(100), columns: plainColumns });
            const el = grid();
            Object.defineProperty(el, "clientHeight", { configurable: true, value: 400 });

            model.virtualized = true;
            await settle();
            expect(rowKeys()).toHaveLength(30);
            expect(spacerHeights()).toEqual([`${70 * 40}px`]);

            scrollGrid(el, 480);
            await settle();
            expect(rowKeys()).toEqual(sites(34).slice(6).map((site) => site.id));
        });

        // BUG: the ResizeObserver is created only in the `mount` hook, and only when the table is
        // already virtualized (table.tsx:420-431). A table switched to virtualized later — which the
        // Table playground's "Virtualized" switch does — never hears about a viewport resize, so its
        // window stays sized for the old viewport: once the viewport grows past the overscan margin,
        // the area below the rendered rows stays blank until the next scroll.
        it.fails("follows viewport resizes when switched to virtualized after mounting", async () => {
            const { model } = await mountTable({ rows: sites(100), columns: plainColumns });
            const el = grid();
            model.virtualized = true;
            await settle();
            Object.defineProperty(el, "clientHeight", { configurable: true, value: 400 });
            scrollGrid(el, 0);
            await settle();

            Object.defineProperty(el, "clientHeight", { configurable: true, value: 1000 });
            await act(async () => { ResizeObserverStub.trigger(el); });

            expect(rowKeys()).toHaveLength(43);
        });

        describe("scrollToRow", () => {
            it("brings a row above the viewport to just under the header", async () => {
                const { el, model } = await mountVirtualized();
                el.scrollTop = 2000;

                model.scrollToRow(10);

                expect(el.scrollTop).toBe(10 * 40);
            });

            it("brings a row below the viewport up to the viewport's bottom edge", async () => {
                const { el, model } = await mountVirtualized();

                model.scrollToRow(50);

                // The row's bottom edge: the 40px header plus 51 rows.
                expect(el.scrollTop).toBe(40 + 51 * 40 - 400);
            });

            it("keeps the row clear of the sticky footer", async () => {
                const { el, model } = await mountVirtualized({
                    columns: [plainColumns[0], { ...qtyColumn, onFilter: (row) => row.qty !== 99 }],
                    filters: { qty: "not 99" }
                });
                Object.defineProperty(footer(), "offsetHeight", { configurable: true, value: 32 });

                model.scrollToRow(50);

                expect(el.scrollTop).toBe(40 + 51 * 40 - 400 + 32);
            });

            it("leaves a row that is already in view where it is", async () => {
                const { el, model } = await mountVirtualized();
                el.scrollTop = 400;

                model.scrollToRow(12);

                expect(el.scrollTop).toBe(400);
            });

            it("moves the window along without waiting for the scroll event", async () => {
                const { model } = await mountVirtualized();

                model.scrollToRow(80);
                await settle();

                expect(rowOf("s80")).not.toBeNull();
            });
        });
    });

    describe("scrollToRow without virtualization", () => {
        // A row is display:contents and has no box, so the table measures its first cell.
        function placeRow(key: string, offsetTop: number) {
            const cell = cellsOf(key)[0];
            Object.defineProperty(cell, "offsetTop", { configurable: true, value: offsetTop });
            Object.defineProperty(cell, "offsetHeight", { configurable: true, value: 40 });
        }

        // A 200px viewport under a single 40px header row.
        async function mountScrolling(params: TableParams<Site> = {}) {
            const mounted = await mountTable({ rows: sites(20), columns: [statusColumn], ...params });
            Object.defineProperty(grid(), "clientHeight", { configurable: true, value: 200 });
            return mounted;
        }

        it("brings a row below the viewport up to the bottom edge", async () => {
            const { model } = await mountScrolling();
            placeRow("s10", 40 + 10 * 40);

            model.scrollToRow(10);

            expect(grid().scrollTop).toBe(40 + 11 * 40 - 200);
        });

        it("brings a row above the viewport down to just under the header", async () => {
            const { model } = await mountScrolling();
            grid().scrollTop = 600;
            placeRow("s5", 40 + 5 * 40);

            model.scrollToRow(5);

            expect(grid().scrollTop).toBe(5 * 40);
        });

        it("leaves a row that is already in view where it is", async () => {
            const { model } = await mountScrolling();
            grid().scrollTop = 100;
            placeRow("s3", 40 + 3 * 40);

            model.scrollToRow(3);

            expect(grid().scrollTop).toBe(100);
        });

        it("keeps the row clear of the capped-rows footer", async () => {
            const { model } = await mountScrolling({ maxRows: 15 });
            Object.defineProperty(footer(), "offsetHeight", { configurable: true, value: 30 });
            placeRow("s14", 40 + 14 * 40);

            model.scrollToRow(14);

            expect(grid().scrollTop).toBe(40 + 15 * 40 - 200 + 30);
        });

        it("finds the row at that displayed position", async () => {
            const { model } = await mountScrolling({ columns: [statusColumn, qtyColumn], sortKey: "qty", sortDirection: "desc" });
            // Displayed index 15 of the reversed order is s4.
            placeRow("s4", 40 + 15 * 40);

            model.scrollToRow(15);

            expect(grid().scrollTop).toBe(40 + 16 * 40 - 200);
        });

        it("finds a row whose key has to be escaped in a selector", async () => {
            const rows = [...sites(10), { id: `north "annex" 2`, name: "Annex", status: "online", qty: 0 }];
            const { model } = await mountScrolling({ rows });
            placeRow(`north \\"annex\\" 2`, 40 + 10 * 40);

            model.scrollToRow(10);

            expect(grid().scrollTop).toBe(40 + 11 * 40 - 200);
        });

        it("ignores an index past the displayed rows", async () => {
            const { model } = await mountScrolling();
            grid().scrollTop = 120;

            model.scrollToRow(20);

            expect(grid().scrollTop).toBe(120);
        });

        it("does nothing once the table is unmounted", async () => {
            const { model, unmount } = await mountScrolling();
            unmount();

            expect(() => model.scrollToRow(3)).not.toThrow();
        });
    });

    describe("data changes", () => {
        it("re-renders when the rows are replaced, keeping a keyed selection", async () => {
            const { model } = await mountTable({ selectable: true, selectedKey: "s1" });

            model.rows = [SITES[1], { id: "s9", name: "Maple", status: "online", qty: 1 }];
            await settle();

            expect(rowKeys()).toEqual(["s1", "s9"]);
            expect(screen.getByText("Maple")).toBeInTheDocument();
            expect(rowOf("s1")).toHaveAttribute("aria-selected", "true");
        });

        it("keeps its sort and filter across a data refresh", async () => {
            const { model } = await mountTable({ sortKey: "name", filters: { name: "e" } });
            expect(rowKeys()).toEqual(["s1", "s0"]);

            model.rows = [...SITES, { id: "s3", name: "Beech", status: "online", qty: 2 }];
            await settle();

            expect(rowKeys()).toEqual(["s1", "s3", "s0"]);
        });

        it("re-applies rows passed as a JSX param on every render", async () => {
            const params: TableParams<Site> = { id: "sites", rows: SITES, columns: COLUMNS, rowKeyField: "id" };
            const { update } = await mount(SiteTable, params);

            await update({ ...params, rows: SITES.slice(2) });

            expect(rowKeys()).toEqual(["s2"]);
        });

        it("re-renders the headers and the cells when the columns change", async () => {
            const { model } = await mountTable();

            model.columns = [qtyColumn, nameColumn];
            await settle();

            expect(screen.getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Qty", "Name"]);
            expect(cellsOf("s0").map((cell) => cell.textContent)).toEqual(["5", "Cedar"]);
        });
    });
});
