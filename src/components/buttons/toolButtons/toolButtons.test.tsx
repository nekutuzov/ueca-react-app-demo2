import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
    AddNewButton, CancelButton, CancelButtonParams, DeleteButton, DeleteButtonParams, EditButton, Icon,
    RefreshButton, SaveButton
} from "@components";
import { IconName, RefreshIcon } from "@core";
import { mount, settle, stubMessages } from "@test";

// The markup a glyph renders on its own, to compare with what the button draws.
function glyphMarkup(glyph: React.ReactElement): string {
    const { container, unmount } = render(glyph);
    const markup = container.innerHTML;
    unmount();
    return markup;
}

function startIconMarkup(button: HTMLElement): string {
    return button.querySelector(".button-start-icon")?.innerHTML;
}

const CANCEL_MESSAGE = "All unsaved changes will be lost! Are you sure you want to cancel?";

describe("toolbar buttons", () => {
    it.each([
        ["SaveButton", SaveButton, "Save", "contained", "save", "sm"],
        ["AddNewButton", AddNewButton, "Add new", "outlined", "addCircle", "md"],
        ["EditButton", EditButton, "Edit", "outlined", "edit", "sm"]
    ] as const)("%s renders its caption, variant and glyph", async (_name, Component, caption, variant, icon, size) => {
        await mount(Component, { id: "tool" });

        const button = screen.getByRole("button", { name: caption });
        expect(button).toHaveClass(`ueca-button-${variant}`);
        expect(startIconMarkup(button)).toBe(glyphMarkup(<Icon name={icon as IconName} size={size} />));
    });

    it("lets the caller override any default", async () => {
        await mount(SaveButton, { id: "save", contentView: "Apply", variant: "text", startIconView: <i data-testid="own" /> });

        const button = screen.getByRole("button", { name: "Apply" });
        expect(button).toHaveClass("ueca-button-text");
        expect(screen.getByTestId("own").parentElement).toHaveClass("button-start-icon");
    });

    // Size is deliberately not pinned, so AddNew stays in step with its sibling tool buttons.
    it("AddNewButton leaves size at the Button default and takes one from the caller", async () => {
        await mount(AddNewButton, { id: "a" });
        await mount(AddNewButton, { id: "b", size: "small" });

        expect(document.getElementById("a")).toHaveClass("ueca-button-medium");
        expect(document.getElementById("b")).toHaveClass("ueca-button-small");
    });

    it("SaveButton raises onClick without asking anything", async () => {
        const bus = await stubMessages({ "Dialog.Confirmation": vi.fn(async () => true) });
        const onClick = vi.fn();
        const { model } = await mount(SaveButton, { id: "save", onClick });

        await userEvent.click(screen.getByRole("button", { name: "Save" }));

        expect(onClick).toHaveBeenCalledWith(model);
        expect(bus["Dialog.Confirmation"]).not.toHaveBeenCalled();
    });
});

describe("CancelButton", () => {
    it("is an outlined Cancel button", async () => {
        await mount(CancelButton, { id: "cancel" });

        expect(screen.getByRole("button", { name: "Cancel" })).toHaveClass("ueca-button-outlined");
    });

    it("confirms discarding changes, then raises onClick with its model", async () => {
        const bus = await stubMessages({ "Dialog.Confirmation": vi.fn(async () => true) });
        const onClick = vi.fn();
        const { model } = await mount(CancelButton, { id: "cancel", onClick });

        await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
        await settle();

        expect(bus["Dialog.Confirmation"]).toHaveBeenCalledWith({ title: "Confirmation", message: CANCEL_MESSAGE });
        expect(onClick).toHaveBeenCalledOnce();
        expect(onClick).toHaveBeenCalledWith(model);
    });

    it("does not raise onClick when the user declines", async () => {
        await stubMessages({ "Dialog.Confirmation": vi.fn(async () => false) });
        const onClick = vi.fn();
        await mount(CancelButton, { id: "cancel", onClick });

        await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
        await settle();

        expect(onClick).not.toHaveBeenCalled();
    });

    it("treats a confirmation nobody answers as declined", async () => {
        const onClick = vi.fn();
        await mount(CancelButton, { id: "cancel", onClick });

        await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
        await settle();

        expect(onClick).not.toHaveBeenCalled();
    });

    it("raises onClick straight away with skipConfirmation", async () => {
        const bus = await stubMessages({ "Dialog.Confirmation": vi.fn(async () => true) });
        const onClick = vi.fn();
        // getFC types the component by the Button model, so the factory's own params go in typed.
        const params: CancelButtonParams = { id: "cancel", skipConfirmation: true, onClick };
        await mount(CancelButton, params);

        await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
        await settle();

        expect(onClick).toHaveBeenCalledOnce();
        expect(bus["Dialog.Confirmation"]).not.toHaveBeenCalled();
    });

    it("waits for the dialog before raising onClick", async () => {
        let answer: (confirmed: boolean) => void;
        await stubMessages({ "Dialog.Confirmation": vi.fn(() => new Promise<boolean>((resolve) => { answer = resolve; })) });
        const onClick = vi.fn();
        await mount(CancelButton, { id: "cancel", onClick });

        await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
        await settle();
        expect(onClick).not.toHaveBeenCalled();

        answer(true);
        await settle();
        expect(onClick).toHaveBeenCalledOnce();
    });

    it("confirms without failing when the owner supplied no onClick", async () => {
        const bus = await stubMessages({ "Dialog.Confirmation": vi.fn(async () => true) });
        await mount(CancelButton, { id: "cancel" });

        await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
        await settle();

        expect(bus["Dialog.Confirmation"]).toHaveBeenCalledOnce();
    });

    it("asks nothing while disabled", async () => {
        const bus = await stubMessages({ "Dialog.Confirmation": vi.fn(async () => true) });
        await mount(CancelButton, { id: "cancel", disabled: true });

        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
        await settle();

        expect(bus["Dialog.Confirmation"]).not.toHaveBeenCalled();
    });
});

