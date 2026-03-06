import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase, Row, Col } from "@components";
import { CRUDScreenModel, useCRUDScreen, Breadcrumb, Palette } from "@core";
import { TextFieldPropertiesEditorModel, useTextFieldPropertiesEditor } from "./textFieldPropertiesEditor";
import { TextFieldPreviewModel, useTextFieldPreview } from "./textFieldPreview";

type TextFieldVariant = "outlined" | "filled" | "standard";
type TextFieldType = "text" | "email" | "password" | "number" | "tel" | "url" | "search";

type TextFieldScreenStruct = UIBaseStruct<{
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
        crudScreen: CRUDScreenModel;
        properties: TextFieldPropertiesEditorModel;
        preview: TextFieldPreviewModel;
    };

    methods: {
        resetProperties: () => void;
    };
}>;

type TextFieldScreenParams = UIBaseParams<TextFieldScreenStruct>;
type TextFieldScreenModel = UIBaseModel<TextFieldScreenStruct>;

function useTextFieldScreen(params?: TextFieldScreenParams): TextFieldScreenModel {
    const struct: TextFieldScreenStruct = {
        props: {
            id: useTextFieldScreen.name,
            labelText: "Email Address",
            placeholder: "Enter your email",
            value: "Test Value",
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
            crudScreen: useCRUDScreen({
                intent: "none",
                breadcrumbs: [
                    { route: { path: "/" }, label: "Home" },
                    { route: { path: "/text-field" }, label: "TextField Component" }
                ] as Breadcrumb[],
                contentView: () => (
                    <Col fill overflow="auto" padding="medium" spacing="large">
                        <Col spacing="medium">
                            <h1>TextField Component</h1>                            
                        </Col>
                        <Row spacing="large" fill flexWrap="wrap">
                            <model.properties.View />
                            <model.preview.View />
                        </Row>
                    </Col>
                )
            }),

            properties: useTextFieldPropertiesEditor({
                labelText: UECA.bind(() => model, "labelText"),
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
                helperText: UECA.bind(() => model, "helperText"),
                onReset: () => model.resetProperties()
            }),

            preview: useTextFieldPreview({
                labelText: UECA.bind(() => model, "labelText"),
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
                helperText: UECA.bind(() => model, "helperText")
            })
        },

        methods: {
            resetProperties: () => {
                model.labelText = "Email Address";
                model.placeholder = "Enter your email";
                model.value = "Test Value";
                model.variant = "outlined";
                model.type = "text";
                model.color = "primary.main";
                model.disabled = false;
                model.required = false;
                model.error = false;
                model.fullWidth = true;
                model.multiline = false;
                model.rows = 1;
                model.helperText = "";
            }
        },

        View: () => <model.crudScreen.View />
    };

    const model = useUIBase(struct, params);
    return model;
}

const TextFieldScreen = UECA.getFC(useTextFieldScreen);

export { TextFieldScreenParams, TextFieldScreenModel, useTextFieldScreen, TextFieldScreen };
