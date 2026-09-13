import React from "react";
import * as UECA from "ueca-react";
import { describe, expect, it, vi } from "vitest";
import { Table, TableColumn, TableModel, TableParams } from "@components";
import { mount } from "@test";
import { rowKeyOf } from "./tableDerive";
import {
    endResize, filterKeyDown, keyDown, moveResize, resetColumnWidth, rowClick, rowMouseDown, startResize
} from "./tableInteractions";
import { MIN_RESIZE_WIDTH } from "./tableTypes";

// The interaction functions drive a real table model (selectRow, displayRows, scrollToRow… are
// its own methods), fed the synthetic events the row, header and grid views would hand them.
// table.test.tsx covers the same gestures end to end through the DOM.

type Site = { id: string; name: string; qty: number };

const SITES: Site[] = [
    { id: "s0", name: "Cedar", qty: 5 },
    { id: "s1", name: "Alder", qty: 3 },
    { id: "s2", name: "Birch", qty: 9 },
    { id: "s3", name: "Aspen", qty: 1 },
    { id: "s4", name: "Beech", qty: 7 }
];

const SITE_COLUMNS: TableColumn<Site>[] = [
    { key: "name", titleView: "Name", field: "name", sortable: true, filterable: true },
    { key: "qty", titleView: "Qty", field: "qty", dataType: "number", sortable: true }
];

function sites(count: number): Site[] {
    return Array.from({ length: count }, (_, i) => ({ id: `s${i}`, name: `Site ${i}`, qty: i }));
}

// getFC erases the row type parameter; restore it so mount() hands back a TableModel<Site>.
const SiteTable = Table as unknown as (params: TableParams<Site>) => UECA.ReactElement;

async function mountTable(params: TableParams<Site> = {}): Promise<TableModel<Site>> {
    const { model } = await mount(SiteTable, { id: "sites", rows: SITES, columns: SITE_COLUMNS, rowKeyField: "id", ...params });
    return model;
}

type Modifiers = { shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean };

function mouseEvent(modifiers: Modifiers = {}) {
    return { shiftKey: false, ctrlKey: false, metaKey: false, preventDefault: vi.fn(), ...modifiers } as unknown as React.MouseEvent;
}

// Clicks the row displayed at `index`, as the row view does.
function clickRow(model: TableModel<Site>, index: number, modifiers: Modifiers = {}) {
    const row = model.displayRows()[index];
    rowClick(model, mouseEvent(modifiers), row, rowKeyOf(model, row, index), index);
}

// A key pressed with the table itself focused, or (fromControl) inside a control within it.
function keyEvent(key: string, modifiers: Modifiers = {}, fromControl = false) {
    const table = document.createElement("div");
    return {
        key,
        shiftKey: false,
        ctrlKey: false,
        metaKey: false,
        currentTarget: table,
        target: fromControl ? document.createElement("button") : table,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        ...modifiers
    } as unknown as React.KeyboardEvent<HTMLDivElement>;
}

