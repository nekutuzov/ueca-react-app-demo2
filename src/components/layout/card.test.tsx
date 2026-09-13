import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Card } from "@components";

function renderCard(props: React.ComponentProps<typeof Card>, id = "card"): HTMLElement {
    render(<Card id={id} {...props} />);
    return document.getElementById(id);
}

// The filling block that holds the children — the card's last element child.
function contentBlockOf(card: HTMLElement): HTMLElement {
    return card.lastElementChild as HTMLElement;
}

// Compares only the named inline style values, as a plain object so a failure diff shows them.
function expectInlineStyle(element: HTMLElement, expected: Record<string, string>) {
    const actual = Object.fromEntries(Object.keys(expected).map((prop) => [prop, element.style[prop]]));
    expect(actual).toEqual(expected);
}

describe("Card", () => {
    it("renders nothing when render is false", () => {
        const { container } = render(<Card render={false} title="Hidden">content</Card>);

        expect(container).toBeEmptyDOMElement();
    });

    it("renders a padded paper column with a small gap between title and content", () => {
        const card = renderCard({ children: "content" });

        expectInlineStyle(card, {
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            padding: "24px",
            backgroundColor: "var(--surface)",
            borderRadius: "var(--radius-lg)"
        });
    });

    // A drop shadow alone is nearly invisible on a dark theme, so the hairline ring goes in FRONT
    // of it — both as tokens, never a hardcoded colour.
    it("composes the hairline ring in front of the elevation shadow", () => {
        expect(renderCard({}).style.boxShadow).toBe("var(--ring), var(--shadow-2)");
    });

    // .ueca-title rather than a bare <h2>, which would take the browser's own size and margin.
    it("shows the title in a .ueca-title block rather than a heading element", () => {
        const card = renderCard({ title: "Settings", children: "content" });

        const title = screen.getByText("Settings");
        expect(title).toHaveClass("ueca-title");
        expect(title.tagName).toBe("DIV");
        expect(card.firstElementChild).toBe(title);
        expect(screen.queryByRole("heading")).toBeNull();
    });

    it("renders no title block without a title", () => {
        const card = renderCard({ children: "content" });

        expect(card.querySelector(".ueca-title")).toBeNull();
        expect(card.children).toHaveLength(1);
    });

    it("puts the children in a filling content block that scrolls by default", () => {
        const card = renderCard({ title: "T", children: <span>body</span> });

        const content = contentBlockOf(card);
        expect(content).toContainElement(screen.getByText("body"));
        expectInlineStyle(content, { flex: "1 1 0%", overflow: "auto" });
    });

    // The card itself never clips: its ring and shadow draw outside the box.
    it("applies the caller's overflow to the content block, not to the card", () => {
        const card = renderCard({ overflow: "hidden", children: "content" });

        expect(card.style.overflow).toBe("unset");
        expect(contentBlockOf(card).style.overflow).toBe("hidden");
    });

    it("lets the caller replace the default padding and background", () => {
        expectInlineStyle(renderCard({ padding: "none", backgroundColor: "background.default" }), {
            padding: "0px",
            backgroundColor: "var(--bg)"
        });
    });

    it("lets sx override its own radius and shadow", () => {
        expectInlineStyle(renderCard({ sx: { borderRadius: "0px", boxShadow: "none", gap: "2px" } }), {
            borderRadius: "0px",
            boxShadow: "none",
            gap: "2px"
        });
    });

    it("passes layout, identity and events through to the card root", () => {
        const onClick = vi.fn();
        const ref = React.createRef<HTMLDivElement>();
        render(<Card id="card" ref={ref} className="profile" role="region" fill width={320} onClick={onClick}>content</Card>);
        const card = screen.getByRole("region");

        fireEvent.click(card);

        expect(card).toHaveAttribute("id", "card");
        expect(card).toHaveClass("profile");
        expect(ref.current).toBe(card);
        expectInlineStyle(card, { flex: "1 1 0%", width: "320px" });
        expect(onClick).toHaveBeenCalledOnce();
    });
});
