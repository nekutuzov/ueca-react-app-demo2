// The picker's arithmetic: text in, text out, and the month grid. Everything here is a pure
// function of its arguments, kept out of the component so a parsing rule can be tested as a
// statement about strings rather than through a rendered calendar.
//
// LOCAL TIME throughout. A Date carries an instant, and this file only ever reads and writes its
// local fields — which is what a user picking "14 September, 09:30" means. Nothing converts to UTC.
//
// Month and weekday names are English constants rather than Intl.DateTimeFormat output. The app is
// English everywhere else, and a name taken from the host's locale would render a different
// calendar on a different machine — the tests included.

// What the field edits. The mode decides the text format, what the panel shows, and whether
// clicking a day is the end of the interaction.
type DateTimeMode = "date" | "time" | "datetime";

// The parts a time string is read into, before it is put on a day.
type TimeParts = { hours: number; minutes: number; seconds: number };

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// Indexed by Date#getDay(), so Sunday leads whatever the week starts on.
const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKDAY_INITIALS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const DAYS_IN_WEEK = 7;
// Always six, never "as many as this month needs": a grid that grows a row between May and June
// would resize the panel under the pointer, and move the footer out from under a click.
const WEEKS_IN_GRID = 6;

// A date part: 2026-09-14, and the same with / or . between, which is what people actually type.
const DATE_PATTERN = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/;
// A time part: 9:30, 09:30:05, 9.30, 9 pm. Minutes and seconds optional; a bare "9" is 09:00.
const TIME_PATTERN = /^(\d{1,2})(?:[:.](\d{1,2}))?(?:[:.](\d{1,2}))?\s*([ap]\.?m?\.?)?$/i;

function isValidDate(value: Date): boolean {
    return value instanceof Date && !Number.isNaN(value.getTime());
}

