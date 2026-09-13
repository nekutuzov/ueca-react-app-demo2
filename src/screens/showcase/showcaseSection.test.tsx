import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ShowcaseSection, ShowcaseSpecimen } from "./showcaseSection";

describe("ShowcaseSection", () => {
    it("renders the title, the description and the specimen in a framed well", () => {
        const { container } = render(
            <ShowcaseSection title="Spacing" description="The gap between children.">
                <span>specimen</span>
            </ShowcaseSection>
        );

        expect(container.querySelector(".showcase-section-title")).toHaveTextContent("Spacing");
        expect(container.querySelector(".showcase-section-description")).toHaveTextContent("The gap between children.");
        const well = screen.getByText("specimen").parentElement;
        expect(well).toHaveClass("showcase-specimen");
        // The default padding suits a row of specimens: "small", 16px.
        expect(well).toHaveStyle({ padding: "16px" });
    });

    it.each([
        ["without a description", undefined],
        ["with an empty description", ""]
    ])("draws no description element %s", (_, description) => {
        const { container } = render(<ShowcaseSection title="Card" description={description} />);

        expect(container.querySelector(".showcase-section-description")).toBeNull();
    });

    it("pads the well as asked, for tall content", () => {
        render(<ShowcaseSection title="Table" padding="large"><span>tall</span></ShowcaseSection>);

        expect(screen.getByText("tall").parentElement).toHaveStyle({ padding: "32px" });
    });

    it("drops the frame, but not the padding, when framed is false", () => {
        render(<ShowcaseSection title="Card" framed={false}><span>own surface</span></ShowcaseSection>);

        const well = screen.getByText("own surface").parentElement;
        expect(well).not.toHaveClass("showcase-specimen");
        expect(well).toHaveStyle({ padding: "16px" });
    });
});

describe("ShowcaseSpecimen", () => {
    it("labels the demo beneath it", () => {
        const { container } = render(<ShowcaseSpecimen label={`spacing="small"`}><i data-testid="demo" /></ShowcaseSpecimen>);

        const label = container.querySelector(".showcase-specimen-label");
        expect(label).toHaveTextContent(`spacing="small"`);
        expect(label.nextElementSibling).toBe(screen.getByTestId("demo"));
    });

    // A fixed-width frame inside a shrink-wrapped specimen pushed the page wider than a phone, so
    // the specimen is capped at its row's width and may shrink below its content.
    it("caps its width at the row it sits in", () => {
        const { container } = render(<ShowcaseSpecimen label="pill" width={230} />);

        expect(container.firstElementChild).toHaveStyle({ width: "230px", maxWidth: "100%", minWidth: "0px" });
    });
});
