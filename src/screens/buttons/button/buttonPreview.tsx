import * as UECA from "ueca-react";
import {
    UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase,
    Col, Block, Card,
    ButtonModel, useButton
} from "@components";
import { Palette, CodeSampleModel, useCodeSample } from "@core";

type ButtonPreviewStruct = UIBaseStruct<{
    props: {
        buttonText: string;
        variant: "text" | "outlined" | "contained";
        size: "small" | "medium" | "large";
        color: Palette;
        disabled: boolean;
        fullWidth: boolean;
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
                    "fullWidth"
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
