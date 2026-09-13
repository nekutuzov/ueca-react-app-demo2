import { describe, expect, it, vi } from "vitest";
import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AbortExecutionException, appMessageBus } from "@core";
import { settle } from "@test";
import {
    alertsHost, appPath, busySpinner, findDialog, openDialog, renderApp, send, sideBar, waitForScreen
} from "./appHarness";

// The top bar's contact buttons, in the order they are drawn, and the address each opens.
const CONTACTS = [
    ["UECA Website", "https://cranesoft.net/"],
    ["Email", "mailto:cranesoft@protonmail.com"],
    ["GitHub Repository", "https://github.com/nekutuzov/ueca-react-app-demo2"],
    ["NPM Package", "https://www.npmjs.com/package/ueca-react"],
    ["YouTube Video", "https://youtu.be/SQl8f-qGxwU?si=-YTWPpPB7ExBZ6L0"]
] as const;

async function advanceTimers(ms: number) {
    await act(async () => {
        await vi.advanceTimersByTimeAsync(ms);
    });
}

describe("App services end to end", { timeout: 20_000 }, () => {
    describe("dialogs", () => {
        it("Dialog.Confirmation asks the question and resolves true on Yes", async () => {
            await renderApp({ url: "/home", signedIn: true });

            const answer = appMessageBus.unicast("Dialog.Confirmation", { title: "Discard the draft?", message: "It cannot be recovered." });

            const dialog = await findDialog();
            expect(dialog).toHaveTextContent("Discard the draft?");
            expect(dialog).toHaveTextContent("It cannot be recovered.");
            await userEvent.click(within(dialog).getByRole("button", { name: "Yes" }));

            await expect(answer).resolves.toBe(true);
            await waitFor(() => expect(openDialog()).toBeNull());
        });

        it.each(["No", "Close"])("Dialog.Confirmation resolves false on %s", async (button) => {
            await renderApp({ url: "/home", signedIn: true });

            const answer = appMessageBus.unicast("Dialog.Confirmation", { title: "Leave?", message: "Unsaved changes will be lost." });
            await userEvent.click(within(await findDialog()).getByRole("button", { name: button }));

            await expect(answer).resolves.toBe(false);
            await waitFor(() => expect(openDialog()).toBeNull());
        });

        it("App.UnhandledException opens the exception dialog with the message, and the call stack in its details", async () => {
            await renderApp({ url: "/showcase/overview", signedIn: true });

            await send(() => appMessageBus.unicast("App.UnhandledException", new Error("Disk quota exceeded")));

            const dialog = await findDialog();
            expect(dialog).toHaveTextContent("Error");
            expect(dialog).toHaveTextContent("Disk quota exceeded");
            await userEvent.click(within(dialog).getByRole("button", { name: "Show details" }));
            expect(await screen.findByText(/Call Stack:/)).toBeInTheDocument();
            // The screen underneath is untouched.
            expect(await waitForScreen("Overview")).toBeInTheDocument();
        });

        it("App.UnhandledException passes over an AbortExecutionException, the business bail-out", async () => {
            await renderApp({ url: "/home", signedIn: true });

            await send(() => appMessageBus.unicast("App.UnhandledException", new AbortExecutionException("Cancelled")));
            await settle(50);

            expect(openDialog()).toBeNull();
            // The same path does open a dialog for any other error, so the silence above is the abort's.
            await send(() => appMessageBus.unicast("App.UnhandledException", new Error("Real failure")));
            expect(await findDialog()).toHaveTextContent("Real failure");
        });
    });

    describe("alerts", () => {
        it("Alert.Success shows a success toast that its × closes, and a later toast still shows", async () => {
            await renderApp({ url: "/home", signedIn: true });

            await send(() => appMessageBus.unicast("Alert.Success", { message: "Settings saved" }));

            const toast = await within(alertsHost()).findByText("Settings saved");
            expect(toast.closest(".ueca-alert")).toHaveClass("ueca-alert-success");
            await userEvent.click(within(alertsHost()).getByRole("button", { name: "Close" }));
            await waitFor(() => expect(within(alertsHost()).queryByText("Settings saved")).toBeNull());

            // Its successor reuses the slot the first one left.
            await send(() => appMessageBus.unicast("Alert.Error", { message: "Upload failed" }));
            const next = await within(alertsHost()).findByText("Upload failed");
            expect(next.closest(".ueca-alert")).toHaveClass("ueca-alert-error");
        });

        it("stacks toasts in the order they were raised", async () => {
            await renderApp({ url: "/home", signedIn: true });

            await send(() => appMessageBus.unicast("Alert.Information", { message: "First" }));
            await send(() => appMessageBus.unicast("Alert.Warning", { message: "Second" }));

            await waitFor(() => expect(alertsHost()).toHaveTextContent("FirstSecond"));
            expect(within(alertsHost()).getByText("Second").closest(".ueca-alert")).toHaveClass("ueca-alert-warning");
        });

        it("a toast closes by itself after four seconds", async () => {
            await renderApp({ url: "/home", signedIn: true });
            vi.useFakeTimers();

            await send(() => appMessageBus.unicast("Alert.Information", { message: "Heads up" }));
            await advanceTimers(3900);
            expect(within(alertsHost()).getByText("Heads up")).toBeInTheDocument();

            await advanceTimers(200);
            expect(within(alertsHost()).queryByText("Heads up")).toBeNull();
        });
    });

    describe("busy display", () => {
        it("BusyDisplay.Set shows the spinner after its 250ms delay and keeps it until every Set(true) is released", async () => {
            await renderApp({ url: "/home", signedIn: true });
            vi.useFakeTimers();

            await send(() => appMessageBus.unicast("BusyDisplay.Set", true));
            // Quick work never flashes a spinner.
            await advanceTimers(200);
            expect(busySpinner()).toBeNull();
            await advanceTimers(100);
            expect(busySpinner()).toBeInTheDocument();

            await send(() => appMessageBus.unicast("BusyDisplay.Set", true));
            await send(() => appMessageBus.unicast("BusyDisplay.Set", false));
            await advanceTimers(300);
            expect(busySpinner()).toBeInTheDocument();

            await send(() => appMessageBus.unicast("BusyDisplay.Set", false));
            await advanceTimers(300);
            expect(busySpinner()).toBeNull();
        });

        it("BusyDisplay.Clear drops every pending Set(true) at once", async () => {
            await renderApp({ url: "/home", signedIn: true });
            vi.useFakeTimers();
            await send(() => appMessageBus.unicast("BusyDisplay.Set", true));
            await send(() => appMessageBus.unicast("BusyDisplay.Set", true));
            await advanceTimers(300);
            expect(busySpinner()).toBeInTheDocument();

            await send(() => appMessageBus.unicast("BusyDisplay.Clear"));
            await advanceTimers(300);

            expect(busySpinner()).toBeNull();
        });

        it("an open dialog stands the busy spinner aside, and the spinner returns once the dialog is answered", async () => {
            await renderApp({ url: "/home", signedIn: true });
            await send(() => appMessageBus.unicast("BusyDisplay.Set", true));
            await waitFor(() => expect(busySpinner()).toBeInTheDocument());

            const answer = appMessageBus.unicast("Dialog.Confirmation", { title: "Stop the import?", message: "Rows imported so far are kept." });
            const dialog = await findDialog();

            await waitFor(() => expect(busySpinner()).toBeNull());
            await userEvent.click(within(dialog).getByRole("button", { name: "No" }));
            await expect(answer).resolves.toBe(false);
            await waitFor(() => expect(busySpinner()).toBeInTheDocument());
        });
    });

    describe("external links", () => {
        it("the top-bar contact buttons open their destinations in a new tab without leaving the page", async () => {
            const { historyLength } = await renderApp({ url: "/showcase/icons", signedIn: true });
            const open = vi.spyOn(window, "open");

            for (const [label] of CONTACTS) {
                await userEvent.click(screen.getByRole("button", { name: label }));
            }

            await waitFor(() => expect(open).toHaveBeenCalledTimes(CONTACTS.length));
            expect(open.mock.calls).toEqual(CONTACTS.map(([, url]) => [url, "_blank", "noopener,noreferrer"]));
            expect(await waitForScreen("Icons")).toBeInTheDocument();
            expect(location.pathname).toBe(appPath("/showcase/icons"));
            expect(history.length).toBe(historyLength);
        });

        it("the sidebar logo opens cranesoft.net in a new tab", async () => {
            await renderApp({ url: "/home", signedIn: true });
            const open = vi.spyOn(window, "open");

            await userEvent.click(within(sideBar()).getByRole("link", { name: "UECA-React" }));

            await waitFor(() => expect(open).toHaveBeenCalledExactlyOnceWith("https://cranesoft.net/", "_blank", "noopener,noreferrer"));
            expect(location.pathname).toBe(appPath("/home"));
        });

        it("the Home page's GitHub, Open demo and Source buttons open their links in a new tab", async () => {
            await renderApp({ url: "/home", signedIn: true });
            const open = vi.spyOn(window, "open");

            await userEvent.click(screen.getByRole("button", { name: "GitHub" }));
            for (const button of within(screen.getByRole("region", { name: "Live demos" })).getAllByRole("button")) {
                await userEvent.click(button);
            }

            await waitFor(() => expect(open).toHaveBeenCalledTimes(6));
            expect(open.mock.calls.map(([url]) => url)).toEqual([
                "https://github.com/nekutuzov/ueca-react-app-demo2",
                "https://nekutuzov.github.io/ueca-react-app-demo1",
                "https://github.com/nekutuzov/ueca-react-app-demo1",
                "https://github.com/nekutuzov/ueca-react-app-demo2",
                "https://nekutuzov.github.io/ueca-react-doc/",
                "https://github.com/nekutuzov/ueca-react-doc"
            ]);
            expect(open.mock.calls.every(([, target, features]) => target === "_blank" && features === "noopener,noreferrer")).toBe(true);
        });

        it("App.Router.OpenNewTab opens a registered external route in a new tab and stays on the screen", async () => {
            const { historyLength } = await renderApp({ url: "/showcase/overview", signedIn: true });
            const open = vi.spyOn(window, "open");

            await send(() => appMessageBus.unicast("App.Router.OpenNewTab", { path: "https://nekutuzov.github.io/ueca-react-doc/" }));

            expect(open).toHaveBeenCalledExactlyOnceWith("https://nekutuzov.github.io/ueca-react-doc/", "_blank", "noopener,noreferrer");
            expect(await waitForScreen("Overview")).toBeInTheDocument();
            expect(location.pathname).toBe(appPath("/showcase/overview"));
            expect(history.length).toBe(historyLength);
        });

        // BUG: Router.lookupRoute cannot find an external route registered without a path, such as
        // "https://cranesoft.net" (or "mailto:…"): _prepareRegExRoutes builds the pattern from the
        // PARSED url, whose pathname is "/", so it demands a trailing slash the registered key does
        // not have — and a mailto address, parsed as the pathname, is dropped from its pattern
        // altogether (router.tsx:129-142). AppRouter._changeRoute then takes the address for an
        // unknown one and routes to Home instead (appRouter.tsx:67-72), adding a history entry — where
        // appRoutes.tsx and AppBrowsingHistory._divertCrossOrigin promise a new tab for a foreign URL.
        // Fixing the lookup alone is not enough: the found route then hits the bug pinned below.
        it.fails("App.Router.GoToRoute to https://cranesoft.net opens the site in a new tab and stays on the screen", async () => {
            await renderApp({ url: "/showcase/overview", signedIn: true });
            const open = vi.spyOn(window, "open");

            await send(() => appMessageBus.unicast("App.Router.GoToRoute", { path: "https://cranesoft.net" }));

            expect(open).toHaveBeenCalledExactlyOnceWith("https://cranesoft.net/", "_blank", "noopener,noreferrer");
            expect(location.pathname).toBe(appPath("/showcase/overview"));
            expect(await waitForScreen("Overview", { timeout: 500 })).toBeInTheDocument();
        });

        // BUG: for an external route the router does find, AppRouter._changeRoute still makes
        // OtherLayout the active layout once AppBrowsingHistory has diverted the URL to a new tab
        // (appRouter.tsx:92-93). That route's view is `() => null`, so the whole shell — menu and
        // screen — disappears, contradicting appRoutes.tsx: "an absolute URL opens in a new tab and
        // never mounts OtherLayout".
        it.fails("App.Router.GoToRoute to a registered external page opens it in a new tab and keeps the shell on show", async () => {
            await renderApp({ url: "/showcase/overview", signedIn: true });
            const open = vi.spyOn(window, "open");

            await send(() => appMessageBus.unicast("App.Router.GoToRoute", { path: "https://github.com/nekutuzov/ueca-react-app-demo2" }));

            expect(open).toHaveBeenCalledExactlyOnceWith("https://github.com/nekutuzov/ueca-react-app-demo2", "_blank", "noopener,noreferrer");
            expect(await waitForScreen("Overview", { timeout: 500 })).toBeInTheDocument();
        });
    });

    it("App.GetInfo answers with the application's name and version, which Home shows", async () => {
        await renderApp({ url: "/home", signedIn: true });

        expect(await send(() => appMessageBus.unicast("App.GetInfo"))).toEqual({ appName: "UECA-React Showcase", appVersion: "3.0" });
        await waitFor(() => expect(document.querySelector(".home-eyebrow")).toHaveTextContent("UECA-React 3.0 · Showcase"));
    });
});
