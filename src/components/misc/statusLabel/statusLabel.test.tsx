import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { Icon, StatusLabel } from "@components";
import { mount, settle, stubMessages } from "@test";

function chip(): HTMLElement {
    return document.getElementById("status");
}

describe("StatusLabel", () => {
    it("renders a soft, neutral chip with a dot before its label by default", async () => {
        await mount(StatusLabel, { id: "status", labelView: "Draft" });

        expect(chip().tagName).toBe("SPAN");
        expect(chip().className).toBe("ueca-status-label ueca-status-label-soft ueca-status-label-none ueca-caption");
        const [dot, text] = Array.from(chip().children);
        expect(dot).toHaveClass("ueca-status-label-dot");
        expect(text).toHaveClass("ueca-status-label-text");
        expect(text).toHaveTextContent("Draft");
    });

    it("reflects intent and variant in its classes, including changes at runtime", async () => {
        const { model } = await mount(StatusLabel, { id: "status", labelView: "Failed", intent: "error", variant: "solid" });
        expect(chip()).toHaveClass("ueca-status-label-solid", "ueca-status-label-error");

        model.intent = "success";
        model.variant = "outlined";
        await settle();

        expect(chip()).toHaveClass("ueca-status-label-outlined", "ueca-status-label-success");
        expect(chip()).not.toHaveClass("ueca-status-label-solid", "ueca-status-label-error");
    });

    it("drops the dot when showDot is off", async () => {
        await mount(StatusLabel, { id: "status", labelView: "Ready", showDot: false });

        expect(chip().querySelector(".ueca-status-label-dot")).toBeNull();
        expect(chip().children).toHaveLength(1);
    });

    it("puts an iconView in the dot's place", async () => {
        await mount(StatusLabel, { id: "status", labelView: "Locked", iconView: <Icon name="lock" label="lock" /> });

        expect(chip().querySelector(".ueca-status-label-dot")).toBeNull();
        expect(chip().firstElementChild).toBe(screen.getByRole("img", { name: "lock" }));
    });

    describe("title", () => {
        // The label already names the chip; a title is extra explanation, shown through the app's
        // tooltip rather than the browser's hint popup.
        it("explains the chip through the app tooltip, never a title attribute", async () => {
            const bus = await stubMessages({
                "App.Tooltip.Show": vi.fn(async () => { }),
                "App.Tooltip.Hide": vi.fn(async () => { })
            });
            await mount(StatusLabel, { id: "status", labelView: "Stale", title: "Not refreshed for a day" });

            expect(chip()).not.toHaveAttribute("title");
            fireEvent.mouseEnter(chip());
            await settle();
            expect(bus["App.Tooltip.Show"]).toHaveBeenCalledWith(expect.objectContaining({
                token: "status",
                contentView: "Not refreshed for a day"
            }));

            fireEvent.mouseLeave(chip());
            await settle();
            expect(bus["App.Tooltip.Hide"]).toHaveBeenCalledWith({ token: "status" });
        });

        it("wires no tooltip without a title", async () => {
            const bus = await stubMessages({ "App.Tooltip.Show": vi.fn(async () => { }) });
            await mount(StatusLabel, { id: "status", labelView: "Stale" });

            fireEvent.mouseEnter(chip());
            await settle();

            expect(bus["App.Tooltip.Show"]).not.toHaveBeenCalled();
        });
    });
});
