import * as UECA from "ueca-react";
import React from "react";
import {
    EditBaseModel, EditBaseParams, EditBaseStruct, PopoverModel, fieldLabelText, useEditBase,
    usePopover
} from "@components";
import { Palette, asyncSafe, resolvePaletteColor } from "@core";
import {
    PAGE_STEP, firstEnabledIndex, isTypeAheadKey, lastEnabledIndex, nextTypeAheadBuffer, stepIndex,
    typeAheadIndex
} from "./selectNavigation";
import "./select.css";

// Select — a combobox over a listbox of our own, NOT a native <select>.
//
// Why it stopped being one is worth recording, because the symptom looked like a CSS bug and was
// not: on Windows, Chrome draws a <select>'s dropdown as a separate OS-level window whose chrome
// follows the BROWSER, not the page. Under the dark theme that meant a near-white border (#EFEFEF),
// a light-mode selection highlight (#99C8FF) and a white flash as the window was created and
// destroyed. Measured by reverting every declaration this file owns (`all: revert`) — the popup did
// not change, so nothing the page can say reaches it. docs/raw/theming.md carries the evidence.
//
// The listbox is an ordinary Popover, per the singleton-vs-component rule in docs/raw/overlays.md: it
// owns state (which row is active, where it is scrolled), so it is a component.
//
// FOCUS NEVER LEAVES THE TRIGGER. The active row is pointed at with aria-activedescendant rather
// than focused, which is what keeps Escape, blur and outside-click simple — there is no focus to
// put back afterwards, and the trigger's own :focus-visible ring stays correct throughout.

// Module scope, not a const after `return model` — those are in the TDZ for the early hooks
// (CLAUDE.md, Critical Warning 10).
const ARROW_STEPS: Record<string, number> = {
    ArrowDown: 1,
    ArrowUp: -1,
    PageDown: PAGE_STEP,
    PageUp: -PAGE_STEP
};

type SelectOption<T = string> = {
    value: T;
    label: string;
    disabled?: boolean;
};

type SelectVariant = "filled" | "outlined" | "standard";
type SelectSize = "small" | "medium";

type SelectStruct<T = string> = EditBaseStruct<{
    props: {
        labelView: React.ReactNode;
        value: T;
        options: SelectOption<T>[];
        placeholder: string;
        disabled: boolean;
        // Not editable, but still readable in full ink. The trigger is disabled and the READONLY
        // class repaints it — otherwise the value would dim and read as unavailable rather
        // than fixed.
        readOnly: boolean;
        helperTextView: string;
        variant: SelectVariant;
        size: SelectSize;
        required: boolean;
        fullWidth: boolean;
        color: Palette;

        // The row the keyboard is on, which is NOT the selected row: it moves with the arrows and
        // only becomes the value on Enter, Space or a click.
        _activeIndex: number;
        // Captured from the trigger at open, so the list lines up under it the way a native
        // dropdown does. positionOverlay centres on the anchor, and an equal width makes centring
        // and left-aligning the same thing.
        _menuWidth: number;
        _typeAhead: string;
        _typeAheadAt: number;
        _scrollActive: boolean;
        __triggerRef: React.RefObject<HTMLButtonElement>;
        __listRef: React.RefObject<HTMLDivElement>;
    };

    children: {
        popover: PopoverModel;
    };

    events: {
        onChange: (value: T, source: SelectModel<T>) => UECA.MaybePromise;
        onFocus: (source: SelectModel<T>) => UECA.MaybePromise;
        onBlur: (source: SelectModel<T>) => UECA.MaybePromise;
    };

    methods: {
        _TriggerView: () => React.ReactElement;
        _ListView: () => React.ReactElement;
    };
}>;

type SelectParams<T = string> = EditBaseParams<SelectStruct<T>>;
type SelectModel<T = string> = EditBaseModel<SelectStruct<T>>;

