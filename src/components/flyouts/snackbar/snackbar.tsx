import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";
import { asyncSafe } from "@core";
import "./snackbar.css";

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
            anchorOrigin: { vertical: "top", horizontal: "right" },
            transition: true,
            simple: false,
            closeReasons: undefined,
            disablePortal: false
        },

        events: {
            onChangeOpen: () => {
                if (model.open) {
                    asyncSafe(() => model.onOpen?.(model));
                    // Auto-hide after 4 seconds if timeout is not disabled                    
                    if (model.closeReasons?.timeout) {
                        setTimeout(() => {
                            if (model.open) {
                                model.open = false;
                            }
                        }, 4000);
                    }
                } else {
                    asyncSafe(() => model.onClose?.(model));
                }
            }
        },

        init: () => {
            if (model.open) {
                asyncSafe(() => model.onOpen?.(model));
            }
        },

        mount: () => {
            // Handle escape key
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === "Escape" && model.open) {                    
                    if (model.closeReasons?.escapeKeyDown) {
                        model.open = false;
                    }
                }
            };
            document.addEventListener("keydown", handleKeyDown);

            // Handle click outside
            const handleClickAway = (e: MouseEvent) => {
                if (!model.open || !model.closeReasons?.clickaway) return;
                
                const snackbarElement = document.getElementById(model.htmlId());
                if (snackbarElement && !snackbarElement.contains(e.target as Node)) {
                    model.open = false;
                }
            };
            document.addEventListener("mousedown", handleClickAway);
        },

        View: () => {
            if (!model.open) return null;

            const positionClass = model.disablePortal ? "" : `snackbar-${model.anchorOrigin.vertical}-${model.anchorOrigin.horizontal}`;
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
}

const Snackbar = UECA.getFC(useSnackbar);

export { SnackbarModel, SnackbarParams, useSnackbar, Snackbar };
