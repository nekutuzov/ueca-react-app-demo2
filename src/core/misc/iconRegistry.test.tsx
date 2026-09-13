import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { getIconSource, iconNames, ICONS } from "@core";

describe("icon registry", () => {
    it("names every registered role and hands out its source", () => {
        expect(iconNames()).toEqual(Object.keys(ICONS));

        for (const name of iconNames()) {
            expect(getIconSource(name), name).toBe(ICONS[name]);
        }
    });

    // Call sites name a role; whatever the registry maps it to has to draw.
    it("draws every role as a decorative svg glyph", () => {
        for (const name of iconNames()) {
            const source = getIconSource(name);
            expect(source.kind, name).toBe("svg");

            const { container, unmount } = render(<>{source.kind === "svg" ? source.component() : null}</>);
            expect(container.querySelector("svg[aria-hidden='true']"), name).not.toBeNull();
            unmount();
        }
    });
});
