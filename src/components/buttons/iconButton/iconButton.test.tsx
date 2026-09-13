import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CloseIconButton, IconButton, IconKind } from "@components";
import { CancelIcon, CheckIcon, CloseIcon, DeleteIcon, RefreshIcon } from "@core";
import { mount, settle, stubMessages } from "@test";

// The markup a glyph renders on its own, to compare with what the button draws.
function glyphMarkup(glyph: React.ReactElement): string {
    const { container, unmount } = render(glyph);
    const markup = container.innerHTML;
    unmount();
    return markup;
}

function stubTooltip() {
    return stubMessages({
        "App.Tooltip.Show": vi.fn(async () => { }),
        "App.Tooltip.Hide": vi.fn(async () => { })
    });
}

describe("IconButton", () => {
    it("renders an empty, unnamed, enabled medium button by default", async () => {
        await mount(IconButton, { id: "ib" });

        const button = screen.getByRole("button");
        expect(button).toHaveAttribute("id", "ib");
        expect(button).toHaveClass("ueca-icon-button", "ueca-icon-button-medium");
        expect(button).toBeEnabled();
        expect(button).toBeEmptyDOMElement();
        expect(button).not.toHaveAttribute("aria-label");
        expect(button.style.getPropertyValue("--icon-button-color")).toBe("");
    });

    it.each(["xsmall", "small", "medium", "large"] as const)("reflects size %s in its class", async (size) => {
        await mount(IconButton, { id: "ib", kind: "ok", size });

        expect(screen.getByRole("button")).toHaveClass(`ueca-icon-button-${size}`);
    });

    it.each([
        ["ok", <CheckIcon />],
        ["cancel", <CancelIcon />],
        ["delete", <DeleteIcon />],
        ["refresh", <RefreshIcon />],
        ["close", <CloseIcon />]
    ] as [IconKind, React.ReactElement][])("draws the %s glyph for its kind", async (kind, glyph) => {
        await mount(IconButton, { id: "ib", kind });

        expect(screen.getByRole("button").innerHTML).toBe(glyphMarkup(glyph));
    });

    it("redraws when kind is assigned at runtime", async () => {
        const { model } = await mount(IconButton, { id: "ib", kind: "ok" });

        model.kind = "delete";
        await settle();

        expect(screen.getByRole("button").innerHTML).toBe(glyphMarkup(<DeleteIcon />));
    });

    it("prefers iconView over kind", async () => {
        await mount(IconButton, { id: "ib", kind: "delete", iconView: <i data-testid="custom" /> });

        const button = screen.getByRole("button");
        expect(screen.getByTestId("custom").parentElement).toBe(button);
        expect(button.querySelector("svg")).toBeNull();
    });

    it("injects --icon-button-color only for a palette colour, never for inherit", async () => {
        const { model } = await mount(IconButton, { id: "ib", kind: "ok" });

        model.color = "error.main";
        await settle();
        expect(screen.getByRole("button").style.getPropertyValue("--icon-button-color")).toBe("var(--error)");

        model.color = "inherit";
        await settle();
        expect(screen.getByRole("button").style.getPropertyValue("--icon-button-color")).toBe("");
    });

    // An icon-only button has no other source for its accessible name.
    it("takes its accessible name from title without setting the native title attribute", async () => {
        await mount(IconButton, { id: "ib", kind: "refresh", title: "Reload rows" });

        const button = screen.getByRole("button", { name: "Reload rows" });
        expect(button).not.toHaveAttribute("title");
    });

    it("raises onClick with its own model", async () => {
        const onClick = vi.fn();
        const { model } = await mount(IconButton, { id: "ib", kind: "ok", onClick });

        await userEvent.click(screen.getByRole("button"));

        expect(onClick).toHaveBeenCalledOnce();
        expect(onClick).toHaveBeenCalledWith(model);
    });

    it("click() raises onClick when enabled", async () => {
        const onClick = vi.fn();
        const { model } = await mount(IconButton, { id: "ib", kind: "ok", onClick });

        model.click();

        expect(onClick).toHaveBeenCalledOnce();
    });

    it("does not raise onClick while disabled, from the DOM or from click()", async () => {
        const onClick = vi.fn();
        const { model } = await mount(IconButton, { id: "ib", kind: "ok", disabled: true, onClick });

        expect(screen.getByRole("button")).toBeDisabled();
        await userEvent.click(screen.getByRole("button"));
        model.click();

        expect(onClick).not.toHaveBeenCalled();
    });

    it("re-enables clicks when disabled is cleared at runtime", async () => {
        const onClick = vi.fn();
        const { model } = await mount(IconButton, { id: "ib", kind: "ok", disabled: true, onClick });

        model.disabled = false;
        await settle();
        await userEvent.click(screen.getByRole("button"));

        expect(onClick).toHaveBeenCalledOnce();
    });

    describe("tooltip", () => {
        it("shows tooltipView in preference to title on hover, and hides it on leave", async () => {
            const bus = await stubTooltip();
            await mount(IconButton, { id: "ib", kind: "delete", title: "Delete", tooltipView: "Delete the selected row" });
            const button = screen.getByRole("button", { name: "Delete" });

            fireEvent.mouseEnter(button);
            await settle();
            expect(bus["App.Tooltip.Show"]).toHaveBeenCalledWith(expect.objectContaining({
                token: "ib",
                contentView: "Delete the selected row"
            }));

            fireEvent.mouseLeave(button);
            await settle();
            expect(bus["App.Tooltip.Hide"]).toHaveBeenCalledWith({ token: "ib" });
        });

        it("uses title as the tooltip when there is no tooltipView", async () => {
            const bus = await stubTooltip();
            await mount(IconButton, { id: "ib", kind: "refresh", title: "Refresh" });

            fireEvent.mouseEnter(screen.getByRole("button"));
            await settle();

            expect(bus["App.Tooltip.Show"]).toHaveBeenCalledWith(expect.objectContaining({ contentView: "Refresh" }));
        });

        // For a control whose meaning is unmistakable: named, but no bubble over the glyph.
        it("shows no tooltip when tooltipEnabled is false, yet keeps its accessible name", async () => {
            const bus = await stubTooltip();
            await mount(IconButton, { id: "ib", kind: "close", title: "Close", tooltipView: "Rich", tooltipEnabled: false });
            const button = screen.getByRole("button", { name: "Close" });

            fireEvent.mouseEnter(button);
            fireEvent.mouseLeave(button);
            await settle();

            expect(bus["App.Tooltip.Show"]).not.toHaveBeenCalled();
            expect(bus["App.Tooltip.Hide"]).not.toHaveBeenCalled();
        });

        it("wires no tooltip without tooltipView or title", async () => {
            const bus = await stubTooltip();
            await mount(IconButton, { id: "ib", kind: "ok" });

            fireEvent.mouseEnter(screen.getByRole("button"));
            await settle();

            expect(bus["App.Tooltip.Show"]).not.toHaveBeenCalled();
        });
    });
});

