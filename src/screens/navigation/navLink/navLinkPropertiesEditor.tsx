import * as UECA from "ueca-react";
import {
    UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase,
    Col, Block, Card,
    TextFieldModel, useTextField,
    RadioGroupModel, useRadioGroup,
    SelectModel, useSelect,
    CheckboxModel, useCheckbox,
    ButtonModel, useButton,
    NavLinkUnderline
} from "@components";
import { Palette } from "@core";

type NavLinkPropertiesEditorStruct = UIBaseStruct<{
    props: {
        text: string;
        color: Palette;
        underline: NavLinkUnderline;
        disabled: boolean;
        newTab: boolean;
    };

    children: {
        textField: TextFieldModel<string>;
        colorSelect: SelectModel<Palette>;
        underlineRadioGroup: RadioGroupModel<NavLinkUnderline>;
        disabledCheckbox: CheckboxModel;
        newTabCheckbox: CheckboxModel;
        resetButton: ButtonModel;
    };

    events: {
        onReset: () => UECA.MaybePromise;
    };
}>;

type NavLinkPropertiesEditorParams = UIBaseParams<NavLinkPropertiesEditorStruct>;
type NavLinkPropertiesEditorModel = UIBaseModel<NavLinkPropertiesEditorStruct>;

function useNavLinkPropertiesEditor(params?: NavLinkPropertiesEditorParams): NavLinkPropertiesEditorModel {
    const struct: NavLinkPropertiesEditorStruct = {
        props: {
            id: useNavLinkPropertiesEditor.name,
            text: "Navigation Link",
            color: "primary.main",
            underline: "hover",
            disabled: false,
            newTab: false
        },

        children: {
            textField: useTextField({
                labelView: "Link Text",
                value: UECA.bind(() => model, "text"),
                placeholder: "Enter link text",
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
                    { value: "info.main", label: "Info" },
                    { value: "text.primary", label: "Text Primary" },
                    { value: "text.secondary", label: "Text Secondary" }
                ],
                fullWidth: true
            }),

            underlineRadioGroup: useRadioGroup({
                labelView: "Underline",
                value: UECA.bind(() => model, "underline"),
                options: [
                    { value: "none", label: "None" },
                    { value: "hover", label: "Hover" },
                    { value: "always", label: "Always" }
                ],
                orientation: "row"
            }),

            disabledCheckbox: useCheckbox({
                labelView: "Disabled",
                checked: UECA.bind(() => model, "disabled")
            }),

            newTabCheckbox: useCheckbox({
                labelView: "Open in New Tab",
                checked: UECA.bind(() => model, "newTab")
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
                    <model.textField.View />
                    <model.colorSelect.View />
                    <model.underlineRadioGroup.View />
                    <model.disabledCheckbox.View />
                    <model.newTabCheckbox.View />
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

const NavLinkPropertiesEditor = UECA.getFC(useNavLinkPropertiesEditor);

export { NavLinkPropertiesEditorParams, NavLinkPropertiesEditorModel, useNavLinkPropertiesEditor, NavLinkPropertiesEditor };
