import * as UECA from "ueca-react";
import { Row, AlertDrawerModel, ButtonModel, DialogModel, UIBaseModel, UIBaseParams, UIBaseStruct, useAlertDrawer, useButton, useDialog, useUIBase } from "@components";

// Alert Dialog component
type AlertDialogStruct = UIBaseStruct<{
    props: {
        contentView: React.ReactNode;
        customActionView: React.ReactNode;
        detailsOpen: boolean,
        detailsView: React.ReactNode,
        open: boolean;
        titleView: React.ReactNode;
        detailsTitleView: React.ReactNode;
        buttons: {
            ok?: boolean,
            cancel?: boolean,
            okCancel?: boolean,
            details?: boolean
        };
        closeResult: boolean | string;
    };

    children: {
        dialog: DialogModel
        okButton: ButtonModel;
        cancelButton: ButtonModel;
        detailsButton: ButtonModel;
        detailsDrawer: AlertDrawerModel;
    };

    events: {
        onOpen: (source: AlertDialogModel) => UECA.MaybePromise;
        onClose: (result: boolean | string, source: AlertDialogModel) => UECA.MaybePromise;
    };
}>;

type AlertDialogParams = UIBaseParams<AlertDialogStruct>;
type AlertDialogModel = UIBaseModel<AlertDialogStruct>;

function useAlertDialog(params?: AlertDialogParams): AlertDialogModel {
    const struct: AlertDialogStruct = {
        props: {
            id: useAlertDialog.name,
            buttons: { cancel: true },
            contentView: undefined,
            detailsOpen: false,
            detailsView: undefined,
            open: false,
            titleView: undefined,
            detailsTitleView: "Details",
            closeResult: undefined,
        },

        children: {
            dialog: useDialog({
                titleView: () => model.titleView,
                contentView: () => model.contentView,
                actionView: () => (
                    <Row horizontalAlign={"spaceBetween"}>
                        <model.detailsButton.View render={!!model.buttons?.details && !!model.detailsView} />
                        <div>
                            {model.customActionView}
                            <model.cancelButton.View render={!!(model.buttons?.cancel || model.buttons?.okCancel)} />
                            <model.okButton.View render={!!(model.buttons?.ok || model.buttons?.okCancel)} />
                        </div>
                    </Row>
                ),
                fullWidth: true,
                open: UECA.bind(() => model, "open"),
                onOpen: () => {
                    model.closeResult = undefined;
                    model.enterModalMode();
                    model.onOpen?.(model);
                },
                onClose: () => {
                    try {
                        model.detailsOpen = false;
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
            detailsButton: useButton({
                contentView: "Show details",
                variant: "text",
                onClick: () => { model.detailsDrawer.open = true; }
            }),
            detailsDrawer: useAlertDrawer({
                titleView: () => model.detailsTitleView,
                contentView: () => model.detailsView
            }),
        },

        View: () => <>
            <model.dialog.View />
            < model.detailsDrawer.View />
        </>
    };

    const model = useUIBase(struct, params);
    return model;

    // Private methods    
    function _close(result: boolean) {
        model.closeResult = result;
        model.open = false;
    }
}

const AlertDialog = UECA.getFC(useAlertDialog);

export { AlertDialogModel, AlertDialogParams, useAlertDialog, AlertDialog };
