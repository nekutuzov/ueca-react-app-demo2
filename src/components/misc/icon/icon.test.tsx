import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Icon } from "@components";
import { DeleteIcon, IconSource, InfoCircleIcon } from "@core";

// The wrapper span every rendered icon sits in.
function renderIcon(props: React.ComponentProps<typeof Icon>): HTMLElement {
    const { container } = render(<Icon {...props} />);
    return container.firstElementChild as HTMLElement;
}

// The markup a glyph component draws at the size and colour Icon renders it with.
function glyphMarkup(glyph: typeof DeleteIcon): string {
    const { container, unmount } = render(<>{glyph({ size: "1em", color: "currentColor" })}</>);
    const html = container.innerHTML;
    unmount();
    return html;
}

describe("Icon", () => {
    it("renders nothing when render is false", () => {
        const { container } = render(<Icon name="delete" render={false} />);

        expect(container).toBeEmptyDOMElement();
    });

    it("renders nothing when it has neither a name nor a source", () => {
        const { container } = render(<Icon size="lg" label="Nothing" />);

        expect(container).toBeEmptyDOMElement();
    });

    // Call sites name a ROLE; the registry decides the glyph.
    it("draws the glyph registered for a role at 1em in currentColor", () => {
        const expected = glyphMarkup(DeleteIcon);

        const icon = renderIcon({ name: "delete" });

        expect(icon.tagName).toBe("SPAN");
        expect(icon).toHaveClass("ueca-icon");
        expect(icon.innerHTML).toBe(expected);
        const svg = icon.querySelector("svg");
        expect(svg).toHaveAttribute("width", "1em");
        expect(svg).toHaveAttribute("color", "currentColor");
    });

    it("prefers a source supplied directly over the named role", () => {
        const source: IconSource = { kind: "svg", component: InfoCircleIcon };

        expect(renderIcon({ name: "delete", source }).innerHTML).toBe(glyphMarkup(InfoCircleIcon));
    });

    // The size lives in tokens.css as font-size; the glyph follows it through 1em.
    it.each([
        [undefined, "var(--icon-md)"],
        ["xs", "var(--icon-xs)"],
        ["2xl", "var(--icon-2xl)"],
        [18, "18px"]
    ] as const)("sizes the wrapper from size %s as font-size %s", (size, fontSize) => {
        expect(renderIcon({ name: "add", size }).style.fontSize).toBe(fontSize);
    });

    describe("colour", () => {
        it("inherits the surrounding colour by default", () => {
            expect(renderIcon({ name: "add" }).style.color).toBe("");
        });

        it("resolves a palette token", () => {
            expect(renderIcon({ name: "add", color: "error.main" }).style.color).toBe("var(--error)");
        });

        // The ink stop of the ramp, not the raw status colour that goes unreadable on light surfaces.
        it("tints with the readable ink of a status intent", () => {
            expect(renderIcon({ name: "add", intent: "warning" }).style.color).toBe("var(--warning-ink)");
        });

        it("ignores the neutral intent", () => {
            expect(renderIcon({ name: "add", intent: "none" }).style.color).toBe("");
        });

        it("gives an explicit colour precedence over an intent", () => {
            expect(renderIcon({ name: "add", intent: "success", color: "secondary.main" }).style.color).toBe("var(--secondary)");
        });
    });

    describe("accessibility", () => {
        // A meaningful icon is named with aria-label, never the browser's own `title` popup.
        it("names a labelled icon as an image through aria-label, without a title attribute", () => {
            renderIcon({ name: "lock", label: "Locked" });

            const icon = screen.getByRole("img", { name: "Locked" });
            expect(icon).toHaveClass("ueca-icon");
            expect(icon).not.toHaveAttribute("title");
        });

        it("leaves an unlabelled icon decorative", () => {
            const icon = renderIcon({ name: "lock" });

            expect(icon).not.toHaveAttribute("role");
            expect(icon).not.toHaveAttribute("aria-label");
        });
    });

    it("appends a caller className to its own", () => {
        expect(renderIcon({ name: "add", className: "spin" }).className).toBe("ueca-icon spin");
    });

    describe("url source", () => {
        it("renders an image with the source's alt text", () => {
            const icon = renderIcon({ source: { kind: "url", src: "/logo.png", alt: "Company logo" }, label: "Ignored label" });

            const img = icon.querySelector("img");
            expect(img).toHaveClass("ueca-icon-image");
            expect(img).toHaveAttribute("src", "/logo.png");
            expect(img).toHaveAttribute("alt", "Company logo");
        });

        it("falls back to the label for alt text, and to an empty, decorative alt without one", () => {
            expect(renderIcon({ source: { kind: "url", src: "/a.png" }, label: "Avatar" }).querySelector("img")).toHaveAttribute("alt", "Avatar");
            expect(renderIcon({ source: { kind: "url", src: "/b.png" } }).querySelector("img")).toHaveAttribute("alt", "");
        });
    });
});
