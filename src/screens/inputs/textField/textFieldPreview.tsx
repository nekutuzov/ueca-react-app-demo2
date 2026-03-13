import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase, Col, Block, Button, Card, TextFieldModel, useTextField } from "@components";
import { Palette, CodeSampleModel, useCodeSample } from "@core";

type TextFieldVariant = "outlined" | "filled" | "standard";
type TextFieldType = "text" | "email" | "password" | "number" | "tel" | "url" | "search";

type TextFieldPreviewStruct = UIBaseStruct<{
    props: {
        labelText: string;
        placeholder: string;
        value: string;
        variant: TextFieldVariant;
        type: TextFieldType;
        color: Palette;
        disabled: boolean;
        required: boolean;
        error: boolean;
        fullWidth: boolean;
        multiline: boolean;
        rows: number;
        helperText: string;
    };

    children: {
        testTextField: TextFieldModel<string>;
        codeSample: CodeSampleModel;
    };

    methods: {
        _PreviewBlockView: () => React.JSX.Element;
        _ValueDisplayView: () => React.JSX.Element;
    };
}>;

type TextFieldPreviewParams = UIBaseParams<TextFieldPreviewStruct>;
type TextFieldPreviewModel = UIBaseModel<TextFieldPreviewStruct>;

function useTextFieldPreview(params?: TextFieldPreviewParams): TextFieldPreviewModel {
    const struct: TextFieldPreviewStruct = {
        props: {
            id: useTextFieldPreview.name,
            labelText: "Label",
            placeholder: "Enter text...",
            value: "",
            variant: "outlined",
            type: "text",
            color: "primary.main",
            disabled: false,
            required: false,
            error: false,
            fullWidth: true,
            multiline: false,
            rows: 1,
            helperText: ""
        },

        children: {
            testTextField: useTextField({
                labelView: () => model.labelText,
                placeholder: UECA.bind(() => model, "placeholder"),
                value: UECA.bind(() => model, "value"),
                variant: UECA.bind(() => model, "variant"),
                type: UECA.bind(() => model, "type"),
                color: UECA.bind(() => model, "color"),
                disabled: UECA.bind(() => model, "disabled"),
                required: UECA.bind(() => model, "required"),
                error: UECA.bind(() => model, "error"),
                fullWidth: UECA.bind(() => model, "fullWidth"),
                multiline: UECA.bind(() => model, "multiline"),
                rows: UECA.bind(() => model, "rows"),
                helperTextView: () => model.helperText
            }),

            codeSample: useCodeSample({
                componentName: "TextField",
                sourceObject: () => model,
                properties: () => ["labelText", "placeholder", "variant", "type", "color", "disabled", "required", "error", "fullWidth", "multiline", "rows", "helperText", "value"],                
            })
        },

        methods: {
            _PreviewBlockView: () => (
                <Col spacing="medium" horizontalAlign="center" verticalAlign="center" minHeight={"200px"}>
                    <model.testTextField.View />
                    <Button
                        contentView="Validate"
                        variant="outlined"
                        color="primary.main"
                        size="small"
                        onClick={() => model.testTextField.validate()}
                    />
                    <model._ValueDisplayView />
                </Col>
            ),

            _ValueDisplayView: () => (
                <Block render={!!model.value} padding={{ top: "medium" }}>
                    Value: <strong>{model.value}</strong>
                </Block>
            )
        },

        View: () => (
            <Card id={model.htmlId()}
                title="👁️ Preview" fill minWidth={400} overflow="auto">
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

const TextFieldPreview = UECA.getFC(useTextFieldPreview);

export { TextFieldPreviewParams, TextFieldPreviewModel, useTextFieldPreview, TextFieldPreview };
