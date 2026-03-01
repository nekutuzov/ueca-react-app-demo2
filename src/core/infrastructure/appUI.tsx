import * as UECA from "ueca-react";
import { ErrorFallback, Col, UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase, FileSelectorModel, useFileSelector } from "@components";
import {
    AbortExecutionException, AppBusyDisplayModel, useAppBusyDisplay, AppDialogManagerModel, useAppDialogManager,
    AppAlertManagerModel, useAppAlertManager, AppRouter
} from "@core";

type AppUIStruct = UIBaseStruct<{
    props: {
        authorizedMode: boolean;
    };

    children: {
        busyDisplay: AppBusyDisplayModel;
        dialogManager: AppDialogManagerModel;
        alertManager: AppAlertManagerModel;
        fileSelector: FileSelectorModel;
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
            authorizedMode: true,
        },

        children: {
            dialogManager: useAppDialogManager(),
            alertManager: useAppAlertManager(),
            busyDisplay: useAppBusyDisplay(),
            fileSelector: useFileSelector(),
        },

        messages: {
            "App.UnhandledException": async (error) => {
                _processUnhandledException(error, true);
            },

            "App.SelectFiles": async (p) => {
                return await model.fileSelector.select(p.fileMask, p.multiselect);
            },
        },

        methods: {
            appView: () => {
                if (model.authorizedMode) {
                    return <AppRouter id={"router"} />;
                }
                return <>Unauthorized Access</>;
            },
        },

        View: () =>
            <ErrorFallback onError={(e) => { console.error("AppUI ErrorFallback:", e) }}>
                <Col id={model.htmlId()} fill>
                    <ErrorFallback onError={(e) => { _processReactException(e) }}>
                        <model.appView />
                    </ErrorFallback>
                    <model.busyDisplay.View />
                    <model.dialogManager.View />
                    <model.alertManager.View />
                    <model.fileSelector.View />
                </Col>
            </ErrorFallback>
    };

    const model = useUIBase(struct, params);
    return model;

    // Private methods
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
