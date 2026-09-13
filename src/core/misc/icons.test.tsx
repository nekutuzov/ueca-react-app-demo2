import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import * as core from "@core";
import { IconProps } from "@core";

type IconComponent = (props?: IconProps) => React.ReactNode;

// Every glyph icons.tsx exports, taken from the @core barrel, where nothing else ends in "Icon".
const ICONS = Object.entries(core).filter(([name, value]) => name.endsWith("Icon") && typeof value === "function") as [string, IconComponent][];

// Drawn as the services draw them rather than in the outline family.
const BRAND_MARKS = ["GitHubIcon", "YouTubeIcon", "NpmIcon"];

function svgOf(node: React.ReactNode) {
    return render(<>{node}</>).container.querySelector("svg");
}

describe("icons", () => {
    it("finds the whole icon set", () => {
        expect(ICONS.map(([name]) => name)).toEqual(expect.arrayContaining(["HomeIcon", "InfoIcon", "PersonIcon", "MiscIcon", ...BRAND_MARKS]));
    });

    it("draws every icon as a decorative 24px glyph on the 24px grid by default", () => {
        for (const [name, Icon] of ICONS) {
            const svg = svgOf(Icon());

            expect(svg, name).not.toBeNull();
            expect(svg.getAttribute("width"), name).toBe("24");
            expect(svg.getAttribute("height"), name).toBe("24");
            expect(svg.getAttribute("viewBox"), name).toBe("0 0 24 24");
            expect(svg.getAttribute("aria-hidden"), name).toBe("true");
            expect(svg.getAttribute("focusable"), name).toBe("false");
        }
    });

    // A string passes straight through: `Icon` sizes glyphs from a token by rendering them at 1em.
    it("sizes every icon in pixels or by a CSS length, and renders nothing when told not to", () => {
        for (const [name, Icon] of ICONS) {
            expect(svgOf(<Icon size={16} />).getAttribute("width"), name).toBe("16");
            expect(svgOf(<Icon size="1em" />).getAttribute("height"), name).toBe("1em");
            expect(render(<>{Icon({ render: false })}</>).container, name).toBeEmptyDOMElement();
        }
    });

    // Every stroke and dot draws in currentColor, so one `color` recolours the whole glyph, dots
    // included, and with no colour the glyph follows the surrounding text.
    it("recolours every outline icon, strokes and dots alike, through currentColor", () => {
        for (const [name, Icon] of ICONS.filter(([n]) => !BRAND_MARKS.includes(n))) {
            const svg = svgOf(<Icon color="red" />);
            const paints = [...svg.querySelectorAll("*")].flatMap((el) => [el.getAttribute("fill"), el.getAttribute("stroke")]);

            expect(svg.getAttribute("color"), name).toBe("red");
            expect(svg.getAttribute("stroke"), name).toBe("currentColor");
            expect(paints.filter((paint) => paint !== null && paint !== "currentColor" && paint !== "none"), name).toEqual([]);
            expect(svgOf(Icon()).hasAttribute("color"), name).toBe(false);
        }
    });

    it("fills a brand mark with the given colour, or currentColor", () => {
        for (const name of BRAND_MARKS) {
            const Icon = (core as unknown as Record<string, IconComponent>)[name];

            expect(svgOf(Icon()).getAttribute("fill"), name).toBe("currentColor");
            expect(svgOf(<Icon color="#24292f" />).getAttribute("fill"), name).toBe("#24292f");
        }
    });
});
