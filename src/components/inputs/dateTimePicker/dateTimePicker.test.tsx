import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DateTimePicker, TimePicker } from "@components";
import { mount, settle } from "@test";

// 14 September 2026 is a Monday, and the month it sits in starts on a Tuesday — so the grid has a
// leading day from August, which is what the "outside" tests need.
const MONDAY = "2026-09-14";
const MONDAY_MORNING = "2026-09-14 09:30";
const MONDAY_NOON = new Date(2026, 8, 14, 12, 0, 0);

function textbox(): HTMLInputElement {
    return screen.getByRole("textbox");
}

// By class, not by role: the toggle's accessible name changes as the panel opens, and most tests
// are not about the name.
function toggle(): HTMLElement {
    return document.querySelector(".dtp-toggle");
}

function panel(): HTMLElement {
    return screen.queryByRole("dialog");
}

function grid(): HTMLElement {
    return screen.queryByRole("grid");
}

function day(name: string): HTMLElement {
    return screen.getByRole("gridcell", { name });
}

function segment(name: string): HTMLElement {
    return screen.getByRole("spinbutton", { name });
}

function action(name: string): HTMLElement {
    return screen.getByRole("button", { name });
}

function helperText(): HTMLElement {
    return document.querySelector(".textfield-helper-text");
}

async function typeText(text: string) {
    await userEvent.clear(textbox());
    if (text) {
        await userEvent.type(textbox(), text);
    }
}

// Leaves the field, which is what commits the text.
async function leave() {
    await userEvent.click(document.body);
    await settle();
}

async function openPanel() {
    await userEvent.click(toggle());
    await settle();
}

// The clock the "today" and "now" rules are read against. Only Date is faked, so userEvent's own
// timers still run.
function freezeClock(at = MONDAY_NOON) {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(at);
}

