import { describe, expect, it } from "vitest";
import {
    addMonths, clampDateTime, dateTimePattern, dayLabel, daysInMonth, formatBy, formatDateTime,
    formatHasSeconds, formatIsTwelveHour, formatTokens, isDayInRange, isSameDay, isSameMonth,
    isValidDate, monthGrid, monthLabel, monthWeeks, parseBy, parseDateTime, parseFormat, startOfDay,
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
            expect(dateTimePattern("time", false)).toBe("HH:mm");
            expect(dateTimePattern("time", true)).toBe("HH:mm:ss");
            expect(dateTimePattern("datetime", false)).toBe("YYYY-MM-DD HH:mm");
            expect(dateTimePattern("datetime", true)).toBe("YYYY-MM-DD HH:mm:ss");
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

    describe("parseFormat", () => {
        it("cuts a pattern into its tokens and the literals between them", () => {
            expect(parseFormat("DD/MM/YYYY")).toEqual([
                { kind: "token", token: "DD" },
                { kind: "literal", text: "/" },
                { kind: "token", token: "MM" },
                { kind: "literal", text: "/" },
                { kind: "token", token: "YYYY" }
            ]);
        });

        // Longest-first, or a four-digit year would read as two two-digit ones.
        it("prefers the longest token that fits", () => {
            expect(formatTokens("YYYY MMMM DD")).toEqual(["YYYY", "MMMM", "DD"]);
            expect(formatTokens("YY MMM D")).toEqual(["YY", "MMM", "D"]);
        });

        // "HHhmm" cannot mean 14h30, because `h` is the 12-hour token.
        it("takes bracketed text as a literal even when it reads as a token", () => {
            expect(formatTokens("HH[h]mm")).toEqual(["HH", "mm"]);
            expect(parseFormat("HH[h]mm")[1]).toEqual({ kind: "literal", text: "h" });
        });

        it("reports what a pattern counts", () => {
            expect(formatHasSeconds("HH:mm")).toBe(false);
            expect(formatHasSeconds("HH:mm:ss")).toBe(true);
            expect(formatHasSeconds("H:m:s")).toBe(true);
            expect(formatIsTwelveHour("HH:mm")).toBe(false);
            expect(formatIsTwelveHour("h:mm A")).toBe(true);
            expect(formatIsTwelveHour("hh:mm a")).toBe(true);
        });
    });

    describe("formatBy", () => {
        // 4 July 2026 is a Saturday; 14:05:09 exercises both the padded and the bare tokens, and
        // an afternoon hour exercises the 12-hour ones.
        const AFTERNOON = new Date(2026, 6, 4, 14, 5, 9);

        it.each([
            ["YYYY", "2026"],
            ["YY", "26"],
            ["MMMM", "July"],
            ["MMM", "Jul"],
            ["MM", "07"],
            ["M", "7"],
            ["DD", "04"],
            ["D", "4"],
            ["HH", "14"],
            ["H", "14"],
            ["hh", "02"],
            ["h", "2"],
            ["mm", "05"],
            ["m", "5"],
            ["ss", "09"],
            ["s", "9"],
            ["A", "PM"],
            ["a", "pm"]
        ])("writes %s as %s", (pattern, text) => {
            expect(formatBy(AFTERNOON, pattern)).toBe(text);
        });

        it.each([
            ["YYYY-MM-DD", "2026-07-04"],
            ["DD/MM/YYYY", "04/07/2026"],
            ["MM/DD/YYYY", "07/04/2026"],
            ["D MMM YYYY", "4 Jul 2026"],
            ["MMMM D, YYYY", "July 4, 2026"],
            ["D.M.YY", "4.7.26"],
            ["h:mm A", "2:05 PM"],
            ["hh:mm:ss a", "02:05:09 pm"],
            ["HH[h]mm", "14h05"],
            ["MMM D, YYYY h:mm A", "Jul 4, 2026 2:05 PM"]
        ])("writes the whole of %s as %s", (pattern, text) => {
            expect(formatBy(AFTERNOON, pattern)).toBe(text);
        });

        it("writes midnight and noon as 12 on a 12-hour clock", () => {
            expect(formatBy(new Date(2026, 6, 4, 0, 30), "h:mm A")).toBe("12:30 AM");
            expect(formatBy(new Date(2026, 6, 4, 12, 30), "h:mm A")).toBe("12:30 PM");
        });

        it("writes an empty string for a missing or unusable value", () => {
            expect(formatBy(undefined, "YYYY-MM-DD")).toBe("");
            expect(formatBy(INVALID, "YYYY-MM-DD")).toBe("");
        });

        // The canonical writer is formatBy over the canonical pattern, so the two cannot drift.
        it("agrees with the canonical writer on the canonical pattern", () => {
            for (const mode of ["date", "time", "datetime"] as const) {
                for (const seconds of [false, true]) {
                    expect(formatDateTime(AFTERNOON, mode, seconds))
                        .toBe(formatBy(AFTERNOON, dateTimePattern(mode, seconds)));
                }
            }
        });
    });

    describe("parseBy", () => {
        it.each([
            ["DD/MM/YYYY", "04/07/2026"],
            ["MM/DD/YYYY", "07/04/2026"],
            ["D MMM YYYY", "4 Jul 2026"],
            ["MMMM D, YYYY", "July 4, 2026"],
            ["D.M.YY", "4.7.26"]
        ])("reads back what %s wrote", (pattern, text) => {
            expect(parseBy(text, pattern)).toEqual(new Date(2026, 6, 4));
        });

        // 03/04 is a different day either side of the Atlantic, and the pattern is what decides.
        it("reads an ambiguous date the way its own pattern says", () => {
            expect(parseBy("03/04/2026", "DD/MM/YYYY")).toEqual(new Date(2026, 3, 3));
            expect(parseBy("03/04/2026", "MM/DD/YYYY")).toEqual(new Date(2026, 2, 4));
        });

        it("takes one digit where the pattern writes two", () => {
            expect(parseBy("4/7/2026", "DD/MM/YYYY")).toEqual(new Date(2026, 6, 4));
        });

        // -, / and . are a habit, not a different date.
        it("takes any of the separators for the one the pattern names", () => {
            expect(parseBy("04-07-2026", "DD/MM/YYYY")).toEqual(new Date(2026, 6, 4));
            expect(parseBy("04.07.2026", "DD/MM/YYYY")).toEqual(new Date(2026, 6, 4));
        });

        it("is free about spacing and about the case of a name", () => {
            expect(parseBy("  4   jul   2026 ", "D MMM YYYY")).toEqual(new Date(2026, 6, 4));
            expect(parseBy("4 JULY 2026", "D MMM YYYY")).toEqual(new Date(2026, 6, 4));
        });

        it("matches a month name on its prefix, whichever name token asked", () => {
            expect(parseBy("4 Sept 2026", "D MMM YYYY")).toEqual(new Date(2026, 8, 4));
            expect(parseBy("4 Sep 2026", "D MMMM YYYY")).toEqual(new Date(2026, 8, 4));
        });

        it("reads a 12-hour clock, with the meridiem written any of the usual ways", () => {
            expect(parseBy("2:05 PM", "h:mm A", MONDAY)).toEqual(new Date(2026, 8, 14, 14, 5));
            expect(parseBy("2:05pm", "h:mm A", MONDAY)).toEqual(new Date(2026, 8, 14, 14, 5));
            expect(parseBy("2:05 p.m.", "h:mm A", MONDAY)).toEqual(new Date(2026, 8, 14, 14, 5));
            expect(parseBy("12:05 AM", "h:mm A", MONDAY)).toEqual(new Date(2026, 8, 14, 0, 5));
        });

        it("splits two-digit years at 69, so 26 is this century and 90 the last", () => {
            expect(parseBy("4.7.26", "D.M.YY").getFullYear()).toBe(2026);
            expect(parseBy("4.7.68", "D.M.YY").getFullYear()).toBe(2068);
            expect(parseBy("4.7.69", "D.M.YY").getFullYear()).toBe(1969);
            expect(parseBy("4.7.90", "D.M.YY").getFullYear()).toBe(1990);
        });

        it("reads a bracketed literal as the character it stands for", () => {
            expect(parseBy("14h05", "HH[h]mm", MONDAY)).toEqual(new Date(2026, 8, 14, 14, 5));
        });

        it("takes the day from the base when the pattern names only a clock", () => {
            expect(parseBy("14:05", "HH:mm", MONDAY)).toEqual(new Date(2026, 8, 14, 14, 5));
        });

        // ...and the clock from the base when the pattern names only a day, so correcting the day
        // of an appointment does not silently move it to midnight.
        it("takes the clock from the base when the pattern names only a day", () => {
            expect(parseBy("01/10/2026", "DD/MM/YYYY", MONDAY)).toEqual(new Date(2026, 9, 1, 9, 5, 30));
        });

        // A pattern that counts to the minute means :00, not whatever second was left over.
        it("zeroes the seconds when the pattern names a clock without them", () => {
            expect(parseBy("14:05", "HH:mm", MONDAY)).toEqual(new Date(2026, 8, 14, 14, 5, 0));
        });

        it("refuses text the pattern cannot account for", () => {
            expect(parseBy("2026-07-04", "DD/MM/YYYY")).toBeUndefined();
            expect(parseBy("4 Jul", "D MMM YYYY")).toBeUndefined();
            expect(parseBy("4 Foo 2026", "D MMM YYYY")).toBeUndefined();
            expect(parseBy("nonsense", "DD/MM/YYYY")).toBeUndefined();
            expect(parseBy("", "DD/MM/YYYY")).toBeUndefined();
        });

        it("refuses a day the month does not have, and a clock off the end of the day", () => {
            expect(parseBy("31/02/2026", "DD/MM/YYYY")).toBeUndefined();
            expect(parseBy("25:00", "HH:mm")).toBeUndefined();
            expect(parseBy("14:60", "HH:mm")).toBeUndefined();
            // 13 is an hour, but not on a 12-hour clock.
            expect(parseBy("13:05 PM", "h:mm A")).toBeUndefined();
            expect(parseBy("13:05", "h:mm")).toBeUndefined();
        });

        it("refuses a pattern that names nothing at all", () => {
            expect(parseBy("whatever", "")).toBeUndefined();
            expect(parseBy("-/-", "[-]/[-]")).toBeUndefined();
        });
    });

    describe("labels", () => {
        it("names a month and a day in full, for a heading and for a screen reader", () => {
            expect(monthLabel(MONDAY)).toBe("September 2026");
            expect(dayLabel(MONDAY)).toBe("Monday, 14 September 2026");
        });
    });
});
