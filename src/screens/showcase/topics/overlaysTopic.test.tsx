import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppMessage, AppTooltipManager, resolvePaletteColor } from "@core";
import { mount, settle, stubMessages } from "@test";
import { OverlaysTopic } from "./overlaysTopic";

const TOPIC = "overlays";

function byId(id: string): HTMLElement {
    return document.getElementById(`${TOPIC}.${id}`);
}

function tooltipTarget(text: string): HTMLElement {
    return screen.getByText(text, { selector: ".showcase-tooltip-target" });
}

// A tooltip's content is JSX; its text is read by rendering it on its own, off the document.
function textOf(node: React.ReactNode): string {
    return render(<>{node}</>, { container: document.createElement("div") }).container.textContent;
}

function stubTooltip() {
    return stubMessages({
        "App.Tooltip.Show": vi.fn(async (_show: AppMessage["App.Tooltip.Show"]["in"]) => { }),
        "App.Tooltip.Hide": vi.fn(async (_hide: AppMessage["App.Tooltip.Hide"]["in"]) => { })
    });
}

function readout(prefix: "last action" | "last result"): string {
    return screen.getByText(new RegExp(`^${prefix}:`)).textContent;
}

function rect(top: number, left: number, width: number, height: number): DOMRect {
    return { top, left, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) } as DOMRect;
}

