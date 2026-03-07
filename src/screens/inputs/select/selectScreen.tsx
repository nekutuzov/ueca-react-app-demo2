import * as UECA from "ueca-react";
import {
    ScreenBaseModel, ScreenBaseParams, ScreenBaseStruct, useScreenBase,
    Row, Col
} from "@components";
import { CRUDScreenModel, useCRUDScreen } from "@core";
import { SelectPropertiesEditorModel, useSelectPropertiesEditor } from "./selectPropertiesEditor";
import { SelectPreviewModel, useSelectPreview } from "./selectPreview";

type SelectScreenStruct = ScreenBaseStruct<{
    children: {
        crudScreen: CRUDScreenModel;
        propertiesEditor: SelectPropertiesEditorModel;
        preview: SelectPreviewModel;
    };

    methods: {
        resetProperties: () => void;
        handleSelectionChange: (value: string) => void;
    };
}>;

type SelectScreenParams = ScreenBaseParams<SelectScreenStruct>;
type SelectScreenModel = ScreenBaseModel<SelectScreenStruct>;

function useSelectScreen(params?: SelectScreenParams): SelectScreenModel {
    const struct: SelectScreenStruct = {
        props: {
            id: useSelectScreen.name
        },

        children: {
            crudScreen: useCRUDScreen({
                intent: "none",
                breadcrumbs: [
                    { route: { path: "/" }, label: "Home" },
                    { route: { path: "/select" }, label: "Select Component" }
                ],
                contentView: () => (
                    <Col fill overflow="auto" padding="medium" spacing="large">
                        <Col spacing="medium">
                            <h1>Select Component</h1>                            
                        </Col>
                        <Row spacing="large" fill flexWrap="wrap">
                            <model.propertiesEditor.View />
                            <model.preview.View />
                        </Row>
                    </Col>
                )
            }),

            propertiesEditor: useSelectPropertiesEditor({
                onReset: () => model.resetProperties()
            }),

            preview: useSelectPreview({
                labelText: UECA.bind(() => model.propertiesEditor, "labelText"),
                placeholder: UECA.bind(() => model.propertiesEditor, "placeholder"),
                variant: UECA.bind(() => model.propertiesEditor, "variant"),
                size: UECA.bind(() => model.propertiesEditor, "size"),
                color: UECA.bind(() => model.propertiesEditor, "color"),
                disabled: UECA.bind(() => model.propertiesEditor, "disabled"),
                required: UECA.bind(() => model.propertiesEditor, "required"),
                fullWidth: UECA.bind(() => model.propertiesEditor, "fullWidth"),
                helperText: UECA.bind(() => model.propertiesEditor, "helperText"),
                optionsText: UECA.bind(() => model.propertiesEditor, "optionsText"),
                onSelectionChange: (value) => model.handleSelectionChange(value)
            })
        },

        methods: {
            resetProperties: () => {
                model.propertiesEditor.labelText = "Select an Option";
                model.propertiesEditor.placeholder = "Choose an option...";
                model.propertiesEditor.variant = "outlined";
                model.propertiesEditor.size = "medium";
                model.propertiesEditor.color = "primary.main";
                model.propertiesEditor.disabled = false;
                model.propertiesEditor.required = false;
                model.propertiesEditor.fullWidth = false;
                model.propertiesEditor.helperText = "";
                model.propertiesEditor.optionsText = "Option 1=1, Option 2=2, Option 3=3";
                model.preview.selectedValue = "";
            },

            handleSelectionChange: (value: string) => {
                model.preview.selectedValue = value;
                model.alertSuccess(`Selected: ${value}`);
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

const SelectScreen = UECA.getFC(useSelectScreen);

export { SelectScreenParams, SelectScreenModel, useSelectScreen, SelectScreen };
