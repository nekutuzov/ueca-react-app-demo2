import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen, within } from "@testing-library/react";
import { AppAlertManager, appMessageBus } from "@core";
import { mount, settle } from "@test";

function container() {
    return document.getElementById("alerts");
}

// The toasts in stacking order, as their Alert elements.
function alertElements() {
    return Array.from(container().querySelectorAll<HTMLElement>(".ueca-alert"));
}

function snackbarOf(text: string) {
    return screen.getByText(text).closest<HTMLElement>(".ueca-snackbar");
}

describe("AppAlertManager", () => {
    it.each([
        ["Alert.Success", "success"],
        ["Alert.Information", "info"],
        ["Alert.Warning", "warning"],
        ["Alert.Error", "error"]
    ] as const)("%s shows a %s toast with the message", async (message, severity) => {
        await mount(AppAlertManager, { id: "alerts" });

        await act(async () => { await appMessageBus.unicast(message, { message: "Something happened" }); });

        const alert = screen.getByText("Something happened").closest(".ueca-alert");
        expect(alert).toHaveClass("ueca-alert-filled", `ueca-alert-${severity}`);
        // Rendered inline in the manager's own stack rather than portalled to a screen corner.
        expect(snackbarOf("Something happened")).toHaveClass("snackbar-relative");
        expect(container()).toContainElement(alert as HTMLElement);
    });

    it("renders a message given as JSX", async () => {
        await mount(AppAlertManager, { id: "alerts" });

        await act(async () => { await appMessageBus.unicast("Alert.Success", { message: <b data-testid="rich">Saved</b> }); });

        expect(within(container()).getByTestId("rich")).toHaveTextContent("Saved");
    });

    describe("position", () => {
        it("stacks at the top right by default", async () => {
            await mount(AppAlertManager, { id: "alerts" });

            expect(container()).toHaveStyle({
                position: "fixed", display: "flex", flexDirection: "column", gap: "8px", zIndex: "1400",
                top: "24px", right: "24px", alignItems: "flex-end"
            });
            expect(container().style.bottom).toBe("");
            expect(container().style.left).toBe("");
        });

        it.each([
            ["top", "left", { top: "24px", left: "24px", alignItems: "flex-start" }],
            ["top", "right", { top: "24px", right: "24px", alignItems: "flex-end" }],
            ["bottom", "left", { bottom: "24px", left: "24px", alignItems: "flex-start" }],
            ["bottom", "right", { bottom: "24px", right: "24px", alignItems: "flex-end" }]
        ] as const)("anchors %s %s", async (vertical, horizontal, expected) => {
            await mount(AppAlertManager, { id: "alerts", anchorOrigin: { vertical, horizontal } });

            expect(container()).toHaveStyle(expected);
            expect(container().style.transform).toBe("");
            expect(container().style[vertical === "top" ? "bottom" : "top"]).toBe("");
            expect(container().style[horizontal === "left" ? "right" : "left"]).toBe("");
        });

        it.each(["top", "bottom"] as const)("centres horizontally at the %s", async (vertical) => {
            await mount(AppAlertManager, { id: "alerts", anchorOrigin: { vertical, horizontal: "center" } });

            expect(container()).toHaveStyle({ [vertical]: "24px", left: "50%", transform: "translateX(-50%)", alignItems: "center" });
            expect(container().style.right).toBe("");
        });

        it("moves when anchorOrigin is reassigned", async () => {
            const { model } = await mount(AppAlertManager, { id: "alerts" });

            model.anchorOrigin = { vertical: "bottom", horizontal: "left" };
            await settle();

            expect(container()).toHaveStyle({ bottom: "24px", left: "24px" });
            expect(container().style.top).toBe("");
        });
    });

    describe("stack", () => {
        it("stacks alerts in arrival order under increasing ids", async () => {
            await mount(AppAlertManager, { id: "alerts" });

            await act(async () => {
                await appMessageBus.unicast("Alert.Information", { message: "first" });
                await appMessageBus.unicast("Alert.Warning", { message: "second" });
                await appMessageBus.unicast("Alert.Error", { message: "third" });
            });

            expect(alertElements().map((a) => a.textContent)).toEqual(["first", "second", "third"]);
            expect(snackbarOf("first").id).toBe("alerts.alert1.snackbar");
            expect(snackbarOf("third").id).toBe("alerts.alert3.snackbar");
        });

        it("removes an alert when it is closed and keeps the others", async () => {
            const { model } = await mount(AppAlertManager, { id: "alerts" });
            await act(async () => {
                model.addAlert("first", "info");
                model.addAlert("second", "success");
            });

            fireEvent.click(within(screen.getByText("first").closest(".ueca-alert")).getByRole("button", { name: "Close" }));
            await settle();

            expect(screen.queryByText("first")).toBeNull();
            expect(alertElements().map((a) => a.textContent)).toEqual(["second"]);
            expect(model._alerts.map((a) => a.message)).toEqual(["second"]);
        });

        // Positions double as ids and React keys, so a new alert numbers on from the LAST one
        // still showing; an id still in use is never handed out twice.
        it("numbers a new alert after the last one still showing", async () => {
            const { model } = await mount(AppAlertManager, { id: "alerts" });
            await act(async () => {
                model.addAlert("first", "info");
                model.addAlert("second", "info");
            });
            fireEvent.click(within(screen.getByText("first").closest(".ueca-alert")).getByRole("button", { name: "Close" }));
            await settle();

            await act(async () => { model.addAlert("third", "info"); });

            expect(model._alerts.map((a) => a.position)).toEqual([2, 3]);
            expect(snackbarOf("third").id).toBe("alerts.alert3.snackbar");
            expect(alertElements().map((a) => a.textContent)).toEqual(["second", "third"]);
        });

        it("starts numbering from 1 again once the stack has emptied", async () => {
            const { model } = await mount(AppAlertManager, { id: "alerts" });
            await act(async () => { model.addAlert("first", "info"); });
            fireEvent.click(screen.getByRole("button", { name: "Close" }));
            await settle();

            await act(async () => { model.addAlert("again", "info"); });

            expect(model._alerts.map((a) => a.position)).toEqual([1]);
        });

        // Only an arriving toast animates in; the ones already showing must not replay their
        // entrance every time another alert joins the stack.
        it("animates only the alert that has just arrived", async () => {
            await mount(AppAlertManager, { id: "alerts" });

            await act(async () => { await appMessageBus.unicast("Alert.Information", { message: "first" }); });
            expect(snackbarOf("first")).toHaveClass("snackbar-transition");

            await act(async () => { await appMessageBus.unicast("Alert.Information", { message: "second" }); });
            expect(snackbarOf("first")).not.toHaveClass("snackbar-transition");
            expect(snackbarOf("second")).toHaveClass("snackbar-transition");
        });

        it("drops an alert from the stack when it auto-hides", async () => {
            const { model } = await mount(AppAlertManager, { id: "alerts" });
            vi.useFakeTimers();

            await act(async () => { model.addAlert("fleeting", "success"); });
            await act(async () => { await vi.advanceTimersByTimeAsync(3900); });
            expect(screen.getByText("fleeting")).toBeInTheDocument();

            await act(async () => { await vi.advanceTimersByTimeAsync(200); });
            expect(screen.queryByText("fleeting")).toBeNull();
            expect(model._alerts).toEqual([]);
        });
    });
});
