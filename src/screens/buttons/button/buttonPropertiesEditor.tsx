import * as UECA from "ueca-react";
import {
    UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase,
    Block, Card,
    TextFieldModel, useTextField,
    RadioGroupModel, useRadioGroup,
    SelectModel, useSelect,
    CheckboxModel, useCheckbox,
    ButtonModel, useButton,
    Col,
    ButtonVariant,
    ButtonSize
} from "@components";
import { Palette } from "@core";

type ButtonPropertiesEditorStruct = UIBaseStruct<{
    props: {
        buttonText: string;
        variant: ButtonVariant;
        size: ButtonSize;
        color: Palette;
        disabled: boolean;
        fullWidth: boolean;
    };

    children: {
        textField: TextFieldModel<string>;
        variantRadioGroup: RadioGroupModel<ButtonVariant>;
        sizeRadioGroup: RadioGroupModel<ButtonSize>;
        colorSelect: SelectModel<Palette>;
        disabledCheckbox: CheckboxModel;
        fullWidthCheckbox: CheckboxModel;
        resetButton: ButtonModel;
    };

    events: {
        onReset: () => UECA.MaybePromise;
    };
}>;

type ButtonPropertiesEditorParams = UIBaseParams<ButtonPropertiesEditorStruct>;
type ButtonPropertiesEditorModel = UIBaseModel<ButtonPropertiesEditorStruct>;

function useButtonPropertiesEditor(params?: ButtonPropertiesEditorParams): ButtonPropertiesEditorModel {
    const struct: ButtonPropertiesEditorStruct = {
        props: {
            id: useButtonPropertiesEditor.name,
            buttonText: "Test Button",
            variant: "contained",
            size: "medium",
            color: "primary.main",
            disabled: false,
            fullWidth: false
        },

        children: {
            textField: useTextField({
                labelView: "Button Text",
                value: UECA.bind(() => model, "buttonText"),
                placeholder: "Enter button text",
                fullWidth: true
            }),

            variantRadioGroup: useRadioGroup({
                labelView: "Variant",
                value: UECA.bind(() => model, "variant"),
                options: [
                    { value: "text", label: "Text" },
                    { value: "outlined", label: "Outlined" },
                    { value: "contained", label: "Contained" }
                ],
                orientation: "row"
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

            fullWidthCheckbox: useCheckbox({
                labelView: "Full Width",
                checked: UECA.bind(() => model, "fullWidth")
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
                title="⚙️ Properties"
                fill
                minWidth={400}
                overflow="auto"
            >
                <Col spacing="medium" fill>
                    <model.textField.View />
                    <model.variantRadioGroup.View />
                    <model.sizeRadioGroup.View />
                    <model.colorSelect.View />
                    <model.disabledCheckbox.View />
                    <model.fullWidthCheckbox.View />
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

const ButtonPropertiesEditor = UECA.getFC(useButtonPropertiesEditor);

export { ButtonPropertiesEditorParams, ButtonPropertiesEditorModel, useButtonPropertiesEditor, ButtonPropertiesEditor };
