import { describe, expect, it, vi } from "vitest";
import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AlertToast } from "@components";
import { mount, settle } from "@test";

const bottomCenter = { vertical: "bottom", horizontal: "center" } as const;

function snackbar(): HTMLElement {
    return document.getElementById("toast.snackbar");
}

function alertOf(): HTMLElement {
    return snackbar()?.querySelector(".ueca-alert");
}

describe("AlertToast", () => {
    it("renders nothing while closed", async () => {
        const { container } = await mount(AlertToast, { id: "toast", contentView: "Saved", anchorOrigin: bottomCenter });

        expect(container).toBeEmptyDOMElement();
    });

    it("opens a filled alert of its severity inside a positioned, sliding snackbar", async () => {
        const { model } = await mount(AlertToast, {
            id: "toast", contentView: "Saved", severity: "success", anchorOrigin: bottomCenter
        });

        model.open = true;
        await settle();

        expect(snackbar()).toHaveClass("ueca-snackbar", "snackbar-bottom-center", "snackbar-transition");
        expect(alertOf()).toHaveClass("ueca-alert", "ueca-alert-filled", "ueca-alert-success");
        expect(alertOf().querySelector(".alert-message")).toHaveTextContent("Saved");
    });

    it("is an info alert by default", async () => {
        await mount(AlertToast, { id: "toast", open: true, contentView: "FYI", anchorOrigin: bottomCenter });

        expect(alertOf()).toHaveClass("ueca-alert-info");
    });

    it("follows content and severity changes while open", async () => {
        const { model } = await mount(AlertToast, { id: "toast", open: true, contentView: "Saving", anchorOrigin: bottomCenter });

        model.contentView = "Save failed";
        model.severity = "error";
        await settle();

        expect(alertOf()).toHaveClass("ueca-alert-error");
        expect(alertOf()).toHaveTextContent("Save failed");
    });

    it("raises onOpen with its own model each time it opens", async () => {
        const onOpen = vi.fn();
        const { model } = await mount(AlertToast, { id: "toast", contentView: "Hi", anchorOrigin: bottomCenter, onOpen });

        model.open = true;
        await settle();
        expect(onOpen).toHaveBeenCalledExactlyOnceWith(model);

        model.open = false;
        await settle();
        model.open = true;
        await settle();

        expect(onOpen).toHaveBeenCalledTimes(2);
        expect(onOpen).toHaveBeenLastCalledWith(model);
    });

    // Regression: AppAlertManager creates every toast already open. The bound `open` reached the
    // snackbar before its `init` hook ran, so onChangeOpen raised onOpen, and then `init`, finding the
    // snackbar open, raised it again — one opening reported twice.
    it("raises onOpen once for a toast created open", async () => {
        const onOpen = vi.fn();

        await mount(AlertToast, { id: "toast", open: true, contentView: "Hi", anchorOrigin: bottomCenter, onOpen });

        expect(onOpen).toHaveBeenCalledOnce();
    });

    it("closes from the alert's × and raises onClose with its own model", async () => {
        const onClose = vi.fn();
        const { model } = await mount(AlertToast, { id: "toast", open: true, contentView: "Saved", anchorOrigin: bottomCenter, onClose });

        await userEvent.click(within(alertOf()).getByRole("button", { name: "Close" }));
        await settle();

        expect(model.open).toBe(false);
        expect(snackbar()).toBeNull();
        expect(onClose).toHaveBeenCalledExactlyOnceWith(model);
    });

    it("hides itself four seconds after opening", async () => {
        const onClose = vi.fn();
        const { model } = await mount(AlertToast, { id: "toast", contentView: "Saved", anchorOrigin: bottomCenter, onClose });
        vi.useFakeTimers({ shouldAdvanceTime: true });

        model.open = true;
        await settle();
        await act(async () => { await vi.advanceTimersByTimeAsync(3900); });
        expect(screen.getByText("Saved")).toBeInTheDocument();

        await act(async () => { await vi.advanceTimersByTimeAsync(100); });

        expect(model.open).toBe(false);
        expect(screen.queryByText("Saved")).toBeNull();
        expect(onClose).toHaveBeenCalledExactlyOnceWith(model);
    });

    // How AppAlertManager stacks toasts: in flow, and sliding in only while new.
    it("passes transition and disablePortal through to its snackbar", async () => {
        const { model } = await mount(AlertToast, { id: "toast", open: true, contentView: "Hi", disablePortal: true, transition: true });
        expect(snackbar()).toHaveClass("snackbar-relative", "snackbar-transition");

        model.transition = false;
        await settle();

        expect(snackbar()).toHaveClass("snackbar-relative");
        expect(snackbar()).not.toHaveClass("snackbar-transition");
    });

    // Regression: anchorOrigin defaults to undefined here, and Snackbar read anchorOrigin.vertical
    // unguarded, so a local toast opened without a position threw in its View and showed nothing,
    // while onOpen still reported it opened. Only AppAlertManager's disablePortal path avoided the read.
    it("opens at the top right, like a Snackbar, when no anchorOrigin is given", async () => {
        const onOpen = vi.fn();
        const { model } = await mount(AlertToast, { id: "toast", contentView: "Saved", onOpen });

        model.open = true;
        await settle();

        expect(screen.getByText("Saved")).toBeInTheDocument();
        expect(snackbar()).toHaveClass("snackbar-top-right", "snackbar-transition");
        expect(onOpen).toHaveBeenCalledOnce();
    });
});
