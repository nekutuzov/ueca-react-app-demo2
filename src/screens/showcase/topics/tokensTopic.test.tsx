import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { mount } from "@test";
import { TokensTopic } from "./tokensTopic";

// jsdom has no stylesheet, so the root's computed custom properties are stubbed with these.
const STYLESHEET: Record<string, string> = {
    "--text-2xs": " 0.6875rem ",
    "--weight-bold": "700",
    "--tracking-wide": "0.04em",
    "--leading-snug": "1.35",
    "--space-small": "16px",
    "--control-h-md": "40px",
    "--icon-xs": "12px",
    "--icon-lg": "20px",
    "--radius-pill": "999px",
    "--motion-fast": "120ms",
    "--z-toast": "1400",
    "--ease": "cubic-bezier(0.2, 0, 0, 1)"
};

function stubStylesheet() {
    const real = window.getComputedStyle.bind(window);
    return vi.spyOn(window, "getComputedStyle").mockImplementation((el: Element, pseudo?: string) =>
        el === document.documentElement
            ? { getPropertyValue: (name: string) => STYLESHEET[name] ?? "" } as CSSStyleDeclaration
            : real(el, pseudo));
}

function label(text: string): HTMLElement {
    return screen.getByText(text, { selector: ".showcase-specimen-label" });
}

describe("TokensTopic", () => {
    it("reports every scale's values as the live stylesheet resolves them", async () => {
        const getComputedStyle = stubStylesheet();

        await mount(TokensTopic, { id: "tokens" });

        expect(getComputedStyle).toHaveBeenCalledWith(document.documentElement);
        for (const text of [
            "--text-2xs · 0.6875rem",
            "--weight-bold · 700",
            "--tracking-wide · 0.04em",
            "--leading-snug · 1.35",
            `spacing="small" vs var(--space-small) · 16px`,
            "--control-h-md · 40px",
            "--icon-xs · 12px",
            "--radius-pill · 999px",
            "--motion-fast · 120ms",
            "--ease · cubic-bezier(0.2, 0, 0, 1)",
            "--z-toast · 1400"
        ]) {
            expect(label(text)).toBeInTheDocument();
        }
    });

    // The values are read on mount, when the document exists; before that the page shows a
    // placeholder rather than a blank.
    it("shows a placeholder for each value until the stylesheet has been read", async () => {
        stubStylesheet();
        let firstDraw: string;

        await mount(TokensTopic, {
            id: "tokens",
            draw: () => {
                firstDraw ??= document.getElementById("tokens").querySelector(".showcase-specimen-label").textContent;
            }
        });

        expect(firstDraw).toBe("--text-2xs · …");
        expect(label("--text-2xs · 0.6875rem")).toBeInTheDocument();
    });

    it("draws each icon specimen at its token's pixel size, or 16px when the token does not resolve", async () => {
        stubStylesheet();

        await mount(TokensTopic, { id: "tokens" });

        const glyph = (text: string) => label(text).nextElementSibling;
        expect(glyph("--icon-xs · 12px")).toHaveAttribute("width", "12");
        expect(glyph("--icon-lg · 20px")).toHaveAttribute("width", "20");
        expect(glyph("--icon-md ·")).toHaveAttribute("width", "16");
    });

    // The spacing scale is declared twice, in layout.tsx and tokens.css; each step is drawn both
    // ways so a drift between them shows.
    it.each([
        ["tiny", "4px"],
        ["default", "8px"],
        ["small", "16px"],
        ["medium", "24px"],
        ["large", "32px"]
    ])("draws spacing %s once through the JSX prop and once through its CSS variable", async (step, px) => {
        stubStylesheet();

        await mount(TokensTopic, { id: "tokens" });

        const specimen = screen.getByText(new RegExp(`^spacing="${step}" vs var\\(--space-${step}\\)`)).parentElement;
        const [, viaProp, viaVariable] = [...specimen.children] as HTMLElement[];
        expect(viaProp.style.gap).toBe(px);
        expect(viaVariable.style.gap).toBe(`var(--space-${step})`);
        expect(viaProp.children).toHaveLength(4);
        expect(viaVariable.children).toHaveLength(4);
    });
});
