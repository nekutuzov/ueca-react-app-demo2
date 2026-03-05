import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase, Col, Block, Button, TextFieldModel, useTextField } from "@components";
import { Palette } from "@core";

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
    };

    methods: {
        _PreviewBlockView: () => React.JSX.Element;
        _CodeDisplayView: () => React.JSX.Element;
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
                </Block>
            ),

            _ValueDisplayView: () => (
                <Block render={!!model.value} padding={{ top: "medium" }}>
                    Value: <strong>{model.value}</strong>
                </Block>
            ),

            _CodeDisplayView: () => {
                return (
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
                                {`<TextField
    labelView="${model.labelText}"
    placeholder="${model.placeholder}"
    variant="${model.variant}"
    type="${model.type}"
    color="${model.color}"
    disabled={${model.disabled}}
    required={${model.required}}
    error={${model.error}}
    fullWidth={${model.fullWidth}}
    multiline={${model.multiline}}${model.multiline && model.rows > 1 ? `\n    rows={${model.rows}}` : ''}${model.helperText ? `\n    helperTextView="${model.helperText}"` : ''}
    value="${model.value}"
/>`}
                            </pre>
                        </Block>
                    </Col>
                );
            }
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

const TextFieldPreview = UECA.getFC(useTextFieldPreview);

export { TextFieldPreviewParams, TextFieldPreviewModel, useTextFieldPreview, TextFieldPreview };
