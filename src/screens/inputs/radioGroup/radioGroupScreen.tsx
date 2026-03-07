import * as UECA from "ueca-react";
import { ScreenBaseModel, ScreenBaseParams, ScreenBaseStruct, useScreenBase, Row, Col } from "@components";
import { CRUDScreenModel, useCRUDScreen } from "@core";
import { RadioGroupPropertiesEditorModel, useRadioGroupPropertiesEditor } from "./radioGroupPropertiesEditor";
import { RadioGroupPreviewModel, useRadioGroupPreview } from "./radioGroupPreview";

type RadioGroupScreenStruct = ScreenBaseStruct<{
    children: {
        crudScreen: CRUDScreenModel;
        properties: RadioGroupPropertiesEditorModel;
        preview: RadioGroupPreviewModel;
    };

    methods: {
        resetProperties: () => void;
    };
}>;

type RadioGroupScreenParams = ScreenBaseParams<RadioGroupScreenStruct>;
type RadioGroupScreenModel = ScreenBaseModel<RadioGroupScreenStruct>;

function useRadioGroupScreen(params?: RadioGroupScreenParams): RadioGroupScreenModel {
    const struct: RadioGroupScreenStruct = {
        props: {
            id: useRadioGroupScreen.name
        },

        children: {
            crudScreen: useCRUDScreen({
                intent: "none",
                breadcrumbs: [
                    { route: { path: "/" }, label: "Home" },
                    { route: { path: "/radio-group" }, label: "RadioGroup Component" }
                ],
                contentView: () => (
                    <Col fill overflow="auto" padding="medium" spacing="large">
                        <Col spacing="medium">
                            <h1>RadioGroup Component</h1>                            
                        </Col>
                        <Row spacing="large" fill flexWrap="wrap">
                            <model.properties.View />
                            <model.preview.View />
                        </Row>
                    </Col>
                )
            }),

            properties: useRadioGroupPropertiesEditor({
                onReset: () => model.resetProperties()
            }),

            preview: useRadioGroupPreview({
                labelText: UECA.bind(() => model.properties, "labelText"),
                orientation: UECA.bind(() => model.properties, "orientation"),
                size: UECA.bind(() => model.properties, "size"),
                color: UECA.bind(() => model.properties, "color"),
                disabled: UECA.bind(() => model.properties, "disabled"),
                required: UECA.bind(() => model.properties, "required"),
                fullWidth: UECA.bind(() => model.properties, "fullWidth"),
                helperText: UECA.bind(() => model.properties, "helperText"),
                optionsText: UECA.bind(() => model.properties, "optionsText")
            })
        },

        methods: {
            resetProperties: () => {
                model.properties.labelText = "Select an Option";
                model.properties.orientation = "column";
                model.properties.size = "medium";
                model.properties.color = "primary.main";
                model.properties.disabled = false;
                model.properties.required = false;
                model.properties.fullWidth = false;
                model.properties.helperText = "";
                model.properties.optionsText = "Option 1=1, Option 2=2, Option 3=3";
                model.preview.selectedValue = "";
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

const RadioGroupScreen = UECA.getFC(useRadioGroupScreen);

export { RadioGroupScreenParams, RadioGroupScreenModel, useRadioGroupScreen, RadioGroupScreen };
