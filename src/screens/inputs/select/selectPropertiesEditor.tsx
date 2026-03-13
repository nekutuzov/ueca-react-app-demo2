import * as UECA from "ueca-react";
import {
    UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase,
    Col, Block, Card,
    TextFieldModel, useTextField,
    RadioGroupModel, useRadioGroup,
    SelectModel, useSelect,
    CheckboxModel, useCheckbox,
    ButtonModel, useButton,
    SelectVariant,
    SelectSize
} from "@components";
import { Palette } from "@core";

type SelectPropertiesEditorStruct = UIBaseStruct<{
    props: {
        labelText: string;
        placeholder: string;
        variant: SelectVariant;
        size: SelectSize;
        color: Palette;
        disabled: boolean;
        required: boolean;
        fullWidth: boolean;
        helperText: string;
        optionsText: string;
    };

    children: {
        labelField: TextFieldModel<string>;
        placeholderField: TextFieldModel<string>;
        variantRadioGroup: RadioGroupModel<SelectVariant>;
        sizeRadioGroup: RadioGroupModel<SelectSize>;
        colorSelect: SelectModel<Palette>;
        disabledCheckbox: CheckboxModel;
        requiredCheckbox: CheckboxModel;
        fullWidthCheckbox: CheckboxModel;
        helperTextField: TextFieldModel<string>;
        optionsField: TextFieldModel<string>;
        resetButton: ButtonModel;
    };

    events: {
        onReset: () => UECA.MaybePromise;
    };
}>;

type SelectPropertiesEditorParams = UIBaseParams<SelectPropertiesEditorStruct>;
type SelectPropertiesEditorModel = UIBaseModel<SelectPropertiesEditorStruct>;

function useSelectPropertiesEditor(params?: SelectPropertiesEditorParams): SelectPropertiesEditorModel {
    const struct: SelectPropertiesEditorStruct = {
        props: {
            id: useSelectPropertiesEditor.name,
            labelText: "Select an Option",
            placeholder: "Choose an option...",
            variant: "outlined",
            size: "medium",
            color: "primary.main",
            disabled: false,
            required: false,
            fullWidth: false,
            helperText: "",
            optionsText: "Option 1=1, Option 2=2, Option 3=3"
        },

        children: {
            labelField: useTextField({
                labelView: "Label",
                value: UECA.bind(() => model, "labelText"),
                placeholder: "Enter label text",
                fullWidth: true
            }),

            placeholderField: useTextField({
                labelView: "Placeholder",
                value: UECA.bind(() => model, "placeholder"),
                placeholder: "Enter placeholder text",
                fullWidth: true
            }),

            variantRadioGroup: useRadioGroup({
                labelView: "Variant",
                value: UECA.bind(() => model, "variant"),
                options: [
                    { value: "outlined", label: "Outlined" },
                    { value: "filled", label: "Filled" },
                    { value: "standard", label: "Standard" }
                ],
                orientation: "row"
            }),

            sizeRadioGroup: useRadioGroup({
                labelView: "Size",
                value: UECA.bind(() => model, "size"),
                options: [
                    { value: "small", label: "Small" },
                    { value: "medium", label: "Medium" }
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

            fullWidthCheckbox: useCheckbox({
                labelView: "Full Width",
                checked: UECA.bind(() => model, "fullWidth")
            }),

            helperTextField: useTextField({
                labelView: "Helper Text",
                value: UECA.bind(() => model, "helperText"),
                placeholder: "Optional helper text",
                fullWidth: true
            }),

            optionsField: useTextField({
                labelView: "Options (Label=Value pairs, comma-separated, Value is optional)",
                value: UECA.bind(() => model, "optionsText"),
                placeholder: "e.g., Red=red, Blue=blue, Green=green",
                fullWidth: true,
                multiline: true,
                rows: 3
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
            <Card id={model.htmlId()}
                title="⚙️ Properties" fill minWidth={400} overflow="auto">
                <Col spacing="medium" fill>
                    <model.labelField.View />
                    <model.placeholderField.View />
                    <model.colorSelect.View />
                    <model.variantRadioGroup.View />
                    <model.sizeRadioGroup.View />
                    <model.disabledCheckbox.View />
                    <model.requiredCheckbox.View />
                    <model.fullWidthCheckbox.View />
                    <model.helperTextField.View />
                    <model.optionsField.View />
                    <Block padding={{ top: "medium" }}>
                        <model.resetButton.View />
                    </Block>
                </Col>
            </Card>
        )
    };

    const model = useUIBase(struct, params);
    return model;
}

const SelectPropertiesEditor = UECA.getFC(useSelectPropertiesEditor);

export { SelectPropertiesEditorParams, SelectPropertiesEditorModel, useSelectPropertiesEditor, SelectPropertiesEditor };
