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
        // Pixels as a number, or any CSS length as a string — see Drawer.
        width?: number | string;
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
                // No type of its own: the heading wears the Drawer's --drawer-title-* tokens like
                // every other drawer, which an inline font-size here used to override.
                titleView: () => (
                    <Row spacing="small" verticalAlign="center">
                        {model.severity && <SeverityIcon severity={model.severity} size={24} color={_getSeverityColor()} />}
                        <span>{model.titleView}</span>
                    </Row>
                ),
                contentView: () => model.contentView,
                actionView: () => (
                    <Row horizontalAlign={"right"} spacing="default">
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
            // A panel footer's buttons sit on the 32px rung, as EditDrawer's do — one
            // above the dialog's answers, which are 24px.
            okButton: useButton({
                contentView: "OK",
                variant: "contained",
                size: "small",
                color: "primary.main",
                onClick: () => _close(true)
            }),
            cancelButton: useButton({
                contentView: "Cancel",
                variant: "outlined",
                size: "small",
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
        if (!model.severity || model.severity == "none") {
            return undefined;
        }
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
