import * as UECA from "ueca-react";
import React from "react";
import {
    EditBaseModel, EditBaseParams, EditBaseStruct, Icon, PopoverModel, TextFieldModel, fieldLabelText,
    useEditBase, usePopover, useTextField
} from "@components";
import { asyncSafe } from "@core";
import {
    DAYS_IN_WEEK, DateTimeMode, addDays, addMonths, clampDateTime, dateTimePattern, dayLabel,
    formatDateTime, isDayInRange, isSameDay, isSameMonth, isValidDate, monthLabel, monthWeeks,
    parseAnyDateTime, parseDateTime, startOfDay, startOfMonth, startOfWeek, weekdayInitials,
    withDatePart, withTimePart
} from "./dateTimeFormat";
import "./dateTimePicker.css";

// DateTimePicker — one value, entered two ways.
//
// The TEXT BOX is the control: it can be typed into, it carries the label, the error and the
// helper line, and it is what a screen reader meets. The CALENDAR is a pointer convenience over
// the same value — which is why nothing in the panel is a tab stop that has to be tabbed through,
// and why a day cell suppresses its own mousedown.
//
// FOCUS NEVER LEAVES THE FIELD, the same decision Select records at length: the arrow keys are
// handled on this component's root, where a keystroke from the text box bubbles through, so
// moving around the month never moves focus and there is nothing to put back when the panel
// closes. The one exception is the time row, whose segments are real spinbuttons — they take
// focus, and they stop their own keys from reaching the calendar.
//
// Typed text is never half-applied. It is parsed on blur or on Enter, and a string that is not a
// date at all is KEPT in the box and reported through validation, rather than being replaced by a
// guess at what the user meant. See dateTimeFormat.ts for what counts as a date.
//
// THE VALUE IS TEXT, not a Date, and that is not a stylistic choice — a Date CANNOT be a reactive
// prop. ueca-react (3.0.2) decides whether a prop changed with a structural comparison that reads
// two non-null objects as equal when their own keys match; a Date has NO own keys, so any two
// Dates compare equal and the second assignment is silently dropped. It fails identically through
// a direct assignment, a binding and a JSX prop, so no amount of care at this end would fix it.
// Text is a primitive, so it simply works — and it carries its own invariant with it: the value is
// exactly what the box shows, in the format `dateTimePattern` names for the mode. `valueAsDate()`
// hands back a Date for anyone who wants to compute with it.

type TimeUnit = "hour" | "minute" | "second";

// Steps for the arrow keys inside the month grid: a week is seven days, so Up and Down are ±7.
const DAY_STEPS: Record<string, number> = {
    ArrowLeft: -1,
    ArrowRight: 1,
    ArrowUp: -7,
    ArrowDown: 7
};

// What each segment counts up to before it wraps.
const UNIT_RANGE: Record<TimeUnit, number> = {
    hour: 24,
    minute: 60,
    second: 60
};

// What a segment's own keys move it by: an arrow one step, a page ten.
const SEGMENT_STEPS: Record<string, number> = {
    ArrowUp: 1,
    ArrowDown: -1,
    PageUp: 10,
    PageDown: -10
};

const MONTHS_IN_YEAR = 12;

// The panel's width is a NUMBER here rather than only a CSS rule because the anchor needs it: an
// anchor as wide as the panel makes centring and left-aligning the same thing, which is how the
// panel lines up with the left edge of the field (the trick Select uses for its listbox).
const CALENDAR_PANEL_WIDTH = 256;
const TIME_PANEL_WIDTH = 176;

