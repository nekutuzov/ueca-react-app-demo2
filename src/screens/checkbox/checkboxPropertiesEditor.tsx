import * as UECA from "ueca-react";
import {
    UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase,
    Col, Block,
    TextFieldModel, useTextField,
    RadioGroupModel, useRadioGroup,
    SelectModel, useSelect,
    CheckboxModel, useCheckbox,
    ButtonModel, useButton
} from "@components";
import { Palette } from "@core";

type CheckboxSize = "small" | "medium" | "large";

type CheckboxPropertiesEditorStruct = UIBaseStruct<{
    props: {
        labelText: string;
        size: CheckboxSize;
        color: Palette;
        disabled: boolean;
        required: boolean;
        indeterminate: boolean;
        helperText: string;
    };

    children: {
        labelField: TextFieldModel<string>;
        sizeRadioGroup: RadioGroupModel<CheckboxSize>;
        colorSelect: SelectModel<Palette>;
        disabledCheckbox: CheckboxModel;
        requiredCheckbox: CheckboxModel;
        indeterminateCheckbox: CheckboxModel;
        helperTextField: TextFieldModel<string>;
        resetButton: ButtonModel;
    };

    events: {
        onReset: () => UECA.MaybePromise;
    };
}>;

type CheckboxPropertiesEditorParams = UIBaseParams<CheckboxPropertiesEditorStruct>;
type CheckboxPropertiesEditorModel = UIBaseModel<CheckboxPropertiesEditorStruct>;

function useCheckboxPropertiesEditor(params?: CheckboxPropertiesEditorParams): CheckboxPropertiesEditorModel {
    const struct: CheckboxPropertiesEditorStruct = {
        props: {
            id: useCheckboxPropertiesEditor.name,
            labelText: "I agree to terms and conditions",
            size: "medium",
            color: "primary.main",
            disabled: false,
            required: false,
            indeterminate: false,
            helperText: ""
        },

        children: {
            labelField: useTextField({
                labelView: "Label",
                value: UECA.bind(() => model, "labelText"),
                placeholder: "Enter label text",
                fullWidth: true
            }),

            sizeRadioGroup: useRadioGroup({
                labelView: "Size",
                value: UECA.bind(() => model, "size"),
                options: [
                    { value: "small", label: "Small" },
                    { value: "medium", label: "Medium" },
                    { value: "large", label: "Large" }
                ],
                orientation: "row"
            }),

            colorSelect: useSelect({
                labelView: "Color",
                value: UECA.bind(() => model, "color"),
                options: [
                    { value: "primary.main", label: "Primary" },
                    { value: "secondary.main", label: "Secondary" },
                    { value: "success.main", label: "Success" },
                    { value: "error.main", label: "Error" },
                    { value: "warning.main", label: "Warning" },
                    { value: "info.main", label: "Info" }
                ],
                fullWidth: true
            }),

            disabledCheckbox: useCheckbox({
                labelView: "Disabled",
                checked: UECA.bind(() => model, "disabled")
            }),

            requiredCheckbox: useCheckbox({
                labelView: "Required",
                checked: UECA.bind(() => model, "required")
            }),

            indeterminateCheckbox: useCheckbox({
                labelView: "Indeterminate",
                checked: UECA.bind(() => model, "indeterminate")
            }),

            helperTextField: useTextField({
                labelView: "Helper Text",
                value: UECA.bind(() => model, "helperText"),
                placeholder: "Optional helper text",
                fullWidth: true
            }),

            resetButton: useButton({
                contentView: "Reset to Defaults",
                variant: "outlined",
                color: "secondary.main",
                size: "small",
                onClick: () => model.onReset?.()
            })
        },

        View: () => (
            <Col spacing="medium" minWidth={"300px"} fill>
                <h2>Properties</h2>
                <model.labelField.View />
                <model.colorSelect.View />
                <model.sizeRadioGroup.View />
                <model.disabledCheckbox.View />
                <model.requiredCheckbox.View />
                <model.indeterminateCheckbox.View />
                <model.helperTextField.View />
                <Block padding={{ top: "medium" }}>
                    <model.resetButton.View />
                </Block>
            </Col>
        )
    };

    const model = useUIBase(struct, params);
    return model;
}

const CheckboxPropertiesEditor = UECA.getFC(useCheckboxPropertiesEditor);

export { CheckboxPropertiesEditorParams, CheckboxPropertiesEditorModel, useCheckboxPropertiesEditor, CheckboxPropertiesEditor };
