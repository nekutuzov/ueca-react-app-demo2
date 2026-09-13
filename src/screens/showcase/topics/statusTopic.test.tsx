import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { mount } from "@test";
import { StatusTopic } from "./statusTopic";

const TOPIC = "status";

const SAMPLE_TEXT = {
    success: "Online",
    info: "Scheduled",
    warning: "Battery low",
    error: "Comms lost",
    primary: "Active",
    none: "Unknown"
};

function byId(id: string): HTMLElement {
    return document.getElementById(`${TOPIC}.${id}`);
}

function rampStops(intent: string): HTMLElement[] {
    const label = screen.getByText(intent, { selector: ".showcase-specimen-label" });
    return [...label.nextElementSibling.children] as HTMLElement[];
}

describe("StatusTopic", () => {
    describe("ramps", () => {
        it.each(["success", "info", "warning", "error", "primary"])("draws the %s ramp as its base colour and four derived stops", async (intent) => {
            await mount(StatusTopic, { id: TOPIC });

            const [base, ...stops] = rampStops(intent);
            expect([base, ...stops].map((stop) => stop.textContent)).toEqual(["base", "bg", "hover", "border", "ink"]);
            for (const stop of stops) {
                expect(stop.style.color).toBe(`var(--${intent}-ink)`);
                expect(stop.style.borderColor).toBe(`var(--${intent}-border)`);
            }
            expect(stops.map((stop) => stop.style.backgroundColor)).toEqual([
                `var(--${intent}-bg)`,
                `var(--${intent}-hover)`,
                `var(--${intent}-border)`,
                // The ink stop shows the ink on the tint it is meant to be read against.
                `var(--${intent}-bg)`
            ]);
        });

        // "primary" rides the theme accent: there is no --primary base colour to draw.
        it("draws the primary base from the accent, and every other base from its own status colour", async () => {
            await mount(StatusTopic, { id: TOPIC });

            expect(rampStops("primary")[0].style.backgroundColor).toBe("var(--accent)");
            expect(rampStops("warning")[0].style.backgroundColor).toBe("var(--warning)");
        });

        it("draws no ramp for the neutral intent", async () => {
            await mount(StatusTopic, { id: TOPIC });

            expect(screen.queryByText("none", { selector: ".showcase-specimen-label" })).toBeNull();
        });
    });

    it.each(["soft", "outlined", "solid", "bare"])("labels a %s chip for every intent with wording that suits it", async (variant) => {
        await mount(StatusTopic, { id: TOPIC });

        for (const [intent, text] of Object.entries(SAMPLE_TEXT)) {
            const chip = byId(`chip-${variant}-${intent}`);
            expect(chip).toHaveClass(`ueca-status-label-${variant}`, `ueca-status-label-${intent}`);
            expect(chip).toHaveTextContent(text);
        }
    });

    it("shows determinate bars, a labelled one, and the indeterminate sweep", async () => {
        await mount(StatusTopic, { id: TOPIC });

        const bar = (id: string) => byId(id).querySelector("[role=progressbar]");
        expect(bar("pb-quarter")).toHaveAttribute("aria-valuenow", "25");
        expect(byId("pb-quarter").querySelector(".progressbar-label")).toBeNull();
        expect(byId("pb-labelled")).toHaveTextContent("60%");
        expect(byId("pb-done")).toHaveTextContent("100%");
        expect(bar("pb-indeterminate")).toHaveClass("indeterminate");
        expect(bar("pb-indeterminate")).not.toHaveAttribute("aria-valuenow");
    });

    it.each(["standard", "outlined", "filled"])("shows a %s alert for every severity", async (variant) => {
        await mount(StatusTopic, { id: TOPIC });

        for (const severity of ["success", "info", "warning", "error"] as const) {
            const alert = byId(`alert-${variant}-${severity}`);
            expect(alert).toHaveClass(`ueca-alert-${variant}`, `ueca-alert-${severity}`);
            expect(alert).toHaveTextContent(`${SAMPLE_TEXT[severity]} — sensor 04 reported at 14:02.`);
        }
    });
});