function startOfDay(value: Date): Date {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function startOfMonth(value: Date): Date {
    return new Date(value.getFullYear(), value.getMonth(), 1);
}

function daysInMonth(year: number, monthIndex: number): number {
    // Day 0 of the next month is the last day of this one.
    return new Date(year, monthIndex + 1, 0).getDate();
}

function addDays(value: Date, days: number): Date {
    const next = new Date(value.getTime());
    next.setDate(next.getDate() + days);
    return next;
}

// Clamped to the target month's length, so 31 January plus one month is 28 February rather than
// rolling forward into March the way setMonth alone would.
function addMonths(value: Date, months: number): Date {
    const next = new Date(value.getFullYear(), value.getMonth() + months, 1);
    next.setDate(Math.min(value.getDate(), daysInMonth(next.getFullYear(), next.getMonth())));
    next.setHours(value.getHours(), value.getMinutes(), value.getSeconds(), 0);
    return next;
}

function isSameDay(a: Date, b: Date): boolean {
    if (!isValidDate(a) || !isValidDate(b)) {
        return false;
    }
    return a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate();
}

function isSameMonth(a: Date, b: Date): boolean {
    if (!isValidDate(a) || !isValidDate(b)) {
        return false;
    }
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

// The day from `day`, the clock from `time`. This is what clicking a date in datetime mode does:
// the hour the user already set stays where it is.
function withDatePart(time: Date, day: Date): Date {
    const base = isValidDate(time) ? time : startOfDay(day);
    return new Date(
        day.getFullYear(), day.getMonth(), day.getDate(),
        base.getHours(), base.getMinutes(), base.getSeconds(), 0
    );
}

function withTimePart(day: Date, hours: number, minutes: number, seconds: number): Date {
    return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, minutes, seconds, 0);
}

function monthLabel(value: Date): string {
    return `${MONTH_NAMES[value.getMonth()]} ${value.getFullYear()}`;
}

// The accessible name of a day cell, spelled out rather than abbreviated: the number alone ("14")
// is meaningless read aloud out of the grid.
function dayLabel(value: Date): string {
    return `${WEEKDAY_NAMES[value.getDay()]}, ${value.getDate()} ${MONTH_NAMES[value.getMonth()]} ${value.getFullYear()}`;
}

// Column headings, rotated so the week starts where `firstDayOfWeek` says (0 = Sunday).
function weekdayInitials(firstDayOfWeek: number): string[] {
    const start = _normalizeWeekStart(firstDayOfWeek);
    return Array.from({ length: DAYS_IN_WEEK }, (_, i) => WEEKDAY_INITIALS[(start + i) % DAYS_IN_WEEK]);
}

// The 42 days a month is drawn as, leading and trailing days of the neighbouring months included.
// Always the same length — see WEEKS_IN_GRID.
function monthGrid(viewMonth: Date, firstDayOfWeek: number): Date[] {
    const origin = startOfWeek(startOfMonth(viewMonth), firstDayOfWeek);
    return Array.from({ length: WEEKS_IN_GRID * DAYS_IN_WEEK }, (_, i) => startOfDay(addDays(origin, i)));
}

// The same days, cut into the six rows they are drawn as.
function monthWeeks(viewMonth: Date, firstDayOfWeek: number): Date[][] {
    const days = monthGrid(viewMonth, firstDayOfWeek);
    return Array.from({ length: WEEKS_IN_GRID }, (_, week) =>
        days.slice(week * DAYS_IN_WEEK, (week + 1) * DAYS_IN_WEEK));
}

// The first column's day for the week `value` falls in — where Home goes, and where the grid
// starts drawing a month.
function startOfWeek(value: Date, firstDayOfWeek: number): Date {
    const start = _normalizeWeekStart(firstDayOfWeek);
    const lead = (value.getDay() - start + DAYS_IN_WEEK) % DAYS_IN_WEEK;
    return startOfDay(addDays(value, -lead));
}

// Whether `day` is choosable under the bounds. A bound carries a clock of its own, so the
// comparison is made day to day: a max of 2026-09-14 09:00 still leaves the 14th choosable, and
// the clamp on commit is what keeps the time itself inside.
function isDayInRange(day: Date, min: Date, max: Date): boolean {
    if (isValidDate(min) && startOfDay(day) < startOfDay(min)) {
        return false;
    }
    if (isValidDate(max) && startOfDay(day) > startOfDay(max)) {
        return false;
    }
    return true;
}

function clampDateTime(value: Date, min: Date, max: Date): Date {
    if (!isValidDate(value)) {
        return value;
    }
    if (isValidDate(min) && value < min) {
        return new Date(min.getTime());
    }
    if (isValidDate(max) && value > max) {
        return new Date(max.getTime());
    }
    return value;
}

// The CANONICAL pattern for a mode — what a value is stored as, whatever the field displays. ISO
// order because it is the one form that is never ambiguous: 03/04 is a different day either side
// of the Atlantic, so a stored value must never be written that way.
function dateTimePattern(mode: DateTimeMode, secondsShown: boolean): string {
    const time = secondsShown ? "HH:mm:ss" : "HH:mm";
    switch (mode) {
        case "date":
            return "YYYY-MM-DD";
        case "time":
            return time;
        default:
            return `YYYY-MM-DD ${time}`;
    }
}

// The canonical writer — `formatBy` over the canonical pattern, so the two can never drift apart.
function formatDateTime(value: Date, mode: DateTimeMode, secondsShown: boolean): string {
    return formatBy(value, dateTimePattern(mode, secondsShown));
}

// Reads what the user typed, or returns undefined if it is not a date at all — the caller keeps
// the text and reports it, rather than silently replacing it with a guess.
//
// `base` supplies the half of the value the text does not carry: the day a time-only entry lands
// on, and the clock a datetime entry keeps when it names no time.
function parseDateTime(text: string, mode: DateTimeMode, base?: Date): Date {
    const trimmed = text?.trim();
    if (!trimmed) {
        return undefined;
    }

    switch (mode) {
        case "date":
            return _parseDate(trimmed);

        case "time": {
            const time = _parseTime(trimmed);
            const day = isValidDate(base) ? base : new Date();
            return time && withTimePart(day, time.hours, time.minutes, time.seconds);
        }

        default: {
            // "T" as well as a space, so a value pasted out of a log or an API reads back.
            const parts = trimmed.split(/[\sT]+/);
            const day = _parseDate(parts[0]);
            if (!day) {
                return undefined;
            }
            if (parts.length === 1) {
                // A date with no clock keeps the one already in the field, so correcting the day of
                // an appointment does not silently move it to midnight.
                return isValidDate(base) ? withDatePart(base, day) : day;
            }
            // parts[1..] rather than parts[1]: "2026-09-14 9 pm" splits the meridiem off on its own.
            const time = _parseTime(parts.slice(1).join(" "));
            return time && withTimePart(day, time.hours, time.minutes, time.seconds);
        }
    }
}

// Reads text without being told which mode wrote it: a datetime first (which covers a bare date),
// then a time. For re-reading a value whose field has just changed mode, where the text on hand
// and the format now wanted disagree by definition.
function parseAnyDateTime(text: string, base?: Date): Date {
    return parseDateTime(text, "datetime", base) ?? parseDateTime(text, "time", base);
}

// ============================================================================
// Patterns.
//
// A pattern is the day.js / moment vocabulary, because that is the one people already know:
//
//   YYYY 2026   YY 26                          MMMM September  MMM Sep   MM 09   M 9
//   DD 04       D 4                            HH 14  H 14     hh 02  h 2        A PM   a pm
//   mm 07       m 7                            ss 05  s 5
//
// Anything that is not a token is a literal, and text in [SQUARE BRACKETS] is a literal even when
// it looks like one — "HH[h]mm" is 14h30, which the bare "HHhmm" could not say, since `h` is the
// 12-hour token. The same trap waits for a stray `a`, `D` or `M` in a word.
//
// Reading back is deliberately LOOSER than writing: -, / and . are interchangeable, spacing is
// free, one digit is accepted where two are written, and a month name matches on its prefix. So a
// DD/MM/YYYY field takes "4/9/2026" as well as "04/09/2026". What it will NOT do is guess: a value
// the pattern cannot account for comes back undefined, and the caller keeps the text.
// ============================================================================

type FormatToken =
    | "YYYY" | "YY" | "MMMM" | "MMM" | "MM" | "M" | "DD" | "D"
    | "HH" | "H" | "hh" | "h" | "mm" | "m" | "ss" | "s" | "A" | "a";

type FormatPart =
    | { kind: "token"; token: FormatToken }
    | { kind: "literal"; text: string };

// Longest alternative first, or "YYYY" would be read as two "YY"s.
const FORMAT_TOKENS = /\[([^\]]*)\]|YYYY|YY|MMMM|MMM|MM|M|DD|D|HH|H|hh|h|mm|m|ss|s|A|a/g;