describe("rowClick", () => {
    describe("single select", () => {
        it("selects the clicked row, then raises onRowClick", async () => {
            const calls: string[] = [];
            const model = await mountTable({
                selectable: true,
                onSelectionChange: (row, key) => { calls.push(`select ${key} ${row.name}`); },
                onRowClick: (row, key) => { calls.push(`click ${key} ${row.name}`); }
            });

            clickRow(model, 2);

            expect(model.selectedKey).toBe("s2");
            expect(calls).toEqual(["select s2 Birch", "click s2 Birch"]);
        });

        it("raises onRowClick in a table that is not selectable, selecting nothing", async () => {
            const onRowClick = vi.fn();
            const onSelectionChange = vi.fn();
            const model = await mountTable({ onRowClick, onSelectionChange });

            clickRow(model, 1);

            expect(onRowClick).toHaveBeenCalledWith(SITES[1], "s1", model);
            expect(onSelectionChange).not.toHaveBeenCalled();
            expect(model.selectedKey).toBeUndefined();
        });

        it.each([{ shiftKey: true }, { ctrlKey: true }, { metaKey: true }])("treats a click with %o as a plain click", async (modifiers) => {
            const model = await mountTable({ selectable: true, selectedKey: "s0" });

            clickRow(model, 3, modifiers);

            expect(model.selectedKey).toBe("s3");
            expect(model.selectedKeys).toEqual([]);
        });
    });

    describe("multi select", () => {
        it("a plain click replaces the set with the clicked row", async () => {
            const onSelectionChange = vi.fn();
            const model = await mountTable({ multiSelect: true, selectedKeys: ["s0", "s4"], onSelectionChange });

            clickRow(model, 2);

            expect(model.selectedKeys).toEqual(["s2"]);
            expect(model.selectedKey).toBe("s2");
            expect(onSelectionChange).toHaveBeenCalledWith(SITES[2], "s2", model);
        });

        it.each(["ctrlKey", "metaKey"] as const)("%s+click adds a row to the set, and a second one takes it out", async (modifier) => {
            const onSelectionChange = vi.fn();
            const model = await mountTable({ multiSelect: true, onSelectionChange });
            clickRow(model, 0);

            clickRow(model, 2, { [modifier]: true });
            expect(model.selectedKeys).toEqual(["s0", "s2"]);
            expect(model.selectedKey).toBe("s2");
            expect(onSelectionChange).toHaveBeenLastCalledWith(SITES[2], "s2", model);

            clickRow(model, 2, { [modifier]: true });
            expect(model.selectedKeys).toEqual(["s0"]);
            // The current row stays where the user clicked, although it left the set.
            expect(model.selectedKey).toBe("s2");
        });

        it("Shift+click selects the block between the anchor and the clicked row, either way round", async () => {
            const onSelectionChange = vi.fn();
            const model = await mountTable({ multiSelect: true, onSelectionChange });
            clickRow(model, 1);

            clickRow(model, 3, { shiftKey: true });
            expect(model.selectedKeys).toEqual(["s1", "s2", "s3"]);
            expect(model.selectedKey).toBe("s3");
            expect(onSelectionChange).toHaveBeenLastCalledWith(SITES[3], "s3", model);

            // The anchor stays on the last plain click, so the next range pivots on it.
            clickRow(model, 0, { shiftKey: true });
            expect(model.selectedKeys).toEqual(["s0", "s1"]);
        });

        it("Shift wins over Ctrl once there is an anchor", async () => {
            const model = await mountTable({ multiSelect: true });
            clickRow(model, 1);

            clickRow(model, 2, { shiftKey: true, ctrlKey: true });

            expect(model.selectedKeys).toEqual(["s1", "s2"]);
        });

        it("Ctrl+click moves the anchor that Shift+click ranges from", async () => {
            const model = await mountTable({ multiSelect: true });
            clickRow(model, 0);
            clickRow(model, 3, { ctrlKey: true });

            clickRow(model, 4, { shiftKey: true });

            expect(model.selectedKeys).toEqual(["s3", "s4"]);
        });

        it("Shift+click before any anchor acts as a plain click, which sets one", async () => {
            const model = await mountTable({ multiSelect: true });

            clickRow(model, 2, { shiftKey: true });
            expect(model.selectedKeys).toEqual(["s2"]);

            clickRow(model, 4, { shiftKey: true });
            expect(model.selectedKeys).toEqual(["s2", "s3", "s4"]);
        });

        // "Runs over the DISPLAYED order, which is what the user is looking at."
        it("Shift+click ranges over the sorted order, not the source order", async () => {
            // By qty: Aspen s3, Alder s1, Cedar s0, Beech s4, Birch s2.
            const model = await mountTable({ multiSelect: true, sortKey: "qty" });
            clickRow(model, 0);

            clickRow(model, 2, { shiftKey: true });

            expect(model.selectedKeys).toEqual(["s3", "s1", "s0"]);
        });

        it("Shift+click keys an index-keyed range by displayed position", async () => {
            const model = await mountTable({ multiSelect: true, rowKeyField: undefined });
            clickRow(model, 3);

            clickRow(model, 1, { shiftKey: true });

            expect(model.selectedKeys).toEqual(["1", "2", "3"]);
        });

        it("Shift+click only moves the current row once the anchor row is filtered out of view", async () => {
            const onSelectionChange = vi.fn();
            const model = await mountTable({ multiSelect: true, onSelectionChange });
            clickRow(model, 0);
            model.filters = { name: "b" };

            clickRow(model, 1, { shiftKey: true });

            expect(model.selectedKeys).toEqual(["s0"]);
            expect(model.selectedKey).toBe("s4");
            expect(onSelectionChange).toHaveBeenLastCalledWith(SITES[4], "s4", model);
        });
    });
});

