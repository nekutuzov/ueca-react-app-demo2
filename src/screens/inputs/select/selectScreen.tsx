import * as UECA from "ueca-react";
import {
    ScreenBaseModel, ScreenBaseParams, ScreenBaseStruct, useScreenBase,
    Row, Col
} from "@components";
import { CRUDScreenModel, useCRUDScreen, Palette } from "@core";
import { SelectPropertiesEditorModel, useSelectPropertiesEditor } from "./selectPropertiesEditor";
import { SelectPreviewModel, useSelectPreview } from "./selectPreview";

type SelectScreenStruct = ScreenBaseStruct<{
    props: {
        // Select properties
        labelText: string;
        placeholder: string;
        variant: "filled" | "outlined" | "standard";
        size: "small" | "medium";
        color: Palette;
        disabled: boolean;
        required: boolean;
        fullWidth: boolean;
        helperText: string;
        optionsText: string;
        selectedValue: string;
    };

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
            id: useSelectScreen.name,
            labelText: "Select an Option",
            placeholder: "Choose an option...",
            variant: "outlined",
            size: "medium",
            color: "primary.main",
            disabled: false,
            required: false,
            fullWidth: false,
            helperText: "",
            optionsText: "Option 1=1, Option 2=2, Option 3=3",
            selectedValue: ""
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
                labelText: UECA.bind(() => model, "labelText"),
                placeholder: UECA.bind(() => model, "placeholder"),
                variant: UECA.bind(() => model, "variant"),
                size: UECA.bind(() => model, "size"),
                color: UECA.bind(() => model, "color"),
                disabled: UECA.bind(() => model, "disabled"),
                required: UECA.bind(() => model, "required"),
                fullWidth: UECA.bind(() => model, "fullWidth"),
                helperText: UECA.bind(() => model, "helperText"),
                optionsText: UECA.bind(() => model, "optionsText"),
                onReset: () => model.resetProperties()
            }),

            preview: useSelectPreview({
                labelText: UECA.bind(() => model, "labelText"),
                placeholder: UECA.bind(() => model, "placeholder"),
                variant: UECA.bind(() => model, "variant"),
                size: UECA.bind(() => model, "size"),
                color: UECA.bind(() => model, "color"),
                disabled: UECA.bind(() => model, "disabled"),
                required: UECA.bind(() => model, "required"),
                fullWidth: UECA.bind(() => model, "fullWidth"),
                helperText: UECA.bind(() => model, "helperText"),
                optionsText: UECA.bind(() => model, "optionsText"),
                selectedValue: UECA.bind(() => model, "selectedValue"),
                onSelectionChange: (value) => model.handleSelectionChange(value)
            })
        },

        methods: {
            resetProperties: () => {
                model.labelText = "Select an Option";
                model.placeholder = "Choose an option...";
                model.variant = "outlined";
                model.size = "medium";
                model.color = "primary.main";
                model.disabled = false;
                model.required = false;
                model.fullWidth = false;
                model.helperText = "";
                model.optionsText = "Option 1=1, Option 2=2, Option 3=3";
                model.selectedValue = "";
                model.alertInformation("Properties reset to defaults");
            },

            handleSelectionChange: (value: string) => {
                model.selectedValue = value;
                model.alertSuccess(`Selected: ${value}`);
            }
        },

        View: () => <model.crudScreen.View />
    }

    const model = useScreenBase(struct, params);
    return model;
}

const SelectScreen = UECA.getFC(useSelectScreen);

export { SelectScreenParams, SelectScreenModel, useSelectScreen, SelectScreen };
