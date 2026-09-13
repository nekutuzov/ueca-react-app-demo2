import React from "react";
import { MIN_RESIZE_WIDTH, TableColumn, TableModel } from "./tableTypes";
import { rowKeyOf } from "./tableDerive";

// Selection gestures, keyboard navigation, and column resizing. Model-bound but stateless —
// every function takes the table model explicitly.

// ---- selection ----

function rowClick<T>(model: TableModel<T>, e: React.MouseEvent, row: T, key: string, rowIndex: number) {
    if (!_modifierSelect(model, e, row, key, rowIndex)) {
        model.selectRow(row, key);
    }

    if (model.onRowClick) {
        model.onRowClick(row, key, model);
    }
}

// Shift = range from the anchor, Ctrl/Cmd = toggle. Returns false when no modifier applied,
// so the caller runs its plain-click behaviour.
function _modifierSelect<T>(model: TableModel<T>, e: React.MouseEvent, row: T, key: string, rowIndex: number): boolean {
    if (!model.multiSelect) {
        return false;
    }
    if (e.shiftKey && model.__anchorKey != null) {
        _selectRange(model, model.__anchorKey, rowIndex);
        model.selectedKey = key;
        if (model.onSelectionChange) {
            model.onSelectionChange(row, key, model);
        }
        return true;
    }
    if (e.ctrlKey || e.metaKey) {
        model.toggleRowSelected(row, key);
        return true;
    }
    return false;
}

// A real Shift+click starts a text selection sweeping across the cells before the click even
// lands — visually it reads as the feature misfiring. Selection gestures suppress it.
function rowMouseDown<T>(model: TableModel<T>, e: React.MouseEvent) {
    if (model.multiSelect && e.shiftKey) {
        e.preventDefault();
    }
}

// Replace the selection with the block between the anchor row and the target index — the
// classic Shift+click. Runs over the DISPLAYED order, which is what the user is looking at.
function _selectRange<T>(model: TableModel<T>, anchorKey: string, targetIndex: number) {
    const rows = model.displayRows();
    const anchorIndex = rows.findIndex((row, i) => rowKeyOf(model, row, i) === anchorKey);
    if (anchorIndex < 0) {
        return;
    }
    const from = Math.min(anchorIndex, targetIndex);
    const to = Math.max(anchorIndex, targetIndex);
    model.selectedKeys = rows.slice(from, to + 1).map((row, i) => rowKeyOf(model, row, from + i));
}

// ---- keyboard navigation (container-level) ----
//
// The TABLE is the focusable element; arrows move the current row, Space toggles it in the
// multi-select set, Enter fires onRowClick, Shift+arrow extends the selection. Rows themselves
// are never tab stops, so a row's own interactive content (action buttons) keeps its ordinary
// behaviour — which is what makes this safe where a roving tabindex would need real design.

function keyDown<T>(model: TableModel<T>, e: React.KeyboardEvent<HTMLDivElement>) {
    if (!model.selectable && !model.multiSelect) {
        return;
    }
    // Keys typed into embedded controls (filter inputs, action buttons) are not navigation.
    if (e.target !== e.currentTarget) {
        return;
    }

    const rows = model.displayRows();
    if (rows.length === 0) {
        return;
    }
    const currentIndex = rows.findIndex((row, i) => rowKeyOf(model, row, i) === model.selectedKey);

    let nextIndex: number;
    if (e.key === "ArrowDown") {
        nextIndex = Math.min(rows.length - 1, currentIndex + 1);
    } else if (e.key === "ArrowUp") {
        nextIndex = Math.max(0, currentIndex < 0 ? 0 : currentIndex - 1);
    } else if (e.key === "Home") {
        nextIndex = 0;
    } else if (e.key === "End") {
        nextIndex = rows.length - 1;
    } else if (e.key === " " && model.multiSelect && currentIndex >= 0) {
        e.preventDefault();
        model.toggleRowSelected(rows[currentIndex], rowKeyOf(model, rows[currentIndex], currentIndex));
        return;
    } else if ((e.ctrlKey || e.metaKey) && (e.key === "a" || e.key === "A") && model.multiSelect) {
        e.preventDefault();
        model.selectAllDisplayed();
        return;
    } else if (e.key === "Escape" && model.multiSelect && (model.selectedKeys?.length ?? 0) > 0) {
        // Only swallow Escape while there is a selection to clear; empty, it bubbles so a host
        // dialog can close on the same key (the SearchField convention).
        e.stopPropagation();
        model.clearSelection();
        return;
    } else if (e.key === "Enter" && currentIndex >= 0) {
        e.preventDefault();
        if (model.onRowClick) {
            model.onRowClick(rows[currentIndex], rowKeyOf(model, rows[currentIndex], currentIndex), model);
        }
        return;
    } else {
        return;
    }

    e.preventDefault();
    const row = rows[nextIndex];
    const key = rowKeyOf(model, row, nextIndex);

    if (model.multiSelect && e.shiftKey && model.__anchorKey != null) {
        _selectRange(model, model.__anchorKey, nextIndex);
        model.selectedKey = key;
        if (model.onSelectionChange) {
            model.onSelectionChange(row, key, model);
        }
    } else {
        model.selectRow(row, key);
    }
    model.scrollToRow(nextIndex);
}

function filterKeyDown<T>(model: TableModel<T>, e: React.KeyboardEvent<HTMLInputElement>, column: TableColumn<T>) {
    e.stopPropagation();
    if (e.key === "Escape") {
        model.setFilter(column.key, "");
    }
}

// ---- column resizing ----

function startResize<T>(model: TableModel<T>, e: React.PointerEvent<HTMLSpanElement>, column: TableColumn<T>) {
    e.preventDefault();
    e.stopPropagation();
    const cell = (e.currentTarget as HTMLElement).parentElement;
    if (!cell) {
        return;
    }
    // Capture routes every subsequent move/up to the handle, however far the pointer strays.
    // Guarded: capture throws for a pointer that vanished between events (or a synthetic one),
    // and an aborted grab must not leave the drag half-armed.
    try {
        e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
        return;
    }
    model.__resize = {
        key: column.key,
        startX: e.clientX,
        startWidth: model._columnWidths?.[column.key] ?? cell.getBoundingClientRect().width
    };
}

function moveResize<T>(model: TableModel<T>, e: React.PointerEvent<HTMLSpanElement>) {
    const drag = model.__resize;
    if (!drag) {
        return;
    }
    const width = Math.max(MIN_RESIZE_WIDTH, Math.round(drag.startWidth + (e.clientX - drag.startX)));
    model._columnWidths = { ...model._columnWidths, [drag.key]: width };
}

function endResize<T>(model: TableModel<T>, e: React.PointerEvent<HTMLSpanElement>) {
    if (model.__resize) {
        e.currentTarget.releasePointerCapture(e.pointerId);
        model.__resize = undefined;
    }
}

function resetColumnWidth<T>(model: TableModel<T>, e: React.MouseEvent, column: TableColumn<T>) {
    e.stopPropagation();
    const widths = { ...model._columnWidths };
    delete widths[column.key];
    model._columnWidths = widths;
}

export { rowClick, rowMouseDown, keyDown, filterKeyDown, startResize, moveResize, endResize, resetColumnWidth };