// Two-digit years, split the way everything else does: 00–68 is this century, 69–99 the last.
const SHORT_YEAR_PIVOT = 69;

// Cuts a pattern into the tokens it names and the literal text between them.
function parseFormat(pattern: string): FormatPart[] {
    const parts: FormatPart[] = [];
    let at = 0;

    // A fresh regex each call: the /g one above carries lastIndex between uses.
    const tokens = new RegExp(FORMAT_TOKENS.source, "g");
    for (let match = tokens.exec(pattern ?? ""); match; match = tokens.exec(pattern)) {
        if (match.index > at) {
            parts.push({ kind: "literal", text: pattern.slice(at, match.index) });
        }
        // Group 1 is set only for [bracketed] text, which is a literal however it reads.
        parts.push(match[1] !== undefined
            ? { kind: "literal", text: match[1] }
            : { kind: "token", token: match[0] as FormatToken });
        at = match.index + match[0].length;
    }

    if (at < (pattern?.length ?? 0)) {
        parts.push({ kind: "literal", text: pattern.slice(at) });
    }
    return parts;
}

function formatTokens(pattern: string): FormatToken[] {
    return parseFormat(pattern).filter((p) => p.kind === "token").map((p: { token: FormatToken }) => p.token);
}

function formatHasSeconds(pattern: string): boolean {
    return formatTokens(pattern).some((t) => t === "ss" || t === "s");
}

// Whether the pattern counts hours 1–12. Such a pattern should carry `A` or `a` as well, or
// nothing in it says which half of the day it means.
function formatIsTwelveHour(pattern: string): boolean {
    return formatTokens(pattern).some((t) => t === "hh" || t === "h");
}

function formatBy(value: Date, pattern: string): string {
    if (!isValidDate(value)) {
        return "";
    }
    return parseFormat(pattern)
        .map((part) => part.kind === "literal" ? part.text : _writeToken(value, part.token))
        .join("");
}

