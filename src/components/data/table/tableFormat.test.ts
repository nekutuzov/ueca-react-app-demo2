import { describe, expect, it, vi } from "vitest";
import type { TableColumn } from "@components";
import { cellClass, cellContent, cellOf, compareValues, formatText, stickyClassFor } from "./tableFormat";

type Row = Record<string, unknown>;

function column(overrides: Partial<TableColumn<Row>> = {}): TableColumn<Row> {
    return { key: "value", titleView: "Value", field: "value", ...overrides };
}

// What a cell of the given column shape shows for `value`.
function shown(value: unknown, overrides: Partial<TableColumn<Row>> = {}) {
    return cellContent(column(overrides), { value }, 0);
}

const DATA_TYPES = [undefined, "string", "number", "boolean", "date", "time", "dateTime"] as const;

describe("cellOf", () => {
    it("carries a 1-based row number next to the 0-based index", () => {
        const col = column();
        const row = { value: 1 };

        expect(cellOf(col, row, 4)).toEqual({ column: col, row, rowIndex: 4, rowNumber: 5 });
    });
});

describe("cellClass", () => {
    it.each([
        [undefined, "left"],
        ["string", "left"],
        ["number", "right"],
        ["boolean", "center"],
        ["date", "left"],
        ["time", "left"],
        ["dateTime", "left"]
    ] as const)("aligns a %s column %s by default", (dataType, align) => {
        expect(cellClass(column({ dataType }), "cell")).toBe(`cell align-${align}`);
    });

    it("lets an explicit align override the data type's convention", () => {
        expect(cellClass(column({ dataType: "number", align: "center" }), "cell")).toBe("cell align-center");
    });
});

describe("stickyClassFor", () => {
    it("pins the first column only, and only when the table is sticky", () => {
        expect(stickyClassFor(0, true)).toBe(" col-sticky col-sticky-first");
        expect(stickyClassFor(1, true)).toBe("");
        expect(stickyClassFor(0, false)).toBe("");
    });
});

describe("cellContent", () => {
    it("renders cellView with the cell, rather than the field", () => {
        const cellView = vi.fn(() => "custom");
        const col = column({ cellView });
        const row = { value: "raw" };

        expect(cellContent(col, row, 2)).toBe("custom");
        expect(cellView).toHaveBeenCalledWith({ column: col, row, rowIndex: 2, rowNumber: 3 });
    });

    it("renders nothing for a computed column that has neither field nor cellView", () => {
        expect(cellContent(column({ field: undefined }), { value: "raw" }, 0)).toBeNull();
    });

    it.each(DATA_TYPES)("shows null and undefined as empty text in a %s column", (dataType) => {
        expect(shown(null, { dataType })).toBe("");
        expect(shown(undefined, { dataType })).toBe("");
    });

    it("shows other values as their string form without a data type", () => {
        expect(shown(42)).toBe("42");
        expect(shown("Cedar", { dataType: "string" })).toBe("Cedar");
    });

    describe("number", () => {
        it("fixes the column's decimals", () => {
            expect(shown(12.5, { dataType: "number", decimals: 2 })).toBe("12.50");
            expect(shown("3.14159", { dataType: "number", decimals: 3 })).toBe("3.142");
        });

        it("normalises a numeric value when no decimals are set", () => {
            expect(shown("007", { dataType: "number" })).toBe("7");
            expect(shown(2.5, { dataType: "number" })).toBe("2.5");
        });

        it("shows a value that is not a number as-is rather than NaN", () => {
            expect(shown("n/a", { dataType: "number", decimals: 2 })).toBe("n/a");
        });
    });

    describe("boolean", () => {
        it.each([
            [true, "Yes"],
            [false, "No"],
            [1, "Yes"],
            [0, "No"],
            ["true", "Yes"],
            ["TRUE", "Yes"],
            // A non-empty string is truthy; only the word "true" reads as Yes.
            ["false", "No"],
            ["yes", "No"]
        ])("shows %j as %s", (value, text) => {
            expect(shown(value, { dataType: "boolean" })).toBe(text);
        });
    });

    describe("dates", () => {
        const instant = new Date("2024-03-05T14:30:15Z");

        it.each([
            ["date", { dateStyle: "short" }],
            ["time", { timeStyle: "medium" }],
            ["dateTime", { dateStyle: "short", timeStyle: "short" }]
        ] as const)("formats a %s column in the browser's locale", (dataType, options) => {
            expect(shown(instant, { dataType })).toBe(new Intl.DateTimeFormat(undefined, options).format(instant));
        });

        it("reads an ISO string the same as a Date", () => {
            expect(shown("2024-03-05T14:30:15Z", { dataType: "dateTime" })).toBe(shown(instant, { dataType: "dateTime" }));
        });

        it.each(["date", "time", "dateTime"] as const)(
            "shows an unparseable %s as-is rather than as Invalid Date", (dataType) => {
                expect(shown("sometime soon", { dataType })).toBe("sometime soon");
            }
        );
    });
});

