import * as UECA from "ueca-react";
import { Row, Col, ScreenBaseStruct, ScreenBaseParams, ScreenBaseModel, useScreenBase } from "@components";
import { CRUDScreenModel, useCRUDScreen } from "@core";
import { ButtonPropertiesEditorModel, useButtonPropertiesEditor } from "./buttonPropertiesEditor";
import { ButtonPreviewModel, useButtonPreview } from "./buttonPreview";

type ButtonScreenStruct = ScreenBaseStruct<{
    children: {
        crudScreen: CRUDScreenModel;
        propertiesEditor: ButtonPropertiesEditorModel;
        preview: ButtonPreviewModel;
    };

    methods: {
        resetProperties: () => void;
        handleTestButtonClick: () => void;
    };
}>;

type ButtonScreenParams = ScreenBaseParams<ButtonScreenStruct>;
type ButtonScreenModel = ScreenBaseModel<ButtonScreenStruct>;

function useButtonScreen(params?: ButtonScreenParams): ButtonScreenModel {
    const struct: ButtonScreenStruct = {
        props: {
            id: useButtonScreen.name
        },

        children: {
            crudScreen: useCRUDScreen({
                intent: "none",
                breadcrumbs: [
                    { route: { path: "/" }, label: "Home" },
                    { route: { path: "/button" }, label: "Button Component" }
                ],
                contentView: () => (
                    <Col fill overflow="auto" padding="medium" spacing="large">
                        <Col spacing="medium">
                            <h1>Button Component</h1>
                        </Col>
                        <Row spacing="large" fill flexWrap="wrap">
                            <model.propertiesEditor.View />
                            <model.preview.View />
                        </Row>
                    </Col>
                )
            }),

            propertiesEditor: useButtonPropertiesEditor({
                onReset: () => model.resetProperties()
            }),

            preview: useButtonPreview({
                buttonText: UECA.bind(() => model.propertiesEditor, "buttonText"),
                variant: UECA.bind(() => model.propertiesEditor, "variant"),
                size: UECA.bind(() => model.propertiesEditor, "size"),
                color: UECA.bind(() => model.propertiesEditor, "color"),
                disabled: UECA.bind(() => model.propertiesEditor, "disabled"),
                fullWidth: UECA.bind(() => model.propertiesEditor, "fullWidth"),               
                onButtonClick: () => model.handleTestButtonClick()
            })
        },

        methods: {
            resetProperties: () => {
                model.propertiesEditor.buttonText = "Test Button";
                model.propertiesEditor.variant = "contained";
                model.propertiesEditor.size = "medium";
                model.propertiesEditor.color = "primary.main";
                model.propertiesEditor.disabled = false;
                model.propertiesEditor.fullWidth = false;
                model.preview.clickCount = 0;
            },

            handleTestButtonClick: () => {
                model.preview.clickCount++;
                model.alertSuccess(`Button clicked! Count: ${model.preview.clickCount}`);
            }
        },

        constr: () => {
            model.resetProperties();
        },

        View: () => <model.crudScreen.View />
    }

    const model = useScreenBase(struct, params);
    return model;
}

const ButtonScreen = UECA.getFC(useButtonScreen);

export { ButtonScreenParams, ButtonScreenModel, useButtonScreen, ButtonScreen };
