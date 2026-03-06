import * as UECA from "ueca-react";
import {
    UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase,
    Col, Block, Card,
    IconButtonModel, useIconButton
} from "@components";
import { Palette, HeartIcon, CodeSampleModel, useCodeSample } from "@core";

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
        codeSample: CodeSampleModel;
    };

    methods: {
        _PreviewBlockView: () => React.ReactElement;
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
            }),

            codeSample: useCodeSample({
                componentName: "IconButton",
                sourceObject: () => model,
                properties: () => model.useCustomIcon 
                    ? ["size", "color", "disabled"]
                    : ["kind", "size", "color", "disabled"],                
            })
        },

        methods: {
            _getCustomIcon: () => <HeartIcon />,

            _PreviewBlockView: () => (
                <Col horizontalAlign="center" verticalAlign="center" minHeight={"200px"}>
                    <model.testIconButton.View />
                    <model._ClickCountView />
                </Col>
            ),

            _ClickCountView: () => (
                <Block padding={{ top: "large" }}>
                    Click count: <strong>{model.clickCount}</strong>
                </Block>
            )
        },

        View: () => (
            <Card id={model.htmlId()}
                title="👁️ Preview"
                fill
                minWidth={400}
                overflow="auto"
            >
                <Col spacing="medium" fill>
                    <model._PreviewBlockView />
                    <model.codeSample.View />
                </Col>
            </Card>
        )
    };

    const model = useUIBase(struct, params);
    return model;
}

const IconButtonPreview = UECA.getFC(useIconButtonPreview);

export { IconButtonPreviewParams, IconButtonPreviewModel, useIconButtonPreview, IconButtonPreview };
