import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { appMessageBus, AppStorageKeys } from "@core";
import { settle } from "@test";
import {
    APP_NAME, HOME_HEADING, activeMenuItems, appPath, documentTitle, menuLink, renderApp, send, sideBar,
    signIn, signInButton, signInField, signOutItem, typeCredentials, waitForScreen
} from "./appHarness";

function signInHeading(): HTMLElement | null {
    return screen.queryByRole("heading", { level: 1, name: "Sign in" });
}

describe("Signing in and out", { timeout: 20_000 }, () => {
    it("shows only the sign-in form while nobody is signed in", async () => {
        await renderApp();

        expect(signInHeading()).toBeInTheDocument();
        expect(signInField("user")).toHaveValue("");
        expect(signInField("password")).toHaveAttribute("type", "password");
        expect(signInButton()).toBeEnabled();
        // No shell and no screen is built for a signed-out visitor.
        expect(sideBar()).toBeNull();
        expect(document.querySelector(".app-content")).toBeNull();
        await waitFor(() => expect(document.title).toBe(APP_NAME));
        expect(await send(() => appMessageBus.unicast("App.Security.IsAuthorized"))).toBe(false);
    });

    it("marks both fields as required when the empty form is submitted, and stays signed out", async () => {
        await renderApp();

        await userEvent.click(signInButton());

        expect(await screen.findByText("Username cannot be empty")).toBeInTheDocument();
        expect(screen.getByText("Password cannot be empty")).toBeInTheDocument();
        expect(document.getElementById("app.ui.loginForm.userInput")).toHaveClass("ueca-textfield-error");
        expect(document.getElementById("app.ui.loginForm.passwordInput")).toHaveClass("ueca-textfield-error");
        expect(signInHeading()).toBeInTheDocument();
        expect(sideBar()).toBeNull();
        expect(localStorage.getItem(AppStorageKeys.userContext)).toBeNull();
    });

    it("clears a field's error once it is typed into, and keeps the other field's", async () => {
        await renderApp();
        await userEvent.click(signInButton());
        await screen.findByText("Username cannot be empty");

        await userEvent.type(signInField("user"), "ada");

        await waitFor(() => expect(screen.queryByText("Username cannot be empty")).toBeNull());
        expect(screen.getByText("Password cannot be empty")).toBeInTheDocument();
    });

    // Enter from a half-filled form must not flag the field the user has not reached yet.
    it("signs in on Enter only once both fields hold more than blanks", async () => {
        await renderApp();

        await userEvent.type(signInField("password"), "secret{Enter}");
        await settle(50);
        expect(screen.queryByText(/cannot be empty/)).toBeNull();
        expect(signInHeading()).toBeInTheDocument();

        // Blank-only text is empty, as the required check has it.
        await userEvent.type(signInField("user"), "   {Enter}");
        await settle(50);
        expect(screen.queryByText(/cannot be empty/)).toBeNull();
        expect(sideBar()).toBeNull();

        await userEvent.clear(signInField("user"));
        await userEvent.type(signInField("user"), "ada{Enter}");

        expect(await waitForScreen(HOME_HEADING)).toBeInTheDocument();
        expect(await send(() => appMessageBus.unicast("App.Security.GetSecurityInfo"))).toEqual({ user: "ada", securityRules: [] });
    });

    it("signing in with the button opens Home in the shell and stores the sign-in", async () => {
        await renderApp();

        await signIn("ada", "secret");

        expect(await waitForScreen(HOME_HEADING)).toBeInTheDocument();
        expect(activeMenuItems()).toEqual(["Home"]);
        expect(signInHeading()).toBeNull();
        expect(await send(() => appMessageBus.unicast("App.Security.GetSecurityInfo"))).toEqual({ user: "ada", securityRules: [] });
        expect(JSON.parse(localStorage.getItem(AppStorageKeys.userContext))).toEqual({ user: "ada", apiToken: "DEMO-TOKEN" });
    });

    it("clears the typed credentials only once signing in succeeds", async () => {
        const { model } = await renderApp();

        // A rejected attempt keeps the text, so a typo is easy to correct.
        await typeCredentials("ada", "");
        await userEvent.click(signInButton());
        await screen.findByText("Password cannot be empty");
        expect(signInField("user")).toHaveValue("ada");

        await userEvent.type(signInField("password"), "secret");
        await userEvent.click(signInButton());
        await waitForScreen();
        expect(model.ui.loginForm.user).toBe("");
        expect(model.ui.loginForm.password).toBe("");

        // Which is what a signed-out user comes back to.
        await userEvent.click(signOutItem());
        await screen.findByRole("heading", { level: 1, name: "Sign in" });
        expect(signInField("user")).toHaveValue("");
        expect(signInField("password")).toHaveValue("");
    });

    it("keeps the user signed in: a remounted app starts in the shell as the same user", async () => {
        const { unmount } = await renderApp();
        await signIn("grace", "hopper");
        unmount();

        // Like a reload: nothing is seeded, the sign-in comes back from storage.
        await renderApp();

        expect(sideBar()).not.toBeNull();
        expect(signInHeading()).toBeNull();
        expect(await send(() => appMessageBus.unicast("App.Security.GetSecurityInfo"))).toEqual({ user: "grace", securityRules: [] });
    });

    it("Sign out returns to the sign-in form and forgets the stored sign-in", async () => {
        await renderApp({ url: "/showcase/controls", signedIn: true });

        await userEvent.click(signOutItem());

        expect(await screen.findByRole("heading", { level: 1, name: "Sign in" })).toBeInTheDocument();
        expect(sideBar()).toBeNull();
        expect(document.querySelector(".app-content")).toBeNull();
        expect(localStorage.getItem(AppStorageKeys.userContext)).toBeNull();
        expect(await send(() => appMessageBus.unicast("App.Security.IsAuthorized"))).toBe(false);
        // The address is left alone, so signing back in returns to the same page.
        expect(location.pathname).toBe(appPath("/showcase/controls"));
    });

    it("a remounted app after signing out starts on the sign-in form", async () => {
        const { unmount } = await renderApp({ signedIn: true });
        await userEvent.click(signOutItem());
        await screen.findByRole("heading", { level: 1, name: "Sign in" });
        unmount();

        await renderApp();

        expect(signInHeading()).toBeInTheDocument();
        expect(sideBar()).toBeNull();
    });

    it("signing back in after signing out restores a working shell on the same page", async () => {
        await renderApp({ url: "/showcase/controls", signedIn: true });
        await userEvent.click(signOutItem());
        await screen.findByRole("heading", { level: 1, name: "Sign in" });

        await signIn("bob", "builder");

        expect(await waitForScreen("Controls")).toBeInTheDocument();
        expect(activeMenuItems()).toEqual(["Controls"]);
        await waitFor(() => expect(document.title).toBe(documentTitle("Controls · Showcase")));
        // The re-activated router is the only one answering, so routing still works.
        await userEvent.click(menuLink("Status"));
        expect(await waitForScreen("Status")).toBeInTheDocument();
        expect(location.pathname).toBe(appPath("/showcase/status"));
        expect(activeMenuItems()).toEqual(["Status"]);
    });

    // BUG: AppBrowsingHistory keeps the name a screen gave itself (SetPageTitle) for as long as the
    // browser stays at that address (appBrowsingHistory.ts:184). Signing out swaps the screen for the
    // sign-in form WITHOUT changing the address, so the form — which names nothing — keeps the title
    // of the screen it replaced ("Controls · Showcase — UECA-React Showcase"). That contradicts
    // appMessage.ts on SetPageTitle: "a screen that sends nothing gets the app name alone rather than
    // the previous page's title" — and a signed-out cold visit to the same address gets the app name.
    it.fails("titles the sign-in form with the app name alone after signing out", async () => {
        await renderApp({ url: "/showcase/controls", signedIn: true });
        await waitFor(() => expect(document.title).toBe(documentTitle("Controls · Showcase")));

        await userEvent.click(signOutItem());
        await screen.findByRole("heading", { level: 1, name: "Sign in" });

        await waitFor(() => expect(document.title).toBe(APP_NAME), { timeout: 500 });
    });
});
