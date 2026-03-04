import * as UECA from "ueca-react";
import {
    UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase,
    Col, Block,
    IconButtonModel, useIconButton
} from "@components";
import { Palette } from "@core";

type IconKind = "ok" | "cancel" | "delete" | "refresh" | "close";

type IconButtonPreviewStruct = UIBaseStruct<{
    props: {
        kind: IconKind;
        size: "small" | "medium" | "large";
        color: Palette | "inherit";
        disabled: boolean;
        useCustomIcon: boolean;
        clickCount: number;
    };

    children: {
        testIconButton: IconButtonModel;
    };

    methods: {
        _PreviewBlockView: () => React.ReactElement;
        _CodeDisplayView: () => React.ReactElement;
        _ClickCountView: () => React.ReactElement;
        _getCustomIcon: () => React.ReactNode;
    };

    events: {
        onIconButtonClick: () => UECA.MaybePromise;
    };
}>;

type IconButtonPreviewParams = UIBaseParams<IconButtonPreviewStruct>;
type IconButtonPreviewModel = UIBaseModel<IconButtonPreviewStruct>;

function useIconButtonPreview(params?: IconButtonPreviewParams): IconButtonPreviewModel {
    const struct: IconButtonPreviewStruct = {
        props: {
            id: useIconButtonPreview.name,
            kind: "ok",
            size: "medium",
            color: "primary.main",
            disabled: false,
            useCustomIcon: false,
            clickCount: 0
        },

        children: {
            testIconButton: useIconButton({
                kind: () => model.kind,
                size: () => model.size,
                color: () => model.color,
                disabled: () => model.disabled,
                iconView: () => model.useCustomIcon ? model._getCustomIcon() : undefined,
                onClick: () => model.onIconButtonClick?.()
            })
        },

        methods: {
            _getCustomIcon: () => (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
            ),

            _PreviewBlockView: () => (
                <Block
                    padding="large"
                    backgroundColor="background.paper"
                    minHeight={"200px"}
                    sx={{
                        border: "1px solid #e0e0e0",
                        borderRadius: "8px",
                    }}
                >
                    <Col spacing="medium" horizontalAlign="center" verticalAlign="center">
                        <model.testIconButton.View />
                        <model._ClickCountView />
                    </Col>
                </Block>
            ),

            _ClickCountView: () => (
                <Block padding={{ top: "large" }}>
                    Click count: <strong>{model.clickCount}</strong>
                </Block>
            ),

            _CodeDisplayView: () => (
                <Col spacing="tiny" padding={{ top: "medium" }}>
                    <h4>JSX Code</h4>
                    <Block
                        backgroundColor="background.default"
                        padding="medium"
                        sx={{
                            border: "1px solid #e0e0e0",
                            borderRadius: "4px",
                            fontFamily: "monospace",
                            fontSize: "12px",
                            overflowX: "auto"
                        }}
                    >
                        <pre>
                            {model.useCustomIcon ? 
`<IconButton
    iconView={customIcon}
    size="${model.size}"
    color="${model.color}"
    disabled={${model.disabled}}
    onClick={handleClick}
/>` :
`<IconButton
    kind="${model.kind}"
    size="${model.size}"
    color="${model.color}"
    disabled={${model.disabled}}
    onClick={handleClick}
/>`}</pre>
                    </Block>
                </Col>
            )
        },

        View: () => (
            <Col spacing="medium" minWidth={"300px"} fill>
                <h2>Preview</h2>
                <model._PreviewBlockView />
                <model._CodeDisplayView />
            </Col>
        )
    };

    const model = useUIBase(struct, params);
    return model;
}

const IconButtonPreview = UECA.getFC(useIconButtonPreview);

export { IconButtonPreviewParams, IconButtonPreviewModel, useIconButtonPreview, IconButtonPreview };
