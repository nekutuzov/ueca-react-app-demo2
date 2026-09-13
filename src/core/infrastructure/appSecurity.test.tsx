import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import * as UECA from "ueca-react";
import { AppLocalStorage, AppSecurity, AppSecurityModel, appMessageBus, AppStorageKeys } from "@core";
import { mount, settle } from "@test";

// The real storage service answers AppSecurity's App.LocalStorage.* messages.
async function mountSecurity(): Promise<AppSecurityModel> {
    await mount(AppLocalStorage, { id: "localStorage" });
    const { model } = await mount(AppSecurity, { id: "security" });
    return model;
}

describe("AppSecurity", () => {
    it("starts signed out when nothing is stored", async () => {
        const security = await mountSecurity();

        expect(security.isAuthorized()).toBe(false);
        expect(security.getUserContext()).toBeUndefined();
    });

    // Restored in constr so AppUI's very first render already knows which view to show.
    it("restores a stored sign-in before the first render", async () => {
        localStorage.setItem(AppStorageKeys.userContext, JSON.stringify({ user: "ada", apiToken: "T" }));
        let authorizedAtInit: boolean;

        await mount(AppSecurity, { id: "security", init: (m) => { authorizedAtInit = m.isAuthorized(); } });

        expect(authorizedAtInit).toBe(true);
    });

    it("treats a stored context without a token as signed out", async () => {
        localStorage.setItem(AppStorageKeys.userContext, JSON.stringify({ user: "ada" }));

        const security = await mountSecurity();

        expect(security.isAuthorized()).toBe(false);
    });

    it("treats unreadable stored JSON as signed out rather than failing", async () => {
        localStorage.setItem(AppStorageKeys.userContext, "{not json");

        const security = await mountSecurity();

        expect(security.isAuthorized()).toBe(false);
    });

    it("authorize issues a token and persists it when asked to keep the user signed in", async () => {
        const security = await mountSecurity();

        await security.authorize("ada", "secret", true);

        expect(security.isAuthorized()).toBe(true);
        expect(security.getUserContext()).toEqual({ user: "ada", apiToken: "DEMO-TOKEN" });
        expect(JSON.parse(localStorage.getItem(AppStorageKeys.userContext))).toEqual({ user: "ada", apiToken: "DEMO-TOKEN" });
    });

    it("authorize without keepMeSignedIn signs in for the session only and clears a stored sign-in", async () => {
        localStorage.setItem(AppStorageKeys.userContext, JSON.stringify({ user: "old", apiToken: "T" }));
        const security = await mountSecurity();

        await security.authorize("ada", "secret", false);

        expect(security.isAuthorized()).toBe(true);
        expect(localStorage.getItem(AppStorageKeys.userContext)).toBeNull();
    });

    it("unauthorize signs out and forgets the stored sign-in", async () => {
        const security = await mountSecurity();
        await security.authorize("ada", "secret", true);

        await security.unauthorize();

        expect(security.isAuthorized()).toBe(false);
        expect(localStorage.getItem(AppStorageKeys.userContext)).toBeNull();
    });

    describe("messages", () => {
        it("answers App.Security.* over the bus", async () => {
            await mountSecurity();

            expect(await appMessageBus.unicast("App.Security.IsAuthorized")).toBe(false);

            await appMessageBus.unicast("App.Security.Authorize", { user: "ada", password: "x", keepMeSignedIn: true });
            expect(await appMessageBus.unicast("App.Security.IsAuthorized")).toBe(true);
            expect(await appMessageBus.unicast("App.Security.GetSecurityInfo")).toEqual({ user: "ada", securityRules: [] });

            await appMessageBus.unicast("App.Security.Unauthorize");
            expect(await appMessageBus.unicast("App.Security.IsAuthorized")).toBe(false);
            expect(await appMessageBus.unicast("App.Security.GetSecurityInfo")).toEqual({ user: undefined, securityRules: [] });
        });
    });

    // The user context is a reactive prop on purpose: AppUI swaps the login form for the router by
    // reading isAuthorized(), and a non-reactive "__" prop would leave the login form on screen.
    it("re-renders a view that reads isAuthorized() when the user signs in and out", async () => {
        const security = await mountSecurity();
        await mount(AuthorizedProbe, { id: "probe", authorized: () => security.isAuthorized() });
        expect(screen.getByTestId("probe")).toHaveTextContent("signed out");

        await security.authorize("ada", "secret", false);
        await settle();
        expect(screen.getByTestId("probe")).toHaveTextContent("signed in");

        await security.unauthorize();
        await settle();
        expect(screen.getByTestId("probe")).toHaveTextContent("signed out");
    });
});

type AuthorizedProbeStruct = UECA.ComponentStruct<{ props: { authorized: boolean } }>;

function useAuthorizedProbe(params?: UECA.ComponentParams<AuthorizedProbeStruct>) {
    const struct: AuthorizedProbeStruct = {
        props: {
            id: useAuthorizedProbe.name,
            authorized: false
        },

        View: () => <div id={model.htmlId()} data-testid="probe">{model.authorized ? "signed in" : "signed out"}</div>
    };

    const model = UECA.useComponent(struct, params);
    return model;
}

const AuthorizedProbe = UECA.getFC(useAuthorizedProbe);