describe("CloseIconButton", () => {
    // Named but not tooltipped: on an information or warning dialog the × is the only way out, so a
    // screen reader must be able to announce it.
    it("draws the close glyph, is named Close, and shows no tooltip", async () => {
        const bus = await stubTooltip();
        await mount(CloseIconButton, { id: "close" });
        const button = screen.getByRole("button", { name: "Close" });

        fireEvent.mouseEnter(button);
        await settle();

        expect(button.innerHTML).toBe(glyphMarkup(<CloseIcon />));
        expect(bus["App.Tooltip.Show"]).not.toHaveBeenCalled();
    });

    it("lets the caller rename it and turn the tooltip back on", async () => {
        const bus = await stubTooltip();
        await mount(CloseIconButton, { id: "close", title: "Dismiss", tooltipEnabled: true });

        fireEvent.mouseEnter(screen.getByRole("button", { name: "Dismiss" }));
        await settle();

        expect(bus["App.Tooltip.Show"]).toHaveBeenCalledWith(expect.objectContaining({ contentView: "Dismiss" }));
    });

    it("keeps the close glyph even when a caller slips a different kind in", async () => {
        const params = { id: "close", kind: "delete" } as Parameters<typeof CloseIconButton>[0];
        const { model } = await mount(CloseIconButton, params);

        expect(model.kind).toBe("close");
        expect(screen.getByRole("button").innerHTML).toBe(glyphMarkup(<CloseIcon />));
    });

    it("raises onClick with its model", async () => {
        const onClick = vi.fn();
        const { model } = await mount(CloseIconButton, { id: "close", onClick });

        await userEvent.click(screen.getByRole("button", { name: "Close" }));

        expect(onClick).toHaveBeenCalledWith(model);
    });
});
