import * as UECA from "ueca-react";
import { ErrorFallback, Col, UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase, FileSelectorModel, useFileSelector } from "@components";
import {
    AbortExecutionException, AppBusyDisplayModel, useAppBusyDisplay, AppDialogManagerModel, useAppDialogManager,
    AppAlertManagerModel, useAppAlertManager, AppRouter,
    AppTooltipManagerModel, useAppTooltipManager,
    AppLoginFormModel, useAppLoginForm
} from "@core";

type AppUIStruct = UIBaseStruct<{
    props: {
        authorizedMode: boolean;
    };

    children: {
        busyDisplay: AppBusyDisplayModel;
        dialogManager: AppDialogManagerModel;
        alertManager: AppAlertManagerModel;
        tooltipManager: AppTooltipManagerModel;
        fileSelector: FileSelectorModel;
        loginForm: AppLoginFormModel;
    };

    methods: {
        appView: () => UECA.ReactElement;
    };
}>;

type AppUIParams = UIBaseParams<AppUIStruct>;
type AppUIModel = UIBaseModel<AppUIStruct>;

function useAppUI(params?: AppUIParams): AppUIModel {
    const struct: AppUIStruct = {
        props: {
            id: useAppUI.name,
            authorizedMode: false
        },

        children: {
            dialogManager: useAppDialogManager(),
            alertManager: useAppAlertManager(),
            tooltipManager: useAppTooltipManager(),
            busyDisplay: useAppBusyDisplay(),
            fileSelector: useFileSelector(),

            loginForm: useAppLoginForm({
                onLogin: async (user, password) => {
                    await _login(user, password);
                }
            })
        },

        messages: {
            "App.UnhandledException": async (error) => {
                _processUnhandledException(error, true);
            },

            "App.SelectFiles": async (p) => {
                return await model.fileSelector.select(p.fileMask, p.multiselect);
            }
        },

        methods: {
            appView: () => {
                if (model.authorizedMode) {
                    return <AppRouter id={"router"} />;
                }
                return <model.loginForm.View />;
            }
        },

        View: () =>
            <ErrorFallback onError={(e) => { console.error("AppUI ErrorFallback:", e) }}>
                {/* spacing none — the hidden overlay hosts are flex children; a gap would show as a strip under the app */}
                <Col id={model.htmlId()} fill height="100vh" spacing={"none"}>
                    <ErrorFallback onError={(e) => { _processReactException(e) }}>
                        <model.appView />
                    </ErrorFallback>
                    <model.busyDisplay.View />
                    <model.dialogManager.View />
                    <model.alertManager.View />
                    <model.tooltipManager.View />
                    <model.fileSelector.View />
                </Col>
                {/* A lazily loaded chunk: a closed viewer costs the bundle nothing. Outside appView so
                    it is reachable from the login form too. */}
                <UECA.TraceViewerButton target={"tab"} theme={"auto"} />
            </ErrorFallback>
    };

    const model = useUIBase(struct, params);
    return model;

    // Private methods
    async function _login(user: string, password: string) {
        await model.runWithBusyDisplay(
            async () => await model.bus.unicast("App.Security.Authorize", { user, password, keepMeSignedIn: true })
        );
        // Erase the fields only on success, so a typo is easy to correct.
        model.loginForm.userInput.value = "";
        model.loginForm.passwordInput.value = "";
    }

    function _processUnhandledException(error: Error, ignoreAbort: boolean) {
        if (ignoreAbort && (error instanceof AbortExecutionException)) {
            return;
        }
        model.bus.unicast("Dialog.Exception", { error });
    }

    function _processReactException(error: Error) {
        _processUnhandledException(error, false);
    }
}

const AppUI = UECA.getFC(useAppUI);

export { AppUIParams, AppUIModel, useAppUI, AppUI };
