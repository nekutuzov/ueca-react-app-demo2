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
        // Where focus was when the dialog opened — the trigger, as a rule — to give back on close.
        __returnFocus: HTMLElement;
        // Set on opening, cleared by the first draw that can put focus into the panel.
        __focusPending: boolean;
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
            __returnFocus: undefined,
            __focusPending: false
        },

        events: {
            onChangeOpen: () => {
                if (model.open) {
                    _takeStackBand();
                    _focusOnDraw();
                    asyncSafe(() => model.onOpen?.(model));
                } else {
                    _releaseStackBand();
                    _returnFocus();
                    asyncSafe(() => model.onClose?.(model));
                }
            }
        },

        constr: () => {
            if (model.open) {
                _takeStackBand();
                _focusOnDraw();
                asyncSafe(() => model.onOpen?.(model));
            }
        },

        // A dialog torn down while still open would otherwise hold its band for the session, and
        // leave focus on the page it no longer covers.
        unmount: () => {
            _releaseStackBand();
            if (model.open) {
                _returnFocus();
            }
        },

        // Focus moves into the panel once it is on screen. aria-modal tells a screen reader to stay
        // inside the dialog, so focus left on the trigger behind the backdrop would sit somewhere it
        // has just been told to ignore. Not while the dialog is suspended by `hidden`.
        draw: () => {
            if (!model.__focusPending || !model.open || model.hidden) {
                return;
            }
            const panel = document.getElementById(model.htmlId());
            if (panel) {
                model.__focusPending = false;
                panel.focus();
            }
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
                        // Without these, assistive technology could not tell a modal was up at all.
                        // Named by the title text alone, not the title row, which holds the ×.
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={model.titleView ? _titleId() : undefined}
                        // Focusable from code only, for draw to move focus into; never a Tab stop.
                        tabIndex={-1}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="dialog-title">
                            <Row verticalAlign="center" horizontalAlign="spaceBetween" spacing="default">
                                <div id={_titleId()}>{model.titleView}</div>
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

    function _titleId(): string {
        return `${model.htmlId()}-title`;
    }

    function _focusOnDraw() {
        model.__returnFocus = document.activeElement as HTMLElement;
        model.__focusPending = true;
    }

    // Only while focus is still the dialog's to give back: inside the panel, or dropped to the page
    // because the panel went away. Focus the user has moved elsewhere stays where they put it.
    function _returnFocus() {
        const target = model.__returnFocus;
        model.__returnFocus = undefined;
        model.__focusPending = false;
        const active = document.activeElement;
        const panel = document.getElementById(model.htmlId());
        const focusIsOurs = !active || active === document.body || !!panel?.contains(active);
        if (focusIsOurs && target?.isConnected && target !== document.body) {
            target.focus();
        }
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
