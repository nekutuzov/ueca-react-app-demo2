import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { SeverityIcon } from "@components";
import { ErrorCircleIcon, InfoCircleIcon, SuccessCircleIcon, WarningIcon } from "@core";
import { mount, settle } from "@test";

// The markup a glyph draws at the given size and colour.
function glyphMarkup(glyph: typeof WarningIcon, size: number, color?: string): string {
    const { container, unmount } = render(<>{glyph({ size, color })}</>);
    const html = container.innerHTML;
    unmount();
    return html;
}

function iconRoot(): HTMLElement {
    return document.getElementById("severity");
}

describe("SeverityIcon", () => {
    it("renders nothing for the default severity, none", async () => {
        const { container } = await mount(SeverityIcon, { id: "severity" });

        expect(container).toBeEmptyDOMElement();
    });

    it.each([
        ["success", SuccessCircleIcon],
        ["info", InfoCircleIcon],
        // The reverse of Material's mapping: the circled "!" is the warning glyph...
        ["warning", ErrorCircleIcon],
        // ...and the triangle is the error one.
        ["error", WarningIcon]
    ] as const)("draws the %s glyph at 22px", async (severity, glyph) => {
        await mount(SeverityIcon, { id: "severity", severity });

        expect(iconRoot().tagName).toBe("SPAN");
        expect(iconRoot().innerHTML).toBe(glyphMarkup(glyph, 22));
    });

    it("wears a triangle for error and a ringed glyph for warning", async () => {
        const ring = 'circle[r="8.5"]';
        const { model } = await mount(SeverityIcon, { id: "severity", severity: "error" });
        expect(iconRoot().querySelector(ring)).toBeNull();

        model.severity = "warning";
        await settle();

        expect(iconRoot().querySelector(ring)).not.toBeNull();
    });

    it("passes size and colour to the glyph", async () => {
        await mount(SeverityIcon, { id: "severity", severity: "info", size: 24, color: "var(--info)" });

        const svg = iconRoot().querySelector("svg");
        expect(svg).toHaveAttribute("width", "24");
        expect(svg).toHaveAttribute("height", "24");
        expect(svg).toHaveAttribute("color", "var(--info)");
    });

    it("follows severity assigned at runtime, down to nothing", async () => {
        const { model, container } = await mount(SeverityIcon, { id: "severity", severity: "success" });

        model.severity = "error";
        await settle();
        expect(iconRoot().innerHTML).toBe(glyphMarkup(WarningIcon, 22));

        model.severity = "none";
        await settle();
        expect(container).toBeEmptyDOMElement();
    });
});
