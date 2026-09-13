import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@components";
import { mount, settle, stubMessages } from "@test";

describe("Button", () => {
    it("renders its content with the default variant, size and alignment", async () => {
        await mount(Button, { id: "save", contentView: "Save" });

        const button = screen.getByRole("button", { name: "Save" });
        expect(button).toHaveAttribute("id", "save");
        expect(button).toHaveClass("ueca-button", "ueca-button-text", "ueca-button-medium");
        expect(button).not.toHaveClass("ueca-button-fullwidth", "ueca-button-selected");
        expect(button).toHaveStyle({ justifyContent: "center" });
    });

    it("reflects variant, size, fullWidth and selected in its classes", async () => {
        await mount(Button, { id: "b", contentView: "Go", variant: "contained", size: "large", fullWidth: true, selected: true });

        expect(screen.getByRole("button")).toHaveClass(
            "ueca-button-contained", "ueca-button-large", "ueca-button-fullwidth", "ueca-button-selected"
        );
    });

    it.each([
        ["left", "flex-start"],
        ["center", "center"],
        ["right", "flex-end"]
    ] as const)("aligns content %s", async (align, justifyContent) => {
        await mount(Button, { id: "b", contentView: "Go", align });

        expect(screen.getByRole("button")).toHaveStyle({ justifyContent });
    });

    it("injects --button-color only for a palette colour, never for inherit", async () => {
        const { model } = await mount(Button, { id: "b", contentView: "Go" });
        expect(screen.getByRole("button").style.getPropertyValue("--button-color")).toBe("");

        model.color = "error.main";
        await settle();

        expect(screen.getByRole("button").style.getPropertyValue("--button-color")).toBe("var(--error)");
    });

    it("renders start and end icons around the content", async () => {
        await mount(Button, {
            id: "b",
            contentView: "Next",
            startIconView: <i data-testid="start" />,
            endIconView: <i data-testid="end" />
        });

        expect(screen.getByTestId("start").parentElement).toHaveClass("button-icon", "button-start-icon");
        expect(screen.getByTestId("end").parentElement).toHaveClass("button-icon", "button-end-icon");
        expect(screen.getByRole("button")).toHaveTextContent("Next");
    });

    it("raises onClick with its own model", async () => {
        const onClick = vi.fn();
        const { model } = await mount(Button, { id: "b", contentView: "Go", onClick });

        await userEvent.click(screen.getByRole("button"));

        expect(onClick).toHaveBeenCalledOnce();
        expect(onClick).toHaveBeenCalledWith(model);
    });

    it("does not raise onClick while disabled, from the DOM or from click()", async () => {
        const onClick = vi.fn();
        const { model } = await mount(Button, { id: "b", contentView: "Go", disabled: true, onClick });

        expect(screen.getByRole("button")).toBeDisabled();
        await userEvent.click(screen.getByRole("button"));
        model.click();

        expect(onClick).not.toHaveBeenCalled();
    });

    it("click() raises onClick when enabled", async () => {
        const onClick = vi.fn();
        const { model } = await mount(Button, { id: "b", contentView: "Go", onClick });

        model.click();

        expect(onClick).toHaveBeenCalledOnce();
    });

    it("re-applies JSX params on every render", async () => {
        const { update } = await mount(Button, { id: "b", contentView: "Save" });

        await update({ id: "b", contentView: "Saved", disabled: true });

        expect(screen.getByRole("button", { name: "Saved" })).toBeDisabled();
    });

    describe("tooltip", () => {
        it("shows tooltipView through the app tooltip on hover and hides it on leave", async () => {
            const bus = await stubMessages({
                "App.Tooltip.Show": vi.fn(async () => { }),
                "App.Tooltip.Hide": vi.fn(async () => { })
            });
            await mount(Button, { id: "b", contentView: "Go", tooltipView: "Runs the job" });
            const button = screen.getByRole("button");

            fireEvent.mouseEnter(button);
            await settle();
            expect(bus["App.Tooltip.Show"]).toHaveBeenCalledWith(expect.objectContaining({
                token: "b",
                contentView: "Runs the job",
                anchor: { top: 0, left: 0, width: 0, height: 0 }
            }));

            fireEvent.mouseLeave(button);
            await settle();
            expect(bus["App.Tooltip.Hide"]).toHaveBeenCalledWith({ token: "b" });
        });

        it("uses title as the tooltip when there is no tooltipView", async () => {
            const bus = await stubMessages({ "App.Tooltip.Show": vi.fn(async () => { }) });
            await mount(Button, { id: "b", contentView: "Go", title: "Plain title" });

            fireEvent.mouseEnter(screen.getByRole("button"));
            await settle();

            expect(bus["App.Tooltip.Show"]).toHaveBeenCalledWith(expect.objectContaining({ contentView: "Plain title" }));
            // The browser's own hint is never used: it cannot be styled and would double up.
            expect(screen.getByRole("button")).not.toHaveAttribute("title");
        });

        it("wires no tooltip handlers without tooltipView or title", async () => {
            const bus = await stubMessages({ "App.Tooltip.Show": vi.fn(async () => { }) });
            await mount(Button, { id: "b", contentView: "Go" });

            fireEvent.mouseEnter(screen.getByRole("button"));
            await settle();

            expect(bus["App.Tooltip.Show"]).not.toHaveBeenCalled();
        });

        // A trigger removed while its tooltip is up never gets its mouseleave, so the base
        // component closes the tooltip on unmount (components/base/base.tsx).
        it("hides its own tooltip when unmounted while showing", async () => {
            const bus = await stubMessages({
                "App.Tooltip.Show": vi.fn(async () => { }),
                "App.Tooltip.Hide": vi.fn(async () => { })
            });
            const { unmount } = await mount(Button, { id: "b", contentView: "Go", tooltipView: "Tip" });

            fireEvent.mouseEnter(screen.getByRole("button"));
            await settle();
            unmount();
            await settle();

            expect(bus["App.Tooltip.Hide"]).toHaveBeenCalledWith({ token: "b" });
        });
    });
});
