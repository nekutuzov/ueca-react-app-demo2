import { describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { FieldHint } from "@components";
import { InfoCircleIcon } from "@core";
import { mount, settle, stubMessages } from "@test";

function hint(): HTMLElement {
    return document.getElementById("hint");
}

// The markup a glyph draws at the 1em / currentColor that Icon renders it with.
function glyphMarkup(glyph: typeof InfoCircleIcon): string {
    const { container, unmount } = render(<>{glyph({ size: "1em", color: "currentColor" })}</>);
    const html = container.innerHTML;
    unmount();
    return html;
}

async function stubTooltip() {
    return await stubMessages({
        "App.Tooltip.Show": vi.fn(async () => { }),
        "App.Tooltip.Hide": vi.fn(async () => { })
    });
}

describe("FieldHint", () => {
    it("renders nothing without content to explain", async () => {
        const { container } = await mount(FieldHint, { id: "hint" });

        expect(container).toBeEmptyDOMElement();
    });

    // Focusable, so the explanation is reachable without a mouse.
    it("renders a focusable info chip carrying the infoHint glyph in the primary colour", async () => {
        await mount(FieldHint, { id: "hint", contentView: "What this setting does" });

        expect(hint()).toHaveClass("ueca-field-hint");
        expect(hint()).toHaveAttribute("tabindex", "0");
        const icon = hint().querySelector<HTMLElement>(".ueca-icon");
        expect(icon.style.fontSize).toBe("var(--icon-md)");
        expect(icon.style.color).toBe("var(--accent)");
        expect(icon.innerHTML).toBe(glyphMarkup(InfoCircleIcon));
    });

    it("sizes the glyph from the size token", async () => {
        const { model } = await mount(FieldHint, { id: "hint", contentView: "Tip", size: "xs" });
        expect(hint().querySelector<HTMLElement>(".ueca-icon").style.fontSize).toBe("var(--icon-xs)");

        model.size = "sm";
        await settle();

        expect(hint().querySelector<HTMLElement>(".ueca-icon").style.fontSize).toBe("var(--icon-sm)");
    });

    // Right, not the tooltip's default of top: opening upward covers the label the hint belongs to.
    it("opens its tooltip to the right on hover and closes it on leave", async () => {
        const bus = await stubTooltip();
        await mount(FieldHint, { id: "hint", contentView: "Runs nightly" });

        fireEvent.mouseEnter(hint());
        await settle();
        expect(bus["App.Tooltip.Show"]).toHaveBeenCalledWith(expect.objectContaining({
            token: "hint",
            contentView: "Runs nightly",
            placement: "right"
        }));

        fireEvent.mouseLeave(hint());
        await settle();
        expect(bus["App.Tooltip.Hide"]).toHaveBeenCalledWith({ token: "hint" });
    });

    it("honours a placement override", async () => {
        const bus = await stubTooltip();
        await mount(FieldHint, { id: "hint", contentView: "Tip", placement: "bottom" });

        fireEvent.mouseEnter(hint());
        await settle();

        expect(bus["App.Tooltip.Show"]).toHaveBeenCalledWith(expect.objectContaining({ placement: "bottom" }));
    });

    it("opens on keyboard focus and closes on blur", async () => {
        const bus = await stubTooltip();
        await mount(FieldHint, { id: "hint", contentView: "Tip" });
        vi.spyOn(hint(), "matches").mockImplementation((selector) => selector === ":focus-visible");

        fireEvent.focus(hint());
        await settle();
        expect(bus["App.Tooltip.Show"]).toHaveBeenCalledOnce();

        fireEvent.blur(hint());
        await settle();
        expect(bus["App.Tooltip.Hide"]).toHaveBeenCalledWith({ token: "hint" });
    });
});
