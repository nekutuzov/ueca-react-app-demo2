import * as UECA from "ueca-react";
import { Row, ButtonModel, DrawerModel, SeverityIcon, UIBaseModel, UIBaseParams, UIBaseStruct, useButton, useDrawer, useUIBase } from "@components";
import { resolvePaletteColor } from "@core";

type DrawerAnchor = "left" | "top" | "right" | "bottom";
type DrawerSeverity = "success" | "info" | "warning" | "error" | "none";

// Alert Drawer component
type AlertDrawerStruct = UIBaseStruct<{
    props: {
        anchor: DrawerAnchor;
        contentView: React.ReactNode;
        customActionView: React.ReactNode;
        open: boolean;
        severity?: DrawerSeverity;
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
                        {model.severity && <SeverityIcon severity={model.severity} size={24} color={_getSeverityColor()} />}
                        <span style={{ fontSize: "20px", fontWeight: 500 }}>{model.titleView}</span>
                    </Row>
                ),
                contentView: () => model.contentView,
                actionView: () => (
                    <Row horizontalAlign={"right"} spacing="small">
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
                variant: "contained",
                color: "primary.main",
                onClick: () => _close(true)
            }),
            cancelButton: useButton({
                contentView: "Cancel",
                variant: "outlined",
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

    function _getSeverityColor(): string | undefined {
        if (!model.severity) return undefined;
        const colorMap = {
            success: "success.main",
            info: "info.main",
            warning: "warning.main",
            error: "error.main"
        };
        return resolvePaletteColor(colorMap[model.severity]);
    }
}

const AlertDrawer = UECA.getFC(useAlertDrawer);

export { AlertDrawerModel, AlertDrawerParams, DrawerAnchor, DrawerSeverity, useAlertDrawer, AlertDrawer };
