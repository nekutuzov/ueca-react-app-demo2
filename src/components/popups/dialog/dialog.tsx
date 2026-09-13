import * as UECA from "ueca-react";
import { Row, CloseIconButton, UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";
import { acquireOverlayZ, asyncSafe, releaseOverlayZ } from "@core";
import "./dialog.css";

type DialogStruct = UIBaseStruct<{
    props: {
        open: boolean;
        titleView: React.ReactNode;
        contentView: React.ReactNode;
        actionView: React.ReactNode;
        fullScreen: boolean;
        fullWidth: boolean;
        maxWidth: "xs" | "sm" | "md" | "lg" | "xl" | false;
        // Suspends the paint WITHOUT closing: the dialog keeps its state, its stacking band and its
        // modal mode, and simply stops showing while something it opened is covering it. Closing it
        // instead would settle the caller's promise and pop it off the manager's stack.
        hidden: boolean;
        // Stacking band, taken while open so this dialog covers whatever was already up. 0 = none
        // held, in which case the CSS falls back to the static token.
        _z: number;
    };

    events: {
        onOpen: (source: DialogModel) => UECA.MaybePromise;
        onClose: (source: DialogModel) => UECA.MaybePromise;
    };
}>;

type DialogParams = UIBaseParams<DialogStruct>;
type DialogModel = UIBaseModel<DialogStruct>;

function useDialog(params?: DialogParams): DialogModel {
    const struct: DialogStruct = {
        props: {
            id: useDialog.name,
            open: false,
            titleView: undefined,
            contentView: undefined,
            actionView: undefined,
            fullScreen: false,
            fullWidth: false,
            maxWidth: "sm",
            hidden: false,
            _z: 0,
        },

        events: {
            onChangeOpen: () => {
                if (model.open) {
                    _takeStackBand();
                    asyncSafe(() => model.onOpen?.(model));
                } else {
                    _releaseStackBand();
                    asyncSafe(() => model.onClose?.(model));
                }
            }
        },

        constr: () => {
            if (model.open) {
                _takeStackBand();
                asyncSafe(() => model.onOpen?.(model));
            }
        },

        // A dialog torn down while still open would otherwise hold its band for the session.
        unmount: () => {
            _releaseStackBand();
        },

        View: () => {
            if (!model.open) {
                return null;
            }
            
            const maxWidthClass = model.maxWidth ? `dialog-max-${model.maxWidth}` : "";
            const fullScreenClass = model.fullScreen ? "dialog-fullscreen" : "";
            const fullWidthClass = model.fullWidth ? "dialog-fullwidth" : "";

            return (
                <div
                    className={`ueca-dialog-backdrop${model.hidden ? " dialog-hidden" : ""}`}
                    onClick={_close}
                    style={model._z ? { "--overlay-z": model._z } as React.CSSProperties : undefined}
                >
                    <div
                        id={model.htmlId()}
                        className={`ueca-dialog ${maxWidthClass} ${fullScreenClass} ${fullWidthClass}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="dialog-title">
                            <Row verticalAlign="center" horizontalAlign="spaceBetween" spacing="default">
                                <div>{model.titleView}</div>
                                <CloseIconButton onClick={_close} />
                            </Row>
                        </div>
                        <div className="dialog-content">
                            <div className="dialog-content-text">
                                {model.contentView}
                            </div>
                        </div>
                        {model.actionView && (
                            <div className="dialog-actions">
                                {model.actionView}
                            </div>
                        )}
                    </div>
                </div>
            );
        }
    };

    const model = useUIBase<DialogStruct>(struct, params);
    return model;

    // Private methods
    function _close() {
        model.open = false;
    }

    function _takeStackBand() {
        if (!model._z) {
            model._z = acquireOverlayZ();
        }
    }

    function _releaseStackBand() {
        if (model._z) {
            releaseOverlayZ(model._z);
            model._z = 0;
        }
    }
}

const Dialog = UECA.getFC(useDialog);

export { DialogModel, DialogParams, useDialog, Dialog };
