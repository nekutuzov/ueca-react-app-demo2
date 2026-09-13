import * as UECA from "ueca-react";
import { AlertDialog, AlertDialogModel, UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";
import { DetailedError } from "@core";


type AppDialogManagerStruct = UIBaseStruct<{
    props: {
        _openDialogs: UECA.ReactElement[];
        // Parallel to _openDialogs: the resolver of each open dialog, so Dialog.Close can settle
        // the topmost one from code. Pushed and popped together with the view.
        _dialogClosers: ((result: boolean) => void)[];
    }
}>;

type AppDialogManagerParams = UIBaseParams<AppDialogManagerStruct>;
type AppDialogManagerModel = UIBaseModel<AppDialogManagerStruct>;

type DialogKind = "notification" | "information" | "warning" | "error" | "confirmation" | "action" | "custom";

function useAppDialogManager(params?: AppDialogManagerParams): AppDialogManagerModel {
    const struct: AppDialogManagerStruct = {
        props: {
            id: useAppDialogManager.name,
            _openDialogs: [],
            _dialogClosers: []
        },

        messages: {
            "Dialog.Information": async (p) => { await _openDialog("information", p.title, p.message); },
            "Dialog.Warning": async (p) => { await _openDialog("warning", p.title, p.message, p.details); },
            "Dialog.Error": async (p) => { await _openDialog("error", p.title, p.message, p.details); },
            "Dialog.Exception": async (p) => { await _openExceptionDialog(p.title, p.error); },
            "Dialog.Confirmation": async (p) => { return await _openDialog("confirmation", p.title, p.message); },
            "Dialog.ActionConfirmation": async (p) => { return await _openDialog("action", p.title, p.message, undefined, p.action); },
            // Generic content dialog: arbitrary JSX content + title, OK/Cancel → boolean. Reuses the
            // same AlertDialog path (correct × behavior, modal focus, theming) — no bespoke dialog.
            "Dialog.Custom": async (p) => { return await _openDialog("custom", p.title, p.content, undefined, p.okText); },
            "Dialog.Close": async () => { _closeTopDialog(); },
        },

        View: () => <>{model._openDialogs[model._openDialogs.length - 1]}</>
    }

    const model = useUIBase(struct, params);
    return model;

    // Private methods  
    async function _openDialog(_kind: DialogKind, title: React.ReactNode, message: React.ReactNode, details?: React.ReactNode, action?: string) {
        let onDialogClose: AlertDialogModel["onClose"];
        let closeFromCode: (result: boolean) => void;

        const promise = new Promise<boolean>((resolve) => {
            const settle = (result: boolean) => {
                resolve(result);
                model._openDialogs.pop();
                model._dialogClosers.pop();
                model.bus.unicast("BusyDisplay.SetVisibility", true);
            };
            onDialogClose = (result) => { settle(!!result); };
            closeFromCode = settle;
        });

        const severity = _getSeverity(_kind);

        const newDialog = (
            <AlertDialog
                id={"activeDialog"}
                titleView={title}
                contentView={message}
                detailsView={details}
                severity={severity}
                buttons={_buttons(_kind)}
                open={true}
                init={(m) => {
                    if (action) {
                        m.okButton.contentView = action;
                    }
                    if (_kind === "action") {
                        m.okButton.color = "error.main";
                    } else {
                        m.okButton.color = "primary.main";
                    }
                }}
                onClose={onDialogClose}
            />
        );

        await model.bus.unicast("BusyDisplay.SetVisibility", false);
        model._openDialogs.push(newDialog);
        model._dialogClosers.push(closeFromCode);

        return promise;
    }

    function _closeTopDialog() {
        // Settles as "cancelled", which is what every caller already handles for the × button.
        model._dialogClosers[model._dialogClosers.length - 1]?.(false);
    }

    async function _openExceptionDialog(title: string, error: Error) {
        title = title ? title : "Error";
        const message = error.message ? error.message : "An error has occurred.";
        let details = (error as DetailedError).details;
        details = details ? `${message}\n\n${details}` : message;
        details = error.stack ? `${details}\n\nCall Stack:\n${error.stack}` : details;
        await _openDialog("error", title, message, details);
    }

    // Which buttons a dialog gets, by kind — the legacy `dialogSetups` table, which varies them
    // rather than showing Cancel/OK on everything:
    //
    //   information            nothing but the × — it is an acknowledgement, not a choice
    //   warning / error        "Show details" when there ARE details, and the × otherwise
    //   confirmation           No / Yes — a question, so the answers are yes and no
    //   action                 Cancel + the action's own verb, tinted danger
    //   custom                 the action's verb alone; the × is the way out
    //
    // Every kind still resolves through the ×, which settles false, so no dialog is a dead end.
    function _buttons(kind: DialogKind): AlertDialogModel["buttons"] {
        switch (kind) {
            case "information":
            case "notification":
                return {};
            case "warning":
            case "error":
                return { details: true };
            case "confirmation":
                return { yesNo: true };
            case "action":
                return { okCancel: true };
            case "custom":
                return { ok: true };
        }
    }

    function _getSeverity(kind: DialogKind): "success" | "info" | "warning" | "error" | undefined {
        switch (kind) {
            case "information":
                return "info";
            case "warning":
            case "confirmation":
            case "action":
                return "warning";
            case "error":
                return "error";
            default:
                return undefined;
        }
    }
}

const AppDialogManager = UECA.getFC(useAppDialogManager);

export { AppDialogManagerParams, AppDialogManagerModel, useAppDialogManager, AppDialogManager }
