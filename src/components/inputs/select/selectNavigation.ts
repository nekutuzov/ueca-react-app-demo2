// Keyboard navigation for Select's listbox — the part that is pure.
//
// Split out of select.tsx because it is the only genuinely fiddly logic in the control (skipping
// disabled rows, clamping at the ends, native-style type-ahead) and it is a pure function of an
// option array. Keeping it here means it can be tested without rendering anything, which is what
// docs/raw/development/04-testing.md asks of a pure module.
//
// The behaviour these functions encode is Windows' native <select>, because that is what this
// control replaced and what a user's fingers already know.

// Only the two fields navigation cares about — Select's own SelectOption<T> is structurally
// compatible, so no conversion is needed at the call site.
type NavigableOption = {
    label: string;
    disabled?: boolean;
};

// How far PageUp/PageDown travel. Native Windows moves by the visible row count; a fixed step is
// close enough and does not require measuring the popup.
const PAGE_STEP = 10;

// Keystrokes further apart than this start a new type-ahead word rather than extending the old one.
const TYPE_AHEAD_RESET_MS = 700;

function firstEnabledIndex(options: NavigableOption[]): number {
    return _scanFrom(options, 0, 1);
}

function lastEnabledIndex(options: NavigableOption[]): number {
    return _scanFrom(options, options.length - 1, -1);
}

// Move `delta` enabled rows from `from`, stopping at the ends rather than wrapping — wrapping on an
// arrow key is the one place native and web listboxes agree, and neither wraps.
//
// `from` of -1 (nothing active yet) enters the list from whichever end the direction implies.
function stepIndex(options: NavigableOption[], from: number, delta: number): number {
    if (options.length === 0 || delta === 0) {
        return -1;
    }

    const direction = delta > 0 ? 1 : -1;
    if (from < 0 || from >= options.length) {
        return direction > 0 ? firstEnabledIndex(options) : lastEnabledIndex(options);
    }

    let index = from;
    for (let step = 0; step < Math.abs(delta); step++) {
        const next = _scanFrom(options, index + direction, direction);
        if (next < 0) {
            // Hit the end. A PAGE move stops where it got to rather than doing nothing, which is
            // what makes PageDown near the bottom land on the last row.
            break;
        }
        index = next;
    }

    // `from` may itself have been a disabled row (the model's value can point at one).
    return options[index]?.disabled ? _scanFrom(options, index, direction) : index;
}

// The row a type-ahead buffer selects, or -1 for no match.
//
// Two cases behave differently, and both are native behaviour worth keeping:
//   "u", then "u" again  → the buffer collapses to one letter and CYCLES through the U's.
//   "u", then "n"        → the buffer is "un" and matching restarts AT the current row, so
//                          extending a word never jumps off the option it has already found.
function typeAheadIndex(options: NavigableOption[], buffer: string, from: number): number {
    if (!buffer || options.length === 0) {
        return -1;
    }

    const needle = buffer.toLowerCase();
    const isRepeat = needle.length > 1 && [...needle].every((c) => c === needle[0]);
    const probe = isRepeat ? needle[0] : needle;
    // A single letter cycles for the same reason a repeat does: pressing it again must advance.
    const start = (isRepeat || needle.length === 1) ? from + 1 : from;

    for (let offset = 0; offset < options.length; offset++) {
        const index = _wrap(start + offset, options.length);
        const option = options[index];
        if (!option.disabled && option.label.toLowerCase().startsWith(probe)) {
            return index;
        }
    }

    return -1;
}

// Grow or restart the buffer, by the same rule the reset timeout implies. Returns the buffer to
// match with; the caller keeps it and hands it back next keystroke.
function nextTypeAheadBuffer(buffer: string, key: string, elapsedMs: number): string {
    if (elapsedMs > TYPE_AHEAD_RESET_MS) {
        return key;
    }
    return buffer + key;
}

// A key that should feed type-ahead rather than being treated as a command. Space is deliberately
// excluded by the CALLER when the buffer is empty (there it commits the active row), but included
// once a word is being typed — "NEW ZEALAND" is unreachable otherwise.
function isTypeAheadKey(key: string): boolean {
    return key.length === 1 && key !== "\t";
}

export {
    NavigableOption, PAGE_STEP, TYPE_AHEAD_RESET_MS,
    firstEnabledIndex, lastEnabledIndex, stepIndex, typeAheadIndex, nextTypeAheadBuffer, isTypeAheadKey
};

// Private helpers
function _scanFrom(options: NavigableOption[], start: number, direction: number): number {
    for (let i = start; i >= 0 && i < options.length; i += direction) {
        if (!options[i].disabled) {
            return i;
        }
    }
    return -1;
}

function _wrap(index: number, length: number): number {
    return ((index % length) + length) % length;
}