describe("DateTimePicker", () => {
    describe("rendering", () => {
        it("renders a full-width TextField child with a calendar toggle and no panel", async () => {
            await mount(DateTimePicker, { id: "d", value: MONDAY });

            expect(document.getElementById("d")).toHaveClass("ueca-datetimepicker", "ueca-datetimepicker-fullwidth");
            expect(document.getElementById("d.input")).toHaveClass("ueca-textfield", "ueca-textfield-fullwidth");
            expect(textbox()).toHaveValue("2026-09-14");
            expect(toggle()).toHaveAttribute("aria-expanded", "false");
            expect(panel()).toBeNull();
        });

        it("hands an explicit width to its frame when not full-width", async () => {
            await mount(DateTimePicker, { id: "d", fullWidth: false, extent: { width: 240 } });

            expect(document.getElementById("d")).not.toHaveClass("ueca-datetimepicker-fullwidth");
            expect(document.getElementById("d.input").style.width).toBe("240px");
        });

        // The pattern is the most useful thing an empty box can say about what it will accept.
        it.each([
            ["date", false, "YYYY-MM-DD"],
            ["time", false, "HH:mm"],
            ["time", true, "HH:mm:ss"],
            ["datetime", false, "YYYY-MM-DD HH:mm"],
            ["datetime", true, "YYYY-MM-DD HH:mm:ss"]
        ] as const)("offers the %s pattern as its placeholder", async (mode, secondsShown, pattern) => {
            await mount(DateTimePicker, { id: "d", mode, secondsShown });
            expect(textbox()).toHaveAttribute("placeholder", pattern);
        });

        it("lets the owner replace the placeholder", async () => {
            await mount(DateTimePicker, { id: "d", placeholder: "when?" });
            expect(textbox()).toHaveAttribute("placeholder", "when?");
        });

        it("names the toggle for what it opens, and swaps the glyph for a clock in time mode", async () => {
            const { model } = await mount(DateTimePicker, { id: "d", mode: "time" });

            expect(action("Choose a time")).toBe(toggle());
            await openPanel();
            expect(action("Hide the clock")).toBe(toggle());
            expect(model.popover.open).toBe(true);
        });

        // The value IS the text — changing what the field edits re-reads it in the new format.
        it("re-reads the value when the field changes what it edits", async () => {
            const { model } = await mount(DateTimePicker, { id: "d", mode: "datetime" });
            model.value = MONDAY_MORNING;
            await settle();
            expect(textbox()).toHaveValue("2026-09-14 09:30");

            model.secondsShown = true;
            await settle();
            expect(model.value).toBe("2026-09-14 09:30:00");

            model.secondsShown = false;
            model.mode = "time";
            await settle();
            expect(model.value).toBe("09:30");
            expect(textbox()).toHaveValue("09:30");
        });

        it("empties the box when the owner clears the value", async () => {
            const { model } = await mount(DateTimePicker, { id: "d", value: MONDAY });

            model.value = undefined;
            await settle();

            expect(textbox()).toHaveValue("");
        });

        it("hands the value back as an instant, and takes one back", async () => {
            const { model } = await mount(DateTimePicker, { id: "d", mode: "datetime", value: MONDAY_MORNING });

            expect(model.valueAsDate()).toEqual(new Date(2026, 8, 14, 9, 30));

            model.setValueAsDate(new Date(2026, 9, 1, 17, 5));
            await settle();

            expect(model.value).toBe("2026-10-01 17:05");
        });
    });

    describe("typing", () => {
        it("commits the typed text on blur and reformats it", async () => {
            const onChange = vi.fn();
            const { model } = await mount(DateTimePicker, { id: "d", onChange });

            await typeText("2026/9/4");
            // Not committed per keystroke: the box holds what was typed until the field is left.
            expect(model.value).toBeUndefined();

            await leave();

            expect(model.value).toBe("2026-09-04");
            expect(textbox()).toHaveValue("2026-09-04");
            expect(onChange).toHaveBeenCalledOnce();
            expect(onChange).toHaveBeenCalledWith("2026-09-04", model);
        });

        it("commits on Enter, without waiting for the field to be left", async () => {
            const { model } = await mount(DateTimePicker, { id: "d", mode: "datetime" });

            await typeText("2026-09-14 21:05");
            await userEvent.keyboard("{Enter}");
            await settle();

            expect(model.value).toBe("2026-09-14 21:05");
        });

        // The whole point of parsing on commit rather than per keystroke: a half-typed date is not
        // a wrong date, and must not be reported as one while it is being typed.
        it("keeps text that is not a date and reports it, rather than guessing", async () => {
            const { model } = await mount(DateTimePicker, { id: "d", labelView: "Starts", value: MONDAY });

            await typeText("nonsense");
            await leave();

            expect(textbox()).toHaveValue("nonsense");
            expect(model.value).toBe(MONDAY);
            expect(model.isValid()).toBe(false);
            expect(helperText()).toHaveTextContent("Starts must look like YYYY-MM-DD");
        });

        it("clears a reported error as soon as the text changes again", async () => {
            const { model } = await mount(DateTimePicker, { id: "d", labelView: "Starts" });

            await typeText("nonsense");
            await leave();
            expect(model.isValid()).toBe(false);

            await userEvent.type(textbox(), "x");
            await settle();

            expect(model.isValid()).toBe(true);
        });

        it("clears the value when the box is emptied", async () => {
            const onChange = vi.fn();
            const { model } = await mount(DateTimePicker, { id: "d", value: MONDAY, onChange });

            await typeText("");
            await leave();

            expect(model.value).toBeUndefined();
            expect(onChange).toHaveBeenCalledWith(undefined, model);
        });

        it("clamps a typed value into the bounds", async () => {
            const { model } = await mount(DateTimePicker, { id: "d", min: "2026-09-10", max: "2026-09-20" });

            await typeText("2026-09-30");
            await leave();

            expect(model.value).toBe("2026-09-20");
        });

        // Typing "2026/9/4" over 2026-09-04 does not change the value, so onChange must not fire —
        // but the text still has to be tidied.
        it("reformats without reporting a change when the value is the same", async () => {
            const onChange = vi.fn();
            const { model } = await mount(DateTimePicker, { id: "d", value: "2026-09-04", onChange });

            await typeText("2026/9/4");
            await leave();

            expect(textbox()).toHaveValue("2026-09-04");
            expect(model.value).toBe("2026-09-04");
            expect(onChange).not.toHaveBeenCalled();
        });

        it("keeps the clock when only the day is retyped in datetime mode", async () => {
            const { model } = await mount(DateTimePicker, { id: "d", mode: "datetime", value: MONDAY_MORNING });

            await typeText("2026-10-01");
            await leave();

            expect(model.value).toBe("2026-10-01 09:30");
        });

        it("takes a 12-hour clock in a time field", async () => {
            const { model } = await mount(TimePicker, { id: "d" });

            await typeText("9:30 pm");
            await leave();

            expect(model.value).toBe("21:30");
        });
    });

    describe("formats", () => {
        it("shows the value in the format while storing it canonically", async () => {
            const { model } = await mount(DateTimePicker, { id: "d", format: "DD/MM/YYYY", value: MONDAY });

            expect(textbox()).toHaveValue("14/09/2026");
            expect(model.value).toBe("2026-09-14");
            expect(textbox()).toHaveAttribute("placeholder", "DD/MM/YYYY");
        });

        it.each([
            ["DD/MM/YYYY", "14/09/2026"],
            ["MM/DD/YYYY", "09/14/2026"],
            ["D MMM YYYY", "14 Sep 2026"],
            ["MMMM D, YYYY", "September 14, 2026"],
            ["D.M.YY", "14.9.26"]
        ])("writes the box in %s", async (format, text) => {
            await mount(DateTimePicker, { id: "d", format, value: MONDAY });
            expect(textbox()).toHaveValue(text);
        });

        it("commits what was typed in the field's own format", async () => {
            const onChange = vi.fn();
            const { model } = await mount(DateTimePicker, { id: "d", format: "DD/MM/YYYY", onChange });

            await typeText("4/7/2026");
            await leave();

            expect(model.value).toBe("2026-07-04");
            expect(textbox()).toHaveValue("04/07/2026");
            expect(onChange).toHaveBeenCalledWith("2026-07-04", model);
        });

        // 03/04 is a different day either side of the Atlantic; the format is what decides.
        it.each([
            ["DD/MM/YYYY", "2026-04-03"],
            ["MM/DD/YYYY", "2026-03-04"]
        ])("reads an ambiguous date the way %s says", async (format, expected) => {
            const { model } = await mount(DateTimePicker, { id: "d", format });

            await typeText("03/04/2026");
            await leave();

            expect(model.value).toBe(expected);
        });

        // The canonical form is never ambiguous, and it is what arrives from a log or an API, so a
        // formatted field takes it too.
        it("also takes the canonical form, whatever the format", async () => {
            const { model } = await mount(DateTimePicker, { id: "d", format: "DD/MM/YYYY" });

            await typeText("2026-07-04");
            await leave();

            expect(model.value).toBe("2026-07-04");
            expect(textbox()).toHaveValue("04/07/2026");
        });

        it("restyles the box when the format changes, and leaves the value alone", async () => {
            const { model } = await mount(DateTimePicker, { id: "d", value: MONDAY });
            expect(textbox()).toHaveValue("2026-09-14");

            model.format = "D MMM YYYY";
            await settle();

            expect(textbox()).toHaveValue("14 Sep 2026");
            expect(model.value).toBe("2026-09-14");
        });

        it("names the format in what it asks for", async () => {
            const { model } = await mount(DateTimePicker, { id: "d", labelView: "Starts", format: "DD/MM/YYYY" });

            await typeText("nonsense");
            await leave();

            expect(model.isValid()).toBe(false);
            expect(helperText()).toHaveTextContent("Starts must look like DD/MM/YYYY");
        });

        it("states a bound in the format too, rather than in the stored form", async () => {
            const { model } = await mount(DateTimePicker, {
                id: "d",
                labelView: "Starts",
                format: "DD/MM/YYYY",
                min: "2026-09-10"
            });

            await typeText("01/09/2026");
            await model.validate();
            await settle();

            expect(helperText()).toHaveTextContent("Starts cannot be earlier than 10/09/2026");
        });

        it("writes the box in the format when a day is picked from the calendar", async () => {
            const { model } = await mount(DateTimePicker, { id: "d", format: "D MMM YYYY", value: MONDAY });
            await openPanel();

            await userEvent.click(day("Thursday, 17 September 2026"));
            await settle();

            expect(model.value).toBe("2026-09-17");
            expect(textbox()).toHaveValue("17 Sep 2026");
        });

        // A format that names seconds is itself a request for them — the box and the value must
        // not disagree about whether this field counts that far.
        it("turns seconds on because the format asked for them", async () => {
            const { model } = await mount(DateTimePicker, {
                id: "d",
                mode: "datetime",
                format: "YYYY-MM-DD HH:mm:ss",
                value: "2026-09-14 09:30"
            });
            await openPanel();

            expect(model.value).toBe("2026-09-14 09:30:00");
            expect(textbox()).toHaveValue("2026-09-14 09:30:00");
            expect(segment("Second")).toHaveTextContent("00");
        });

        describe("a 12-hour clock", () => {
            it("writes the box on a 12-hour clock, midnight and noon included", async () => {
                const { update } = await mount(TimePicker, { id: "d", format: "h:mm A", value: "14:05" });
                expect(textbox()).toHaveValue("2:05 PM");

                await update({ id: "d", mode: "time", format: "h:mm A", value: "00:30" });
                expect(textbox()).toHaveValue("12:30 AM");

                await update({ id: "d", mode: "time", format: "h:mm A", value: "12:30" });
                expect(textbox()).toHaveValue("12:30 PM");
            });

            it("takes a 12-hour time typed in, and stores it on the 24-hour clock", async () => {
                const { model } = await mount(TimePicker, { id: "d", format: "h:mm A" });

                await typeText("2:05 pm");
                await leave();

                expect(model.value).toBe("14:05");
                expect(textbox()).toHaveValue("2:05 PM");
            });

            it("counts the panel's hour 1–12 and offers the AM/PM the hours need", async () => {
                await mount(TimePicker, { id: "d", format: "h:mm A", value: "14:05" });
                await openPanel();

                expect(segment("Hour")).toHaveTextContent("02");
                expect(segment("Hour")).toHaveAttribute("aria-valuenow", "2");
                expect(segment("Hour")).toHaveAttribute("aria-valuemin", "1");
                expect(segment("Hour")).toHaveAttribute("aria-valuemax", "12");
                expect(action("Afternoon, switch to morning")).toHaveTextContent("PM");
            });

            it("moves the value half a day when the meridiem is switched", async () => {
                const { model } = await mount(TimePicker, { id: "d", format: "h:mm A", value: "14:05" });
                await openPanel();

                await userEvent.click(action("Afternoon, switch to morning"));
                await settle();

                expect(model.value).toBe("02:05");
                expect(textbox()).toHaveValue("2:05 AM");
                expect(action("Morning, switch to afternoon")).toHaveTextContent("AM");
            });

            // Stepping moves the real hour, so the clock face rolls over and the half-day with it.
            it("carries the meridiem when the hour steps past noon", async () => {
                const { model } = await mount(TimePicker, { id: "d", format: "h:mm A", value: "11:05" });
                await openPanel();

                await userEvent.click(action("Increment hour"));
                await settle();

                expect(model.value).toBe("12:05");
                expect(textbox()).toHaveValue("12:05 PM");
            });

            // The panel's width is set from a count, not left to the content, because the ANCHOR
            // needs it before the panel renders — an anchor that does not match puts the panel
            // half its error off to one side. These are the arithmetic in _panelWidth, which
            // mirrors the measured parts in dateTimePicker.css.
            it.each([
                [{}, 176],
                [{ format: "h:mm A" }, 176],
                [{ secondsShown: true }, 178],
                [{ format: "h:mm:ss A" }, 215]
            ])("sizes the clock panel to the row it holds (%j)", async (params, width) => {
                await mount(TimePicker, { id: "d", value: "14:05", ...params });
                await openPanel();

                expect(document.querySelector(".dtp-panel")).toHaveStyle({ width: `${width}px` });
            });

            it("offers no AM/PM on a 24-hour field", async () => {
                await mount(TimePicker, { id: "d", value: "14:05" });
                await openPanel();

                expect(segment("Hour")).toHaveTextContent("14");
                expect(screen.queryByRole("button", { name: /switch to/ })).toBeNull();
            });
        });
    });

    describe("the calendar", () => {
        it("opens on the month of the value, with the value marked as chosen", async () => {
            await mount(DateTimePicker, { id: "d", value: MONDAY });

            await openPanel();

            expect(panel()).not.toBeNull();
            expect(grid()).toHaveAttribute("aria-label", "September 2026");
            expect(document.querySelector(".dtp-month-label")).toHaveTextContent("September 2026");
            expect(day("Monday, 14 September 2026")).toHaveClass("selected");
            expect(toggle()).toHaveAttribute("aria-expanded", "true");
        });

        it("draws six weeks, the neighbouring months' days marked as outside", async () => {
            await mount(DateTimePicker, { id: "d", value: MONDAY });
            await openPanel();

            expect(screen.getAllByRole("gridcell")).toHaveLength(42);
            expect(day("Monday, 31 August 2026")).toHaveClass("outside");
            expect(day("Tuesday, 1 September 2026")).not.toHaveClass("outside");
        });

        it("starts the week where firstDayOfWeek says", async () => {
            const { update } = await mount(DateTimePicker, { id: "d", value: MONDAY });
            await openPanel();
            expect(screen.getAllByRole("columnheader")[0]).toHaveTextContent("Mo");

            await update({ id: "d", value: MONDAY, firstDayOfWeek: 0 });
            expect(screen.getAllByRole("columnheader")[0]).toHaveTextContent("Su");
        });

        it("takes the clicked day and closes, in date mode", async () => {
            const onChange = vi.fn();
            const { model } = await mount(DateTimePicker, { id: "d", value: MONDAY, onChange });
            await openPanel();

            await userEvent.click(day("Thursday, 17 September 2026"));
            await settle();

            expect(model.value).toBe("2026-09-17");
            expect(textbox()).toHaveValue("2026-09-17");
            expect(onChange).toHaveBeenCalledOnce();
            expect(panel()).toBeNull();
        });

        // Two picks in a row: the value has to be replaceable, not only settable once.
        it("takes a second day over the first", async () => {
            const { model } = await mount(DateTimePicker, { id: "d", value: MONDAY });

            await openPanel();
            await userEvent.click(day("Thursday, 17 September 2026"));
            await settle();
            await openPanel();
            await userEvent.click(day("Friday, 25 September 2026"));
            await settle();

            expect(model.value).toBe("2026-09-25");
        });

        // Datetime mode still has a clock to set, so the click is not the end of the interaction.
        it("keeps the panel up in datetime mode, and keeps the time already set", async () => {
            const { model } = await mount(DateTimePicker, { id: "d", mode: "datetime", value: MONDAY_MORNING });
            await openPanel();

            await userEvent.click(day("Thursday, 17 September 2026"));
            await settle();

            expect(model.value).toBe("2026-09-17 09:30");
            expect(panel()).not.toBeNull();
        });

        it("walks the months without touching the value", async () => {
            const { model } = await mount(DateTimePicker, { id: "d", value: MONDAY });
            await openPanel();

            await userEvent.click(action("Next month"));
            await settle();
            expect(grid()).toHaveAttribute("aria-label", "October 2026");

            await userEvent.click(action("Previous month"));
            await userEvent.click(action("Previous month"));
            await settle();
            expect(grid()).toHaveAttribute("aria-label", "August 2026");
            expect(model.value).toBe(MONDAY);
        });

        it("makes the days outside the bounds unchoosable", async () => {
            const { model } = await mount(DateTimePicker, {
                id: "d",
                value: MONDAY,
                min: "2026-09-10",
                max: "2026-09-20 17:00"
            });
            await openPanel();

            expect(day("Wednesday, 9 September 2026")).toBeDisabled();
            expect(day("Thursday, 10 September 2026")).toBeEnabled();
            // A bound's own day stays choosable even when its clock is mid-day.
            expect(day("Sunday, 20 September 2026")).toBeEnabled();
            expect(day("Monday, 21 September 2026")).toBeDisabled();
            expect(model.value).toBe(MONDAY);
        });

        it("marks today, whichever day is chosen", async () => {
            freezeClock();
            await mount(DateTimePicker, { id: "d", value: "2026-09-17" });
            await openPanel();

            expect(day("Monday, 14 September 2026")).toHaveAttribute("aria-current", "date");
            expect(day("Thursday, 17 September 2026")).not.toHaveAttribute("aria-current");
        });

        it("opens on today when the field is empty", async () => {
            freezeClock();
            await mount(DateTimePicker, { id: "d" });

            await openPanel();

            expect(grid()).toHaveAttribute("aria-label", "September 2026");
            expect(day("Monday, 14 September 2026")).toHaveClass("focused");
            expect(day("Monday, 14 September 2026")).not.toHaveClass("selected");
        });

        it("closes on a second click of the toggle", async () => {
            await mount(DateTimePicker, { id: "d", value: MONDAY });

            await openPanel();
            expect(panel()).not.toBeNull();

            await userEvent.click(toggle());
            await settle();
            expect(panel()).toBeNull();
        });

        it("closes on Escape and on a click outside", async () => {
            await mount(DateTimePicker, { id: "d", value: MONDAY });

            await openPanel();
            await userEvent.keyboard("{Escape}");
            await settle();
            expect(panel()).toBeNull();

            await openPanel();
            await userEvent.click(document.body);
            await settle();
            expect(panel()).toBeNull();
        });
    });

    // Stepping ‹ › a month at a time is no way to reach 1987, so the heading is a way up: days to
    // the months of their year, months to a decade of years.
    describe("finding a year", () => {
        it("opens the months of the year from the heading, marking the one in the value", async () => {
            await mount(DateTimePicker, { id: "d", value: MONDAY });
            await openPanel();

            await userEvent.click(action("September 2026, choose a month"));
            await settle();

            expect(grid()).toHaveAttribute("aria-label", "Choose a month");
            expect(screen.getByRole("gridcell", { name: "September 2026" })).toHaveClass("selected");
            expect(screen.getAllByRole("gridcell")).toHaveLength(12);
            expect(document.querySelector(".dtp-month-label")).toHaveTextContent("2026");
        });

        it("opens a decade from the months' heading, with the strays either side marked as outside", async () => {
            await mount(DateTimePicker, { id: "d", value: MONDAY });
            await openPanel();
            await userEvent.click(action("September 2026, choose a month"));
            await settle();

            await userEvent.click(action("2026, choose a year"));
            await settle();

            expect(grid()).toHaveAttribute("aria-label", "Choose a year");
            // The heading names the DECADE; the grid shows a year either side of it to fill 4×3.
            expect(document.querySelector(".dtp-month-label")).toHaveTextContent("2020 – 2029");
            expect(screen.getAllByRole("gridcell")).toHaveLength(12);
            expect(screen.getByRole("gridcell", { name: "2026" })).toHaveClass("selected");
            expect(screen.getByRole("gridcell", { name: "2019" })).toHaveClass("outside");
            expect(screen.getByRole("gridcell", { name: "2030" })).toHaveClass("outside");
            expect(screen.getByRole("gridcell", { name: "2020" })).not.toHaveClass("outside");
        });

        // The heading at the top level is not a way further up, so it stops being a button.
        it("offers no way up from the years", async () => {
            await mount(DateTimePicker, { id: "d", value: MONDAY });
            await openPanel();
            await userEvent.click(action("September 2026, choose a month"));
            await userEvent.click(action("2026, choose a year"));
            await settle();

            expect(document.querySelector(".dtp-month-label-action")).toBeNull();
        });

        it.each([
            ["days", [], "Previous month", "Next month"],
            ["months", ["September 2026, choose a month"], "Previous year", "Next year"],
            ["years", ["September 2026, choose a month", "2026, choose a year"], "Previous years", "Next years"]
        ])("steps a %s page from the arrows", async (_level, drills, back, forward) => {
            await mount(DateTimePicker, { id: "d", value: MONDAY });
            await openPanel();
            for (const drill of drills) {
                await userEvent.click(action(drill));
            }
            await settle();

            expect(action(back)).toBeInTheDocument();
            expect(action(forward)).toBeInTheDocument();
        });

        it("walks a year at a time through the months, and a decade through the years", async () => {
            await mount(DateTimePicker, { id: "d", value: MONDAY });
            await openPanel();
            await userEvent.click(action("September 2026, choose a month"));
            await settle();

            await userEvent.click(action("Next year"));
            await settle();
            expect(document.querySelector(".dtp-month-label")).toHaveTextContent("2027");

            await userEvent.click(action("2027, choose a year"));
            await userEvent.click(action("Previous years"));
            await settle();
            expect(document.querySelector(".dtp-month-label")).toHaveTextContent("2010 – 2019");
        });

        // Two clicks from a day in 2026 to the same day in 2031 — the whole point of the drill-down.
        it("travels down through a year and a month back to the days", async () => {
            const { model } = await mount(DateTimePicker, { id: "d", value: MONDAY });
            await openPanel();

            await userEvent.click(action("September 2026, choose a month"));
            await userEvent.click(action("2026, choose a year"));
            await settle();
            await userEvent.click(screen.getByRole("gridcell", { name: "2021" }));
            await settle();

            expect(grid()).toHaveAttribute("aria-label", "Choose a month");
            expect(document.querySelector(".dtp-month-label")).toHaveTextContent("2021");

            await userEvent.click(screen.getByRole("gridcell", { name: "March 2021" }));
            await settle();

            expect(grid()).toHaveAttribute("aria-label", "March 2021");
            expect(day("Sunday, 14 March 2021")).toHaveClass("focused");
            // Travelling is not choosing: the value still waits for a day.
            expect(model.value).toBe(MONDAY);
        });

        it("clamps the focused day to the length of the month it lands in", async () => {
            await mount(DateTimePicker, { id: "d", value: "2026-01-31" });
            await openPanel();

            await userEvent.click(action("January 2026, choose a month"));
            await settle();
            await userEvent.click(screen.getByRole("gridcell", { name: "February 2026" }));
            await settle();

            expect(day("Saturday, 28 February 2026")).toHaveClass("focused");
        });

        it("always reopens on the days", async () => {
            await mount(DateTimePicker, { id: "d", value: MONDAY });
            await openPanel();
            await userEvent.click(action("September 2026, choose a month"));
            await settle();

            await userEvent.click(toggle());
            await openPanel();

            expect(grid()).toHaveAttribute("aria-label", "September 2026");
        });

        // The keyboard only ever works on days, so a key part-way through the journey lands back
        // where the keys mean something.
        it("drops back to the days when a key is pressed in a chooser", async () => {
            await mount(DateTimePicker, { id: "d", value: MONDAY });
            await userEvent.click(textbox());
            await openPanel();
            await userEvent.click(action("September 2026, choose a month"));
            await settle();

            await userEvent.keyboard("{ArrowRight}");
            await settle();

            expect(grid()).toHaveAttribute("aria-label", "September 2026");
            expect(day("Tuesday, 15 September 2026")).toHaveClass("focused");
        });
    });

    describe("press and hold", () => {
        // The repeat's own numbers, pinned here because they are what the control FEELS like: a
        // click must never start one, and once it does the value has to move at a usable rate.
        const DELAY = 400;
        const INTERVAL = 80;

        function hold(button: HTMLElement, ms: number) {
            vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval"] });
            fireEvent.mouseDown(button);
            if (ms) {
                act(() => { vi.advanceTimersByTime(ms); });
            }
        }

        function release(button: HTMLElement) {
            fireEvent.mouseUp(button);
            act(() => { vi.advanceTimersByTime(10_000); });
            vi.useRealTimers();
        }

        it("steps once on a press and keeps going once the press outlasts a click", async () => {
            const { model } = await mount(TimePicker, { id: "d", value: "09:30" });
            await openPanel();
            const up = action("Increment minute");

            hold(up, 0);
            expect(model.value).toBe("09:31");

            // The delay elapses, which only ARMS the repeat — the first tick is an interval later.
            act(() => { vi.advanceTimersByTime(DELAY); });
            expect(model.value).toBe("09:31");

            act(() => { vi.advanceTimersByTime(INTERVAL); });
            expect(model.value).toBe("09:32");

            act(() => { vi.advanceTimersByTime(3 * INTERVAL); });
            expect(model.value).toBe("09:35");

            release(up);
            expect(model.value).toBe("09:35");
        });

        it("stops the moment the button is released", async () => {
            const { model } = await mount(TimePicker, { id: "d", value: "09:30" });
            await openPanel();
            const up = action("Increment hour");

            hold(up, DELAY + 2 * INTERVAL);
            expect(model.value).toBe("12:30");

            release(up);
            expect(model.value).toBe("12:30");
        });

        it("stops when the pointer leaves the button mid-press", async () => {
            const { model } = await mount(TimePicker, { id: "d", value: "09:30" });
            await openPanel();
            const down = action("Decrement minute");

            hold(down, DELAY + INTERVAL);
            expect(model.value).toBe("09:28");

            fireEvent.mouseLeave(down);
            act(() => { vi.advanceTimersByTime(10_000); });
            vi.useRealTimers();

            expect(model.value).toBe("09:28");
        });

        // A timer that outlived its button would go on changing a value nobody is holding.
        it("stops when the panel closes under a held button", async () => {
            const { model } = await mount(TimePicker, { id: "d", value: "09:30" });
            await openPanel();

            hold(action("Increment minute"), DELAY + INTERVAL);
            expect(model.value).toBe("09:32");

            act(() => { model.popover.close(); });
            act(() => { vi.advanceTimersByTime(10_000); });
            vi.useRealTimers();

            expect(model.value).toBe("09:32");
        });

        it("also repeats on the calendar's month arrows", async () => {
            await mount(DateTimePicker, { id: "d", value: MONDAY });
            await openPanel();
            const next = action("Next month");

            hold(next, DELAY + 2 * INTERVAL);
            // One for the press, then two ticks.
            expect(grid()).toHaveAttribute("aria-label", "December 2026");

            release(next);
        });

        // A right-click is not a press-and-hold, and must not leave a timer running.
        it("ignores a press that is not the primary button", async () => {
            const { model } = await mount(TimePicker, { id: "d", value: "09:30" });
            await openPanel();

            fireEvent.mouseDown(action("Increment minute"), { button: 2 });
            await settle();

            expect(model.value).toBe("09:30");
        });
    });

    describe("the keyboard", () => {
        it("opens on Alt+ArrowDown and closes on Alt+ArrowUp, from the text box", async () => {
            await mount(DateTimePicker, { id: "d", value: MONDAY });
            await userEvent.click(textbox());

            await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");
            await settle();
            expect(panel()).not.toBeNull();

            await userEvent.keyboard("{Alt>}{ArrowUp}{/Alt}");
            await settle();
            expect(panel()).toBeNull();
        });

        // Focus never leaves the text box, so the arrows have to be caught on the way up.
        it.each([
            ["{ArrowRight}", "Tuesday, 15 September 2026"],
            ["{ArrowLeft}", "Sunday, 13 September 2026"],
            ["{ArrowDown}", "Monday, 21 September 2026"],
            ["{ArrowUp}", "Monday, 7 September 2026"],
            ["{Home}", "Monday, 14 September 2026"],
            ["{End}", "Sunday, 20 September 2026"]
        ])("moves the focused day on %s while the panel is open", async (key, expected) => {
            const { model } = await mount(DateTimePicker, { id: "d", value: MONDAY });
            await userEvent.click(textbox());
            await openPanel();

            await userEvent.keyboard(key);
            await settle();

            expect(day(expected)).toHaveClass("focused");
            // Moving is not choosing — the value waits for Enter.
            expect(model.value).toBe(MONDAY);
            // ...and nothing about it moved DOM focus: it is still on the control the user was on,
            // never on a day cell.
            expect(document.getElementById("d")).toContainElement(document.activeElement as HTMLElement);
            expect(document.activeElement).not.toHaveClass("dtp-day");
        });

        it("takes the focused day on Enter and closes", async () => {
            const { model } = await mount(DateTimePicker, { id: "d", value: MONDAY });
            await userEvent.click(textbox());
            await openPanel();

            await userEvent.keyboard("{ArrowRight}{Enter}");
            await settle();

            expect(model.value).toBe("2026-09-15");
            expect(panel()).toBeNull();
        });

        it("follows the focused day into the next month", async () => {
            await mount(DateTimePicker, { id: "d", value: "2026-09-30" });
            await userEvent.click(textbox());
            await openPanel();

            await userEvent.keyboard("{ArrowRight}");
            await settle();

            expect(grid()).toHaveAttribute("aria-label", "October 2026");
            expect(day("Thursday, 1 October 2026")).toHaveClass("focused");
        });

        it("pages by a month, and by a year with Shift", async () => {
            await mount(DateTimePicker, { id: "d", value: MONDAY });
            await userEvent.click(textbox());
            await openPanel();

            await userEvent.keyboard("{PageDown}");
            await settle();
            expect(grid()).toHaveAttribute("aria-label", "October 2026");

            await userEvent.keyboard("{Shift>}{PageUp}{/Shift}");
            await settle();
            expect(grid()).toHaveAttribute("aria-label", "October 2025");
        });

        // Closed, the arrows belong to the caret.
        it("leaves the arrows alone while the panel is closed", async () => {
            const { model } = await mount(DateTimePicker, { id: "d", value: MONDAY });
            await userEvent.click(textbox());

            await userEvent.keyboard("{ArrowRight}{ArrowDown}");
            await settle();

            expect(model.value).toBe(MONDAY);
            expect(panel()).toBeNull();
        });
    });

    describe("the time row", () => {
        it("shows a clock and no calendar in time mode", async () => {
            await mount(TimePicker, { id: "d", value: "09:30" });
            await openPanel();

            expect(grid()).toBeNull();
            expect(segment("Hour")).toHaveTextContent("09");
            expect(segment("Minute")).toHaveTextContent("30");
            expect(screen.queryByRole("spinbutton", { name: "Second" })).toBeNull();
        });

        it("adds the seconds segment when the field shows seconds", async () => {
            await mount(TimePicker, { id: "d", value: "09:30:05", secondsShown: true });
            await openPanel();

            expect(segment("Second")).toHaveTextContent("05");
        });

        it("shows both a calendar and a clock in datetime mode", async () => {
            await mount(DateTimePicker, { id: "d", mode: "datetime", value: MONDAY_MORNING });
            await openPanel();

            expect(grid()).not.toBeNull();
            expect(segment("Hour")).toHaveTextContent("09");
        });

        it("steps a segment from its own buttons", async () => {
            const { model } = await mount(TimePicker, { id: "d", value: "09:30" });
            await openPanel();

            await userEvent.click(action("Increment hour"));
            await settle();
            expect(model.value).toBe("10:30");

            await userEvent.click(action("Decrement minute"));
            await settle();
            expect(model.value).toBe("10:29");
            expect(textbox()).toHaveValue("10:29");
        });

        // A spinbutton on a clock wraps inside its own unit: stepping past 23 is midnight, not
        // tomorrow.
        it("wraps a segment without moving the day", async () => {
            const { model } = await mount(DateTimePicker, {
                id: "d",
                mode: "datetime",
                value: "2026-09-14 23:59"
            });
            await openPanel();

            await userEvent.click(action("Increment hour"));
            await userEvent.click(action("Increment minute"));
            await settle();

            expect(model.value).toBe("2026-09-14 00:00");
        });

        it("answers the arrows when a segment has focus, and leaves the calendar alone", async () => {
            const { model } = await mount(DateTimePicker, { id: "d", mode: "datetime", value: MONDAY_MORNING });
            await openPanel();

            segment("Hour").focus();
            await userEvent.keyboard("{ArrowUp}");
            await settle();

            expect(model.value).toBe("2026-09-14 10:30");
            // The root's own arrow handling must not also have walked the month.
            expect(day("Monday, 14 September 2026")).toHaveClass("focused");
        });

        it("carries the range a segment counts over, for a screen reader", async () => {
            await mount(TimePicker, { id: "d", value: "09:30" });
            await openPanel();

            expect(segment("Hour")).toHaveAttribute("aria-valuenow", "9");
            expect(segment("Hour")).toHaveAttribute("aria-valuemax", "23");
            expect(segment("Hour")).toHaveAttribute("aria-valuetext", "09");
            expect(segment("Minute")).toHaveAttribute("aria-valuemax", "59");
        });
    });

    describe("the footer", () => {
        it("sets today and closes, in date mode", async () => {
            freezeClock();
            const { model } = await mount(DateTimePicker, { id: "d" });
            await openPanel();

            await userEvent.click(action("Today"));
            await settle();

            expect(model.value).toBe(MONDAY);
            expect(panel()).toBeNull();
        });

        it("sets the current time and stays open, in datetime mode", async () => {
            freezeClock(new Date(2026, 8, 14, 9, 30, 45));
            const { model } = await mount(DateTimePicker, { id: "d", mode: "datetime" });
            await openPanel();

            await userEvent.click(action("Now"));
            await settle();

            // The seconds go with the milliseconds unless the field shows them — otherwise "Now"
            // would write a value the text cannot say.
            expect(model.value).toBe("2026-09-14 09:30");
            expect(panel()).not.toBeNull();
        });

        it("keeps the seconds when the field shows them", async () => {
            freezeClock(new Date(2026, 8, 14, 9, 30, 45));
            const { model } = await mount(TimePicker, { id: "d", secondsShown: true });
            await openPanel();

            await userEvent.click(action("Now"));
            await settle();

            expect(model.value).toBe("09:30:45");
        });

        it("clears the value and closes", async () => {
            const onChange = vi.fn();
            const { model } = await mount(DateTimePicker, { id: "d", value: MONDAY, onChange });
            await openPanel();

            await userEvent.click(action("Clear"));
            await settle();

            expect(model.value).toBeUndefined();
            expect(textbox()).toHaveValue("");
            expect(onChange).toHaveBeenCalledWith(undefined, model);
            expect(panel()).toBeNull();
        });

        it("offers nothing to clear on an empty field, and no Clear at all when it is refused", async () => {
            const { update } = await mount(DateTimePicker, { id: "d" });
            await openPanel();
            expect(action("Clear")).toBeDisabled();

            await update({ id: "d", clearable: false });
            expect(screen.queryByRole("button", { name: "Clear" })).toBeNull();
        });
    });

    describe("validation", () => {
        it("reports an empty required field by its label", async () => {
            const { model } = await mount(DateTimePicker, { id: "d", labelView: "Starts", required: true });

            await model.validate();
            await settle();

            expect(model.isValid()).toBe(false);
            expect(helperText()).toHaveTextContent("Starts cannot be empty");
        });

        it("passes a required field that holds a value", async () => {
            const { model } = await mount(DateTimePicker, { id: "d", labelView: "Starts", required: true, value: MONDAY });

            await model.validate();
            await settle();

            expect(model.isValid()).toBe(true);
        });

        it("reports text that is outside the bounds before it has been committed", async () => {
            const { model } = await mount(DateTimePicker, {
                id: "d",
                labelView: "Starts",
                min: "2026-09-10",
                max: "2026-09-20"
            });

            await typeText("2026-09-01");
            await model.validate();
            await settle();

            expect(helperText()).toHaveTextContent("Starts cannot be earlier than 2026-09-10");

            await typeText("2026-09-30");
            await model.validate();
            await settle();

            expect(helperText()).toHaveTextContent("Starts cannot be later than 2026-09-20");
        });

        it("shows an error the owner has decided on, over and above its own", async () => {
            await mount(DateTimePicker, {
                id: "d",
                value: MONDAY,
                error: true,
                helperTextView: "That slot is taken"
            });

            expect(document.getElementById("d.input")).toHaveClass("ueca-textfield-error");
            expect(helperText()).toHaveTextContent("That slot is taken");
        });
    });

    describe("disabled and read-only", () => {
        it.each(["disabled", "readOnly"] as const)("cannot be opened when %s", async (state) => {
            const { model } = await mount(DateTimePicker, { id: "d", value: MONDAY, [state]: true });

            expect(toggle()).toBeDisabled();
            await userEvent.click(textbox());
            await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");
            await settle();

            expect(panel()).toBeNull();
            expect(model.value).toBe(MONDAY);
        });

        it("leaves a read-only value in full ink, and a disabled one faded", async () => {
            const { update } = await mount(DateTimePicker, { id: "d", value: MONDAY, readOnly: true });
            expect(document.getElementById("d.input")).toHaveClass("ueca-textfield-readonly");

            await update({ id: "d", value: MONDAY, disabled: true });
            expect(document.getElementById("d.input")).toHaveClass("ueca-textfield-disabled");
        });
    });
});
