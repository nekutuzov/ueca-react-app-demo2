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

type TextFieldVariant = "outlined" | "filled" | "standard";
type TextFieldType = "text" | "email" | "password" | "number" | "tel" | "url" | "search";

type TextFieldPropertiesEditorStruct = UIBaseStruct<{
    props: {
        labelText: string;
        placeholder: string;
        value: string;
        variant: TextFieldVariant;
        type: TextFieldType;
        color: Palette;
        disabled: boolean;
        required: boolean;
        error: boolean;
        fullWidth: boolean;
        multiline: boolean;
        rows: number;
        helperText: string;
    };

    children: {
        labelField: TextFieldModel<string>;
        placeholderField: TextFieldModel<string>;
        valueField: TextFieldModel<string>;
        variantRadioGroup: RadioGroupModel<TextFieldVariant>;
        typeSelect: SelectModel<TextFieldType>;
        colorSelect: SelectModel<Palette>;
        disabledCheckbox: CheckboxModel;
        requiredCheckbox: CheckboxModel;
        errorCheckbox: CheckboxModel;
        fullWidthCheckbox: CheckboxModel;
        multilineCheckbox: CheckboxModel;
        rowsField: TextFieldModel<number>;
        helperTextField: TextFieldModel<string>;
        resetButton: ButtonModel;
    };

    events: {
        onReset: () => UECA.MaybePromise;
    };
}>;

type TextFieldPropertiesEditorParams = UIBaseParams<TextFieldPropertiesEditorStruct>;
type TextFieldPropertiesEditorModel = UIBaseModel<TextFieldPropertiesEditorStruct>;

function useTextFieldPropertiesEditor(params?: TextFieldPropertiesEditorParams): TextFieldPropertiesEditorModel {
    const struct: TextFieldPropertiesEditorStruct = {
        props: {
            id: useTextFieldPropertiesEditor.name,
            labelText: "Label",
            placeholder: "Enter text...",
            value: "",
            variant: "outlined",
            type: "text",
            color: "primary.main",
            disabled: false,
            required: false,
            error: false,
            fullWidth: true,
            multiline: false,
            rows: 1,
            helperText: ""
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

            valueField: useTextField({
                labelView: "Value",
                value: UECA.bind(() => model, "value"),
                placeholder: "Enter value",
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

            typeSelect: useSelect({
                labelView: "Type",
                value: UECA.bind(() => model, "type"),
                options: [
                    { value: "text", label: "Text" },
                    { value: "email", label: "Email" },
                    { value: "password", label: "Password" },
                    { value: "number", label: "Number" },
                    { value: "tel", label: "Tel" },
                    { value: "url", label: "URL" },
                    { value: "search", label: "Search" }
                ],
                fullWidth: true
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

            errorCheckbox: useCheckbox({
                labelView: "Error",
                checked: UECA.bind(() => model, "error")
            }),

            fullWidthCheckbox: useCheckbox({
                labelView: "Full Width",
                checked: UECA.bind(() => model, "fullWidth")
            }),

            multilineCheckbox: useCheckbox({
                labelView: "Multiline",
                checked: UECA.bind(() => model, "multiline")
            }),

            rowsField: useTextField({
                labelView: "Rows",
                type: "number",
                value: UECA.bind(() => model, "rows"),
                placeholder: "Number of rows",
                fullWidth: true,
                disabled: () => !model.multiline
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
                <model.typeSelect.View />
                <model.labelField.View />
                <model.placeholderField.View />
                <model.valueField.View />
                <model.colorSelect.View />
                <model.variantRadioGroup.View />
                <model.disabledCheckbox.View />
                <model.requiredCheckbox.View />
                <model.errorCheckbox.View />
                <model.fullWidthCheckbox.View />
                <model.multilineCheckbox.View />
                <model.rowsField.View />
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

const TextFieldPropertiesEditor = UECA.getFC(useTextFieldPropertiesEditor);

export { TextFieldPropertiesEditorParams, TextFieldPropertiesEditorModel, useTextFieldPropertiesEditor, TextFieldPropertiesEditor };
