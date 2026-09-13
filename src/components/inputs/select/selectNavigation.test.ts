import { describe, expect, it } from "vitest";
import {
    NavigableOption, PAGE_STEP, TYPE_AHEAD_RESET_MS, firstEnabledIndex, isTypeAheadKey, lastEnabledIndex,
    nextTypeAheadBuffer, stepIndex, typeAheadIndex
} from "./selectNavigation";

// Builds options from labels; a leading "!" marks a disabled row.
function opts(...labels: string[]): NavigableOption[] {
    return labels.map((label) => label.startsWith("!")
        ? { label: label.slice(1), disabled: true }
        : { label });
}

describe("firstEnabledIndex / lastEnabledIndex", () => {
    it("return -1 for an empty list", () => {
        expect(firstEnabledIndex([])).toBe(-1);
        expect(lastEnabledIndex([])).toBe(-1);
    });

    it("return -1 when every row is disabled", () => {
        const all = opts("!A", "!B");

        expect(firstEnabledIndex(all)).toBe(-1);
        expect(lastEnabledIndex(all)).toBe(-1);
    });

    it("skip disabled rows at either end", () => {
        const list = opts("!A", "B", "C", "!D");

        expect(firstEnabledIndex(list)).toBe(1);
        expect(lastEnabledIndex(list)).toBe(2);
    });

    it("return the ends themselves when they are enabled", () => {
        const list = opts("A", "!B", "C");

        expect(firstEnabledIndex(list)).toBe(0);
        expect(lastEnabledIndex(list)).toBe(2);
    });
});

describe("stepIndex", () => {
    const abcde = opts("A", "B", "C", "D", "E");

    it("returns -1 for an empty list or a zero delta", () => {
        expect(stepIndex([], 0, 1)).toBe(-1);
        expect(stepIndex(abcde, 2, 0)).toBe(-1);
    });

    it.each([
        [1, 3],
        [-1, 1],
        [2, 4],
        [-2, 0]
    ])("moves %i rows from the middle", (delta, expected) => {
        expect(stepIndex(abcde, 2, delta)).toBe(expected);
    });

    // Neither native nor web listboxes wrap on an arrow key.
    it("stops at the ends rather than wrapping", () => {
        expect(stepIndex(abcde, 4, 1)).toBe(4);
        expect(stepIndex(abcde, 0, -1)).toBe(0);
    });

    it("enters the list from the end the direction implies when nothing is active", () => {
        const list = opts("!A", "B", "C", "!D");

        expect(stepIndex(list, -1, 1)).toBe(1);
        expect(stepIndex(list, -1, -1)).toBe(2);
        expect(stepIndex(list, -1, PAGE_STEP)).toBe(1);
    });

    it("treats an out-of-range start like no active row", () => {
        expect(stepIndex(abcde, 5, 1)).toBe(0);
        expect(stepIndex(abcde, 99, -1)).toBe(4);
    });

    it("skips disabled rows and counts only enabled ones", () => {
        const list = opts("A", "!B", "!C", "D", "!E", "F");

        expect(stepIndex(list, 0, 1)).toBe(3);
        expect(stepIndex(list, 3, 1)).toBe(5);
        expect(stepIndex(list, 5, -1)).toBe(3);
        expect(stepIndex(list, 0, 2)).toBe(5);
    });

    it("stays put when only disabled rows lie ahead", () => {
        const list = opts("A", "B", "!C", "!D");

        expect(stepIndex(list, 1, 1)).toBe(1);
    });

    // What makes PageDown near the bottom land on the last row instead of doing nothing.
    it("lets a page move stop where it reached the end", () => {
        const twelve = opts(...Array.from({ length: 12 }, (_, i) => `Row ${i}`));

        expect(stepIndex(twelve, 5, PAGE_STEP)).toBe(11);
        expect(stepIndex(twelve, 5, -PAGE_STEP)).toBe(0);
        expect(stepIndex(twelve, 0, PAGE_STEP)).toBe(PAGE_STEP);
    });

    it("a page move near the end stops on the last ENABLED row", () => {
        const list = opts("A", "B", "C", "!D");

        expect(stepIndex(list, 0, PAGE_STEP)).toBe(2);
    });

    // The model's value can point at a disabled row.
    it("moves on from a disabled starting row", () => {
        const list = opts("A", "!B", "C");

        expect(stepIndex(list, 1, 1)).toBe(2);
        expect(stepIndex(list, 1, -1)).toBe(0);
    });

    it("returns -1 from a disabled starting row with nothing enabled beyond it", () => {
        const list = opts("A", "!B");

        expect(stepIndex(list, 1, 1)).toBe(-1);
    });
});

