import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Alert, SeverityIcon } from "@components";
import { mount, settle } from "@test";

function alert(): HTMLElement {
    return document.getElementById("alert");
}

// The glyph a SeverityIcon draws on its own for the same severity.
async function referenceGlyph(severity: "success" | "info" | "warning" | "error"): Promise<string> {
    await mount(SeverityIcon, { id: `ref-${severity}`, severity });
    return document.getElementById(`ref-${severity}`).querySelector("svg").outerHTML;
}

describe("Alert", () => {
    it("renders a standard info alert with its message and no close button by default", async () => {
        await mount(Alert, { id: "alert", children: "Heads up" });

        expect(alert()).toHaveClass("ueca-alert", "ueca-alert-standard", "ueca-alert-info");
        expect(alert().querySelector(".alert-message")).toHaveTextContent("Heads up");
        expect(alert().querySelector(".alert-icon svg")).not.toBeNull();
        expect(alert().querySelector(".alert-action")).toBeNull();
        expect(within(alert()).queryByRole("button")).toBeNull();
    });

    it.each(["standard", "filled", "outlined"] as const)("reflects the %s variant in its classes", async (variant) => {
        await mount(Alert, { id: "alert", variant, severity: "warning", children: "Hi" });

        expect(alert()).toHaveClass(`ueca-alert-${variant}`, "ueca-alert-warning");
    });

    it.each(["success", "info", "warning", "error"] as const)("wears the %s severity's class and glyph", async (severity) => {
        await mount(Alert, { id: "alert", severity, children: "Hi" });

        expect(alert()).toHaveClass(`ueca-alert-${severity}`);
        expect(alert().querySelector(".alert-icon svg").outerHTML).toBe(await referenceGlyph(severity));
    });

    it("follows runtime changes to its severity, variant and message", async () => {
        const { model } = await mount(Alert, { id: "alert", children: "Loading" });

        model.severity = "error";
        model.variant = "outlined";
        model.children = <strong>Failed</strong>;
        await settle();

        expect(alert()).toHaveClass("ueca-alert-outlined", "ueca-alert-error");
        expect(alert()).not.toHaveClass("ueca-alert-standard", "ueca-alert-info");
        expect(within(alert()).getByText("Failed").tagName).toBe("STRONG");
        expect(alert().querySelector(".alert-icon svg").outerHTML).toBe(await referenceGlyph("error"));
    });

    it("offers a small close button only when there is an onClose, raising it with its model", async () => {
        const onClose = vi.fn();
        const { model } = await mount(Alert, { id: "alert", children: "Saved", onClose });

        const close = within(alert().querySelector(".alert-action") as HTMLElement).getByRole("button", { name: "Close" });
        expect(close).toHaveClass("ueca-icon-button-small");

        await userEvent.click(close);

        expect(onClose).toHaveBeenCalledExactlyOnceWith(model);
        // The alert does not dismiss itself — its owner decides.
        expect(screen.getByText("Saved")).toBeInTheDocument();
    });
});
