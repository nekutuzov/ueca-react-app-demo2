import React from "react";
import { ColumnAlign, TableCell, TableColumn } from "./tableTypes";

// Pure cell helpers — module scope, model-free: the memoized row view shares them.

// One collator for every string comparison. localeCompare with an options object builds the
// collation on every call — sorting 5,000 rows is ~60k comparisons, and that difference is
// hundreds of milliseconds versus this.
const textCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

// One formatter per date shape, for the same reason: toLocaleString(undefined, options) builds a
// DateTimeFormat on every call, and a virtualized table formats dates on every window shift.
const DATE_FORMATS = {
    date: new Intl.DateTimeFormat(undefined, { dateStyle: "short" }),
    time: new Intl.DateTimeFormat(undefined, { timeStyle: "medium" }),
    dateTime: new Intl.DateTimeFormat(undefined, { dateStyle: "short", timeStyle: "short" })
} as const;

function cellOf<T>(column: TableColumn<T>, row: T, rowIndex: number): TableCell<T> {
    return { column, row, rowIndex, rowNumber: rowIndex + 1 };
}

// Numbers read right-aligned and booleans centred; that is a convention, not a preference, so it
// is the default rather than something every column has to state.
function _defaultAlign<T>(column: TableColumn<T>): ColumnAlign {
    switch (column.dataType) {
        case "number":
            return "right";
        case "boolean":
            return "center";
        default:
            return "left";
    }
}

function cellClass<T>(column: TableColumn<T>, base: string): string {
    return `${base} align-${column.align ?? _defaultAlign(column)}`;
}

// The sticky class for a rendered column — only the first one pins.
function stickyClassFor(colIndex: number, sticky: boolean): string {
    if (sticky && colIndex === 0) {
        return " col-sticky col-sticky-first";
    }
    return "";
}

function _asBoolean(value: unknown): boolean {
    if (typeof value === "string") {
        return value.toLowerCase() === "true";
    }
    return !!value;
}

// Uses the browser's locale rather than a bundled date library — one less dependency, and it
// follows the user's regional settings. An unparseable value is shown as-is rather than as
// "Invalid Date", which tells the reader nothing about what is actually in the data.
function _formatDate(value: unknown, format: Intl.DateTimeFormat): string {
    const date = value instanceof Date ? value : new Date(value as string);
    if (Number.isNaN(date.getTime())) {
        return String(value);
    }
    return format.format(date);
}

function formatValue<T>(value: unknown, column: TableColumn<T>): React.ReactNode {
    if (value == null) {
        return "";
    }

    switch (column.dataType) {
        case "number": {
            const n = Number(value);
            if (Number.isNaN(n)) {
                return String(value);
            }
            return column.decimals != null ? n.toFixed(column.decimals) : String(n);
        }
        case "boolean":
            return _asBoolean(value) ? "Yes" : "No";
        case "date":
            return _formatDate(value, DATE_FORMATS.date);
        case "time":
            return _formatDate(value, DATE_FORMATS.time);
        case "dateTime":
            return _formatDate(value, DATE_FORMATS.dateTime);
        default:
            return String(value);
    }
}

// The text a default filter matches against: the same string the cell displays, so "what you see
// is what you filter". A cellView column has no derivable text — give it `onFilter`.
function formatText<T>(row: T, column: TableColumn<T>): string {
    if (!column.field) {
        return "";
    }
    const formatted = formatValue(row[column.field], column);
    return typeof formatted === "string" ? formatted : String(row[column.field] ?? "");
}

function cellContent<T>(column: TableColumn<T>, row: T, rowIndex: number): React.ReactNode {
    if (column.cellView) {
        return column.cellView(cellOf(column, row, rowIndex));
    }

    if (!column.field) {
        return null;
    }

    return formatValue(row[column.field], column);
}

function compareValues<T>(x: unknown, y: unknown, column: TableColumn<T>): number {
    // Null-ish values sort last in ascending order regardless of type, rather than comparing as
    // "" or 0 and landing in the middle of the data.
    if (x == null && y == null) {
        return 0;
    }
    if (x == null) {
        return 1;
    }
    if (y == null) {
        return -1;
    }

    if (column.dataType === "number") {
        return Number(x) - Number(y);
    }
    if (column.dataType === "date" || column.dataType === "time" || column.dataType === "dateTime") {
        return new Date(x as string).getTime() - new Date(y as string).getTime();
    }
    if (typeof x === "number" && typeof y === "number") {
        return x - y;
    }

    // The shared collator: "Ä" sorts next to "A" and "item10" after "item9" with `numeric`.
    return textCollator.compare(String(x), String(y));
}

export { cellOf, cellClass, stickyClassFor, formatText, cellContent, compareValues };