// Reads text written in `pattern`. `base` fills in whatever the pattern does not mention — the day
// under a time-only pattern, the clock under a date-only one — so retyping the day of an
// appointment does not silently move it to midnight.
function parseBy(text: string, pattern: string, base?: Date): Date {
    const trimmed = text?.trim();
    if (!trimmed) {
        return undefined;
    }

    const parts = parseFormat(pattern);
    const tokens = parts.filter((p) => p.kind === "token").map((p: { token: FormatToken }) => p.token);
    if (!tokens.length) {
        return undefined;
    }

    const source = parts
        .map((part) => part.kind === "literal" ? _literalSource(part.text) : _tokenSource(part.token))
        .join("");
    // Case-insensitive throughout, so "sep"/"SEP" and "pm"/"PM" both read.
    const match = new RegExp(`^\\s*${source}\\s*$`, "i").exec(trimmed);
    if (!match) {
        return undefined;
    }

    const read: _ReadFields = {};
    // `every` short-circuits, which is the point: a token the regex matched but that says nothing
    // real — "4 Foo 2026" against D MMM YYYY — must fail the whole read. Left to _buildDate's
    // fallbacks it would quietly become today's month.
    if (!tokens.every((token, index) => _readToken(read, token, match[index + 1]))) {
        return undefined;
    }
    return _buildDate(read, base);
}

export {
    DateTimeMode, TimeParts, FormatToken, FormatPart, MONTH_NAMES, WEEKDAY_NAMES, WEEKDAY_INITIALS,
    DAYS_IN_WEEK, WEEKS_IN_GRID,
    isValidDate, startOfDay, startOfMonth, daysInMonth, addDays, addMonths, isSameDay, isSameMonth,
    withDatePart, withTimePart, monthLabel, dayLabel, weekdayInitials, monthGrid, monthWeeks,
    startOfWeek, isDayInRange, clampDateTime, dateTimePattern, formatDateTime, parseDateTime,
    parseAnyDateTime,
    parseFormat, formatTokens, formatHasSeconds, formatIsTwelveHour, formatBy, parseBy
};

// Private helpers
function _normalizeWeekStart(firstDayOfWeek: number): number {
    // Tolerates an unset prop and a number off the end of the week, so a bad value shifts the
    // columns rather than emptying the grid.
    const start = Math.trunc(firstDayOfWeek ?? 1);
    return ((start % DAYS_IN_WEEK) + DAYS_IN_WEEK) % DAYS_IN_WEEK;
}

function _pad(value: number, width = 2): string {
    return String(value).padStart(width, "0");
}

function _twelveHour(hours: number): number {
    // Midnight and noon are 12, not 0 — the one pair the modulo does not give you.
    return hours % 12 || 12;
}

function _writeToken(value: Date, token: FormatToken): string {
    switch (token) {
        case "YYYY": return _pad(value.getFullYear(), 4);
        case "YY": return _pad(value.getFullYear() % 100);
        case "MMMM": return MONTH_NAMES[value.getMonth()];
        case "MMM": return MONTH_NAMES[value.getMonth()].slice(0, 3);
        case "MM": return _pad(value.getMonth() + 1);
        case "M": return String(value.getMonth() + 1);
        case "DD": return _pad(value.getDate());
        case "D": return String(value.getDate());
        case "HH": return _pad(value.getHours());
        case "H": return String(value.getHours());
        case "hh": return _pad(_twelveHour(value.getHours()));
        case "h": return String(_twelveHour(value.getHours()));
        case "mm": return _pad(value.getMinutes());
        case "m": return String(value.getMinutes());
        case "ss": return _pad(value.getSeconds());
        case "s": return String(value.getSeconds());
        case "A": return value.getHours() < 12 ? "AM" : "PM";
        default: return value.getHours() < 12 ? "am" : "pm";
    }
}

// What a token matches when read back. Wider than what it writes, on purpose: a field that insists
// on "04" where the user typed "4" is a field people fight.
function _tokenSource(token: FormatToken): string {
    switch (token) {
        case "YYYY": return "(\\d{4})";
        case "YY": return "(\\d{2})";
        case "MMMM":
        case "MMM": return "([A-Za-z]+)";
        case "A":
        case "a": return "([AaPp])\\.?[Mm]?\\.?";
        default: return "(\\d{1,2})";
    }
}

// Separators are read loosely: -, / and . are interchangeable (the difference between a European
// and an ISO habit, not between two dates), and spacing is free.
function _literalSource(text: string): string {
    return text.split("").map((ch) => {
        if (/\s/.test(ch)) {
            return "\\s*";
        }
        if (/[-/.]/.test(ch)) {
            return "[-/.]";
        }
        return ch.replace(/[\\^$*+?.()|[\]{}]/, "\\$&");
    }).join("");
}

