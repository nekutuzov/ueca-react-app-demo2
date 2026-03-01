import * as UECA from "ueca-react";
import { AlertToast, UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";
import { Intent } from "@core";

// AppAlertManager - Global toast notification manager
type AppAlertManagerStruct = UIBaseStruct<{
    props: {
        _alerts: {
            message: React.ReactNode;
            intent: Intent;
            position: number;
            new: boolean;
        }[];
    };

    methods: {
        addAlert: (message: React.ReactNode, intent: Intent) => void;
        _alertView: () => UECA.ReactElement;
    };

    events: {
        onOpen: (source: AppAlertManagerModel) => UECA.MaybePromise;
        onClose: (source: AppAlertManagerModel) => UECA.MaybePromise;
    };
}>;

type AppAlertManagerParams = UIBaseParams<AppAlertManagerStruct>;
type AppAlertManagerModel = UIBaseModel<AppAlertManagerStruct>;

function useAppAlertManager(params?: AppAlertManagerParams): AppAlertManagerModel {
    const struct: AppAlertManagerStruct = {
        props: {
            id: useAppAlertManager.name,
            _alerts: []
        },

        messages: {
            "Alert.Success": async (p) => model.addAlert(p.message, "success"),
            "Alert.Information": async (p) => model.addAlert(p.message, "info"),
            "Alert.Warning": async (p) => model.addAlert(p.message, "warning"),
            "Alert.Error": async (p) => model.addAlert(p.message, "error")
        },

        methods: {
            addAlert: (message, intent) => {
                const lastAlert = model._alerts[model._alerts.length - 1];
                model._alerts.push({
                    message: message,
                    intent: intent,
                    position: lastAlert ? (lastAlert.position + 1) : 1,
                    new: true
                });
            },

            _alertView: () => {
                return <>
                    {
                        model._alerts.map((alert) => {
                            return <AlertToast
                                id={`alert${alert.position}`}
                                key={alert.position}
                                contentView={alert.message}
                                color={alert.intent}
                                severity={alert.intent}
                                open
                                transition={alert.new}
                                disablePortal={true}
                                onOpen={() => { alert.new = false; }}
                                onClose={(m) => { model._alerts = model._alerts.filter(a => m.id != `alert${a.position}`); }}
                            />
                        })
                    }
                </>
            }
        },

        View: () => (
            <div
                id={model.htmlId()}
                style={{
                    position: "fixed",
                    right: "24px",
                    top: "24px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: "8px",
                    zIndex: 1400
                }}
            >
                <model._alertView />
            </div>
        )
    };

    const model = useUIBase(struct, params);
    return model;
}

const AppAlertManager = UECA.getFC(useAppAlertManager);

export { AppAlertManagerParams, AppAlertManagerModel, useAppAlertManager, AppAlertManager };
