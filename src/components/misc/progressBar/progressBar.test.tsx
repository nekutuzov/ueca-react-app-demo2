import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { ProgressBar } from "@components";
import { mount, settle } from "@test";

function fill(): HTMLElement {
    return screen.getByRole("progressbar").querySelector(".progressbar-fill");
}

function percentageLabel(): HTMLElement {
    return document.querySelector(".progressbar-label");
}

describe("ProgressBar", () => {
    it("exposes a 0–100 progressbar inside its root", async () => {
        await mount(ProgressBar, { id: "progress", value: 10 });

        const root = document.getElementById("progress");
        const bar = screen.getByRole("progressbar");
        expect(root).toHaveClass("ueca-progressbar");
        expect(root).toContainElement(bar);
        expect(bar).toHaveClass("progressbar-track");
        expect(bar).toHaveAttribute("aria-valuemin", "0");
        expect(bar).toHaveAttribute("aria-valuemax", "100");
    });

    it("renders the indeterminate sweep without a value: no aria value, no width, no label", async () => {
        await mount(ProgressBar, { id: "progress", percentage: true });

        const bar = screen.getByRole("progressbar");
        expect(bar).toHaveClass("indeterminate");
        expect(bar).not.toHaveAttribute("aria-valuenow");
        expect(fill()).not.toHaveAttribute("style");
        expect(percentageLabel()).toBeNull();
    });

    it.each([
        [42.4, "42.4%", "42"],
        // Zero is a value, not the absence of one.
        [0, "0%", "0"],
        [99.6, "99.6%", "100"],
        [-10, "0%", "0"],
        [150, "100%", "100"]
    ])("shows value %s as a %s fill, announced and labelled as %s", async (value, width, rounded) => {
        await mount(ProgressBar, { id: "progress", value, percentage: true });

        const bar = screen.getByRole("progressbar");
        expect(bar).not.toHaveClass("indeterminate");
        expect(bar).toHaveAttribute("aria-valuenow", rounded);
        expect(fill().style.width).toBe(width);
        expect(percentageLabel()).toHaveTextContent(`${rounded}%`);
    });

    it("shows the percentage label only when asked", async () => {
        await mount(ProgressBar, { id: "progress", value: 60 });

        expect(percentageLabel()).toBeNull();
    });

    it("follows value assigned at runtime, back to indeterminate when it is cleared", async () => {
        const { model } = await mount(ProgressBar, { id: "progress", value: 20 });

        model.value = 80;
        await settle();
        expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "80");
        expect(fill().style.width).toBe("80%");

        model.value = undefined;
        await settle();
        expect(screen.getByRole("progressbar")).toHaveClass("indeterminate");
        expect(screen.getByRole("progressbar")).not.toHaveAttribute("aria-valuenow");
    });

    it("carries its colour to the stylesheet as a resolved palette variable", async () => {
        const { model } = await mount(ProgressBar, { id: "progress", value: 50 });
        const root = document.getElementById("progress");
        expect(root.style.getPropertyValue("--progressbar-color")).toBe("var(--accent)");

        model.color = "success.main";
        await settle();

        expect(root.style.getPropertyValue("--progressbar-color")).toBe("var(--success)");
    });
});
