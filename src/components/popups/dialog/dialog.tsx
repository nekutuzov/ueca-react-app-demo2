import * as UECA from "ueca-react";
import { Row, CloseIconButton, UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";
import { asyncSafe } from "@core";
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
        },

        events: {
            onChangeOpen: () => {
                if (model.open) {
                    asyncSafe(() => model.onOpen?.(model));
                } else {
                    asyncSafe(() => model.onClose?.(model));
                }
            }
        },

        constr: () => {
            if (model.open) {
                asyncSafe(() => model.onOpen?.(model));
            }
        },

        View: () => {
            if (!model.open) return null;
            
            const maxWidthClass = model.maxWidth ? `dialog-max-${model.maxWidth}` : "";
            const fullScreenClass = model.fullScreen ? "dialog-fullscreen" : "";
            const fullWidthClass = model.fullWidth ? "dialog-fullwidth" : "";

            return (
                <div className="ueca-dialog-backdrop" onClick={_close}>
                    <div
                        id={model.htmlId()}
                        className={`ueca-dialog ${maxWidthClass} ${fullScreenClass} ${fullWidthClass}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="dialog-title">
                            <Row verticalAlign="center" horizontalAlign="spaceBetween">
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
}

const Dialog = UECA.getFC(useDialog);

export { DialogModel, DialogParams, useDialog, Dialog };
