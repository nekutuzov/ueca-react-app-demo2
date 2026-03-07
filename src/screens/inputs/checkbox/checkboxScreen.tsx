import * as UECA from "ueca-react";
import { ScreenBaseModel, ScreenBaseParams, ScreenBaseStruct, useScreenBase, Row, Col } from "@components";
import { CRUDScreenModel, useCRUDScreen, Breadcrumb } from "@core";
import { CheckboxPropertiesEditorModel, useCheckboxPropertiesEditor } from "./checkboxPropertiesEditor";
import { CheckboxPreviewModel, useCheckboxPreview } from "./checkboxPreview";

type CheckboxScreenStruct = ScreenBaseStruct<{
    children: {
        crudScreen: CRUDScreenModel;
        properties: CheckboxPropertiesEditorModel;
        preview: CheckboxPreviewModel;
    };

    methods: {
        resetProperties: () => void;
    };
}>;

type CheckboxScreenParams = ScreenBaseParams<CheckboxScreenStruct>;
type CheckboxScreenModel = ScreenBaseModel<CheckboxScreenStruct>;

function useCheckboxScreen(params?: CheckboxScreenParams): CheckboxScreenModel {
    const struct: CheckboxScreenStruct = {
        props: {
            id: useCheckboxScreen.name
        },

        children: {
            crudScreen: useCRUDScreen({
                intent: "none",
                breadcrumbs: [
                    { route: { path: "/" }, label: "Home" },
                    { route: { path: "/checkbox" }, label: "Checkbox Component" }
                ] as Breadcrumb[],
                contentView: () => (
                    <Col fill overflow="auto" padding="medium" spacing="large">
                        <Col spacing="medium">
                            <h1>Checkbox Component</h1>                            
                        </Col>
                        <Row spacing="large" fill flexWrap="wrap">
                            <model.properties.View />
                            <model.preview.View />
                        </Row>
                    </Col>
                )
            }),

            properties: useCheckboxPropertiesEditor({
                onReset: () => model.resetProperties()
            }),

            preview: useCheckboxPreview({
                labelText: UECA.bind(() => model.properties, "labelText"),
                size: UECA.bind(() => model.properties, "size"),
                color: UECA.bind(() => model.properties, "color"),
                disabled: UECA.bind(() => model.properties, "disabled"),
                required: UECA.bind(() => model.properties, "required"),
                indeterminate: UECA.bind(() => model.properties, "indeterminate"),
                helperText: UECA.bind(() => model.properties, "helperText")
            })
        },

        methods: {
            resetProperties: () => {
                model.properties.labelText = "I agree to terms and conditions";
                model.properties.size = "medium";
                model.properties.color = "primary.main";
                model.properties.disabled = false;
                model.properties.required = false;
                model.properties.indeterminate = false;
                model.properties.helperText = "";
                model.preview.checked = false;
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

const CheckboxScreen = UECA.getFC(useCheckboxScreen);

export { CheckboxScreenParams, CheckboxScreenModel, useCheckboxScreen, CheckboxScreen };