describe("DeleteButton", () => {
    it("is an outlined, error-coloured Delete button with the delete glyph", async () => {
        await mount(DeleteButton, { id: "delete" });

        const button = screen.getByRole("button", { name: "Delete" });
        expect(button).toHaveClass("ueca-button-outlined");
        expect(button.style.getPropertyValue("--button-color")).toBe("var(--error)");
        expect(startIconMarkup(button)).toBe(glyphMarkup(<Icon name="delete" size="sm" />));
    });

    it("confirms with the default action dialog, then raises onClick with its model", async () => {
        const bus = await stubMessages({ "Dialog.ActionConfirmation": vi.fn(async () => true) });
        const onClick = vi.fn();
        const { model } = await mount(DeleteButton, { id: "delete", onClick });

        await userEvent.click(screen.getByRole("button", { name: "Delete" }));
        await settle();

        expect(bus["Dialog.ActionConfirmation"]).toHaveBeenCalledWith({
            title: "Warning",
            message: "Are you sure want to delete this item?",
            action: "Delete"
        });
        expect(onClick).toHaveBeenCalledWith(model);
    });

    it.each([
        [{ dialogTitle: "Remove user", dialogMessage: "Remove ada?" }, { title: "Remove user", message: "Remove ada?" }],
        [{ dialogTitle: "Remove user" }, { title: "Remove user", message: "Are you sure want to delete this item?" }],
        [{ dialogMessage: "Remove ada?" }, { title: "Warning", message: "Remove ada?" }]
    ])("asks with a custom title and message: %j", async (custom, expected) => {
        const bus = await stubMessages({ "Dialog.ActionConfirmation": vi.fn(async () => true) });
        const params: DeleteButtonParams = { id: "delete", ...custom };
        await mount(DeleteButton, params);

        await userEvent.click(screen.getByRole("button", { name: "Delete" }));
        await settle();

        expect(bus["Dialog.ActionConfirmation"]).toHaveBeenCalledWith({ ...expected, action: "Delete" });
    });

    it("does not raise onClick when the user declines", async () => {
        await stubMessages({ "Dialog.ActionConfirmation": vi.fn(async () => false) });
        const onClick = vi.fn();
        await mount(DeleteButton, { id: "delete", onClick });

        await userEvent.click(screen.getByRole("button", { name: "Delete" }));
        await settle();

        expect(onClick).not.toHaveBeenCalled();
    });

    // A destructive action must never proceed on a confirmation that did not happen.
    it("treats a confirmation nobody answers as declined", async () => {
        const onClick = vi.fn();
        await mount(DeleteButton, { id: "delete", onClick });

        await userEvent.click(screen.getByRole("button", { name: "Delete" }));
        await settle();

        expect(onClick).not.toHaveBeenCalled();
    });

    it("raises onClick straight away with showDialog false", async () => {
        const bus = await stubMessages({ "Dialog.ActionConfirmation": vi.fn(async () => true) });
        const onClick = vi.fn();
        const params: DeleteButtonParams = { id: "delete", showDialog: false, onClick };
        await mount(DeleteButton, params);

        await userEvent.click(screen.getByRole("button", { name: "Delete" }));
        await settle();

        expect(onClick).toHaveBeenCalledOnce();
        expect(bus["Dialog.ActionConfirmation"]).not.toHaveBeenCalled();
    });

    it("confirms without failing when the owner supplied no onClick", async () => {
        const bus = await stubMessages({ "Dialog.ActionConfirmation": vi.fn(async () => true) });
        await mount(DeleteButton, { id: "delete" });

        await userEvent.click(screen.getByRole("button", { name: "Delete" }));
        await settle();

        expect(bus["Dialog.ActionConfirmation"]).toHaveBeenCalledOnce();
    });
});

describe("RefreshButton", () => {
    it("is a refresh icon button named Refresh, which is also its tooltip", async () => {
        const bus = await stubMessages({ "App.Tooltip.Show": vi.fn(async () => { }) });
        await mount(RefreshButton, { id: "refresh" });
        const button = screen.getByRole("button", { name: "Refresh" });

        fireEvent.mouseEnter(button);
        await settle();

        expect(button).toHaveClass("ueca-icon-button");
        expect(button.innerHTML).toBe(glyphMarkup(<RefreshIcon />));
        expect(bus["App.Tooltip.Show"]).toHaveBeenCalledWith(expect.objectContaining({ contentView: "Refresh" }));
    });

    it("takes a caller's title and click handler", async () => {
        const onClick = vi.fn();
        const { model } = await mount(RefreshButton, { id: "refresh", title: "Reload users", onClick });

        await userEvent.click(screen.getByRole("button", { name: "Reload users" }));

        expect(onClick).toHaveBeenCalledWith(model);
    });
});