describe("formatText", () => {
    it("is the text the cell displays, so a filter matches what the user sees", () => {
        expect(formatText({ value: true }, column({ dataType: "boolean" }))).toBe("Yes");
        expect(formatText({ value: 2 }, column({ dataType: "number", decimals: 2 }))).toBe("2.00");
        expect(formatText({ value: null }, column())).toBe("");
    });

    it("formats the field even when a cellView draws something else", () => {
        const col = column({ dataType: "boolean", cellView: () => "custom" });

        expect(formatText({ value: false }, col)).toBe("No");
    });

    it("is empty for a computed column without a field", () => {
        expect(formatText({ value: "raw" }, column({ field: undefined }))).toBe("");
    });
});

describe("compareValues", () => {
    // Rather than comparing as "" or 0 and landing in the middle of the data.
    it.each(DATA_TYPES)("sorts empty values after every value in a %s column", (dataType) => {
        const col = column({ dataType });

        expect(compareValues(null, 0, col)).toBeGreaterThan(0);
        expect(compareValues(undefined, "", col)).toBeGreaterThan(0);
        expect(compareValues(0, null, col)).toBeLessThan(0);
        expect(compareValues(null, undefined, col)).toBe(0);
    });

    it("compares a number column arithmetically, even when the values are strings", () => {
        const col = column({ dataType: "number" });

        // Text comparison would order both of these pairs the other way round.
        expect(compareValues("-1", "-2", col)).toBeGreaterThan(0);
        expect(compareValues("0.5", "0.25", col)).toBeGreaterThan(0);
    });

    it("compares two numbers arithmetically without a data type", () => {
        expect(compareValues(-1, -2, column())).toBeGreaterThan(0);
        expect(compareValues(0.5, 0.25, column())).toBeGreaterThan(0);
    });

    it.each(["date", "time", "dateTime"] as const)("compares a %s column chronologically", (dataType) => {
        const col = column({ dataType });

        // As text, "F" sorts after "2".
        expect(compareValues("Feb 1, 2024", "2024-03-01", col)).toBeLessThan(0);
        expect(compareValues(new Date("2024-01-02"), new Date("2024-01-01"), col)).toBeGreaterThan(0);
    });

    it("compares text by base letter, ignoring case and accents", () => {
        const col = column();

        // Plain code-point order would put "B" before "a" and "Ä" after "Z".
        expect(compareValues("apple", "Banana", col)).toBeLessThan(0);
        expect(compareValues("Ärger", "Bach", col)).toBeLessThan(0);
        expect(compareValues("resume", "Résumé", col)).toBe(0);
    });

    it("orders the numbers inside text by value", () => {
        expect(compareValues("item9", "item10", column())).toBeLessThan(0);
    });

    // BUG: compareValues returns NaN for a number column value that is not a number
    // (tableFormat.ts:128). Array.sort reads NaN as "equal to everything", which is no order at all,
    // so one such value leaves the valid numbers around it unsorted. formatValue already expects
    // these values (it shows them as-is), so sorting should cope with them too.
    it.fails("still orders the valid numbers of a number column holding a value that is not a number", () => {
        const col = column({ dataType: "number" });

        const sorted = [3, "n/a", 1, 2].sort((a, b) => compareValues(a, b, col));

        expect(sorted.filter((v) => v !== "n/a")).toEqual([1, 2, 3]);
    });

    // BUG: the same NaN for an unparseable date (tableFormat.ts:131) — the value _formatDate
    // deliberately shows as-is — leaves every valid date around it unsorted.
    it.fails("still orders the valid dates of a date column holding an unparseable value", () => {
        const col = column({ dataType: "date" });

        const sorted = ["2024-03-01", "not a date", "2024-01-01", "2024-02-01"].sort((a, b) => compareValues(a, b, col));

        expect(sorted.filter((v) => v !== "not a date")).toEqual(["2024-01-01", "2024-02-01", "2024-03-01"]);
    });
});
