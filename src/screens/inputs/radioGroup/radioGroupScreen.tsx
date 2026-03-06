import * as UECA from "ueca-react";
import { ScreenBaseModel, ScreenBaseParams, ScreenBaseStruct, useScreenBase, Row, Col } from "@components";
import { CRUDScreenModel, useCRUDScreen, Breadcrumb, Palette } from "@core";
import { RadioGroupPropertiesEditorModel, useRadioGroupPropertiesEditor } from "./radioGroupPropertiesEditor";
import { RadioGroupPreviewModel, useRadioGroupPreview } from "./radioGroupPreview";

type RadioOrientation = "row" | "column";
type RadioSize = "small" | "medium" | "large";

type RadioGroupScreenStruct = ScreenBaseStruct<{
    props: {
        labelText: string;
        orientation: RadioOrientation;
        size: RadioSize;
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
            id: useRadioGroupScreen.name,
            labelText: "Select an Option",
            orientation: "column",
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
                    { route: { path: "/radio-group" }, label: "RadioGroup Component" }
                ] as Breadcrumb[],
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
                labelText: UECA.bind(() => model, "labelText"),
                orientation: UECA.bind(() => model, "orientation"),
                size: UECA.bind(() => model, "size"),
                color: UECA.bind(() => model, "color"),
                disabled: UECA.bind(() => model, "disabled"),
                required: UECA.bind(() => model, "required"),
                fullWidth: UECA.bind(() => model, "fullWidth"),
                helperText: UECA.bind(() => model, "helperText"),
                optionsText: UECA.bind(() => model, "optionsText"),
                onReset: () => model.resetProperties()
            }),

            preview: useRadioGroupPreview({
                labelText: UECA.bind(() => model, "labelText"),
                orientation: UECA.bind(() => model, "orientation"),
                size: UECA.bind(() => model, "size"),
                color: UECA.bind(() => model, "color"),
                disabled: UECA.bind(() => model, "disabled"),
                required: UECA.bind(() => model, "required"),
                fullWidth: UECA.bind(() => model, "fullWidth"),
                helperText: UECA.bind(() => model, "helperText"),
                optionsText: UECA.bind(() => model, "optionsText"),
                selectedValue: UECA.bind(() => model, "selectedValue")
            })
        },

        methods: {
            resetProperties: () => {
                model.labelText = "Select an Option";
                model.orientation = "column";
                model.size = "medium";
                model.color = "primary.main";
                model.disabled = false;
                model.required = false;
                model.fullWidth = false;
                model.helperText = "";
                model.optionsText = "Option 1=1, Option 2=2, Option 3=3";
                model.selectedValue = "";
            }
        },

        View: () => <model.crudScreen.View />
    };

    const model = useScreenBase(struct, params);
    return model;
}

const RadioGroupScreen = UECA.getFC(useRadioGroupScreen);

export { RadioGroupScreenParams, RadioGroupScreenModel, useRadioGroupScreen, RadioGroupScreen };
