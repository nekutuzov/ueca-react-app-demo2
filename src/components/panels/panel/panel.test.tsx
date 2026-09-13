import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Panel } from "@components";
import { mount, settle } from "@test";

function panel(): HTMLElement {
    return document.getElementById("panel");
}

describe("Panel", () => {
    it("renders open by default, with a close button and its content but no title", async () => {
        await mount(Panel, { id: "panel", contentView: <p>Panel body</p> });

        expect(panel()).toHaveClass("ueca-panel");
        expect(panel()).toContainElement(screen.getByText("Panel body"));
        const close = screen.getByRole("button", { name: "Close" });
        expect(close.parentElement).toHaveClass("ueca-panel-close");
        expect(close).toHaveAttribute("id", "panel.closeButton");
        expect(panel().querySelector(".ueca-panel-title")).toBeNull();
    });

    it("shows a title in the shared label style", async () => {
        await mount(Panel, { id: "panel", titleView: "Filters", contentView: "body" });

        const title = screen.getByText("Filters");
        expect(title).toHaveClass("ueca-panel-title", "ueca-label");
    });

    it("hides the close button when not closable", async () => {
        const { model } = await mount(Panel, { id: "panel", closable: false, contentView: "body" });
        expect(screen.queryByRole("button", { name: "Close" })).toBeNull();

        model.closable = true;
        await settle();

        expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    });

    it("renders nothing while closed and appears when opened", async () => {
        const { model, container } = await mount(Panel, { id: "panel", open: false, contentView: "body" });
        expect(container).toBeEmptyDOMElement();

        model.open = true;
        await settle();

        expect(panel()).toHaveTextContent("body");
    });

    // The panel owns its visibility; onClose only lets the parent sync its own state.
    it("closes itself from the close button and then tells the parent", async () => {
        const onClose = vi.fn();
        const { model, container } = await mount(Panel, { id: "panel", contentView: "body", onClose });

        await userEvent.click(screen.getByRole("button", { name: "Close" }));
        await settle();

        expect(model.open).toBe(false);
        expect(container).toBeEmptyDOMElement();
        expect(onClose).toHaveBeenCalledOnce();
        expect(onClose).toHaveBeenCalledWith(model);
    });

    it("closes without an onClose handler, and can be opened again", async () => {
        const { model } = await mount(Panel, { id: "panel", contentView: "body" });

        await userEvent.click(screen.getByRole("button", { name: "Close" }));
        await settle();
        expect(panel()).toBeNull();

        model.open = true;
        await settle();
        expect(panel()).toHaveTextContent("body");
    });

    it("passes className, padding and sx through to its root", async () => {
        await mount(Panel, { id: "panel", className: "floating", padding: "px12", sx: { top: "10px" }, contentView: "body" });

        expect(panel().className).toBe("ueca-panel floating");
        expect(panel().style.padding).toBe("12px");
        expect(panel().style.top).toBe("10px");
    });
});
