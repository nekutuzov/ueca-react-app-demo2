import * as UECA from "ueca-react";
import { Alert, UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";
import { Intent } from "@core";

type AlertItem = {
    id: number;
    message: React.ReactNode;
    intent: Intent;
};

// AppAlertManager - Global toast notification manager
type AppAlertManagerStruct = UIBaseStruct<{
    props: {
        alerts: AlertItem[];
        nextAlertId: number;
    };

    methods: {
        addAlert: (message: React.ReactNode, intent: Intent) => void;
        removeAlert: (id: number) => void;
    };
}>;

type AppAlertManagerParams = UIBaseParams<AppAlertManagerStruct>;
type AppAlertManagerModel = UIBaseModel<AppAlertManagerStruct>;

function useAppAlertManager(params?: AppAlertManagerParams): AppAlertManagerModel {
    const struct: AppAlertManagerStruct = {
        props: {
            id: useAppAlertManager.name,
            alerts: [],
            nextAlertId: 1
        },

        messages: {
            "Alert.Success": async (p) => model.addAlert(p.message, "success"),
            "Alert.Information": async (p) => model.addAlert(p.message, "info"),
            "Alert.Warning": async (p) => model.addAlert(p.message, "warning"),
            "Alert.Error": async (p) => model.addAlert(p.message, "error")
        },

        methods: {
            addAlert: (message, intent) => {
                const id = model.nextAlertId++;
                model.alerts.push({ id, message, intent });
                
                // Auto-remove after 4 seconds
                setTimeout(() => {
                    model.removeAlert(id);
                }, 4000);
            },

            removeAlert: (id) => {
                model.alerts = model.alerts.filter(a => a.id !== id);
            }
        },

        View: () => (
            <div
                id={model.htmlId()}
                style={{
                    position: "fixed",
                    top: "24px",
                    right: "24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    zIndex: 1400,
                    pointerEvents: "none",
                    maxWidth: "400px"
                }}
            >
                <style>{`
                    @keyframes alertSlideIn {
                        from {
                            transform: translateX(100%);
                            opacity: 0;
                        }
                        to {
                            transform: translateX(0);
                            opacity: 1;
                        }
                    }
                `}</style>
                
                {model.alerts.map(alert => (
                    <div
                        key={alert.id}
                        style={{
                            width: "100%",
                            animation: "alertSlideIn 0.3s ease",
                            pointerEvents: "auto"
                        }}
                    >
                        <Alert
                            variant="filled"
                            severity={alert.intent}
                            color={alert.intent}
                            onClose={() => model.removeAlert(alert.id)}
                        >
                            {alert.message}
                        </Alert>
                    </div>
                ))}
            </div>
        )
    };

    const model = useUIBase(struct, params);
    return model;
}

const AppAlertManager = UECA.getFC(useAppAlertManager);

export { AppAlertManagerParams, AppAlertManagerModel, useAppAlertManager, AppAlertManager };
