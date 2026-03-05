import * as UECA from "ueca-react";
import {
    UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase,
    Col, Block,
    IconButtonModel, useIconButton
} from "@components";
import { Palette, HeartIcon } from "@core";

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
            _getCustomIcon: () => <HeartIcon />,

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
