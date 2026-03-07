import * as UECA from "ueca-react";
import { ScreenBaseModel, ScreenBaseParams, ScreenBaseStruct, useScreenBase, Row, Col } from "@components";
import { CRUDScreenModel, useCRUDScreen } from "@core";
import { TextFieldPropertiesEditorModel, useTextFieldPropertiesEditor } from "./textFieldPropertiesEditor";
import { TextFieldPreviewModel, useTextFieldPreview } from "./textFieldPreview";

type TextFieldScreenStruct = ScreenBaseStruct<{
    children: {
        crudScreen: CRUDScreenModel;
        properties: TextFieldPropertiesEditorModel;
        preview: TextFieldPreviewModel;
    };

    methods: {
        resetProperties: () => void;
    };
}>;

type TextFieldScreenParams = ScreenBaseParams<TextFieldScreenStruct>;
type TextFieldScreenModel = ScreenBaseModel<TextFieldScreenStruct>;

function useTextFieldScreen(params?: TextFieldScreenParams): TextFieldScreenModel {
    const struct: TextFieldScreenStruct = {
        props: {
            id: useTextFieldScreen.name
        },

        children: {
            crudScreen: useCRUDScreen({
                intent: "none",
                breadcrumbs: [
                    { route: { path: "/" }, label: "Home" },
                    { route: { path: "/text-field" }, label: "TextField Component" }
                ],
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
                onReset: () => model.resetProperties()
            }),

            preview: useTextFieldPreview({
                labelText: UECA.bind(() => model.properties, "labelText"),
                placeholder: UECA.bind(() => model.properties, "placeholder"),
                value: UECA.bind(() => model.properties, "value"),
                variant: UECA.bind(() => model.properties, "variant"),
                type: UECA.bind(() => model.properties, "type"),
                color: UECA.bind(() => model.properties, "color"),
                disabled: UECA.bind(() => model.properties, "disabled"),
                required: UECA.bind(() => model.properties, "required"),
                error: UECA.bind(() => model.properties, "error"),
                fullWidth: UECA.bind(() => model.properties, "fullWidth"),
                multiline: UECA.bind(() => model.properties, "multiline"),
                rows: UECA.bind(() => model.properties, "rows"),
                helperText: UECA.bind(() => model.properties, "helperText")
            })
        },

        methods: {
            resetProperties: () => {
                model.properties.labelText = "Email Address";
                model.properties.placeholder = "Enter your email";
                model.properties.value = "Test Value";
                model.properties.variant = "outlined";
                model.properties.type = "text";
                model.properties.color = "primary.main";
                model.properties.disabled = false;
                model.properties.required = false;
                model.properties.error = false;
                model.properties.fullWidth = true;
                model.properties.multiline = false;
                model.properties.rows = 1;
                model.properties.helperText = "";
            }
        },

        constr: () => {
            model.resetProperties();
        },

        View: () => <model.crudScreen.View />
    };

    const model = useScreenBase(struct, params);
    return model;
}

const TextFieldScreen = UECA.getFC(useTextFieldScreen);

export { TextFieldScreenParams, TextFieldScreenModel, useTextFieldScreen, TextFieldScreen };