type DateTimePickerStruct = EditBaseStruct<{
    props: {
        // The committed value, as text in the mode's own format — see the header for why it is not
        // a Date. Undefined when the field is empty.
        value: string;
        // What is being edited: a day, a clock, or both. Decides the text format, what the panel
        // holds, and whether clicking a day finishes the job.
        mode: DateTimeMode;
        labelView: React.ReactNode;
        // Defaults to the mode's own pattern ("YYYY-MM-DD"), which is the most useful thing an
        // empty box can say about what it will accept.
        placeholder: string;
        disabled: boolean;
        readOnly: boolean;
        required: boolean;
        // An error the OWNER has decided on, over and above this field's own validation.
        error: boolean;
        helperTextView: React.ReactNode;
        fullWidth: boolean;
        // Bounds, as text again. Read leniently, so "2026-09-10" bounds a datetime field as
        // midnight on that day. Days outside them are unchoosable, and a typed value is clamped.
        min: string;
        max: string;
        // Seconds in the text and a third segment in the time row. Off by default: most fields
        // that want a time want a minute.
        secondsShown: boolean;
        // 0 = Sunday … 6 = Saturday. Monday by default.
        firstDayOfWeek: number;
        // The "Clear" action in the panel footer. The box can always be emptied by hand.
        clearable: boolean;

        // What is IN the box, which is not the value: it holds whatever has been typed until it
        // is committed, and survives being wrong.
        _text: string;
        // The month the grid is showing and the day the keyboard is on, as instants — primitives,
        // for the same reason the value is text. The focused day is not the selection: like
        // Select's _activeIndex it only becomes the value on Enter or a click.
        _viewMonthAt: number;
        _focusedDayAt: number;
        __rootRef: React.RefObject<HTMLDivElement>;
        __toggleRef: React.RefObject<HTMLButtonElement>;
    };

    children: {
        input: TextFieldModel;
        popover: PopoverModel;
    };

    events: {
        onChange: (value: string, source: DateTimePickerModel) => UECA.MaybePromise;
    };

    methods: {
        open: () => void;
        close: () => void;
        // The value as an instant, for an owner that has to compute with it.
        valueAsDate: () => Date;
        // ...and the way back in, which saves every caller from repeating the mode's format.
        setValueAsDate: (value: Date) => void;
        _PanelView: () => React.ReactElement;
        _CalendarView: () => React.ReactElement;
        _TimeView: () => React.ReactElement;
    };
}>;

type DateTimePickerParams = EditBaseParams<DateTimePickerStruct>;
type DateTimePickerModel = EditBaseModel<DateTimePickerStruct>;