describe("OverlaysTopic", () => {
    describe("collision table", () => {
        it("shows where positionOverlay places each edge case", async () => {
            await mount(OverlaysTopic, { id: TOPIC });

            const rows = [...document.querySelectorAll(".showcase-pos-row")].map((row) =>
                [...row.children].map((cell) => cell.textContent));

            expect(rows).toEqual([
                ["scenario", "asked", "result"],
                ["mid-viewport, room everywhere", "top", "top"],
                ["hard against the viewport top", "top", "bottom"],
                ["hard against the viewport bottom", "bottom", "top"],
                ["hard against the right edge", "right", "left"],
                ["hard against the left edge", "left", "right"]
            ]);
        });

        it("marks a result that flipped in the accent, and one that held in secondary text", async () => {
            await mount(OverlaysTopic, { id: TOPIC });

            const resultCell = (row: number) => document.querySelectorAll(".showcase-pos-row")[row].children[2] as HTMLElement;
            expect(resultCell(1).style.color).toBe(resolvePaletteColor("text.secondary"));
            expect(resultCell(2).style.color).toBe(resolvePaletteColor("primary.main"));
        });
    });

    describe("tooltip triggers", () => {
        it.each(["top", "bottom", "left", "right"] as const)("the %s target asks the app tooltip for that placement", async (placement) => {
            const bus = await stubTooltip();
            await mount(OverlaysTopic, { id: TOPIC });

            fireEvent.mouseEnter(tooltipTarget(placement));
            await settle();
            expect(bus["App.Tooltip.Show"]).toHaveBeenCalledWith({
                token: TOPIC,
                anchor: { top: 0, left: 0, width: 0, height: 0 },
                contentView: `Placement: ${placement}`,
                placement,
                delay: 120
            });

            fireEvent.mouseLeave(tooltipTarget(placement));
            await settle();
            expect(bus["App.Tooltip.Hide"]).toHaveBeenCalledWith({ token: TOPIC });
        });

        it("labels each of the twelve sweep targets with its channel and a short delay", async () => {
            const bus = await stubTooltip();
            await mount(OverlaysTopic, { id: TOPIC });

            fireEvent.mouseEnter(tooltipTarget("01"));
            fireEvent.mouseEnter(tooltipTarget("12"));
            await settle();

            expect(bus["App.Tooltip.Show"]).toHaveBeenNthCalledWith(1, expect.objectContaining({
                contentView: "Channel 01 — last reading 14:00", delay: 80, placement: undefined
            }));
            expect(bus["App.Tooltip.Show"]).toHaveBeenNthCalledWith(2, expect.objectContaining({
                contentView: "Channel 12 — last reading 14:01"
            }));
        });

        // BUG: all twelve sweep targets spread the topic model's own tooltipProps, so they share one
        // token ("overlays"). A late leave from one therefore names the trigger now showing and
        // closes the tooltip its neighbour has just opened — the very race this section says the
        // token prevents (overlaysTopic.tsx, _SweepView).
        it.fails("a late leave from one sweep target leaves its neighbour's tooltip open", async () => {
            await mount(AppTooltipManager, { id: "tooltip" });
            await mount(OverlaysTopic, { id: TOPIC });

            fireEvent.mouseEnter(tooltipTarget("01"));
            fireEvent.mouseEnter(tooltipTarget("02"));
            await settle(120);
            expect(screen.getByRole("tooltip")).toHaveTextContent("Channel 02");

            fireEvent.mouseLeave(tooltipTarget("01"));
            await settle();

            expect(screen.getByRole("tooltip")).toHaveTextContent("Channel 02");
        });

        it("carries JSX content, not only strings", async () => {
            const bus = await stubTooltip();
            await mount(OverlaysTopic, { id: TOPIC });
            const shown = () => bus["App.Tooltip.Show"].mock.lastCall[0];

            fireEvent.mouseEnter(byId("tooltip-rich-button"));
            await settle();
            expect(shown().token).toBe(`${TOPIC}.tooltip-rich-button`);
            expect(textOf(shown().contentView)).toBe("Borehole 04-12.4071 mmSampled 14:02, averaged over 60 s");

            fireEvent.mouseEnter(tooltipTarget("with an icon"));
            await settle();
            expect(textOf(shown().contentView)).toBe("Battery below 20%");

            fireEvent.mouseEnter(tooltipTarget("long text"));
            await settle();
            expect(shown().contentView).toContain("/var/log/showcase/instrument-04-diagnostics.log");
        });
    });

    describe("menu", () => {
        async function openMenu() {
            await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
            return screen.getByRole("menu");
        }

        it("opens under the button, anchored to where the button is", async () => {
            const { model } = await mount(OverlaysTopic, { id: TOPIC });
            vi.spyOn(byId("menuButton"), "getBoundingClientRect").mockReturnValue(rect(120, 40, 96, 32));

            const menu = await openMenu();

            expect(model.menuPopover.anchor).toEqual({ top: 120, left: 40, width: 96, height: 32 });
            expect(within(menu).getAllByRole("menuitem").map((item) => item.textContent)).toEqual([
                "RefreshF5", "Export as CSV", "PrintCtrl+P", "Restore archived", "Delete site"
            ]);
            expect(readout("last action")).toBe("last action: —");
        });

        it("sets a disabled row apart, and a destructive row behind a separator", async () => {
            await mount(OverlaysTopic, { id: TOPIC });

            const menu = await openMenu();

            expect(within(menu).getByRole("menuitem", { name: "Restore archived" })).toBeDisabled();
            const deleteItem = within(menu).getByRole("menuitem", { name: "Delete site" });
            expect(deleteItem).toHaveClass("danger");
            expect(deleteItem.previousElementSibling).toHaveAttribute("role", "separator");
        });

        it.each([
            ["Refresh", "refresh"],
            ["Export as CSV", "export"],
            ["Print", "print"],
            ["Delete site", "delete"]
        ])("choosing %s reports it and closes the menu", async (label, action) => {
            await mount(OverlaysTopic, { id: TOPIC });
            const menu = await openMenu();

            await userEvent.click(within(menu).getByRole("menuitem", { name: new RegExp(`^${label}`) }));

            expect(readout("last action")).toBe(`last action: ${action}`);
            expect(screen.queryByRole("menu")).toBeNull();
        });

        // The outside-click close fires on mousedown, before the button's click, so without the
        // trigger marked the second click would close the menu and immediately reopen it.
        it("closes when its button is clicked again", async () => {
            await mount(OverlaysTopic, { id: TOPIC });
            await openMenu();

            await userEvent.click(screen.getByRole("button", { name: "Open menu" }));

            expect(screen.queryByRole("menu")).toBeNull();
        });

        it("closes on Escape and on a click outside", async () => {
            await mount(OverlaysTopic, { id: TOPIC });

            await openMenu();
            await userEvent.keyboard("{Escape}");
            expect(screen.queryByRole("menu")).toBeNull();

            await openMenu();
            await userEvent.click(document.body);
            expect(screen.queryByRole("menu")).toBeNull();
            expect(readout("last action")).toBe("last action: —");
        });
    });

    describe("popover", () => {
        it("hosts live controls that keep their state between openings", async () => {
            const { model } = await mount(OverlaysTopic, { id: TOPIC });
            vi.spyOn(byId("popoverButton"), "getBoundingClientRect").mockReturnValue(rect(300, 200, 90, 32));

            await userEvent.click(screen.getByRole("button", { name: "Filter…" }));
            expect(model.filterPopover.anchor).toEqual({ top: 300, left: 200, width: 90, height: 32 });
            const field = () => byId("popoverField").querySelector("input");
            const check = () => within(byId("popoverCheck")).getByRole("checkbox");
            expect(field()).toHaveValue("cedar");
            expect(check()).toBeChecked();

            await userEvent.type(field(), " dam");
            await userEvent.click(check());
            await userEvent.click(screen.getByRole("button", { name: "Apply" }));
            expect(byId("filterPopover")).toBeNull();

            await userEvent.click(screen.getByRole("button", { name: "Filter…" }));
            expect(field()).toHaveValue("cedar dam");
            expect(check()).not.toBeChecked();
        });
    });

    describe("edit drawer", () => {
        function drawer(): HTMLElement {
            return byId("editDrawer.drawer");
        }

        async function openDrawer() {
            await userEvent.click(screen.getByRole("button", { name: "Open edit drawer" }));
            expect(drawer()).not.toBeNull();
            return drawer();
        }

        it("opens titled, with Delete, Cancel and Save in its footer", async () => {
            await mount(OverlaysTopic, { id: TOPIC });

            const panel = await openDrawer();

            expect(panel).toHaveTextContent("Edit specimen");
            const footer = panel.querySelector(".drawer-actions") as HTMLElement;
            expect(within(footer).getAllByRole("button").map((b) => b.textContent)).toEqual(["Delete", "Cancel", "Save"]);
            expect(readout("last result")).toBe("last result: —");
        });

        it("refuses to save an empty name, then reports saved once it has one", async () => {
            await mount(OverlaysTopic, { id: TOPIC });
            const panel = await openDrawer();

            await userEvent.click(within(panel).getByRole("button", { name: "Save" }));
            await settle();
            expect(drawer()).not.toBeNull();
            expect(byId("editDrawerField")).toHaveTextContent("Name cannot be empty");
            expect(readout("last result")).toBe("last result: —");

            await userEvent.type(byId("editDrawerField").querySelector("input"), "Cedar");
            await userEvent.click(within(panel).getByRole("button", { name: "Save" }));
            await settle();

            expect(drawer()).toBeNull();
            expect(readout("last result")).toBe("last result: saved");
        });

        it.each([
            ["Cancel", "Cancel"],
            ["the close button", "Close"]
        ])("reports cancelled when closed with %s", async (_, name) => {
            await mount(OverlaysTopic, { id: TOPIC });
            const panel = await openDrawer();

            await userEvent.click(within(panel).getByRole("button", { name }));
            await settle();

            expect(drawer()).toBeNull();
            expect(readout("last result")).toBe("last result: cancelled");
        });

        it("closes after the delete is confirmed", async () => {
            await stubMessages({
                "Dialog.ActionConfirmation": vi.fn(async () => true),
                "Dialog.Confirmation": vi.fn(async () => true)
            });
            await mount(OverlaysTopic, { id: TOPIC });
            const panel = await openDrawer();

            await userEvent.click(within(panel).getByRole("button", { name: "Delete" }));
            await settle();

            expect(drawer()).toBeNull();
            expect(readout("last result")).toBe("last result: cancelled");
        });

        it("stays open when the topic's own delete question is answered no", async () => {
            const bus = await stubMessages({
                "Dialog.ActionConfirmation": vi.fn(async () => true),
                "Dialog.Confirmation": vi.fn(async () => false)
            });
            await mount(OverlaysTopic, { id: TOPIC });
            const panel = await openDrawer();

            await userEvent.click(within(panel).getByRole("button", { name: "Delete" }));
            await settle();

            expect(bus["Dialog.Confirmation"]).toHaveBeenCalledWith({ title: "Confirmation", message: "Delete the specimen?" });
            expect(drawer()).not.toBeNull();
            expect(readout("last result")).toBe("last result: —");
        });

        // BUG: EditDrawer confirms before raising onDelete unless deleteConfirmation is turned off
        // ("off only when the owner asks in its own way"). This topic asks in its own way — onDelete
        // opens "Delete the specimen?" — but leaves deleteConfirmation on, so one delete puts two
        // confirmation dialogs in front of the user (overlaysTopic.tsx, editDrawer).
        it.fails("asks for confirmation only once before deleting", async () => {
            const bus = await stubMessages({
                "Dialog.ActionConfirmation": vi.fn(async () => true),
                "Dialog.Confirmation": vi.fn(async () => true)
            });
            await mount(OverlaysTopic, { id: TOPIC });
            const panel = await openDrawer();

            await userEvent.click(within(panel).getByRole("button", { name: "Delete" }));
            await settle();

            const questions = bus["Dialog.ActionConfirmation"].mock.calls.length + bus["Dialog.Confirmation"].mock.calls.length;
            expect(questions).toBe(1);
        });
    });
});
