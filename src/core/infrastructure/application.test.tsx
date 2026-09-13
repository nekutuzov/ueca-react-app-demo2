import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Application, appMessageBus, AppStorageKeys, THEME_STORAGE_KEY } from "@core";
import { mount, settle } from "@test";

// The router and its screens have their own tests; what matters here is which view AppUI shows.
vi.mock("./appRouter", async (importOriginal) => {
    const actual = await importOriginal<typeof import("./appRouter")>();
    const React = await import("react");
    return {
        ...actual,
        AppRouter: () => React.createElement("div", { "data-testid": "router" })
    };
});

async function mountApplication() {
    return await mount(Application, { id: "app", applicationName: "UECA-React Showcase", appVersion: "3.0" });
}

function signInHeading() {
    return screen.queryByRole("heading", { level: 1, name: "Sign in" });
}

describe("Application", () => {
    beforeEach(() => {
        document.head.appendChild(Object.assign(document.createElement("base"), { href: "/ueca-react-app-demo2/" }));
        history.replaceState(null, "", "/ueca-react-app-demo2/home");
    });

    it("answers App.GetInfo with its name and version", async () => {
        await mountApplication();

        expect(await appMessageBus.unicast("App.GetInfo")).toEqual({ appName: "UECA-React Showcase", appVersion: "3.0" });
    });

    it("names the document after itself through the browsing history", async () => {
        await mountApplication();

        expect(document.title).toBe("UECA-React Showcase");
    });

    it("owns the app-wide services, each reachable over the bus", async () => {
        localStorage.setItem(THEME_STORAGE_KEY, "ueca-dark");
        localStorage.setItem(AppStorageKeys.lastUsedRoute, "/showcase/data");
        const { model } = await mountApplication();

        expect([model.browsingHistory, model.security, model.localStorage, model.themeManager, model.ui].map((m) => m.fullId()))
            .toEqual(["app.browsingHistory", "app.security", "app.localStorage", "app.themeManager", "app.ui"]);
        expect(await appMessageBus.unicast("App.BrowsingHistory.GetActiveAddress")).toEqual({ path: "/home", section: undefined });
        expect(await appMessageBus.unicast("App.Theme.GetMode")).toBe("dark");
        expect(await appMessageBus.unicast("App.LocalStorage.Read", AppStorageKeys.lastUsedRoute)).toBe("/showcase/data");
        expect(await appMessageBus.unicast("App.Security.IsAuthorized")).toBe(false);
        expect(document.getElementById("app.ui")).toContainElement(signInHeading());
    });

    // AppSecurity restores the sign-in in constr, so the very first render already knows.
    it("opens on the app rather than the sign-in form when a sign-in is stored", async () => {
        localStorage.setItem(AppStorageKeys.userContext, JSON.stringify({ user: "ada", apiToken: "DEMO-TOKEN" }));

        const { model } = await mountApplication();

        expect(model.ui.authorizedMode).toBe(true);
        expect(screen.getByTestId("router")).toBeInTheDocument();
        expect(signInHeading()).toBeNull();
    });

    it("switches between the sign-in form and the app as the user signs in and out", async () => {
        const { model } = await mountApplication();
        expect(model.ui.authorizedMode).toBe(false);

        await act(async () => { await appMessageBus.unicast("App.Security.Authorize", { user: "ada", password: "x", keepMeSignedIn: false }); });
        await settle();
        expect(model.ui.authorizedMode).toBe(true);
        expect(screen.getByTestId("router")).toBeInTheDocument();

        await act(async () => { await appMessageBus.unicast("App.Security.Unauthorize"); });
        await settle();
        expect(model.ui.authorizedMode).toBe(false);
        expect(signInHeading()).toBeInTheDocument();
    });

    it("signs in from the form, stays signed in across reloads and clears the form", async () => {
        const { model } = await mountApplication();
        const userInput = document.getElementById("app.ui.loginForm.userInput").querySelector("input");
        const passwordInput = document.getElementById("app.ui.loginForm.passwordInput").querySelector("input");

        await userEvent.type(userInput, "ada");
        await userEvent.type(passwordInput, "secret");
        await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
        await settle();

        expect(screen.getByTestId("router")).toBeInTheDocument();
        expect(model.security.getUserContext()).toEqual({ user: "ada", apiToken: "DEMO-TOKEN" });
        expect(JSON.parse(localStorage.getItem(AppStorageKeys.userContext))).toEqual({ user: "ada", apiToken: "DEMO-TOKEN" });
        expect(model.ui.loginForm.user).toBe("");
        expect(model.ui.loginForm.password).toBe("");
    });
});