// What a pattern read out of some text: only the fields it actually named.
type _ReadFields = {
    year?: number;
    month?: number;
    day?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
    twelveHour?: boolean;
    meridiem?: "a" | "p";
};

// False when the text matched the token's shape but means nothing — the only token that can fail
// this way is a month NAME, since every other one is pinned to digits by its own regex.
function _readToken(read: _ReadFields, token: FormatToken, text: string): boolean {
    switch (token) {
        case "YYYY":
            read.year = Number(text);
            break;
        case "YY": {
            const short = Number(text);
            read.year = short < SHORT_YEAR_PIVOT ? 2000 + short : 1900 + short;
            break;
        }
        case "MMMM":
        case "MMM":
            read.month = _readMonthName(text);
            if (read.month == null) {
                return false;
            }
            break;
        case "MM":
        case "M":
            read.month = Number(text);
            break;
        case "DD":
        case "D":
            read.day = Number(text);
            break;
        case "hh":
        case "h":
            read.twelveHour = true;
            read.hours = Number(text);
            break;
        case "HH":
        case "H":
            read.hours = Number(text);
            break;
        case "mm":
        case "m":
            read.minutes = Number(text);
            break;
        case "ss":
        case "s":
            read.seconds = Number(text);
            break;
        default:
            read.meridiem = text.toLowerCase() as "a" | "p";
            break;
    }
    return true;
}

// By prefix, so "Sep", "Sept" and "September" all land on the same month whichever token asked.
function _readMonthName(text: string): number {
    const wanted = text.toLowerCase();
    const index = MONTH_NAMES.findIndex((name) => name.toLowerCase().startsWith(wanted));
    return index < 0 ? undefined : index + 1;
}

// Assembles what the pattern read, over what `base` already held. Rejects on the same terms as the
// canonical parser: a day the month does not have, or a clock off the end of the day.
function _buildDate(read: _ReadFields, base: Date): Date {
    const fallback = isValidDate(base) ? base : undefined;
    const year = read.year ?? fallback?.getFullYear() ?? new Date().getFullYear();
    const month = read.month ?? (fallback ? fallback.getMonth() + 1 : new Date().getMonth() + 1);
    const day = read.day ?? fallback?.getDate() ?? new Date().getDate();

    if (month == null || month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month - 1)) {
        return undefined;
    }

    let hours = read.hours ?? fallback?.getHours() ?? 0;
    const minutes = read.minutes ?? (read.hours != null ? 0 : fallback?.getMinutes() ?? 0);
    // Seconds follow the minutes: a pattern that names a clock down to the minute means :00, not
    // whatever second the value happened to carry.
    const seconds = read.seconds ?? (read.hours != null ? 0 : fallback?.getSeconds() ?? 0);

    if (minutes > 59 || seconds > 59) {
        return undefined;
    }

    if (read.meridiem) {
        if (hours < 1 || hours > 12) {
            return undefined;
        }
        hours = hours % 12 + (read.meridiem === "p" ? 12 : 0);
    }
    else if (hours > 23 || (read.twelveHour && hours > 12)) {
        return undefined;
    }

    return new Date(year, month - 1, day, hours, minutes, seconds, 0);
}

// Rejects rather than rolls over: new Date(2026, 1, 31) is 3 March, and accepting "2026-02-31" as
// that would move the user's day without telling them.
function _parseDate(text: string): Date {
    const match = DATE_PATTERN.exec(text);
    if (!match) {
        return undefined;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month - 1)) {
        return undefined;
    }
    return new Date(year, month - 1, day);
}

function _parseTime(text: string): TimeParts {
    const match = TIME_PATTERN.exec(text);
    if (!match) {
        return undefined;
    }

    let hours = Number(match[1]);
    const minutes = match[2] ? Number(match[2]) : 0;
    const seconds = match[3] ? Number(match[3]) : 0;
    const meridiem = match[4]?.[0].toLowerCase();

    if (minutes > 59 || seconds > 59) {
        return undefined;
    }

    if (meridiem) {
        // A 12-hour reading, where 12am is midnight and 12pm is noon — the one pair that does not
        // follow the "add 12 for pm" rule.
        if (hours < 1 || hours > 12) {
            return undefined;
        }
        hours = hours % 12 + (meridiem === "p" ? 12 : 0);
    }
    else if (hours > 23) {
        return undefined;
    }

    return { hours, minutes, seconds };
}
