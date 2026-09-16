import { describe, expect, it } from "vitest";
import {
    addMonths, clampDateTime, dateTimePattern, dayLabel, daysInMonth, formatDateTime, isDayInRange,
    isSameDay, isSameMonth, isValidDate, monthGrid, monthLabel, monthWeeks, parseDateTime, startOfDay,
    startOfMonth, startOfWeek, weekdayInitials, withDatePart, withTimePart
} from "./dateTimeFormat";

// 14 September 2026 is a Monday, which is what makes it useful here: the week-start tests have a
// different answer for each firstDayOfWeek only if the day is not already mid-week.
const MONDAY = new Date(2026, 8, 14, 9, 5, 30);
const INVALID = new Date("nonsense");

describe("dateTimeFormat", () => {
    describe("formatDateTime", () => {
        it("writes each mode in ISO order, zero-padded", () => {
            expect(formatDateTime(MONDAY, "date", false)).toBe("2026-09-14");
            expect(formatDateTime(MONDAY, "time", false)).toBe("09:05");
            expect(formatDateTime(MONDAY, "time", true)).toBe("09:05:30");
            expect(formatDateTime(MONDAY, "datetime", false)).toBe("2026-09-14 09:05");
            expect(formatDateTime(MONDAY, "datetime", true)).toBe("2026-09-14 09:05:30");
        });

        // An empty box, not the string "Invalid Date" — the field has to be able to show "nothing".
        it("writes an empty string for a missing or unusable value", () => {
            expect(formatDateTime(undefined, "datetime", false)).toBe("");
            expect(formatDateTime(INVALID, "datetime", false)).toBe("");
        });
    });

    describe("dateTimePattern", () => {
        it("names the shape each mode accepts, seconds included only when they are shown", () => {
            expect(dateTimePattern("date", false)).toBe("YYYY-MM-DD");
            expect(dateTimePattern("time", false)).toBe("HH:MM");
            expect(dateTimePattern("time", true)).toBe("HH:MM:SS");
            expect(dateTimePattern("datetime", false)).toBe("YYYY-MM-DD HH:MM");
            expect(dateTimePattern("datetime", true)).toBe("YYYY-MM-DD HH:MM:SS");
        });
    });

    describe("parseDateTime — dates", () => {
        it("reads a date with any of the separators people type", () => {
            expect(parseDateTime("2026-09-14", "date")).toEqual(new Date(2026, 8, 14));
            expect(parseDateTime("2026/09/14", "date")).toEqual(new Date(2026, 8, 14));
            expect(parseDateTime("2026.9.4", "date")).toEqual(new Date(2026, 8, 4));
        });

        it("ignores the space around what was typed", () => {
            expect(parseDateTime("  2026-09-14  ", "date")).toEqual(new Date(2026, 8, 14));
        });

        it("zeroes the clock, so a date mode value is a day and nothing more", () => {
            const parsed = parseDateTime("2026-09-14", "date");
            expect([parsed.getHours(), parsed.getMinutes(), parsed.getSeconds()]).toEqual([0, 0, 0]);
        });

        // The whole reason the parse is hand-rolled: new Date(2026, 1, 31) is 3 March, and
        // accepting it would move the user's day without saying so.
        it("refuses a day the month does not have, rather than rolling into the next one", () => {
            expect(parseDateTime("2026-02-30", "date")).toBeUndefined();
            expect(parseDateTime("2026-04-31", "date")).toBeUndefined();
            expect(parseDateTime("2024-02-29", "date")).toEqual(new Date(2024, 1, 29));
        });

        it("refuses a month outside the year, an ambiguous order, and plain nonsense", () => {
            expect(parseDateTime("2026-13-01", "date")).toBeUndefined();
            expect(parseDateTime("14-09-2026", "date")).toBeUndefined();
            expect(parseDateTime("next tuesday", "date")).toBeUndefined();
        });

        it("reads nothing out of an empty box", () => {
            expect(parseDateTime("", "date")).toBeUndefined();
            expect(parseDateTime("   ", "date")).toBeUndefined();
            expect(parseDateTime(undefined, "date")).toBeUndefined();
        });
    });

    describe("parseDateTime — times", () => {
        const base = new Date(2026, 8, 14, 23, 59, 59);

        it("puts the time on the day the field already holds", () => {
            expect(parseDateTime("9:30", "time", base)).toEqual(new Date(2026, 8, 14, 9, 30, 0));
            expect(parseDateTime("09:30:05", "time", base)).toEqual(new Date(2026, 8, 14, 9, 30, 5));
        });

        it("reads a bare hour as the top of it", () => {
            expect(parseDateTime("9", "time", base)).toEqual(new Date(2026, 8, 14, 9, 0, 0));
        });

        it("reads a 12-hour clock, midnight and noon included", () => {
            expect(parseDateTime("9:30 pm", "time", base)).toEqual(new Date(2026, 8, 14, 21, 30, 0));
            expect(parseDateTime("9:30PM", "time", base)).toEqual(new Date(2026, 8, 14, 21, 30, 0));
            expect(parseDateTime("12:00 am", "time", base)).toEqual(new Date(2026, 8, 14, 0, 0, 0));
            expect(parseDateTime("12:00 pm", "time", base)).toEqual(new Date(2026, 8, 14, 12, 0, 0));
        });

        it("refuses an hour or a minute off the end of the clock", () => {
            expect(parseDateTime("24:00", "time", base)).toBeUndefined();
            expect(parseDateTime("9:60", "time", base)).toBeUndefined();
            expect(parseDateTime("9:30:60", "time", base)).toBeUndefined();
            // 0 and 13 are hours, but not on a 12-hour clock.
            expect(parseDateTime("0:30 pm", "time", base)).toBeUndefined();
            expect(parseDateTime("13:30 pm", "time", base)).toBeUndefined();
        });
    });

    describe("parseDateTime — datetimes", () => {
        it("reads a date and a time, separated by a space or by a T", () => {
            expect(parseDateTime("2026-09-14 09:30", "datetime")).toEqual(new Date(2026, 8, 14, 9, 30, 0));
            expect(parseDateTime("2026-09-14T09:30:05", "datetime")).toEqual(new Date(2026, 8, 14, 9, 30, 5));
        });

        // The meridiem splits off as a word of its own, so the time part is everything after the date.
        it("reads a meridiem that arrives as a separate word", () => {
            expect(parseDateTime("2026-09-14 9 pm", "datetime")).toEqual(new Date(2026, 8, 14, 21, 0, 0));
        });

        it("keeps the clock the field already held when the text names only a day", () => {
            const base = new Date(2026, 0, 2, 7, 45, 0);
            expect(parseDateTime("2026-09-14", "datetime", base)).toEqual(new Date(2026, 8, 14, 7, 45, 0));
        });

        it("falls back to midnight when there is no clock anywhere", () => {
            expect(parseDateTime("2026-09-14", "datetime")).toEqual(new Date(2026, 8, 14));
        });

        it("refuses a good date with a bad time", () => {
            expect(parseDateTime("2026-09-14 25:00", "datetime")).toBeUndefined();
            expect(parseDateTime("nope 09:30", "datetime")).toBeUndefined();
        });
    });

    describe("the month grid", () => {
        it("always draws six weeks, so the panel never changes height between months", () => {
            expect(monthGrid(new Date(2026, 8, 1), 1)).toHaveLength(42);
            // February 2026 starts on a Sunday and is exactly four weeks long.
            expect(monthGrid(new Date(2026, 1, 1), 1)).toHaveLength(42);
            expect(monthWeeks(new Date(2026, 8, 1), 1)).toHaveLength(6);
            expect(monthWeeks(new Date(2026, 8, 1), 1)[0]).toHaveLength(7);
        });

        it("starts on the week the month's first day falls in", () => {
            // 1 September 2026 is a Tuesday, so a Monday week reaches back one day.
            expect(monthGrid(new Date(2026, 8, 1), 1)[0]).toEqual(new Date(2026, 7, 31));
            // ...and a Sunday week reaches back two.
            expect(monthGrid(new Date(2026, 8, 1), 0)[0]).toEqual(new Date(2026, 7, 30));
        });

        it("runs on into the following month", () => {
            const grid = monthGrid(new Date(2026, 8, 1), 1);
            expect(grid[grid.length - 1]).toEqual(new Date(2026, 9, 11));
        });

        it("zeroes the clock on every cell, so a day compares as a day", () => {
            expect(monthGrid(new Date(2026, 8, 1), 1).every((d) => d.getHours() === 0)).toBe(true);
        });

        it("rotates the column headings to the week's first day", () => {
            expect(weekdayInitials(1)).toEqual(["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]);
            expect(weekdayInitials(0)).toEqual(["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]);
            // An unset or out-of-range prop shifts the columns rather than emptying the grid.
            expect(weekdayInitials(undefined)).toEqual(weekdayInitials(1));
            expect(weekdayInitials(7)).toEqual(weekdayInitials(0));
        });

        it("finds the first column's day for whatever week a day is in", () => {
            expect(startOfWeek(MONDAY, 1)).toEqual(new Date(2026, 8, 14));
            expect(startOfWeek(MONDAY, 0)).toEqual(new Date(2026, 8, 13));
        });
    });

    describe("arithmetic", () => {
        it("clamps a month step to the length of the month it lands in", () => {
            expect(addMonths(new Date(2026, 0, 31), 1)).toEqual(new Date(2026, 1, 28));
            expect(addMonths(new Date(2024, 0, 31), 1)).toEqual(new Date(2024, 1, 29));
            expect(addMonths(new Date(2026, 0, 15), -1)).toEqual(new Date(2025, 11, 15));
        });

        it("keeps the clock across a month step", () => {
            expect(addMonths(MONDAY, 1)).toEqual(new Date(2026, 9, 14, 9, 5, 30));
        });

        it("counts the days in a month, leap years included", () => {
            expect(daysInMonth(2026, 1)).toBe(28);
            expect(daysInMonth(2024, 1)).toBe(29);
            expect(daysInMonth(2026, 8)).toBe(30);
        });

        it("takes the day from one value and the clock from the other", () => {
            expect(withDatePart(MONDAY, new Date(2027, 0, 2))).toEqual(new Date(2027, 0, 2, 9, 5, 30));
            expect(withTimePart(MONDAY, 23, 0, 0)).toEqual(new Date(2026, 8, 14, 23, 0, 0));
        });

        it("reads a missing clock as midnight rather than as an invalid date", () => {
            expect(withDatePart(undefined, new Date(2027, 0, 2))).toEqual(new Date(2027, 0, 2));
        });

        it("compares days and months without their clocks", () => {
            expect(isSameDay(MONDAY, new Date(2026, 8, 14, 23, 59))).toBe(true);
            expect(isSameDay(MONDAY, new Date(2026, 8, 15))).toBe(false);
            expect(isSameDay(MONDAY, undefined)).toBe(false);
            expect(isSameMonth(MONDAY, new Date(2026, 8, 1))).toBe(true);
            expect(isSameMonth(MONDAY, new Date(2025, 8, 14))).toBe(false);
        });

        it("strips a value back to its day or its month", () => {
            expect(startOfDay(MONDAY)).toEqual(new Date(2026, 8, 14));
            expect(startOfMonth(MONDAY)).toEqual(new Date(2026, 8, 1));
        });

        it("knows a date it can work with from one it cannot", () => {
            expect(isValidDate(MONDAY)).toBe(true);
            expect(isValidDate(INVALID)).toBe(false);
            expect(isValidDate(undefined)).toBe(false);
        });
    });

    describe("bounds", () => {
        const min = new Date(2026, 8, 10, 9, 0);
        const max = new Date(2026, 8, 20, 17, 0);

        // Day to day, not instant to instant: a max of 20 September 17:00 still leaves the 20th
        // choosable, and the clamp on commit is what keeps the time itself inside.
        it("counts a bound's own day as choosable", () => {
            expect(isDayInRange(new Date(2026, 8, 10), min, max)).toBe(true);
            expect(isDayInRange(new Date(2026, 8, 20), min, max)).toBe(true);
            expect(isDayInRange(new Date(2026, 8, 9), min, max)).toBe(false);
            expect(isDayInRange(new Date(2026, 8, 21), min, max)).toBe(false);
        });

        it("leaves every day choosable when there is no bound on that side", () => {
            expect(isDayInRange(new Date(1999, 0, 1), undefined, max)).toBe(true);
            expect(isDayInRange(new Date(2099, 0, 1), min, undefined)).toBe(true);
        });

        it("pulls a value inside the bounds, and leaves one that already is", () => {
            expect(clampDateTime(new Date(2026, 8, 1), min, max)).toEqual(min);
            expect(clampDateTime(new Date(2026, 8, 30), min, max)).toEqual(max);
            expect(clampDateTime(new Date(2026, 8, 15), min, max)).toEqual(new Date(2026, 8, 15));
            expect(clampDateTime(undefined, min, max)).toBeUndefined();
        });
    });

    describe("labels", () => {
        it("names a month and a day in full, for a heading and for a screen reader", () => {
            expect(monthLabel(MONDAY)).toBe("September 2026");
            expect(dayLabel(MONDAY)).toBe("Monday, 14 September 2026");
        });
    });
});
