import * as UECA from "ueca-react";
import { ErrorFallback, Col, UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase, FileSelectorModel, useFileSelector } from "@components";
import { AbortExecutionException, AppRoutes, AppBusyDisplayModel, useAppBusyDisplay } from "@core";

type AppUIStruct = UIBaseStruct<{
    props: {
        // Future: Add properties like authorizedMode when needed
    };

    children: {
        busyDisplay: AppBusyDisplayModel;
        fileSelector: FileSelectorModel;
        // Future: Add child components (themeManager, dialogManager, alertManager, etc.)
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
        },

        children: {
            busyDisplay: useAppBusyDisplay(),
            fileSelector: useFileSelector(),
            // Future: Initialize child components here
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
                return <AppRoutes id={"routes"} />;
            },
        },        
        
        View: () =>
            <ErrorFallback onError={(e) => { console.error("AppUI ErrorFallback:", e) }}>
                <Col id={model.htmlId()} fill>
                    <ErrorFallback onError={(e) => { _processReactException(e) }}>
                        <model.appView />
                    </ErrorFallback>
                    <model.busyDisplay.View />
                    <model.fileSelector.View />
                    {/* Future: Add dialogManager, alertManager views */}
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
        // Future: Show dialog with error
        console.error("Unhandled exception:", error);
    }

    function _processReactException(error: Error) {
        console.error("React component rendering error:", error);
        _processUnhandledException(error, false);
    }
}

const AppUI = UECA.getFC(useAppUI);

export { AppUIParams, AppUIModel, useAppUI, AppUI };
