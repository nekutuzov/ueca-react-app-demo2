import * as UECA from "ueca-react";
import { Row, AlertDrawerModel, ButtonModel, DialogModel, SeverityIcon, UIBaseModel, UIBaseParams, UIBaseStruct, useAlertDrawer, useButton, useDialog, useUIBase } from "@components";
import { Palette, resolvePaletteColor } from "@core";
import "./alertDialog.css";

// Alert Dialog component
type AlertDialogStruct = UIBaseStruct<{
    props: {
        contentView: React.ReactNode;
        customActionView: React.ReactNode;
        detailsOpen: boolean,
        detailsView: React.ReactNode,
        open: boolean;
        severity?: "success" | "info" | "warning" | "error";
        titleView: React.ReactNode;
        detailsTitleView: React.ReactNode;
        buttons: {
            ok?: boolean,
            cancel?: boolean,
            okCancel?: boolean,
            // A No/Yes pair instead of Cancel/OK, for a question rather than an action. "No"
            // resolves false and "Yes" true, exactly as cancel/ok do.
            yesNo?: boolean,
            details?: boolean
        };
        closeResult: boolean | string;
    };

    children: {
        dialog: DialogModel
        okButton: ButtonModel;
        cancelButton: ButtonModel;
        noButton: ButtonModel;
        yesButton: ButtonModel;
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
            severity: undefined,
            titleView: undefined,
            // Left unset, the details panel names itself after the severity (_detailsTitle).
            detailsTitleView: undefined,
            closeResult: undefined,
        },

        children: {
            dialog: useDialog({
                titleView: () => {
                    // The icon always carries the severity; the title text follows it only where a
                    // theme wants that (MLAdmin's heading stays body ink). The colour is published
                    // as a custom property rather than set as `color`, so --alert-title-ink can win
                    // over it in CSS — an inline colour could not be overridden at all.
                    const sevColor = _severityColor();
                    return (
                        <Row spacing="small" verticalAlign="center">
                            {model.severity &&
                                <span className="alert-dialog-icon">
                                    <SeverityIcon severity={model.severity} size={24} color={sevColor} />
                                </span>
                            }
                            <span
                                className="alert-dialog-title"
                                style={sevColor ? { "--alert-severity": sevColor } as React.CSSProperties : undefined}
                            >
                                {model.titleView}
                            </span>
                        </Row>
                    );
                },
                contentView: () => model.contentView,
                // "Show details" sits left, the answers right. The left slot keeps its wrapper even
                // when the details button is hidden: a View that renders nothing leaves
                // spaceBetween with a single child, which then lands on the LEFT — which is how
                // every Yes/No pair ended up in the wrong corner.
                actionView: () => (
                    <Row horizontalAlign={"spaceBetween"} spacing="default">
                        <div>
                            <model.detailsButton.View render={!!model.buttons?.details && !!model.detailsView} />
                        </div>
                        <Row spacing="default">
                            {model.customActionView}
                            <model.cancelButton.View render={!!(model.buttons?.cancel || model.buttons?.okCancel)} />
                            <model.okButton.View render={!!(model.buttons?.ok || model.buttons?.okCancel)} />
                            <model.noButton.View render={!!model.buttons?.yesNo} />
                            <model.yesButton.View render={!!model.buttons?.yesNo} />
                        </Row>
                    </Row>
                ),
                fullWidth: true,
                // Stand aside while the details panel is up, as the legacy box does — it is the
                // same message, continued. Hidden rather than closed: closing would settle the
                // caller's promise and the panel's Cancel would have nothing to come back to.
                hidden: () => model.detailsDrawer.open,
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
            // Every answer wears the same chip — outlined, and on the 24px rung, which is a step
            // below the screen toolbar's buttons exactly as the legacy message box's are. Legacy
            // renders them all outlined too: its four buttons ask for four different variants and
            // every one comes out the same, so the box never sorts its answers by weight. Ours
            // says so directly instead of arriving there by accident.
            okButton: useButton({
                contentView: "OK",
                variant: "outlined",
                size: "xsmall",
                onClick: () => _close(true)
            }),
            cancelButton: useButton({
                contentView: "Cancel",
                variant: "outlined",
                size: "xsmall",
                onClick: () => _close(false)
            }),
            noButton: useButton({
                contentView: "No",
                variant: "outlined",
                size: "xsmall",
                onClick: () => _close(false)
            }),
            yesButton: useButton({
                contentView: "Yes",
                variant: "outlined",
                size: "xsmall",
                onClick: () => _close(true)
            }),
            detailsButton: useButton({
                contentView: "Show details",
                variant: "outlined",
                size: "xsmall",
                onClick: () => { model.detailsDrawer.open = true; }
            }),
            // The details panel carries no glyph of its own — the dialog behind it already showed
            // one — so the severity reaches it as the heading's colour instead.
            detailsDrawer: useAlertDrawer({
                titleView: () => (
                    <span
                        className="alert-details-title"
                        style={_severityColor() ? { "--alert-severity": _severityColor() } as React.CSSProperties : undefined}
                    >
                        {model.detailsTitleView ?? _detailsTitle()}
                    </span>
                ),
                contentView: () => _detailsContentView(),
                // Two thirds of the viewport — the legacy "medium" slider, and the width a stack
                // trace needs when it is rendered without wrapping.
                width: "65%",
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

    function _severityColor(): string | undefined {
        if (!model.severity) {
            return undefined;
        }
        return resolvePaletteColor(`${model.severity}.main` as Palette);
    }

    // The details panel names what it is showing, as the legacy slider does. (Legacy's own version
    // of this reads `intent === DANGER ? "Error Details" : Intent.WARNING ? …`, whose second test is
    // a constant and therefore always true — so everything that is not an error is titled "Warning
    // Details" there. This is the mapping it meant.)
    function _detailsTitle(): string {
        switch (model.severity) {
            case "error":
                return "Error Details";
            case "warning":
                return "Warning Details";
            default:
                return "Message Details";
        }
    }

    // Details arrive as a string when they are a message + stack trace, and that has to survive
    // verbatim — a <pre> keeps the line breaks and the indentation. Anything else is already a node
    // and is rendered as it is.
    function _detailsContentView(): React.ReactNode {
        if (typeof model.detailsView !== "string") {
            return model.detailsView;
        }
        return <pre className="alert-dialog-details">{model.detailsView}</pre>;
    }
}

const AlertDialog = UECA.getFC(useAlertDialog);

export { AlertDialogModel, AlertDialogParams, useAlertDialog, AlertDialog };
