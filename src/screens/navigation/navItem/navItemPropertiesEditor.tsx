import * as UECA from "ueca-react";
import {
    UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase,
    Col, Block, Card,
    TextFieldModel, useTextField,
    RadioGroupModel, useRadioGroup,
    CheckboxModel, useCheckbox,
    ButtonModel, useButton,
    NavItemMode
} from "@components";

type NavItemPropertiesEditorStruct = UIBaseStruct<{
    props: {
        text: string;
        mode: NavItemMode;
        disabled: boolean;
        newTab: boolean;
        active: boolean;
    };

    children: {
        textField: TextFieldModel<string>;
        modeRadioGroup: RadioGroupModel<NavItemMode>;
        disabledCheckbox: CheckboxModel;
        newTabCheckbox: CheckboxModel;
        activeCheckbox: CheckboxModel;
        resetButton: ButtonModel;
    };

    events: {
        onReset: () => UECA.MaybePromise;
    };
}>;

type NavItemPropertiesEditorParams = UIBaseParams<NavItemPropertiesEditorStruct>;
type NavItemPropertiesEditorModel = UIBaseModel<NavItemPropertiesEditorStruct>;

function useNavItemPropertiesEditor(params?: NavItemPropertiesEditorParams): NavItemPropertiesEditorModel {
    const struct: NavItemPropertiesEditorStruct = {
        props: {
            id: useNavItemPropertiesEditor.name,
            text: "Navigation Item",
            mode: "icon-text",
            disabled: false,
            newTab: false,
            active: false
        },

        children: {
            textField: useTextField({
                labelView: "Item Text",
                value: UECA.bind(() => model, "text"),
                placeholder: "Enter item text",
                fullWidth: true
            }),

            modeRadioGroup: useRadioGroup({
                labelView: "Display Mode",
                value: UECA.bind(() => model, "mode"),
                options: [
                    { value: "icon-text", label: "Icon + Text" },
                    { value: "text-only", label: "Text Only" },
                    { value: "icon-only", label: "Icon Only" }
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

            activeCheckbox: useCheckbox({
                labelView: "Active State",
                checked: UECA.bind(() => model, "active")
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
                    <model.modeRadioGroup.View />
                    <model.activeCheckbox.View />
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

const NavItemPropertiesEditor = UECA.getFC(useNavItemPropertiesEditor);

export { NavItemPropertiesEditorParams, NavItemPropertiesEditorModel, useNavItemPropertiesEditor, NavItemPropertiesEditor };
