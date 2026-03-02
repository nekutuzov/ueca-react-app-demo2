import * as UECA from "ueca-react";
import { Alert, SnackbarModel, UIBaseModel, UIBaseParams, UIBaseStruct, useSnackbar, useUIBase } from "@components";

// Alert Dialog component
type AlertToastStruct = UIBaseStruct<{
    props: {
        open: boolean;
        contentView: React.ReactNode;
        color: "success" | "info" | "warning" | "error";
        transition: boolean;
        severity: "success" | "info" | "warning" | "error";
        anchorOrigin: { vertical: "top" | "bottom"; horizontal: "left" | "center" | "right"; };
        disablePortal: boolean;
    };

    children: {
        snackbar: SnackbarModel;
    };

    events: {
        onOpen: (source: AlertToastModel) => UECA.MaybePromise;
        onClose: (source: AlertToastModel) => UECA.MaybePromise;
    };
}>;

type AlertToastParams = UIBaseParams<AlertToastStruct>;
type AlertToastModel = UIBaseModel<AlertToastStruct>;

function useAlertToast(params?: AlertToastParams): AlertToastModel {
    const struct: AlertToastStruct = {
        props: {
            id: useAlertToast.name,
            open: false,
            contentView: undefined,
            transition: true,
            severity: "info",
            anchorOrigin: undefined,
            disablePortal: false
        },

        children: {
            snackbar: useSnackbar({
                contentView: () => (
                    <Alert
                        variant="filled"
                        color={model.color}
                        severity={model.severity}
                        children={model.contentView}
                        onClose={() => { model.open = false; }}
                    />
                ),
                open: UECA.bind(() => model, "open"),
                anchorOrigin: () => model.anchorOrigin,
                simple: () => !model.anchorOrigin,
                transition: () => model.transition,
                disablePortal: () => model.disablePortal,
                closeReasons: { timeout: true },
                onOpen: async () => {
                    await model.onOpen?.(model);
                },
                onClose: async () => {
                    await model.onClose?.(model);
                }
            }),
        },

        View: () => <model.snackbar.View />
    };

    const model = useUIBase(struct, params);
    return model;
}

const AlertToast = UECA.getFC(useAlertToast);

export { AlertToastParams, AlertToastModel, useAlertToast, AlertToast };
