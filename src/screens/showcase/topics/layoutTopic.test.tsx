import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Row } from "@components";
import { mount } from "@test";
import { LayoutTopic } from "./layoutTopic";

const TOPIC = "layout";

// A specimen is its label followed by the demo it labels.
function demoLabelled(text: string): HTMLElement {
    return screen.getByText(text, { selector: ".showcase-specimen-label" }).nextElementSibling as HTMLElement;
}

// Row and Col share some alignment labels, so an alignment demo is picked by its flex direction.
function flexDemo(text: string, direction: "row" | "column"): HTMLElement {
    const demos = screen.getAllByText(text, { selector: ".showcase-specimen-label" })
        .map((label) => label.nextElementSibling.firstElementChild as HTMLElement)
        .filter((demo) => demo?.style.flexDirection === direction);
    expect(demos, `${direction} demo labelled ${text}`).toHaveLength(1);
    return demos[0];
}

function styles(elements: Element[], property: "height" | "width" | "fontSize" | "flexGrow"): string[] {
    return elements.map((el) => (el as HTMLElement).style[property]);
}

describe("LayoutTopic", () => {
    it.each([
        ["tiny", "4px"],
        ["default", "8px"],
        ["small", "16px"],
        ["medium", "24px"],
        ["large", "32px"],
        ["huge", "64px"]
    ])(`demonstrates spacing="%s" as a %s gap between three swatches`, async (step, gap) => {
        await mount(LayoutTopic, { id: TOPIC });

        const row = demoLabelled(`spacing="${step}"`);
        expect(row.style.gap).toBe(gap);
        expect(row.children).toHaveLength(3);
    });

    it("demonstrates spacing=\"none\" with no gap at all", async () => {
        await mount(LayoutTopic, { id: TOPIC });

        expect(parseFloat(demoLabelled(`spacing="none"`).style.gap)).toBe(0);
    });

    // Regression: the Spacing section told the reader a Row or Col "defaults to `default` (8px), not
    // zero", but both default to no gap (row.tsx: "No implicit gap"), so the reference page
    // misstated the one default it warned about.
    it("states the gap a Row really has without a spacing prop", async () => {
        await mount(LayoutTopic, { id: TOPIC });
        const unspaced = render(<Row><i /><i /></Row>, { container: document.createElement("div") }).container.firstElementChild as HTMLElement;
        expect(parseFloat(unspaced.style.gap)).toBe(0);

        const description = screen.getByText(/^The gap BETWEEN children/).textContent.replace(/\s+/g, " ");
        expect(description).not.toContain("defaults to `default` (8px)");
        expect(description).toContain("There is none by default");
    });

    it.each([
        ["none", "0px"],
        ["tiny", "4px"],
        ["small", "16px"],
        ["large", "32px"]
    ])(`pads the padding="%s" frame by %s`, async (step, padding) => {
        await mount(LayoutTopic, { id: TOPIC });

        const frame = demoLabelled(`padding="${step}"`);
        expect(frame).toHaveClass("showcase-frame");
        expect(frame.style.padding).toBe(padding);
    });

    describe("alignment specimens", () => {
        it.each([
            ["left", "flex-start"],
            ["center", "center"],
            ["spaceBetween", "space-between"],
            ["spaceEvenly", "space-evenly"]
        ])(`lays out Row horizontalAlign="%s" as justify-content %s`, async (align, justify) => {
            await mount(LayoutTopic, { id: TOPIC });

            expect(flexDemo(`horizontalAlign="${align}"`, "row").style.justifyContent).toBe(justify);
        });

        // A fixed-size child cannot show `stretch` (nothing to stretch into) or `baseline` (no text
        // baseline), and would render identically to `top` — so those two get different children.
        it("gives Row verticalAlign=\"stretch\" swatches without a height of their own", async () => {
            await mount(LayoutTopic, { id: TOPIC });

            const row = flexDemo(`verticalAlign="stretch"`, "row");
            expect(row.style.alignItems).toBe("stretch");
            expect(styles([...row.children], "height")).toEqual(["", "", ""]);
        });

        it("gives Row verticalAlign=\"baseline\" text in three different sizes", async () => {
            await mount(LayoutTopic, { id: TOPIC });

            const row = flexDemo(`verticalAlign="baseline"`, "row");
            expect(row.style.alignItems).toBe("baseline");
            expect([...row.children].map((child) => child.textContent)).toEqual(["Ag", "Ag", "Ag"]);
            expect(styles([...row.children], "fontSize")).toEqual(["10px", "17px", "13px"]);
        });

        it.each(["top", "center", "bottom"])("gives Row verticalAlign=\"%s\" swatches of three heights", async (align) => {
            await mount(LayoutTopic, { id: TOPIC });

            expect(styles([...flexDemo(`verticalAlign="${align}"`, "row").children], "height")).toEqual(["20px", "36px", "28px"]);
        });

        // Same reasoning on a Col's cross axis: `stretch` needs children with no width of their own.
        it("gives Col horizontalAlign=\"stretch\" swatches without a width, and the others two widths", async () => {
            await mount(LayoutTopic, { id: TOPIC });

            const stretch = flexDemo(`horizontalAlign="stretch"`, "column");
            expect(stretch.style.alignItems).toBe("stretch");
            expect(styles([...stretch.children], "width")).toEqual(["", ""]);

            const right = flexDemo(`horizontalAlign="right"`, "column");
            expect(right.style.alignItems).toBe("flex-end");
            expect(styles([...right.children], "width")).toEqual(["44px", "68px"]);
        });

        it.each([
            ["top", "flex-start"],
            ["spaceBetween", "space-between"],
            ["spaceAround", "space-around"]
        ])(`lays out Col verticalAlign="%s" as justify-content %s`, async (align, justify) => {
            await mount(LayoutTopic, { id: TOPIC });

            const col = flexDemo(`verticalAlign="${align}"`, "column");
            expect(col.style.justifyContent).toBe(justify);
            expect(col.children).toHaveLength(3);
        });
    });

    it.each([
        ["fraction={1} fraction={1}", ["1", "1"]],
        ["fraction={2} fraction={1}", ["2", "1"]],
        ["fraction={1} fraction={2} fraction={1}", ["1", "2", "1"]],
        ["fraction={3} fraction={1}", ["3", "1"]]
    ])("splits the %s specimen in that ratio", async (text, grows) => {
        await mount(LayoutTopic, { id: TOPIC });

        const row = demoLabelled(text).firstElementChild as HTMLElement;
        expect(styles([...row.children], "flexGrow")).toEqual(grows);
    });

    it("mixes a fixed-width swatch with proportional ones", async () => {
        await mount(LayoutTopic, { id: TOPIC });

        const row = demoLabelled(`width={80} (no fraction) + fraction={1} + fraction={2} — fixed and proportional children mix freely`)
            .firstElementChild as HTMLElement;
        const [fixed, one, two] = [...row.children] as HTMLElement[];
        expect(fixed.style.width).toBe("80px");
        expect(fixed.style.flexGrow).toBe("");
        expect([one.style.flexGrow, two.style.flexGrow]).toEqual(["1", "2"]);
    });
});
