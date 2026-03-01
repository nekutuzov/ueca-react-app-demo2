import * as UECA from "ueca-react";
import { CloseIconButton, UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";
import "./alert.css";

type AlertStruct = UIBaseStruct<{
    props: {
        color: "success" | "info" | "warning" | "error";
        severity: "success" | "info" | "warning" | "error";
        variant: "filled" | "outlined" | "standard";
        children: React.ReactNode;
    };

    events: {
        onClose: (source: AlertModel) => UECA.MaybePromise;
    };
}>;

type AlertParams = UIBaseParams<AlertStruct>;
type AlertModel = UIBaseModel<AlertStruct>;

function useAlert(params?: AlertParams): AlertModel {
    const struct: AlertStruct = {
        props: {
            id: useAlert.name,
            color: "info",
            severity: "info",
            variant: "standard",
            children: undefined,
        },

        View: () => {
            const severityIcon = _getSeverityIcon(model.severity);
            
            return (
                <div
                    id={model.htmlId()}
                    className={`ueca-alert ueca-alert-${model.variant} ueca-alert-${model.severity}`}
                >
                    <div className="alert-icon">{severityIcon}</div>
                    <div className="alert-message">{model.children}</div>
                    {model.onClose && (
                        <div className="alert-action">
                            <CloseIconButton 
                                size="small" 
                                onClick={() => model.onClose?.(model)} 
                            />
                        </div>
                    )}
                </div>
            );
        }
    };

    const model = useUIBase(struct, params);
    return model;

    // Private methods
    function _getSeverityIcon(severity: string) {
        switch (severity) {
            case "success":
                return (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                );
            case "info":
                return (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                    </svg>
                );
            case "warning":
                return (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                    </svg>
                );
            case "error":
                return (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                );
            default:
                return null;
        }
    }
}

const Alert = UECA.getFC(useAlert);

export { AlertModel, AlertParams, useAlert, Alert };
