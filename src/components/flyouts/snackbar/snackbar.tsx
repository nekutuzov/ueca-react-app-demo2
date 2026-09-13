import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";
import { asyncSafe } from "@core";
import "./snackbar.css";

// How long a snackbar with the `timeout` close reason stays up.
const AUTO_HIDE_MS = 4000;

// Where a snackbar sits unless it is given an anchorOrigin.
const DEFAULT_ANCHOR_ORIGIN = { vertical: "top", horizontal: "right" } as const;

type SnackbarStruct = UIBaseStruct<{
    props: {
        open: boolean;
        contentView: React.ReactNode;
        messageView: React.ReactNode;
        actionView: React.ReactNode;
        anchorOrigin: { vertical: "top" | "bottom"; horizontal: "left" | "center" | "right"; };
        transition: boolean;
        simple: boolean;
        closeReasons: { timeout?: boolean; clickaway?: boolean; escapeKeyDown?: boolean; };
        disablePortal: boolean;
        // The pending auto-hide of the current opening, so closing can cancel it.
        __hideTimer: number;
        // Whether onOpen has been raised for the current opening. A snackbar created open hears of
        // that opening twice — from its bound `open` arriving and again from `init`.
        __openRaised: boolean;
    };

    events: {
        onOpen: (source: SnackbarModel) => UECA.MaybePromise;
        onClose: (source: SnackbarModel) => UECA.MaybePromise;
    };
}>;

type SnackbarParams = UIBaseParams<SnackbarStruct>;
type SnackbarModel = UIBaseModel<SnackbarStruct>;

function useSnackbar(params?: SnackbarParams): SnackbarModel {
    const struct: SnackbarStruct = {
        props: {
            id: useSnackbar.name,
            open: false,
            contentView: undefined,
            messageView: undefined,
            actionView: undefined,
            anchorOrigin: DEFAULT_ANCHOR_ORIGIN,
            transition: true,
            simple: false,
            closeReasons: undefined,
            disablePortal: false,
            __hideTimer: undefined,
            __openRaised: false
        },

        events: {
            onChangeOpen: () => {
                if (model.open) {
                    _opened();
                } else {
                    _closed();
                }
            }
        },

        // A snackbar created open never hears onChangeOpen for that first value, and one brought
        // back open from the model cache had its auto-hide cancelled when it unmounted.
        init: () => {
            if (model.open) {
                _opened();
            }
        },

        // Paired with unmount. The listeners used to be added here and never removed, so every
        // mount leaked a pair, and a snackbar removed while open still answered Escape and clicks.
        mount: () => {
            document.addEventListener("keydown", _handleKeyDown);
            document.addEventListener("mousedown", _handleClickAway);
        },

        unmount: () => {
            document.removeEventListener("keydown", _handleKeyDown);
            document.removeEventListener("mousedown", _handleClickAway);
            _cancelHide();
        },

        View: () => {
            if (!model.open) {
                return null;
            }

            // Unset means the default corner. An undefined param or binding replaces the default rather
            // than falling back to it, and AlertToast hands on its own anchorOrigin, unset unless given —
            // reading it unguarded threw, so a local toast without a position never showed.
            const { vertical, horizontal } = model.anchorOrigin ?? DEFAULT_ANCHOR_ORIGIN;
            const positionClass = model.disablePortal ? "" : `snackbar-${vertical}-${horizontal}`;
            const transitionClass = model.transition ? "snackbar-transition" : "";
            const portalClass = model.disablePortal ? "snackbar-relative" : "";

            return (
                <div id={model.htmlId()}
                    className={`ueca-snackbar ${positionClass} ${transitionClass} ${portalClass}`}
                >
                    {model.contentView || (
                        <div className="snackbar-content">
                            <div className="snackbar-message">{model.messageView}</div>
                            {model.actionView && <div className="snackbar-action">{model.actionView}</div>}
                        </div>
                    )}
                </div>
            );
        },
    };

    const model = useUIBase(struct, params);
    return model;

    // Private methods
    function _opened() {
        if (!model.__openRaised) {
            model.__openRaised = true;
            asyncSafe(() => model.onOpen?.(model));
        }
        _scheduleHide();
    }

    function _closed() {
        _cancelHide();
        model.__openRaised = false;
        asyncSafe(() => model.onClose?.(model));
    }

    // Always restarts: a timer left over from an earlier opening would otherwise close this one
    // early. AppAlertManager reuses a toast's model for the next alert under the same id, so a toast
    // closed and replaced within four seconds was shut by its predecessor's timer.
    function _scheduleHide() {
        _cancelHide();
        if (model.open && model.closeReasons?.timeout) {
            model.__hideTimer = window.setTimeout(() => {
                model.__hideTimer = undefined;
                model.open = false;
            }, AUTO_HIDE_MS);
        }
    }

    function _cancelHide() {
        window.clearTimeout(model.__hideTimer);
        model.__hideTimer = undefined;
    }

    function _handleKeyDown(e: KeyboardEvent) {
        if (e.key === "Escape" && model.open && model.closeReasons?.escapeKeyDown) {
            model.open = false;
        }
    }

    function _handleClickAway(e: MouseEvent) {
        if (!model.open || !model.closeReasons?.clickaway) {
            return;
        }
        const snackbarElement = document.getElementById(model.htmlId());
        if (snackbarElement && !snackbarElement.contains(e.target as Node)) {
            model.open = false;
        }
    }
}

const Snackbar = UECA.getFC(useSnackbar);

export { SnackbarModel, SnackbarParams, useSnackbar, Snackbar };
