import * as UECA from "ueca-react";
import { Row, ButtonModel, DrawerModel, SeverityIcon, UIBaseModel, UIBaseParams, UIBaseStruct, useButton, useDrawer, useUIBase } from "@components";

// Alert Drawer component
type AlertDrawerStruct = UIBaseStruct<{
    props: {
        anchor: "left" | "top" | "right" | "bottom";
        contentView: React.ReactNode;
        customActionView: React.ReactNode;
        open: boolean;
        severity?: "success" | "info" | "warning" | "error";
        titleView: React.ReactNode;
        width?: number;
        buttons: {
            ok?: boolean,
            cancel?: boolean,
            okCancel?: boolean
        };
        closeResult: boolean | string;
    };

    children: {
        drawer: DrawerModel
        okButton: ButtonModel;
        cancelButton: ButtonModel;
    };

    events: {
        onOpen: (source: AlertDrawerModel) => UECA.MaybePromise;
        onClose: (result: boolean | string, source: AlertDrawerModel) => UECA.MaybePromise;
    };
}>;

type AlertDrawerParams = UIBaseParams<AlertDrawerStruct>;
type AlertDrawerModel = UIBaseModel<AlertDrawerStruct>;

function useAlertDrawer(params?: AlertDrawerParams): AlertDrawerModel {
    const struct: AlertDrawerStruct = {
        props: {
            id: useAlertDrawer.name,
            anchor: "right",
            buttons: { cancel: true },
            contentView: undefined,
            customActionView: undefined,
            open: false,
            severity: undefined,
            titleView: undefined,
            width: undefined,
            closeResult: false,
        },

        children: {
            drawer: useDrawer({
                titleView: () => (
                    <Row spacing="small" verticalAlign="center">
                        {model.severity && <SeverityIcon severity={model.severity} size={24} />}
                        {model.titleView}
                    </Row>
                ),
                contentView: () => model.contentView,
                actionView: () => (
                    <Row horizontalAlign={"right"}>
                        {model.customActionView}
                        <model.cancelButton.View render={!!(model.buttons?.cancel || model.buttons?.okCancel)} />
                        <model.okButton.View render={!!(model.buttons?.ok || model.buttons?.okCancel)} />
                    </Row>
                ),
                anchor: () => model.anchor,
                width: () => model.width,
                open: UECA.bind(() => model, "open"),
                onOpen: () => {
                    model.enterModalMode();
                    model.onOpen?.(model);
                },
                onClose: () => {
                    try {
                        model.onClose?.(model.closeResult, model);
                    } finally {
                        model.leaveModalMode();
                    }
                }
            }),
            okButton: useButton({
                contentView: "OK",
                variant: "text",
                onClick: () => _close(true)
            }),
            cancelButton: useButton({
                contentView: "Cancel",
                variant: "text",
                onClick: () => _close(false)
            }),
        },

        View: () => <model.drawer.View />
    };

    const model = useUIBase(struct, params);
    return model;

    // Private methods    
    function _close(result: boolean) {
        model.closeResult = result;
        model.open = false;
    }
}

const AlertDrawer = UECA.getFC(useAlertDrawer);

export { AlertDrawerModel, AlertDrawerParams, useAlertDrawer, AlertDrawer };
