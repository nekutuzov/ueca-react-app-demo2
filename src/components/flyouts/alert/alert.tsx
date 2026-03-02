import * as UECA from "ueca-react";
import { CloseIconButton, SeverityIcon, UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";
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
            return (
                <div
                    id={model.htmlId()}
                    className={`ueca-alert ueca-alert-${model.variant} ueca-alert-${model.severity}`}
                >
                    <div className="alert-icon">
                        <SeverityIcon severity={model.severity} />
                    </div>
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
}

const Alert = UECA.getFC(useAlert);

export { AlertModel, AlertParams, useAlert, Alert };
