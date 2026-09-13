import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as UECA from "ueca-react";
import { AbortExecutionException, AppUI, appMessageBus } from "@core";
import { mount, settle, stubMessages } from "@test";

// AppRouter has its own tests; here it is a plain stand-in that AppUI either shows or does not.
// Being a plain component, with no UECA error boundary of its own, it is also the way to make
// the app view fail during render.
const routerStandIn = vi.hoisted(() => ({ renderError: undefined as Error }));

vi.mock("./appRouter", async (importOriginal) => {
    const actual = await importOriginal<typeof import("./appRouter")>();
    const React = await import("react");
    return {
        ...actual,
        AppRouter: (props: { id: string }) => {
            if (routerStandIn.renderError) {
                throw routerStandIn.renderError;
            }
            return React.createElement("div", { "data-testid": "router", "data-id": props.id });
        }
    };
});

function signInHeading() {
    return screen.queryByRole("heading", { level: 1, name: "Sign in" });
}

function input(field: "userInput" | "passwordInput") {
    return document.getElementById(`ui.loginForm.${field}`).querySelector("input");
}

// The exception dialog's message and title, once it is showing.
function dialog() {
    const element = document.getElementById("ui.dialogManager.activeDialog.dialog");
    return element && {
        title: element.querySelector(".alert-dialog-title").textContent,
        message: element.querySelector(".dialog-content-text").textContent
    };
}

