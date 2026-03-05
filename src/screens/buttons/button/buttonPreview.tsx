import * as UECA from "ueca-react";
import {
    UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase,
    Col, Block,
    ButtonModel, useButton
} from "@components";
import { Palette } from "@core";

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
    };

    methods: {
        _PreviewBlockView: () => React.ReactElement;
        _CodeDisplayView: () => React.ReactElement;
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
            })
        },

        methods: {
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
                        <model.testButton.View />
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
                            {`<Button
    contentView="${model.buttonText}"
    variant="${model.variant}"
    size="${model.size}"
    color="${model.color}"
    disabled={${model.disabled}}
    fullWidth={${model.fullWidth}}
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

const ButtonPreview = UECA.getFC(useButtonPreview);

export { ButtonPreviewParams, ButtonPreviewModel, useButtonPreview, ButtonPreview };