describe("rowMouseDown", () => {
    // A real Shift+click starts a text selection sweeping across the cells before the click lands.
    it.each([
        [true, { shiftKey: true }, 1],
        [true, { ctrlKey: true }, 0],
        [true, {}, 0],
        [false, { shiftKey: true }, 0]
    ])("with multiSelect %s and %o prevents the default %i time(s)", async (multiSelect, modifiers, times) => {
        const model = await mountTable({ multiSelect });
        const event = mouseEvent(modifiers);

        rowMouseDown(model, event);

        expect(event.preventDefault).toHaveBeenCalledTimes(times);
    });
});

describe("keyDown", () => {
    it("ignores keys in a table that is not selectable", async () => {
        const model = await mountTable();
        const event = keyEvent("ArrowDown");

        keyDown(model, event);

        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(model.selectedKey).toBeUndefined();
    });

    // "Keys typed into embedded controls (filter inputs, action buttons) are not navigation."
    it("ignores keys pressed in a control inside the table", async () => {
        const model = await mountTable({ selectable: true, selectedKey: "s1" });
        const event = keyEvent("ArrowDown", {}, true);

        keyDown(model, event);

        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(model.selectedKey).toBe("s1");
    });

    it("ignores keys while no rows are displayed", async () => {
        const model = await mountTable({ selectable: true, filters: { name: "no such site" } });
        const event = keyEvent("Home");

        keyDown(model, event);

        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(model.selectedKey).toBeUndefined();
    });

    it.each([
        ["ArrowDown", 3],
        ["ArrowUp", 1],
        ["Home", 0],
        ["End", 4]
    ])("%s makes row %i current and selects it, instead of scrolling the page", async (key, index) => {
        const onSelectionChange = vi.fn();
        const model = await mountTable({ selectable: true, selectedKey: "s2", onSelectionChange });
        const event = keyEvent(key);

        keyDown(model, event);

        expect(model.selectedKey).toBe(`s${index}`);
        expect(onSelectionChange).toHaveBeenCalledWith(SITES[index], `s${index}`, model);
        expect(event.preventDefault).toHaveBeenCalled();
    });

    it("stops at the first and the last row", async () => {
        const model = await mountTable({ selectable: true, selectedKey: "s4" });

        keyDown(model, keyEvent("ArrowDown"));
        expect(model.selectedKey).toBe("s4");

        model.selectedKey = "s0";
        keyDown(model, keyEvent("ArrowUp"));
        expect(model.selectedKey).toBe("s0");
    });

    it.each(["ArrowDown", "ArrowUp"])("%s starts on the first row when no row is current", async (key) => {
        const model = await mountTable({ selectable: true });

        keyDown(model, keyEvent(key));

        expect(model.selectedKey).toBe("s0");
    });

    it("moves through the displayed order", async () => {
        // By qty: Aspen s3, Alder s1, Cedar s0, Beech s4, Birch s2.
        const model = await mountTable({ selectable: true, sortKey: "qty", selectedKey: "s1" });

        keyDown(model, keyEvent("ArrowDown"));

        expect(model.selectedKey).toBe("s0");
    });

    it("scrolls the new current row into view", async () => {
        const model = await mountTable({ selectable: true, virtualized: true, rows: sites(100) });
        const grid = document.getElementById("sites");
        Object.defineProperty(grid, "clientHeight", { configurable: true, value: 400 });

        keyDown(model, keyEvent("End"));

        // The last row's bottom edge (two 40px header rows + 100 rows) meets the viewport's.
        expect(grid.scrollTop).toBe(80 + 100 * 40 - 400);
    });

    it("leaves other keys to the browser", async () => {
        const model = await mountTable({ selectable: true, selectedKey: "s2" });
        const event = keyEvent("x");

        keyDown(model, event);

        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(model.selectedKey).toBe("s2");
    });

    describe("Enter", () => {
        it("raises onRowClick for the current row without changing the selection", async () => {
            const onRowClick = vi.fn();
            const onSelectionChange = vi.fn();
            const model = await mountTable({ selectable: true, selectedKey: "s3", onRowClick, onSelectionChange });
            const event = keyEvent("Enter");

            keyDown(model, event);

            expect(onRowClick).toHaveBeenCalledWith(SITES[3], "s3", model);
            expect(onSelectionChange).not.toHaveBeenCalled();
            expect(event.preventDefault).toHaveBeenCalled();
        });

        it("does nothing without a current row", async () => {
            const onRowClick = vi.fn();
            const model = await mountTable({ selectable: true, onRowClick });
            const event = keyEvent("Enter");

            keyDown(model, event);

            expect(onRowClick).not.toHaveBeenCalled();
            expect(event.preventDefault).not.toHaveBeenCalled();
        });
    });

    describe("multi select", () => {
        it("an arrow alone collapses the set to the new current row", async () => {
            const model = await mountTable({ multiSelect: true });
            clickRow(model, 1);
            clickRow(model, 3, { shiftKey: true });

            keyDown(model, keyEvent("ArrowUp"));

            expect(model.selectedKeys).toEqual(["s2"]);
            expect(model.selectedKey).toBe("s2");
        });

        it("Shift+arrow extends the range from the anchor", async () => {
            const onSelectionChange = vi.fn();
            const model = await mountTable({ multiSelect: true, onSelectionChange });
            clickRow(model, 1);

            keyDown(model, keyEvent("ArrowDown", { shiftKey: true }));
            keyDown(model, keyEvent("ArrowDown", { shiftKey: true }));
            expect(model.selectedKeys).toEqual(["s1", "s2", "s3"]);
            expect(model.selectedKey).toBe("s3");
            expect(onSelectionChange).toHaveBeenLastCalledWith(SITES[3], "s3", model);

            keyDown(model, keyEvent("Home", { shiftKey: true }));
            expect(model.selectedKeys).toEqual(["s0", "s1"]);
        });

        it("Shift+arrow before any anchor selects plainly, which sets the anchor", async () => {
            const model = await mountTable({ multiSelect: true, selectedKey: "s1" });

            keyDown(model, keyEvent("ArrowDown", { shiftKey: true }));
            expect(model.selectedKeys).toEqual(["s2"]);

            keyDown(model, keyEvent("ArrowDown", { shiftKey: true }));
            expect(model.selectedKeys).toEqual(["s2", "s3"]);
        });

        it("Space toggles the current row in and out of the set", async () => {
            const model = await mountTable({ multiSelect: true });
            clickRow(model, 0);
            clickRow(model, 2, { ctrlKey: true });
            const space = keyEvent(" ");

            keyDown(model, space);
            expect(model.selectedKeys).toEqual(["s0"]);
            expect(space.preventDefault).toHaveBeenCalled();

            keyDown(model, keyEvent(" "));
            expect(model.selectedKeys).toEqual(["s0", "s2"]);
            expect(model.selectedKey).toBe("s2");
        });

        it("Space is left to the browser when no row is current", async () => {
            const model = await mountTable({ multiSelect: true });
            const space = keyEvent(" ");

            keyDown(model, space);

            expect(space.preventDefault).not.toHaveBeenCalled();
            expect(model.selectedKeys).toEqual([]);
        });

        it.each([
            ["a", { ctrlKey: true }],
            ["A", { ctrlKey: true }],
            ["a", { metaKey: true }]
        ])("%s with %o selects every displayed row", async (key, modifiers) => {
            const model = await mountTable({ multiSelect: true, filters: { name: "b" } });
            const event = keyEvent(key, modifiers);

            keyDown(model, event);

            expect(model.selectedKeys).toEqual(["s2", "s4"]);
            expect(event.preventDefault).toHaveBeenCalled();
        });

        it("Escape clears the selection and stops there", async () => {
            const model = await mountTable({ multiSelect: true });
            clickRow(model, 1);
            clickRow(model, 3, { shiftKey: true });
            const escape = keyEvent("Escape");

            keyDown(model, escape);

            expect(model.selectedKeys).toEqual([]);
            expect(model.selectedKey).toBeUndefined();
            expect(escape.stopPropagation).toHaveBeenCalled();
        });

        // "Only swallow Escape while there is a selection to clear; empty, it bubbles so a host
        // dialog can close on the same key."
        it("lets Escape bubble when there is no selection to clear", async () => {
            const model = await mountTable({ multiSelect: true, selectedKey: "s1" });
            const escape = keyEvent("Escape");

            keyDown(model, escape);

            expect(escape.stopPropagation).not.toHaveBeenCalled();
            expect(model.selectedKey).toBe("s1");
        });
    });

    describe("single select", () => {
        it.each([
            [" ", {}],
            ["a", { ctrlKey: true }],
            ["Escape", {}]
        ])("leaves %j with %o to the browser", async (key, modifiers) => {
            const model = await mountTable({ selectable: true, selectedKey: "s1", selectedKeys: ["s1"] });
            const event = keyEvent(key, modifiers);

            keyDown(model, event);

            expect(event.preventDefault).not.toHaveBeenCalled();
            expect(event.stopPropagation).not.toHaveBeenCalled();
            expect(model.selectedKey).toBe("s1");
            expect(model.selectedKeys).toEqual(["s1"]);
        });
    });
});

