import * as UECA from "ueca-react";
import { AnyRoute } from "@components";
import { AppRoute } from "./appRoutes";
import { AppStorageKey } from "./appTypes";

// Application Messages: "message-type": { in: <parameter-type>, out: <parameter-type> }
// Properties "in" and "out" describe value type of input and output parameters. Both properties are optional.

type ApiMessage = {
    // Add your API messages here
}

type DialogMessage = {
    "Dialog.Information": { in: { title?: string, message: string } };
    "Dialog.Warning": { in: { title?: string, message: string, details?: string } };
    "Dialog.Error": { in: { title?: string, message: string, details?: string } };
    "Dialog.Exception": { in: { title?: string, error: Error } };
    "Dialog.Confirmation": { in: { title?: string, message: string }, out: boolean };
    "Dialog.ActionConfirmation": { in: { title?: string, message: string, action: string }, out: boolean };
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

    "App.Theme.GetMode": { out: "light" | "dark" };
    "App.Theme.SetMode": { in: "light" | "dark" };

    "App.BrowsingHistory.GetActivePath": { out: string };
    "App.BrowsingHistory.Open": { in: { path: AnyRoute | string, newTab?: boolean } };
    "App.BrowsingHistory.Replace": { in: { path: AnyRoute | string } };
    "App.BrowsingHistory.OnNavigate": { in: string, out: boolean }

    "App.Router.GetRoute": { out: AppRoute };
    "App.Router.GoToRoute": { in: AppRoute; out: boolean };
    "App.Router.SetRoute": { in: AppRoute; out: boolean };
    "App.Router.SetRouteParams": { in: { params: Record<string, unknown>, patch: boolean } };
    "App.Router.BeforeRouteChange": { in: AppRoute, out: boolean };
    "App.Router.AfterRouteChange": { in: AppRoute };
    "App.Router.OpenNewTab": { in: AppRoute };

    "App.Security.IsAuthorized": { out: boolean };
    "App.Security.Authorize": { in: { user: string, password: string; keepMeSignedIn: boolean } };
    "App.Security.Unauthorize": NoParamsNoReturn;
    "App.Security.GetSecurityInfo": { out: { user: string; securityRules: string[] } };

    "App.GetInfo": { out: { appName: string, appVersion: string } };

    "App.SelectFiles": { in: { fileMask?: string; multiselect?: boolean }, out: File[] };

    "App.LocalStorage.Read": { in: AppStorageKey, out: string };
    "App.LocalStorage.Write": { in: { key: AppStorageKey; value: string } };
    "App.LocalStorage.Clear": { in: AppStorageKey };

    "App.GetSideBarState": { out: { collapsed: boolean } };
    "App.SetSideBarState": { in: { collapsed: boolean } };
    "App.ToggleSideBarState": { out: { collapsed: boolean } };
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
