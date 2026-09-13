import * as UECA from "ueca-react";
import {
    Block, BlockProps, IconButtonModel, useCloseIconButton,
    UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase
} from "@components";
import "./panel.css";

// A reusable card: panel chrome (border/bg/blur) + an optional close (×) button
// and an optional title label, with the body supplied by the caller via contentView.
// The panel OWNS its visibility: when `open` is false it renders nothing. The close × sets
// `open = false` and fires `onClose` so the parent can sync any external state. Positioning/
// spacing are the caller's via className + padding + sx (passed through to the root).
type PanelStruct = UIBaseStruct<{
    props: {
        open: boolean;                  // the panel's own visibility — false renders nothing
        titleView: React.ReactNode;     // optional header label (rendered in the shared label style)
        contentView: React.ReactNode;   // the body — any JSX from outside
        closable: boolean;              // show the close × (sets open=false + fires onClose)
        className: string;              // extra classes for positioning / appearance
        padding: BlockProps["padding"]; // inner padding (use pxN tokens)
        sx: React.CSSProperties;        // extra inline style
    };

    children: {
        closeButton: IconButtonModel;
    };

    events: {
        onClose: (source: PanelModel) => UECA.MaybePromise;
    };
}>;

type PanelParams = UIBaseParams<PanelStruct>;
type PanelModel = UIBaseModel<PanelStruct>;

function usePanel(params?: PanelParams): PanelModel {
    const struct: PanelStruct = {
        props: {
            id: usePanel.name,
            open: true,
            titleView: undefined,
            contentView: undefined,
            closable: true,
            className: undefined,
            padding: undefined,
            sx: undefined
        },

        children: {
            closeButton: useCloseIconButton({
                size: "xsmall",
                title: "Close",
                onClick: () => {
                    model.open = false;               // panel hides itself
                    if (model.onClose) {
                        model.onClose(model);  // let the parent sync external state
                    }
                }
            })
        },

        View: () => {
            if (!model.open) {
                return null;   // panel controls its own rendering
            }
            return (
                <Block
                    id={model.htmlId()}
                    className={"ueca-panel" + (model.className ? " " + model.className : "")}
                    padding={model.padding}
                    sx={model.sx}
                >
                    <Block className="ueca-panel-close" render={model.closable}>
                        <model.closeButton.View />
                    </Block>
                    <Block className="ueca-panel-title ueca-label" render={!!model.titleView}>
                        {model.titleView}
                    </Block>
                    {model.contentView}
                </Block>
            );
        }
    };

    const model = useUIBase(struct, params);
    return model;
}

const Panel = UECA.getFC(usePanel);

export { PanelModel, PanelParams, usePanel, Panel };
