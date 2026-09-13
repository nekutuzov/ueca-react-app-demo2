import * as UECA from "ueca-react";
import { AnyRoute } from "@components";
import { AppRoute } from "./appRoutes";
import { AppStorageKey } from "./appTypes";
import type { ThemeId, ThemeMode, ThemeDescriptor } from "./appTheme";
import type { AnchorRect, Placement } from "../misc/overlayPosition";

// Application Messages: "message-type": { in: <parameter-type>, out: <parameter-type> }
// Properties "in" and "out" describe value type of input and output parameters. Both properties are optional.

type ApiMessage = {
    // Add your API messages here, named "Api.<Area>.<Operation>". A screen never calls fetch: it
    // sends one of these and the API service owns the transport.
}

type DialogMessage = {
    "Dialog.Information": { in: { title?: string, message: string } };
    "Dialog.Warning": { in: { title?: string, message: string, details?: string } };
    "Dialog.Error": { in: { title?: string, message: string, details?: string } };
    "Dialog.Exception": { in: { title?: string, error: Error } };
    "Dialog.Confirmation": { in: { title?: string, message: string }, out: boolean };
    "Dialog.ActionConfirmation": { in: { title?: string, message: string, action: string }, out: boolean };
    "Dialog.Custom": { in: { title?: React.ReactNode, content: React.ReactNode, okText?: string }, out: boolean };
    // Dismisses the topmost open dialog from code, resolving its promise as if cancelled. For a
    // dialog that has to disappear on its own, never for one the user is expected to answer.
    "Dialog.Close": NoParamsNoReturn;
    "Alert.Information": { in: { message: React.ReactNode } };
    "Alert.Success": { in: { message: React.ReactNode } };
    "Alert.Error": { in: { message: React.ReactNode } };
    "Alert.Warning": { in: { message: React.ReactNode } };
}

type ScreenMessages = {
    // Add your screen specific messages here
}

type MiscMessages = {
    "App.UnhandledException": { in: Error };

    "BusyDisplay.Set": { in: boolean };
    "BusyDisplay.Clear": NoParamsNoReturn;
    "BusyDisplay.SetVisibility": { in: boolean };

    // Tooltip — ONE instance lives on AppUI and every trigger drives it over the bus, so no
    // component owns tooltip DOM of its own. `token` identifies the trigger: Hide is ignored unless
    // it names the trigger currently showing, which is what stops a late hide from one target
    // closing the tooltip another target has just opened.
    "App.Tooltip.Show": {
        in: {
            token: string;
            anchor: AnchorRect;
            contentView: React.ReactNode;
            placement?: Placement;
            delay?: number;
        }
    };
    "App.Tooltip.Hide": { in: { token: string } };

    "App.Theme.GetMode": { out: ThemeMode };
    "App.Theme.SetMode": { in: ThemeMode };
    "App.Theme.GetTheme": { out: ThemeId };
    "App.Theme.SetTheme": { in: ThemeId };
    "App.Theme.ToggleTheme": { out: ThemeId };
    "App.Theme.ListThemes": { out: ThemeDescriptor[] };
    // Broadcast after the active theme changes, so anything showing the current mode (the theme
    // toggle) stays in sync without polling.
    "App.Theme.Changed": { in: { theme: ThemeId, mode: ThemeMode } };

    // One message, because the path and the section are one thing: the address. Two getters would
    // be read across two awaits, and anything arriving in between — a popstate, a Replace — yields
    // a path from one moment paired with a section from another.
    "App.BrowsingHistory.GetActiveAddress": { out: { path: string, section?: string } };
    "App.BrowsingHistory.Open": { in: { path: AnyRoute | string, newTab?: boolean } };
    "App.BrowsingHistory.Replace": { in: { path: AnyRoute | string } };
    // Carries the section as well as the path, so Back and Forward restore an anchor within the
    // screen the same way they restore the screen.
    "App.BrowsingHistory.OnNavigate": { in: { path: string, section?: string }, out: boolean }
    "App.BrowsingHistory.ResolveRoute": { in: AnyRoute, out: string };

    "App.Router.GetRoute": { out: AppRoute };
    "App.Router.GoToRoute": { in: AppRoute; out: boolean };
    "App.Router.SetRoute": { in: AppRoute; out: boolean };
    // Patches the address of the screen already on show, rather than routing to one. The section
    // rides here for exactly that reason: sending it through GoToRoute would hand the router a new
    // route object and tear down the mounted screen just to move within it.
    "App.Router.SetRouteParams": { in: { params?: Record<string, unknown>, patch?: boolean, section?: string } };
    // Both are BROADCAST — more than one component legitimately listens (a CRUD screen vetoes on
    // unsaved changes, the tooltip closes its bubble), and unicast throws on a second subscriber.
    "App.Router.BeforeRouteChange": { in: AppRoute, out: boolean };
    "App.Router.AfterRouteChange": { in: AppRoute };
    "App.Router.OpenNewTab": { in: AppRoute };
    // The URL a route would navigate to, WITHOUT navigating — for a link's href. Undefined when the
    // route cannot be resolved (a ":segment" with no value).
    "App.Router.ResolveRoute": { in: AppRoute, out: string };

    "App.Security.IsAuthorized": { out: boolean };
    "App.Security.Authorize": { in: { user: string, password: string; keepMeSignedIn: boolean } };
    "App.Security.Unauthorize": NoParamsNoReturn;
    "App.Security.GetSecurityInfo": { out: { user: string; securityRules: string[] } };

    "App.GetInfo": { out: { appName: string, appVersion: string } };

    "App.SelectFiles": { in: { fileMask?: string; multiselect?: boolean }, out: File[] };

    "App.LocalStorage.Read": { in: AppStorageKey, out: string };
    "App.LocalStorage.Write": { in: { key: AppStorageKey; value: string } };
    "App.LocalStorage.Clear": { in: AppStorageKey };

    "App.SideBarStateChanged": { in: { collapsed: boolean } };

    // Add public messages directly in here or declare a separate message type
}

type AppMessage =
    ApiMessage &
    DialogMessage &
    ScreenMessages &
    MiscMessages;

type NoParamsNoReturn = UECA.EmptyObject;

export { AppMessage, ApiMessage }