function useSelect<T = string>(params?: SelectParams<T>): SelectModel<T> {
    const struct: SelectStruct<T> = {
        props: {
            id: useSelect.name,
            value: undefined,
            labelView: undefined,
            options: [],
            placeholder: undefined,
            disabled: false,
            readOnly: false,
            helperTextView: undefined,
            variant: "outlined",
            size: "medium",
            required: false,
            fullWidth: true,
            // default accent follows the active theme; pass `color` to recolor a specific select
            color: "primary.main",

            _activeIndex: -1,
            _menuWidth: 0,
            _typeAhead: "",
            _typeAheadAt: 0,
            _scrollActive: false,
            __triggerRef: { current: null },
            __listRef: { current: null }
        },

        children: {
            popover: usePopover({
                placement: "bottom",
                className: "ueca-select-popover",
                // A mousedown on the trigger is not an outside click — without this the popover
                // would close before the trigger's own click handler ran, and could never toggle.
                onGetTrigger: () => model.__triggerRef.current,
                onClose: () => {
                    model._typeAhead = "";
                },
                contentView: () => <model._ListView />
            })
        },

        events: {
            onInternalValidate: async () => {
                if (model.required && !model.value) {
                    return `${fieldLabelText(model.labelView) ?? "This field"} cannot be empty`;
                }
            },

            onChangeValue: () => model.resetValidationErrors(),
        },

        methods: {
            // Its OWN MobX boundary, and that is the entire point of splitting it out: it reads
            // _activeIndex, which changes on every hover. Left in the main View, those reads
            // re-rendered the whole component — which re-created <model.popover.View />, so React
            // unmounted and remounted the popover and its fade-in animation replayed, repainting
            // the page behind it. Measured on a single hover: POPOVER NODE REMOVED → ADDED →
            // ANIMATIONSTART ueca-popover-in. That was the blink.
            _TriggerView: () => {
                const open = model.popover.open;
                const selected = _selectedOption();

                return (
                    // A combobox names itself from the label PLUS its own text, so it is announced
                    // as "Theme, Midnight" rather than as one or the other.
                    <button
                        id={_triggerId()}
                        ref={model.__triggerRef}
                        type="button"
                        className="ueca-select-input"
                        role="combobox"
                        aria-haspopup="listbox"
                        aria-expanded={open}
                        aria-controls={_listId()}
                        aria-activedescendant={open && model._activeIndex >= 0 ? _optionId(model._activeIndex) : undefined}
                        aria-labelledby={model.labelView ? `${_labelId()} ${_triggerId()}` : undefined}
                        aria-required={model.required || undefined}
                        aria-invalid={!model.isValid() || undefined}
                        disabled={model.disabled || model.readOnly}
                        onClick={_toggle}
                        onKeyDown={_handleKeyDown}
                        onFocus={_handleFocus}
                        onBlur={_handleBlur}
                    >
                        {/* An unchosen value shows the placeholder rather than the first option, so
                            a select with nothing picked never looks as though the user picked. */}
                        <span className={"ueca-select-value" + (selected ? "" : " ueca-select-value-placeholder")}>
                            {selected ? selected.label : model.placeholder}
                        </span>
                    </button>
                );
            },

            _ListView: () => (
                <div
                    id={_listId()}
                    ref={model.__listRef}
                    role="listbox"
                    className="ueca-select-listbox"
                    style={{ width: model._menuWidth || undefined }}
                    aria-labelledby={model.labelView ? _labelId() : undefined}
                >
                    {model.options.map((option, index) => (
                        <div
                            key={String(option.value)}
                            id={_optionId(index)}
                            role="option"
                            aria-selected={_isSelected(option)}
                            aria-disabled={option.disabled || undefined}
                            className={_optionClass(option, index)}
                            // Keeps the trigger focused: without it the mousedown blurs the
                            // trigger, which closes the list before the click can land.
                            onMouseDown={(e) => e.preventDefault()}
                            onMouseEnter={() => { model._activeIndex = index; }}
                            onClick={() => { _choose(index); }}
                        >
                            {option.label}
                        </div>
                    ))}
                </div>
            )
        },

        draw: () => {
            _scrollActiveIntoView();
        },

        // Reads NOTHING that changes while the list is open — see _TriggerView. `popover.open` is
        // the one state it does read, and that is the render on which the popover is created or
        // destroyed anyway.
        View: () => {
            const colorClass = resolvePaletteColor(model.color);
            const sizeClass = model.size ? `ueca-select-${model.size}` : "";
            const open = model.popover.open;
            const className = `ueca-select ueca-select-${model.variant} ${sizeClass} ${!model.isValid() ? "ueca-select-error" : ""} ${model.disabled ? "ueca-select-disabled" : ""} ${model.readOnly ? "ueca-select-readonly" : ""} ${open ? "ueca-select-open" : ""}`.trim();

            return (
                <div
                    id={model.htmlId()}
                    className={className}
                    style={{
                        width: model.fullWidth ? "100%" : model.extent?.width,
                        "--select-color": colorClass
                    } as React.CSSProperties}
                >
                    {model.labelView && (
                        <label id={_labelId()} className="ueca-select-label ueca-label">
                            {model.required && <span className="ueca-select-required">*</span>}
                            {model.labelView}
                        </label>
                    )}
                    <model._TriggerView />
                    <model.popover.View />
                    {(model.helperTextView || !model.isValid()) && (
                        <div className={`ueca-select-helper-text ${!model.isValid() ? "ueca-select-helper-text-error" : ""}`}>
                            {!model.isValid() ? model.getValidationError() : model.helperTextView}
                        </div>
                    )}
                </div>
            );
        },
    };

    const model = useEditBase(struct, params);
    return model;

    // Private methods
    function _labelId(): string {
        return `${model.htmlId()}-label`;
    }

    function _triggerId(): string {
        return `${model.htmlId()}-trigger`;
    }

    function _listId(): string {
        return `${model.htmlId()}-listbox`;
    }

    function _optionId(index: number): string {
        return `${model.htmlId()}-option-${index}`;
    }

    function _isSelected(option: SelectOption<T>): boolean {
        return model.value != null && option.value === model.value;
    }

    function _selectedIndex(): number {
        return model.options.findIndex((option) => _isSelected(option));
    }

    function _selectedOption(): SelectOption<T> {
        const index = _selectedIndex();
        return index >= 0 ? model.options[index] : undefined;
    }

    function _optionClass(option: SelectOption<T>, index: number): string {
        return "ueca-select-option"
            + (index === model._activeIndex ? " active" : "")
            + (_isSelected(option) ? " selected" : "")
            + (option.disabled ? " disabled" : "");
    }

    function _openMenu() {
        const el = model.__triggerRef.current;
        if (!el) {
            return;
        }
        const rect = el.getBoundingClientRect();
        model.popover.anchor = { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
        model._menuWidth = rect.width;
        const selected = _selectedIndex();
        model._activeIndex = selected >= 0 ? selected : firstEnabledIndex(model.options);
        model._typeAhead = "";
        model._scrollActive = true;
        model.popover.open = true;
    }

    function _toggle() {
        if (model.popover.open) {
            model.popover.close();
            return;
        }
        _openMenu();
    }

    function _setActive(index: number) {
        if (index < 0) {
            return;
        }
        model._activeIndex = index;
        model._scrollActive = true;
    }

    // Takes the value without closing — what type-ahead does on a CLOSED select, matching native.
    function _commit(index: number) {
        const option = model.options[index];
        if (!option || option.disabled) {
            return;
        }
        model.value = option.value;
        if (model.onChange) {
            asyncSafe(() => model.onChange(model.value, model));
        }
    }

    function _choose(index: number) {
        _commit(index);
        model.popover.close();
    }

    function _handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
        const open = model.popover.open;

        // Escape is the popover's own, on a capture-phase listener that has already run. Focus is
        // still on the trigger — it never moved — so there is nothing to restore here.
        if (e.key === "Escape") {
            return;
        }

        // Alt+Arrow opens and closes without moving anything — the conventional pairing, and now
        // the only way an arrow reaches the list, since a bare one moves the value instead.
        if (e.altKey && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault();
            if (e.key === "ArrowDown" && !open) {
                _openMenu();
            }
            else if (e.key === "ArrowUp" && open) {
                model.popover.close();
            }
            return;
        }

        if (e.key === "Enter" || (e.key === " " && !model._typeAhead)) {
            e.preventDefault();
            if (open) {
                _choose(model._activeIndex);
            }
            else {
                _openMenu();
            }
            return;
        }

        if (_handleMovementKey(e, open)) {
            return;
        }

        if (isTypeAheadKey(e.key)) {
            _typeAhead(e);
        }
    }

    // Every movement key follows ONE rule, and it is the native <select>'s: CLOSED, it moves the
    // VALUE and opens nothing; OPEN, it moves the active row inside the list and commits nothing
    // until Enter, Space or a click. Returns false for a key it does not own.
    function _handleMovementKey(e: React.KeyboardEvent<HTMLButtonElement>, open: boolean): boolean {
        const selected = _selectedIndex();
        const from = open ? model._activeIndex : selected;
        let target: number;

        if (e.key in ARROW_STEPS) {
            target = stepIndex(model.options, from, ARROW_STEPS[e.key]);
        }
        else if (e.key === "Home") {
            target = firstEnabledIndex(model.options);
        }
        else if (e.key === "End") {
            target = lastEnabledIndex(model.options);
        }
        else {
            return false;
        }

        e.preventDefault();
        if (open) {
            _setActive(target);
        }
        else if (target !== selected) {
            // Guarded, so arrowing into the end of the list does not re-fire onChange with the
            // value it already has — this one reaches a screen's save state.
            _commit(target);
        }
        return true;
    }

    function _typeAhead(e: React.KeyboardEvent<HTMLButtonElement>) {
        const now = Date.now();
        model._typeAhead = nextTypeAheadBuffer(model._typeAhead, e.key, now - model._typeAheadAt);
        model._typeAheadAt = now;

        const open = model.popover.open;
        const hit = typeAheadIndex(model.options, model._typeAhead, open ? model._activeIndex : _selectedIndex());
        if (hit < 0) {
            return;
        }
        e.preventDefault();
        if (open) {
            _setActive(hit);
        }
        else {
            // A closed native select changes its value as you type, without opening.
            _commit(hit);
        }
    }

    function _scrollActiveIntoView() {
        if (!model._scrollActive) {
            return;
        }
        if (model._activeIndex < 0) {
            model._scrollActive = false;
            return;
        }

        const list = model.__listRef.current;
        const row = list?.children[model._activeIndex] as HTMLElement;
        // The list has not rendered yet on the draw that opened it; keep the flag and try again.
        if (!list || !row) {
            return;
        }
        model._scrollActive = false;

        // By hand against the list's own box rather than scrollIntoView(), which also scrolls every
        // ancestor — including the screen behind the popover.
        const top = row.offsetTop;
        const bottom = top + row.offsetHeight;
        if (top < list.scrollTop) {
            list.scrollTop = top;
        }
        else if (bottom > list.scrollTop + list.clientHeight) {
            list.scrollTop = bottom - list.clientHeight;
        }
    }

    function _handleFocus() {
        if (model.onFocus) {
            asyncSafe(() => model.onFocus(model));
        }
    }

    function _handleBlur() {
        // Tabbing away with the list open: close it. A click on a row cannot reach here, because
        // the row suppresses its own mousedown to keep the trigger focused.
        if (model.popover.open) {
            model.popover.close();
        }
        if (model.onBlur) {
            asyncSafe(() => model.onBlur(model));
        }
    }
}

const Select = UECA.getFC(useSelect);

export { SelectModel, SelectOption, SelectParams, SelectVariant, SelectSize, useSelect, Select };
