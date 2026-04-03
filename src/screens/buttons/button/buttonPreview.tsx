import * as UECA from "ueca-react";
import {
    UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase,
    Col, Block, Card,
    ButtonModel, useButton,
    ButtonSize,
    ButtonVariant,
    ButtonAlign
} from "@components";
import { Palette, CodeSampleModel, useCodeSample } from "@core";

type ButtonPreviewStruct = UIBaseStruct<{
    props: {
        buttonText: string;
        variant: ButtonVariant;
        size: ButtonSize;
        color: Palette;
        disabled: boolean;
        fullWidth: boolean;
        align: ButtonAlign;
        clickCount: number;
    };

    children: {
        testButton: ButtonModel;
        codeSample: CodeSampleModel;
    };

    methods: {
        _PreviewBlockView: () => React.ReactElement;
        _ClickCountView: () => React.ReactElement;
    };

    events: {
        onButtonClick: () => UECA.MaybePromise;
    };
}>;

type ButtonPreviewParams = UIBaseParams<ButtonPreviewStruct>;
type ButtonPreviewModel = UIBaseModel<ButtonPreviewStruct>;

function useButtonPreview(params?: ButtonPreviewParams): ButtonPreviewModel {
    const struct: ButtonPreviewStruct = {
        props: {
            id: useButtonPreview.name,
            buttonText: "Test Button",
            variant: "contained",
            size: "medium",
            color: "primary.main",
            disabled: false,
            fullWidth: false,
            align: "center",
            clickCount: 0
        },

        children: {
            testButton: useButton({
                contentView: () => model.buttonText,
                variant: () => model.variant,
                size: () => model.size,
                color: () => model.color,
                disabled: () => model.disabled,
                fullWidth: () => model.fullWidth,
                align: () => model.align,
                onClick: () => model.onButtonClick?.()
            }),

            codeSample: useCodeSample({
                componentName: "Button",
                sourceObject: () => model,
                properties: () => [
                    "buttonText",
                    "variant",
                    "size",
                    "color",
                    "disabled",
                    "fullWidth",
                    "align"
                ]
            })
        },

        methods: {
            _PreviewBlockView: () => (
                <Col horizontalAlign="center" verticalAlign="center" minHeight={"200px"}>
                    <model.testButton.View />
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

const ButtonPreview = UECA.getFC(useButtonPreview);

export { ButtonPreviewParams, ButtonPreviewModel, useButtonPreview, ButtonPreview };