describe("AppUI", () => {
    beforeEach(() => {
        routerStandIn.renderError = undefined;
    });

    describe("app view", () => {
        it("shows the sign-in form while not authorized", async () => {
            await mount(AppUI, { id: "ui" });

            expect(signInHeading()).toBeInTheDocument();
            expect(document.getElementById("ui")).toContainElement(signInHeading());
            expect(screen.queryByTestId("router")).toBeNull();
        });

        it("shows the router once authorized, and the sign-in form again when that ends", async () => {
            const { model } = await mount(AppUI, { id: "ui", authorizedMode: true });

            expect(screen.getByTestId("router")).toHaveAttribute("data-id", "router");
            expect(signInHeading()).toBeNull();

            model.authorizedMode = false;
            await settle();

            expect(screen.queryByTestId("router")).toBeNull();
            expect(signInHeading()).toBeInTheDocument();
        });

        // How Application wires it: a getter over the security service's observable state.
        it("follows a bound authorizedMode", async () => {
            const security = UECA.observe({ authorized: false });
            await mount(AppUI, { id: "ui", authorizedMode: () => security.authorized });
            expect(signInHeading()).toBeInTheDocument();

            security.authorized = true;
            await settle();

            expect(screen.getByTestId("router")).toBeInTheDocument();
            expect(signInHeading()).toBeNull();
        });

        // Outside the app view, so it is reachable from the sign-in form too.
        it("offers the trace viewer before anyone has signed in", async () => {
            await mount(AppUI, { id: "ui" });

            expect(screen.getByRole("button", { name: "Open the UECA trace viewer" })).toBeInTheDocument();
        });
    });

    describe("services", () => {
        it("renders the dialogs, toasts and tooltip its services are asked for", async () => {
            await mount(AppUI, { id: "ui" });

            void appMessageBus.unicast("Dialog.Information", { title: "Note", message: "Dialog body" });
            await act(async () => {
                await appMessageBus.unicast("Alert.Success", { message: "Toast body" });
                await appMessageBus.unicast("App.Tooltip.Show", { token: "t", anchor: { top: 10, left: 10, width: 10, height: 10 }, contentView: "Tooltip body", delay: 0 });
            });
            await settle();

            const root = document.getElementById("ui");
            expect(dialog()).toEqual({ title: "Note", message: "Dialog body" });
            expect(document.getElementById("ui.alertManager")).toHaveTextContent("Toast body");
            expect(document.getElementById("ui.tooltipManager")).toHaveTextContent("Tooltip body");
            expect(root).toContainElement(document.getElementById("ui.alertManager"));
            expect(root).toContainElement(document.getElementById("ui.tooltipManager"));
        });

        it("shows the busy spinner over the app", async () => {
            await mount(AppUI, { id: "ui" });
            vi.useFakeTimers();

            await act(async () => { await appMessageBus.unicast("BusyDisplay.Set", true); });
            await act(async () => { await vi.advanceTimersByTimeAsync(300); });

            expect(document.getElementById("ui")).toContainElement(document.getElementById("ui.busyDisplay.spinner"));
        });

        it("App.SelectFiles picks files through its hidden file input", async () => {
            const bodyOnFocus = document.body.onfocus;
            await mount(AppUI, { id: "ui" });
            const picker = document.getElementById("ui.fileSelector") as HTMLInputElement;
            const click = vi.spyOn(picker, "click").mockImplementation(() => { });
            const file = new File(["a,b"], "rows.csv", { type: "text/csv" });

            let picked: File[];
            const selection = appMessageBus.unicast("App.SelectFiles", { fileMask: ".csv", multiselect: true }).then((f) => { picked = f; });
            await settle(10);
            expect(click).toHaveBeenCalledOnce();
            expect(picker).toHaveAttribute("type", "file");
            expect(picker.accept).toBe(".csv");
            expect(picker.multiple).toBe(true);

            Object.defineProperty(picker, "files", { configurable: true, value: [file] });
            picker.dispatchEvent(new Event("change"));
            await selection;

            expect(picked).toEqual([file]);
            document.body.onfocus = bodyOnFocus;
        });
    });

    describe("errors", () => {
        it("shows an unhandled exception in the exception dialog", async () => {
            await mount(AppUI, { id: "ui" });

            await act(async () => { await appMessageBus.unicast("App.UnhandledException", new Error("Disk full")); });
            await settle();

            expect(dialog()).toEqual({ title: "Error", message: "Disk full" });
        });

        // AbortExecution is a normal business-logic bail-out, not a failure.
        it("ignores an unhandled AbortExecutionException", async () => {
            await mount(AppUI, { id: "ui" });

            await act(async () => { await appMessageBus.unicast("App.UnhandledException", new AbortExecutionException("Cancelled")); });
            await settle();

            expect(dialog()).toBeNull();
        });

        it("contains a render error in the app view and shows it, even an AbortExecutionException", async () => {
            const consoleError = vi.spyOn(console, "error").mockImplementation(() => { });
            routerStandIn.renderError = new AbortExecutionException("Render bailed");
            const { model } = await mount(AppUI, { id: "ui" });

            model.authorizedMode = true;
            await settle();
            await settle();

            expect(screen.getByText(/This page isn.t loading correctly/)).toBeInTheDocument();
            // The rest of the UI survives the failed view: its dialog host still shows the error.
            expect(dialog()).toEqual({ title: "Error", message: "Render bailed" });
            expect(consoleError).toHaveBeenCalled();
        });
    });

    describe("sign-in", () => {
        it("signs in under the busy display and clears the fields afterwards", async () => {
            let busyWhileSigningIn: number;
            const { model } = await mount(AppUI, { id: "ui" });
            const bus = await stubMessages({
                "App.Security.Authorize": vi.fn(async () => { busyWhileSigningIn = model.busyDisplay._busySetCount; })
            });

            await userEvent.type(input("userInput"), "ada");
            await userEvent.type(input("passwordInput"), "secret");
            await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
            await settle();

            expect(bus["App.Security.Authorize"]).toHaveBeenCalledExactlyOnceWith({ user: "ada", password: "secret", keepMeSignedIn: true });
            expect(busyWhileSigningIn).toBe(1);
            expect(model.busyDisplay._busySetCount).toBe(0);
            expect(input("userInput")).toHaveValue("");
            expect(input("passwordInput")).toHaveValue("");
        });

        // Erased only on success, so a typo is easy to correct.
        it("keeps the fields, and clears the busy display, when signing in fails", async () => {
            const { model } = await mount(AppUI, { id: "ui" });
            await stubMessages({ "App.Security.Authorize": vi.fn(async () => { throw new Error("Wrong password"); }) });
            model.loginForm.user = "ada";
            model.loginForm.password = "typo";
            await settle();

            // Raised directly rather than through the button: its click handler rethrows the
            // failure as an unhandled rejection once the error has been reported.
            await expect(model.loginForm.onLogin("ada", "typo")).rejects.toThrow("Wrong password");
            await settle();

            expect(input("userInput")).toHaveValue("ada");
            expect(input("passwordInput")).toHaveValue("typo");
            expect(model.busyDisplay._busySetCount).toBe(0);
        });
    });
});
