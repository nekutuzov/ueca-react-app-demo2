import * as UECA from "ueca-react";
import {
    UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase,
    Block, Card,
    TextFieldModel, useTextField,
    RadioGroupModel, useRadioGroup,
    CheckboxModel, useCheckbox,
    ButtonModel, useButton,
    Col, Row,
    TabOrientation,
    TabScrollButtons,
    TabVariant,
    TabIconPosition
} from "@components";

type TabPropertiesEditorStruct = UIBaseStruct<{
    props: {
        labelText: string;
        iconPosition: TabIconPosition;
        disabled: boolean;
        wrapped: boolean;
        showIcon: boolean;
        orientation: TabOrientation;
        variant: TabVariant;
        scrollButtons: TabScrollButtons;
        centered: boolean;
    };

    children: {
        labelTextField: TextFieldModel<string>;
        iconPositionRadioGroup: RadioGroupModel<TabIconPosition>;
        disabledCheckbox: CheckboxModel;
        wrappedCheckbox: CheckboxModel;
        showIconCheckbox: CheckboxModel;
        orientationRadioGroup: RadioGroupModel<TabOrientation>;
        variantRadioGroup: RadioGroupModel<TabVariant>;
        scrollButtonsRadioGroup: RadioGroupModel<TabScrollButtons>;
        centeredCheckbox: CheckboxModel;
        resetButton: ButtonModel;
    };

    events: {
        onReset: () => UECA.MaybePromise;
    };
}>;

type TabPropertiesEditorParams = UIBaseParams<TabPropertiesEditorStruct>;
type TabPropertiesEditorModel = UIBaseModel<TabPropertiesEditorStruct>;

function useTabPropertiesEditor(params?: TabPropertiesEditorParams): TabPropertiesEditorModel {
    const struct: TabPropertiesEditorStruct = {
        props: {
            id: useTabPropertiesEditor.name,
            labelText: "Tab Label",
            iconPosition: "top",
            disabled: false,
            wrapped: false,
            showIcon: true,
            orientation: "horizontal",
            variant: "standard",
            scrollButtons: "auto",
            centered: false
        },

        children: {
            labelTextField: useTextField({
                labelView: "Label Text",
                value: UECA.bind(() => model, "labelText"),
                placeholder: "Enter tab label",
                fullWidth: true
            }),

            iconPositionRadioGroup: useRadioGroup({
                labelView: "Icon Position",
                value: UECA.bind(() => model, "iconPosition"),
                options: [
                    { value: "top", label: "Top" },
                    { value: "bottom", label: "Bottom" },
                    { value: "start", label: "Start" },
                    { value: "end", label: "End" }
                ],
                orientation: "column"
            }),

            disabledCheckbox: useCheckbox({
                labelView: "Disabled",
                checked: UECA.bind(() => model, "disabled")
            }),

            wrappedCheckbox: useCheckbox({
                labelView: "Wrapped",
                checked: UECA.bind(() => model, "wrapped")
            }),

            showIconCheckbox: useCheckbox({
                labelView: "Show Icon",
                checked: UECA.bind(() => model, "showIcon")
            }),

            orientationRadioGroup: useRadioGroup({
                labelView: "Orientation",
                value: UECA.bind(() => model, "orientation"),
                options: [
                    { value: "horizontal", label: "Horizontal" },
                    { value: "vertical", label: "Vertical" }
                ],
                orientation: "row"
            }),

            variantRadioGroup: useRadioGroup({
                labelView: "Variant",
                value: UECA.bind(() => model, "variant"),
                options: [
                    { value: "standard", label: "Standard" },
                    { value: "scrollable", label: "Scrollable" },
                    { value: "fullWidth", label: "Full Width" }
                ],
                orientation: "column"
            }),

            scrollButtonsRadioGroup: useRadioGroup({
                labelView: "Scroll Buttons",
                value: UECA.bind(() => model, "scrollButtons"),
                options: [
                    { value: "auto", label: "Auto" },
                    { value: true, label: "Always" },
                    { value: false, label: "Never" }
                ],
                orientation: "row"
            }),

            centeredCheckbox: useCheckbox({
                labelView: "Centered",
                checked: UECA.bind(() => model, "centered")
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
                <Row spacing="large" flexWrap="wrap" divider>
                    <Col spacing="medium" fill minWidth={300}>
                        <Block padding={{ bottom: "small" }}>
                            <h3>Tab Properties</h3>
                        </Block>
                        <model.labelTextField.View />
                        <model.showIconCheckbox.View />
                        <Block render={model.showIcon} padding={{ left: "medium" }}>
                            <model.iconPositionRadioGroup.View />
                        </Block>
                        <model.disabledCheckbox.View />
                        <model.wrappedCheckbox.View />
                    </Col>
                    <Col spacing="medium" fill minWidth={300}>
                        <Block padding={{ bottom: "small" }}>
                            <h3>TabsContainer Properties</h3>
                        </Block>
                        <model.orientationRadioGroup.View />
                        <model.variantRadioGroup.View />
                        <model.scrollButtonsRadioGroup.View render={model.variant === "scrollable"} />
                        <model.centeredCheckbox.View />
                    </Col>
                </Row>
                <Block padding={{ top: "huge" }}>
                    <model.resetButton.View />
                </Block>
            </Card>
        )
    };

    const model = useUIBase(struct, params);
    return model;
}

const TabPropertiesEditor = UECA.getFC(useTabPropertiesEditor);

export { TabPropertiesEditorParams, TabPropertiesEditorModel, useTabPropertiesEditor, TabPropertiesEditor };