function useDateTimePicker(params?: DateTimePickerParams): DateTimePickerModel {
    const struct: DateTimePickerStruct = {
        props: {
            id: useDateTimePicker.name,
            value: undefined,
            mode: "date",
            labelView: undefined,
            placeholder: undefined,
            disabled: false,
            readOnly: false,
            required: false,
            error: false,
            helperTextView: undefined,
            fullWidth: true,
            min: undefined,
            max: undefined,
            secondsShown: false,
            firstDayOfWeek: 1,
            clearable: true,

            _text: "",
            _viewMonthAt: undefined,
            _focusedDayAt: undefined,
            __rootRef: { current: null },
            __toggleRef: { current: null }
        },

        children: {
            input: useTextField({
                // Two-way, and the setter does more than store: typing is what makes a reported
                // error stale, so it is cleared here rather than on a commit the user has not
                // reached yet.
                value: UECA.bind(() => model._text, (text: string) => {
                    model._text = text;
                    model.resetValidationErrors();
                }),
                labelView: () => model.labelView,
                placeholder: () => model.placeholder ?? dateTimePattern(model.mode, model.secondsShown),
                disabled: () => model.disabled,
                readOnly: () => model.readOnly,
                required: () => model.required,
                fullWidth: () => model.fullWidth,
                extent: () => model.extent,
                error: () => model.error || !model.isValid(),
                helperTextView: () => model.isValid() ? model.helperTextView : model.getValidationError(),
                endView: () => _ToggleView(),
                onBlur: () => _commit(),
                // With the panel open Enter belongs to the focused day, and the root's key handler
                // has it — committing here as well would apply the typed text underneath.
                onEnter: () => {
                    if (!model.popover.open) {
                        _commit();
                    }
                }
            }),

            popover: usePopover({
                placement: "bottom",
                className: "ueca-datetimepicker-popover",
                // A mousedown on the toggle is not an outside click: without this the panel would
                // close before the toggle's own click ran, and the button could never shut it.
                onGetTrigger: () => model.__toggleRef.current,
                contentView: () => <model._PanelView />
            })
        },

        methods: {
            open: () => {
                _open();
            },

            close: () => {
                model.popover.close();
            },

            valueAsDate: () => _valueDate(),

            setValueAsDate: (value) => {
                _applyDate(value);
            },

            _PanelView: () => (
                <div
                    className="dtp-panel"
                    style={{ width: _panelWidth() }}
                    role="group"
                    aria-label={_panelLabel()}
                >
                    {_showsCalendar() && <model._CalendarView />}
                    {_showsTime() && <model._TimeView />}
                    <div className="dtp-footer">
                        {model.clearable && (
                            <button
                                type="button"
                                className="dtp-action"
                                disabled={!model.value}
                                onMouseDown={_keepFocus}
                                onClick={() => _clear()}
                            >
                                {"Clear"}
                            </button>
                        )}
                        <button
                            type="button"
                            className="dtp-action dtp-action-accent"
                            onMouseDown={_keepFocus}
                            onClick={() => _setToNow()}
                        >
                            {_nowLabel()}
                        </button>
                    </div>
                </div>
            ),

            _CalendarView: () => (
                <div className="dtp-calendar">
                    <div className="dtp-month">
                        <button
                            type="button"
                            className="dtp-month-step"
                            aria-label="Previous month"
                            onMouseDown={_keepFocus}
                            onClick={() => _shiftMonth(-1)}
                        >
                            <Icon name="chevronLeft" size="sm" />
                        </button>
                        <span className="dtp-month-label" aria-live="polite">
                            {monthLabel(_viewMonth())}
                        </span>
                        <button
                            type="button"
                            className="dtp-month-step"
                            aria-label="Next month"
                            onMouseDown={_keepFocus}
                            onClick={() => _shiftMonth(1)}
                        >
                            <Icon name="chevronRight" size="sm" />
                        </button>
                    </div>
                    {/* One grid, not a grid of rows: a row is `display: contents`, so its days
                        become direct grid children and every column lines up — the same mechanism
                        Table uses for its rows. */}
                    <div className="dtp-grid" role="grid" aria-label={monthLabel(_viewMonth())}>
                        <div className="dtp-week" role="row">
                            {weekdayInitials(model.firstDayOfWeek).map((day) => (
                                <span key={day} role="columnheader" className="dtp-weekday">{day}</span>
                            ))}
                        </div>
                        {monthWeeks(_viewMonth(), model.firstDayOfWeek).map((week) => (
                            <div key={week[0].getTime()} className="dtp-week" role="row">
                                {week.map((day) => (
                                    <button
                                        key={day.getTime()}
                                        id={_dayId(day)}
                                        type="button"
                                        role="gridcell"
                                        // Not a tab stop: the text box is the keyboard's way in,
                                        // and the arrows are handled on the root. Forty-two tab
                                        // stops would be a worse answer than the one that works.
                                        tabIndex={-1}
                                        className={_dayClass(day)}
                                        aria-label={dayLabel(day)}
                                        aria-selected={isSameDay(day, _valueDate())}
                                        aria-current={isSameDay(day, new Date()) ? "date" : undefined}
                                        disabled={!isDayInRange(day, _minDate(), _maxDate())}
                                        onMouseDown={_keepFocus}
                                        onClick={() => _clickDay(day)}
                                    >
                                        {day.getDate()}
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            ),

            _TimeView: () => (
                <div className="dtp-time" role="group" aria-label="Time">
                    {_SegmentView("hour")}
                    <span className="dtp-time-separator" aria-hidden="true">:</span>
                    {_SegmentView("minute")}
                    {model.secondsShown && <span className="dtp-time-separator" aria-hidden="true">:</span>}
                    {model.secondsShown && _SegmentView("second")}
                </div>
            )
        },

        events: {
            onInternalValidate: async () => {
                // `||`, not `??`, as in TextField: placeholder defaults to "" on the child, and
                // `??` would pass an empty name through to " cannot be empty".
                const fieldName = fieldLabelText(model.labelView) || model.placeholder || "This field";
                const text = model._text?.trim() ?? "";

                if (!text) {
                    return model.required ? `${fieldName} cannot be empty` : undefined;
                }

                const parsed = parseDateTime(text, model.mode, _valueDate());
                if (!parsed) {
                    return `${fieldName} must look like ${dateTimePattern(model.mode, model.secondsShown)}`;
                }
                if (isValidDate(_minDate()) && parsed < _minDate()) {
                    return `${fieldName} cannot be earlier than ${_formatted(_minDate())}`;
                }
                if (isValidDate(_maxDate()) && parsed > _maxDate()) {
                    return `${fieldName} cannot be later than ${_formatted(_maxDate())}`;
                }
            },

            // The owner setting the value from outside is what this is for: the box follows it.
            onChangeValue: () => {
                model._text = model.value ?? "";
                model.resetValidationErrors();
            },

            // A field that changes what it edits re-reads what it is holding in the new format —
            // and drops whatever the new format cannot say, which is the honest reading of "the
            // value is what the box shows".
            onChangeMode: () => {
                _reformatValue();
            },

            onChangeSecondsShown: () => {
                _reformatValue();
            }
        },

        init: () => {
            model._text = model.value ?? "";
        },

        // Reads NOTHING that changes while the panel is open — see the note in select.tsx: a main
        // View that re-renders would re-create <model.popover.View />, and React would unmount and
        // remount the panel, replaying its fade-in on every arrow key.
        View: () => (
            <div
                id={model.htmlId()}
                ref={model.__rootRef}
                className={"ueca-datetimepicker" + (model.fullWidth ? " ueca-datetimepicker-fullwidth" : "")}
                style={{ width: model.fullWidth ? "100%" : model.extent?.width }}
                onKeyDown={_handleKeyDown}
                onBlur={_handleBlur}
            >
                <model.input.View />
                <model.popover.View />
            </div>
        )
    };

    const model = useEditBase(struct, params);
    return model;

    // Private methods
    function _dayId(day: Date): string {
        return `${model.htmlId()}-day-${formatDateTime(day, "date", false)}`;
    }

    function _showsCalendar(): boolean {
        return model.mode !== "time";
    }

    function _showsTime(): boolean {
        return model.mode !== "date";
    }

    function _isEditable(): boolean {
        return !model.disabled && !model.readOnly;
    }

    function _formatted(value: Date): string {
        return formatDateTime(value, model.mode, model.secondsShown);
    }

    // The committed value as an instant. Read with the field's own mode, so a time-only value
    // lands on today and a datetime one keeps its day.
    function _valueDate(): Date {
        return parseDateTime(model.value, model.mode);
    }

    // Bounds are read LENIENTLY, so a datetime field can be bounded by a plain day.
    function _minDate(): Date {
        return parseAnyDateTime(model.min);
    }

    function _maxDate(): Date {
        return parseAnyDateTime(model.max);
    }

    function _panelWidth(): number {
        return _showsCalendar() ? CALENDAR_PANEL_WIDTH : TIME_PANEL_WIDTH;
    }

    function _panelLabel(): string {
        return model.mode === "time" ? "Choose a time" : "Choose a date";
    }

    function _nowLabel(): string {
        return model.mode === "date" ? "Today" : "Now";
    }

    // The day the panel opens on, and the day arithmetic falls back to when the field is empty:
    // today, pulled inside the bounds so an empty field does not open on an unchoosable month.
    function _baseDate(): Date {
        const value = _valueDate();
        if (isValidDate(value)) {
            return value;
        }
        return clampDateTime(startOfDay(new Date()), _minDate(), _maxDate());
    }

    function _viewMonth(): Date {
        return model._viewMonthAt != null ? new Date(model._viewMonthAt) : startOfMonth(_baseDate());
    }

    function _setViewMonth(month: Date) {
        model._viewMonthAt = startOfMonth(month).getTime();
    }

    function _focusedDay(): Date {
        return model._focusedDayAt != null ? new Date(model._focusedDayAt) : startOfDay(_baseDate());
    }

    function _setFocusedDay(day: Date) {
        model._focusedDayAt = startOfDay(day).getTime();
    }

    function _dayClass(day: Date): string {
        return "dtp-day"
            + (isSameMonth(day, _viewMonth()) ? "" : " outside")
            + (isSameDay(day, new Date()) ? " today" : "")
            + (isSameDay(day, _valueDate()) ? " selected" : "")
            + (isSameDay(day, _focusedDay()) ? " focused" : "");
    }

    // Every control inside the panel suppresses its own mousedown, so a click never blurs the text
    // box. That is what keeps focus in one place: there is no focus to restore when the panel
    // closes, and the field's own focus ring stays correct throughout.
    function _keepFocus(e: React.MouseEvent) {
        e.preventDefault();
    }

    function _ToggleView(): React.JSX.Element {
        const label = _toggleLabel();
        return (
            <button
                ref={model.__toggleRef}
                type="button"
                className="dtp-toggle"
                {...model.tooltipProps(label)}
                aria-label={label}
                aria-haspopup="dialog"
                aria-expanded={model.popover.open}
                disabled={!_isEditable()}
                onClick={() => _toggle()}
            >
                <Icon name={model.mode === "time" ? "clock" : "calendar"} size="md" />
            </button>
        );
    }

    function _toggleLabel(): string {
        if (model.popover.open) {
            return model.mode === "time" ? "Hide the clock" : "Hide the calendar";
        }
        return model.mode === "time" ? "Choose a time" : "Choose a date";
    }

    function _SegmentView(unit: TimeUnit): React.JSX.Element {
        return (
            <span key={unit} className="dtp-segment">
                <button
                    type="button"
                    tabIndex={-1}
                    className="dtp-segment-step"
                    aria-label={`Increment ${unit}`}
                    disabled={!_isEditable()}
                    onMouseDown={_keepFocus}
                    onClick={() => _stepTime(unit, 1)}
                >
                    <Icon name="chevronUp" size="xs" />
                </button>
                {/* A spinbutton rather than a text input: the panel's job is CHOOSING, and typing
                    a whole time is what the box above is for. That keeps the segment free of the
                    half-typed-value problem ("1" on the way to "14") and still leaves it keyboard
                    reachable, with the arrows it is expected to answer to. */}
                <span
                    className="dtp-segment-value"
                    role="spinbutton"
                    tabIndex={_isEditable() ? 0 : -1}
                    aria-label={_segmentLabel(unit)}
                    aria-valuenow={_segmentValue(unit)}
                    aria-valuemin={0}
                    aria-valuemax={UNIT_RANGE[unit] - 1}
                    aria-valuetext={_segmentText(unit)}
                    onKeyDown={(e) => _handleSegmentKeyDown(unit, e)}
                >
                    {_segmentText(unit)}
                </span>
                <button
                    type="button"
                    tabIndex={-1}
                    className="dtp-segment-step"
                    aria-label={`Decrement ${unit}`}
                    disabled={!_isEditable()}
                    onMouseDown={_keepFocus}
                    onClick={() => _stepTime(unit, -1)}
                >
                    <Icon name="chevronDown" size="xs" />
                </button>
            </span>
        );
    }

    function _segmentLabel(unit: TimeUnit): string {
        return unit.charAt(0).toUpperCase() + unit.slice(1);
    }

    function _segmentValue(unit: TimeUnit): number {
        const base = _baseDate();
        switch (unit) {
            case "hour":
                return base.getHours();
            case "minute":
                return base.getMinutes();
            default:
                return base.getSeconds();
        }
    }

    function _segmentText(unit: TimeUnit): string {
        return String(_segmentValue(unit)).padStart(2, "0");
    }

    function _open() {
        if (!_isEditable() || model.popover.open) {
            return;
        }

        const root = model.__rootRef.current;
        const toggle = model.__toggleRef.current;
        if (root && toggle) {
            const field = root.getBoundingClientRect();
            const trigger = toggle.getBoundingClientRect();
            // positionOverlay CENTRES the panel on its anchor, so an anchor as wide as the panel
            // and starting at the field's left edge puts the panel's left edge there too. The
            // vertical extent comes from the toggle, which sits in the field frame, so the panel
            // drops below the frame rather than below a helper line under it.
            model.popover.anchor = {
                top: trigger.top,
                left: field.left,
                width: _panelWidth(),
                height: trigger.height
            };
        }

        const base = _baseDate();
        _setViewMonth(base);
        _setFocusedDay(base);
        model.popover.open = true;
    }

    function _toggle() {
        if (model.popover.open) {
            model.popover.close();
            return;
        }
        _open();
    }

    function _shiftMonth(delta: number) {
        _setViewMonth(addMonths(_viewMonth(), delta));
        // The focused day follows the month it is being looked at in, clamped to its length so
        // stepping from 31 March lands on 28 February rather than falling out of the grid.
        _setFocusedDay(addMonths(_focusedDay(), delta));
    }

    function _moveFocus(next: Date) {
        _setFocusedDay(next);
        if (!isSameMonth(_focusedDay(), _viewMonth())) {
            _setViewMonth(_focusedDay());
        }
    }

    // Takes the day without closing — datetime mode still has a clock to set.
    function _chooseDay(day: Date) {
        if (!_isEditable() || !isDayInRange(day, _minDate(), _maxDate())) {
            return;
        }
        _setFocusedDay(day);
        _applyDate(clampDateTime(withDatePart(_baseDate(), day), _minDate(), _maxDate()));
    }

    function _clickDay(day: Date) {
        _chooseDay(day);
        // In date mode the click IS the whole interaction; in datetime mode the panel stays up so
        // the time can be set without opening it again.
        if (model.mode === "date") {
            model.popover.close();
        }
    }

    function _stepTime(unit: TimeUnit, delta: number) {
        if (!_isEditable()) {
            return;
        }

        const base = _baseDate();
        const hours = base.getHours();
        const minutes = base.getMinutes();
        const seconds = base.getSeconds();
        // Wraps inside the unit — 23 steps up to 00 without moving the day, which is what a
        // spinbutton on a clock is expected to do.
        let next: Date;
        switch (unit) {
            case "hour":
                next = withTimePart(base, _wrap(hours + delta, UNIT_RANGE.hour), minutes, seconds);
                break;
            case "minute":
                next = withTimePart(base, hours, _wrap(minutes + delta, UNIT_RANGE.minute), seconds);
                break;
            default:
                next = withTimePart(base, hours, minutes, _wrap(seconds + delta, UNIT_RANGE.second));
                break;
        }
        _applyDate(clampDateTime(next, _minDate(), _maxDate()));
    }

    function _wrap(value: number, range: number): number {
        return ((value % range) + range) % range;
    }

    function _setToNow() {
        if (!_isEditable()) {
            return;
        }

        const now = new Date();
        const next = model.mode === "date"
            ? startOfDay(now)
            // Milliseconds always go, and the seconds with them unless the field shows them —
            // otherwise "Now" would write a value the text cannot say.
            : withTimePart(now, now.getHours(), now.getMinutes(), model.secondsShown ? now.getSeconds() : 0);

        _moveFocus(next);
        _applyDate(clampDateTime(next, _minDate(), _maxDate()));
        if (model.mode === "date") {
            model.popover.close();
        }
    }

    function _clear() {
        if (!_isEditable()) {
            return;
        }
        _applyDate(undefined);
        model.popover.close();
    }

    // Reads the box. Text that is not a date is KEPT and reported — see the header.
    function _commit() {
        if (!_isEditable()) {
            return;
        }

        const text = model._text?.trim() ?? "";
        if (!text) {
            _applyDate(undefined);
            return;
        }

        const parsed = parseDateTime(text, model.mode, _valueDate());
        if (!parsed) {
            asyncSafe(() => model.validate());
            return;
        }
        _applyDate(clampDateTime(parsed, _minDate(), _maxDate()));
    }

    function _applyDate(next: Date) {
        const text = _formatted(next);
        // Undefined rather than "", so `required` and the Clear button read an empty field the
        // same way an unset one reads.
        const value = text || undefined;
        const changed = value !== model.value;

        model.value = value;
        // Written even when the value did not change, so "2026/9/4" is tidied to "2026-09-04";
        // onChangeValue only fires on an actual change. Same split as NumberField's.
        model._text = text;
        model.resetValidationErrors();
        if (changed && model.onChange) {
            asyncSafe(() => model.onChange(value, model));
        }
    }

    // Re-reads the value after the field changed what it edits. Text the new format cannot say at
    // all is left alone for validation to report, rather than thrown away.
    function _reformatValue() {
        const parsed = parseAnyDateTime(model.value);
        if (!isValidDate(parsed)) {
            return;
        }
        model.value = _formatted(parsed) || undefined;
    }

    // Every key the panel answers to, caught on the ROOT so it works wherever focus is inside the
    // field — normally the text box. Raw DOM key handling, so nothing here may be async.
    function _handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
        if (!_isEditable()) {
            return;
        }

        // Alt+Arrow opens and closes without moving anything — the pairing Select uses, and the
        // one a combobox is expected to answer to. A BARE arrow still belongs to the caret.
        if (e.altKey && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault();
            if (e.key === "ArrowDown") {
                _open();
            }
            else {
                model.popover.close();
            }
            return;
        }

        // Escape is the popover's own, on a capture-phase listener that has already run. Focus
        // never moved, so there is nothing to restore here.
        if (!model.popover.open) {
            return;
        }

        if (e.key === "Enter") {
            e.preventDefault();
            if (_showsCalendar()) {
                _chooseDay(_focusedDay());
            }
            // Enter is "done" in every mode, including the datetime one a click leaves open.
            model.popover.close();
            return;
        }

        // Time-only: the segments own their arrows, and the caret keeps the rest.
        if (!_showsCalendar()) {
            return;
        }

        if (e.key in DAY_STEPS) {
            e.preventDefault();
            _moveFocus(addDays(_focusedDay(), DAY_STEPS[e.key]));
            return;
        }

        if (e.key === "PageUp" || e.key === "PageDown") {
            e.preventDefault();
            // Shift takes a year at a time — the pairing a month grid is expected to answer to.
            const step = e.key === "PageUp" ? -1 : 1;
            _shiftMonth(e.shiftKey ? step * MONTHS_IN_YEAR : step);
            return;
        }

        if (e.key === "Home" || e.key === "End") {
            e.preventDefault();
            const weekStart = startOfWeek(_focusedDay(), model.firstDayOfWeek);
            _moveFocus(e.key === "Home" ? weekStart : addDays(weekStart, DAYS_IN_WEEK - 1));
        }
    }

    function _handleSegmentKeyDown(unit: TimeUnit, e: React.KeyboardEvent<HTMLSpanElement>) {
        if (!_isEditable() || !(e.key in SEGMENT_STEPS)) {
            return;
        }

        e.preventDefault();
        // The calendar reads the same arrows on the root. A segment owns them while it has focus,
        // so a press must not also walk the month.
        e.stopPropagation();
        _stepTime(unit, SEGMENT_STEPS[e.key]);
    }

    function _handleBlur(e: React.FocusEvent<HTMLDivElement>) {
        if (!model.popover.open) {
            return;
        }
        // Focus moving to a time segment stays inside the field; tabbing past the field closes it.
        if (e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)) {
            return;
        }
        model.popover.close();
    }
}

const DateTimePicker = UECA.getFC(useDateTimePicker);

// Shorthand: the picker preconfigured for a clock. Not a component of its own — it returns a
// DateTimePickerModel, and a caller overrides any default.
function useTimePicker(params?: DateTimePickerParams): DateTimePickerModel {
    return useDateTimePicker({ mode: "time", ...params });
}

const TimePicker = UECA.getFC(useTimePicker);

export {
    DateTimePickerModel, DateTimePickerParams, useDateTimePicker, DateTimePicker,
    useTimePicker, TimePicker
};