describe("filterKeyDown", () => {
    function inputKey(key: string) {
        return { key, stopPropagation: vi.fn() } as unknown as React.KeyboardEvent<HTMLInputElement>;
    }

    it("keeps every key typed into a filter away from the table's navigation", async () => {
        const model = await mountTable({ filters: { name: "ce" } });
        const event = inputKey("ArrowDown");

        filterKeyDown(model, event, SITE_COLUMNS[0]);

        expect(event.stopPropagation).toHaveBeenCalled();
        expect(model.filters).toEqual({ name: "ce" });
    });

    it("Escape clears that column's filter and leaves the others", async () => {
        const model = await mountTable({ filters: { name: "ce", qty: "5" } });

        filterKeyDown(model, inputKey("Escape"), SITE_COLUMNS[0]);

        expect(model.filters).toEqual({ name: "", qty: "5" });
    });
});

describe("column resizing", () => {
    const nameColumn = SITE_COLUMNS[0];

    // A resize handle inside its header cell, which is what a drag measures.
    function resizeHandle(cellWidth = 150) {
        const cell = document.createElement("div");
        const handle = document.createElement("span");
        cell.appendChild(handle);
        return {
            handle,
            measure: vi.spyOn(cell, "getBoundingClientRect").mockReturnValue({ width: cellWidth } as DOMRect),
            capture: vi.spyOn(handle, "setPointerCapture"),
            release: vi.spyOn(handle, "releasePointerCapture")
        };
    }

    function pointer(handle: HTMLElement, clientX: number) {
        return {
            clientX,
            pointerId: 7,
            currentTarget: handle,
            preventDefault: vi.fn(),
            stopPropagation: vi.fn()
        } as unknown as React.PointerEvent<HTMLSpanElement>;
    }

    it("drags from the header cell's measured width and follows the pointer", async () => {
        const model = await mountTable({ resizableColumns: true });
        const { handle, capture } = resizeHandle(150);

        startResize(model, pointer(handle, 100), nameColumn);
        expect(capture).toHaveBeenCalledWith(7);

        moveResize(model, pointer(handle, 130));
        expect(model._columnWidths).toEqual({ name: 180 });

        moveResize(model, pointer(handle, 90));
        expect(model._columnWidths).toEqual({ name: 140 });
    });

    it("starts from the width an earlier drag left, without measuring", async () => {
        const model = await mountTable({ resizableColumns: true, _columnWidths: { name: 220 } });
        const { handle, measure } = resizeHandle(150);

        startResize(model, pointer(handle, 0), nameColumn);
        moveResize(model, pointer(handle, 10));

        expect(model._columnWidths).toEqual({ name: 230 });
        expect(measure).not.toHaveBeenCalled();
    });

    it("keeps other columns' widths while dragging one", async () => {
        const model = await mountTable({ resizableColumns: true, _columnWidths: { qty: 90 } });
        const { handle } = resizeHandle(150);

        startResize(model, pointer(handle, 0), nameColumn);
        moveResize(model, pointer(handle, 25));

        expect(model._columnWidths).toEqual({ qty: 90, name: 175 });
    });

    // Below it the padding swallows the content and the handle becomes impossible to grab again.
    it("never narrows a column below the minimum width", async () => {
        const model = await mountTable({ resizableColumns: true });
        const { handle } = resizeHandle(150);

        startResize(model, pointer(handle, 500), nameColumn);
        moveResize(model, pointer(handle, 0));

        expect(model._columnWidths).toEqual({ name: MIN_RESIZE_WIDTH });
    });

    it("rounds the width to whole pixels", async () => {
        const model = await mountTable({ resizableColumns: true });
        const { handle } = resizeHandle(150.6);

        startResize(model, pointer(handle, 10), nameColumn);
        moveResize(model, pointer(handle, 10.3));

        expect(model._columnWidths).toEqual({ name: 151 });
    });

    it("keeps the grab from sorting the column or starting a text selection", async () => {
        const model = await mountTable({ resizableColumns: true });
        const { handle } = resizeHandle();
        const event = pointer(handle, 0);

        startResize(model, event, nameColumn);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
    });

    it("ends the drag on pointer up, releasing the capture, so later moves change nothing", async () => {
        const model = await mountTable({ resizableColumns: true });
        const { handle, release } = resizeHandle(150);
        startResize(model, pointer(handle, 0), nameColumn);
        moveResize(model, pointer(handle, 20));

        endResize(model, pointer(handle, 20));
        moveResize(model, pointer(handle, 80));

        expect(release).toHaveBeenCalledWith(7);
        expect(model.__resize).toBeUndefined();
        expect(model._columnWidths).toEqual({ name: 170 });
    });

    it("ignores pointer moves and ups without a drag", async () => {
        const model = await mountTable({ resizableColumns: true });
        const { handle, release } = resizeHandle();

        moveResize(model, pointer(handle, 80));
        endResize(model, pointer(handle, 80));

        expect(model._columnWidths).toEqual({});
        expect(release).not.toHaveBeenCalled();
    });

    // "Capture throws for a pointer that vanished between events, and an aborted grab must not
    // leave the drag half-armed."
    it("arms no drag when the pointer cannot be captured", async () => {
        const model = await mountTable({ resizableColumns: true });
        const { handle, capture } = resizeHandle();
        capture.mockImplementation(() => { throw new DOMException("No active pointer", "NotFoundError"); });

        startResize(model, pointer(handle, 0), nameColumn);
        moveResize(model, pointer(handle, 60));

        expect(model.__resize).toBeUndefined();
        expect(model._columnWidths).toEqual({});
    });

    it("arms no drag for a handle outside a header cell", async () => {
        const model = await mountTable({ resizableColumns: true });
        const loose = document.createElement("span");
        const capture = vi.spyOn(loose, "setPointerCapture");

        startResize(model, pointer(loose, 0), nameColumn);

        expect(model.__resize).toBeUndefined();
        expect(capture).not.toHaveBeenCalled();
    });

    it("a double-click drops that column's override and keeps the others", async () => {
        const model = await mountTable({ resizableColumns: true, _columnWidths: { name: 200, qty: 90 } });
        const event = mouseEvent();
        (event as unknown as { stopPropagation: () => void }).stopPropagation = vi.fn();

        resetColumnWidth(model, event, nameColumn);

        expect(model._columnWidths).toEqual({ qty: 90 });
        expect(event.stopPropagation).toHaveBeenCalled();
    });
});
