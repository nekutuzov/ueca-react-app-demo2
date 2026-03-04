import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase, Row, Col } from "@components";
import { CRUDScreenModel, useCRUDScreen, Breadcrumb, Palette } from "@core";
import { CheckboxPropertiesEditorModel, useCheckboxPropertiesEditor } from "./checkboxPropertiesEditor";
import { CheckboxPreviewModel, useCheckboxPreview } from "./checkboxPreview";

type CheckboxSize = "small" | "medium" | "large";

type CheckboxScreenStruct = UIBaseStruct<{
    props: {
        labelText: string;
        size: CheckboxSize;
        color: Palette;
        disabled: boolean;
        required: boolean;
        indeterminate: boolean;
        helperText: string;
        checked: boolean;
    };

    children: {
        crudScreen: CRUDScreenModel;
        properties: CheckboxPropertiesEditorModel;
        preview: CheckboxPreviewModel;
    };

    methods: {
        resetProperties: () => void;
    };
}>;

type CheckboxScreenParams = UIBaseParams<CheckboxScreenStruct>;
type CheckboxScreenModel = UIBaseModel<CheckboxScreenStruct>;

function useCheckboxScreen(params?: CheckboxScreenParams): CheckboxScreenModel {
    const struct: CheckboxScreenStruct = {
        props: {
            id: useCheckboxScreen.name,
            labelText: "I agree to terms and conditions",
            size: "medium",
            color: "primary.main",
            disabled: false,
            required: false,
            indeterminate: false,
            helperText: "",
            checked: false
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
                            <p>Modify properties and see the changes in real-time.</p>
                        </Col>
                        <Row spacing="large" fill flexWrap="wrap">
                            <model.properties.View />
                            <model.preview.View />
                        </Row>
                    </Col>
                )
            }),

            properties: useCheckboxPropertiesEditor({
                labelText: UECA.bind(() => model, "labelText"),
                size: UECA.bind(() => model, "size"),
                color: UECA.bind(() => model, "color"),
                disabled: UECA.bind(() => model, "disabled"),
                required: UECA.bind(() => model, "required"),
                indeterminate: UECA.bind(() => model, "indeterminate"),
                helperText: UECA.bind(() => model, "helperText"),
                onReset: () => model.resetProperties()
            }),

            preview: useCheckboxPreview({
                labelText: UECA.bind(() => model, "labelText"),
                size: UECA.bind(() => model, "size"),
                color: UECA.bind(() => model, "color"),
                disabled: UECA.bind(() => model, "disabled"),
                required: UECA.bind(() => model, "required"),
                indeterminate: UECA.bind(() => model, "indeterminate"),
                helperText: UECA.bind(() => model, "helperText"),
                checked: UECA.bind(() => model, "checked")
            })
        },

        methods: {
            resetProperties: () => {
                model.labelText = "I agree to terms and conditions";
                model.size = "medium";
                model.color = "primary.main";
                model.disabled = false;
                model.required = false;
                model.indeterminate = false;
                model.helperText = "";
                model.checked = false;
            }
        },

        View: () => <model.crudScreen.View />
    };

    const model = useUIBase(struct, params);
    return model;
}

const CheckboxScreen = UECA.getFC(useCheckboxScreen);

export { CheckboxScreenParams, CheckboxScreenModel, useCheckboxScreen, CheckboxScreen };