describe("typeAheadIndex", () => {
    const fruit = opts("Apple", "Avocado", "Banana", "Blueberry", "Cherry");

    it("returns -1 for an empty buffer or an empty list", () => {
        expect(typeAheadIndex(fruit, "", 0)).toBe(-1);
        expect(typeAheadIndex([], "a", -1)).toBe(-1);
    });

    it("returns -1 when no enabled label starts with the buffer", () => {
        expect(typeAheadIndex(fruit, "z", 0)).toBe(-1);
        expect(typeAheadIndex(opts("Apple", "!Banana"), "b", 0)).toBe(-1);
    });

    it("matches case-insensitively on the label's start only", () => {
        expect(typeAheadIndex(fruit, "CH", -1)).toBe(4);
        expect(typeAheadIndex(fruit, "err", -1)).toBe(-1);
    });

    // Pressing the same letter again must advance, not stick on the current row.
    it("a single letter searches from the row after the current one and wraps", () => {
        expect(typeAheadIndex(fruit, "a", -1)).toBe(0);
        expect(typeAheadIndex(fruit, "a", 0)).toBe(1);
        expect(typeAheadIndex(fruit, "a", 1)).toBe(0);
        expect(typeAheadIndex(fruit, "b", 4)).toBe(2);
    });

    it("a repeated letter collapses to that letter and cycles", () => {
        expect(typeAheadIndex(fruit, "bb", 2)).toBe(3);
        expect(typeAheadIndex(fruit, "BBB", 3)).toBe(2);
    });

    // Extending a word never jumps off the option it has already found.
    it("a longer word matches starting AT the current row", () => {
        expect(typeAheadIndex(fruit, "bl", 3)).toBe(3);
        expect(typeAheadIndex(fruit, "av", 1)).toBe(1);
        expect(typeAheadIndex(fruit, "ba", 3)).toBe(2);
    });

    it("skips disabled rows while cycling", () => {
        const list = opts("Alpha", "!Amber", "Azure");

        expect(typeAheadIndex(list, "a", 0)).toBe(2);
    });

    // Space is part of a word once one is being typed — "NEW ZEALAND" is unreachable otherwise.
    it("matches a buffer containing a space", () => {
        const countries = opts("Netherlands", "New Caledonia", "New Zealand");

        expect(typeAheadIndex(countries, "new z", 1)).toBe(2);
    });
});

describe("nextTypeAheadBuffer", () => {
    it("extends the buffer while keystrokes are close together", () => {
        expect(nextTypeAheadBuffer("ne", "w", 50)).toBe("new");
    });

    it("extends it at exactly the reset interval", () => {
        expect(nextTypeAheadBuffer("a", "b", TYPE_AHEAD_RESET_MS)).toBe("ab");
    });

    it("starts a new word once the keystrokes are further apart than the reset interval", () => {
        expect(nextTypeAheadBuffer("new", "b", TYPE_AHEAD_RESET_MS + 1)).toBe("b");
    });

    it("starts from the key when there is no buffer yet", () => {
        expect(nextTypeAheadBuffer("", "x", 0)).toBe("x");
    });
});

describe("isTypeAheadKey", () => {
    it.each(["a", "Z", "7", " ", "é", "-"])("accepts the printable key %j", (key) => {
        expect(isTypeAheadKey(key)).toBe(true);
    });

    it.each(["\t", "", "Enter", "ArrowDown", "Escape", "Tab", "Shift"])("rejects the command key %j", (key) => {
        expect(isTypeAheadKey(key)).toBe(false);
    });
});
