import * as UECA from "ueca-react";
import { AppMessage, AppRoute } from "@core";

// Base UECA Component for all components in the application

type BasePartialStruct = UECA.ComponentStruct<{
    methods: {
        // Shorthand Methods

        // Routing
        getRoute: () => Promise<AppRoute>;
        goToRoute: (route: AppRoute) => Promise<boolean>;
        setRoute: (route: AppRoute) => Promise<boolean>;
        setRouteParams: (params: Record<string, unknown>, patch: boolean) => Promise<void>;
        openNewTab: (route: AppRoute) => Promise<void>;

        // Dialogs
        dialogInfo: (title: string, message: string) => Promise<void>;
        dialogWarning: (title: string, message: string, details?: string) => Promise<void>;
        dialogError: (title: string, message: string, details?: string) => Promise<void>;
        dialogException: (title: string, error: Error) => Promise<void>;
        dialogYesNo: (title: string, message: string) => Promise<boolean>;
        dialogConfirmAction: (title?: string, message?: string, action?: string) => Promise<boolean>;
        alertInformation: (text: string) => Promise<void>;
        alertWarning: (message: React.ReactNode) => Promise<void>;
        alertSuccess: (message: React.ReactNode) => Promise<void>;
        alertError: (message: React.ReactNode) => Promise<void>;

        // Busy indicator
        setAppBusy: (value: boolean) => Promise<void>;  // IMPORTANT: counts the calls
        clearAppBusy: () => Promise<void>;              // Set the call count to 0 and set busy state to false

        // Misc
        runWithErrorDisplay: <P, R>(action: (params?: P) => Promise<R>, params?: P) => Promise<R>;
        runWithBusyDisplay: <T>(action: () => Promise<T>) => Promise<T>;
        copyToClipboard: (content: string) => Promise<void>;

        // File selection        
        selectFiles: (fileMask: string, multiselect?: boolean) => Promise<File[]>;
    }

}, AppMessage>;


type BaseStruct<T extends UECA.GeneralComponentStruct> = BasePartialStruct & UECA.ComponentStruct<T, AppMessage>;
type BaseParams<T extends BasePartialStruct> = UECA.ComponentParams<T>;
type BaseModel<T extends BasePartialStruct = BasePartialStruct> = UECA.ComponentModel<T, AppMessage>;

function useBase<T extends BasePartialStruct>(extStruct: T, params?: BaseParams<T>): BaseModel<T> {
    const struct: BasePartialStruct = {
        methods: {
            // Shorthand Methods

            // Routing
            getRoute: async () => await model.bus.unicast("App.Router.GetRoute", undefined),
            goToRoute: async (route) => await model.bus.unicast("App.Router.GoToRoute", route),
            setRoute: async (route) => await model.bus.unicast("App.Router.SetRoute", route),
            setRouteParams: async (params, patch) => await model.bus.unicast("App.Router.SetRouteParams", { params, patch }),
            openNewTab: async (route) => await model.bus.unicast("App.Router.OpenNewTab", route),

            // Modal dialogs
            dialogInfo: async (title, message) => await model.bus.unicast("Dialog.Information", { title, message }),
            dialogWarning: async (title, message, details) => await model.bus.unicast("Dialog.Warning", { title, message, details }),
            dialogError: async (title, message, details) => await model.bus.unicast("Dialog.Error", { title, message, details }),
            dialogException: async (title: string, error: Error) => await model.bus.unicast("Dialog.Exception", { title, error }),
            dialogYesNo: async (title, message) => await model.bus.unicast("Dialog.Confirmation", { title, message }),
            dialogConfirmAction: async (title = "Warning", message = "Are you sure want to delete this item?", action = "Delete") => await model.bus.unicast("Dialog.ActionConfirmation", { title, message, action }),
            
            // Toast notifications
            alertInformation: async (text) => await model.bus.unicast("Alert.Information", { message: text }),
            alertSuccess: async (message) => await model.bus.unicast("Alert.Success", { message }),
            alertWarning: async (message) => await model.bus.unicast("Alert.Warning", { message }),
            alertError: async (message) => await model.bus.unicast("Alert.Error", { message }),

            // Busy indicator
            setAppBusy: async (value) => await model.bus.unicast("BusyDisplay.Set", value),
            clearAppBusy: async () => await model.bus.unicast("BusyDisplay.Clear", undefined),

            // Misc
            runWithErrorDisplay: async (p) => await _runWithErrorDisplay(p),
            runWithBusyDisplay: async (action) => await _runWithBusyDisplay(action),
            selectFiles: async (fileMask, multiselect) => await model.bus.unicast("App.SelectFiles", { fileMask, multiselect }),
        }
    }

    const model = UECA.useExtendedComponent(struct, extStruct, params);
    return model;

    // Private methods
    async function _runWithErrorDisplay<P, R>(action: (params?: P) => Promise<R>, params?: P): Promise<R> {
        try {
            return await action(params);
        } catch (error) {
            await model.dialogException("Error", error as Error);
        }
    }

    async function _runWithBusyDisplay<T>(action: () => Promise<T>): Promise<T> {
        await model.setAppBusy(true);
        try {
            return await action();
        } finally {
            await model.setAppBusy(false);
        }
    }
}

export { BaseStruct, BaseParams, BaseModel, useBase }
