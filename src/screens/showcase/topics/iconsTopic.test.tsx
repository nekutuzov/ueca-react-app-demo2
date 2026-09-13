import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import { ICONS, iconNames, resolvePaletteColor } from "@core";
import { mount } from "@test";
import { IconsTopic } from "./iconsTopic";

// The registry labels its cells with role names ("refresh", "success"…) too, so specimen queries
// are scoped to the section they belong to.
function section(title: string): HTMLElement {
    return screen.getByText(title, { selector: ".showcase-section-title" }).parentElement;
}

// The icon a colour specimen labels: its label, then the demo below it.
function iconLabelled(text: string): HTMLElement {
    const label = within(section("Colour and intent")).getByText(text, { selector: ".showcase-specimen-label" });
    const demo = label.nextElementSibling as HTMLElement;
    return demo.matches(".ueca-icon") ? demo : demo.querySelector(".ueca-icon");
}

describe("IconsTopic", () => {
    it("lists every registered role once, with its glyph and the kind of source behind it", async () => {
        await mount(IconsTopic, { id: "icons" });

        const cells = [...document.querySelectorAll(".showcase-icon-cell")];
        expect(cells.map((cell) => cell.querySelector(".showcase-specimen-label").textContent)).toEqual(iconNames());
        cells.forEach((cell, i) => {
            expect(cell.querySelector(".showcase-icon-kind")).toHaveTextContent(ICONS[iconNames()[i]].kind);
            expect(cell.querySelector(".ueca-icon svg, .ueca-icon img")).not.toBeNull();
        });
    });

    it("draws the two sample glyphs at every step of the size scale", async () => {
        await mount(IconsTopic, { id: "icons" });

        for (const row of ["refresh", "settings"]) {
            const specimens = within(section("One size scale")).getByText(row, { selector: ".showcase-specimen-label" }).parentElement;
            const sizes = [...specimens.querySelectorAll<HTMLElement>(".ueca-icon")].map((icon) => icon.style.fontSize);
            expect(sizes).toEqual(["xs", "sm", "md", "lg", "xl", "2xl"].map((step) => `var(--icon-${step})`));
        }
    });

    it.each(["success", "info", "warning", "error", "primary"])("tints the %s specimen with that ramp's readable ink", async (intent) => {
        await mount(IconsTopic, { id: "icons" });

        expect(iconLabelled(intent).style.color).toBe(`var(--${intent}-ink)`);
    });

    it("colours by palette token, and otherwise inherits from the surrounding block", async () => {
        await mount(IconsTopic, { id: "icons" });

        expect(iconLabelled("primary.main").style.color).toBe(resolvePaletteColor("primary.main"));
        expect(iconLabelled("text.secondary").style.color).toBe(resolvePaletteColor("text.secondary"));
        const inherited = iconLabelled("inherited");
        expect(inherited.style.color).toBe("");
        expect(inherited.parentElement.style.color).toBe(resolvePaletteColor("text.disabled"));
    });

    // A one-off source that is in no registry still renders through Icon, sized and tinted.
    it("renders an ad-hoc SVG source at the icon size, tinted by intent", async () => {
        await mount(IconsTopic, { id: "icons" });

        const adHoc = iconLabelled("ad-hoc source");
        expect(adHoc.style.fontSize).toBe("var(--icon-lg)");
        expect(adHoc.style.color).toBe("var(--warning-ink)");
        const svg = adHoc.querySelector("svg");
        expect(svg).toHaveAttribute("width", "1em");
        expect(svg.querySelector("path")).toHaveAttribute("d", "M12 3.5 14.6 9l6 .6-4.5 4 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.5-4 6-.6z");
    });
});
