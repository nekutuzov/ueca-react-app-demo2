import * as UECA from "ueca-react";
import {
    UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase,
    Col, Block,
    TextFieldModel, useTextField,
    SelectModel, useSelect,
    CheckboxModel, useCheckbox,
    ButtonModel, useButton
} from "@components";
import { Palette } from "@core";

type RowPropertiesEditorStruct = UIBaseStruct<{
    props: {
        spacing: string;
        horizontalAlign: string;
        verticalAlign: string;
        padding: string;
        backgroundColor: Palette;
        reverseItems: boolean;
        divider: boolean;
        flexWrap: string;
        fill: boolean;
        width: string;
        height: string;
        childrenCount: number;
    };

    children: {
        spacingSelect: SelectModel;
        horizontalAlignSelect: SelectModel;
        verticalAlignSelect: SelectModel;
        paddingSelect: SelectModel;
        backgroundColorSelect: SelectModel;
        reverseItemsCheckbox: CheckboxModel;
        dividerCheckbox: CheckboxModel;
        flexWrapSelect: SelectModel;
        fillCheckbox: CheckboxModel;
        widthField: TextFieldModel;
        heightField: TextFieldModel;
        childrenCountField: TextFieldModel<number>;
        resetButton: ButtonModel;
    };

    events: {
        onReset: () => UECA.MaybePromise;
    };
}>;

type RowPropertiesEditorParams = UIBaseParams<RowPropertiesEditorStruct>;
type RowPropertiesEditorModel = UIBaseModel<RowPropertiesEditorStruct>;

function useRowPropertiesEditor(params?: RowPropertiesEditorParams): RowPropertiesEditorModel {
    const struct: RowPropertiesEditorStruct = {
        props: {
            id: useRowPropertiesEditor.name,
            spacing: "medium",
            horizontalAlign: "left",
            verticalAlign: "center",
            padding: "medium",
            backgroundColor: "transparent",
            reverseItems: false,
            divider: false,
            flexWrap: "nowrap",
            fill: false,
            width: "",
            height: "",
            childrenCount: 3
        },

        children: {
            spacingSelect: useSelect({
                labelView: "Spacing",
                value: UECA.bind(() => model, "spacing"),
                options: [
                    { value: "none", label: "None" },
                    { value: "tiny", label: "Tiny" },
                    { value: "default", label: "Default" },
                    { value: "small", label: "Small" },
                    { value: "medium", label: "Medium" },
                    { value: "large", label: "Large" },
                    { value: "huge", label: "Huge" },
                    { value: "massive", label: "Massive" }
                ],
                fullWidth: true
            }),

            horizontalAlignSelect: useSelect({
                labelView: "Horizontal Align",
                value: UECA.bind(() => model, "horizontalAlign"),
                options: [
                    { value: "left", label: "Left" },
                    { value: "center", label: "Center" },
                    { value: "right", label: "Right" },
                    { value: "spaceBetween", label: "Space Between" },
                    { value: "spaceAround", label: "Space Around" },
                    { value: "spaceEvenly", label: "Space Evenly" }
                ],
                fullWidth: true
            }),

            verticalAlignSelect: useSelect({
                labelView: "Vertical Align",
                value: UECA.bind(() => model, "verticalAlign"),
                options: [
                    { value: "top", label: "Top" },
                    { value: "center", label: "Center" },
                    { value: "bottom", label: "Bottom" },
                    { value: "stretch", label: "Stretch" },
                    { value: "baseline", label: "Baseline" }
                ],
                fullWidth: true
            }),

            paddingSelect: useSelect({
                labelView: "Padding",
                value: UECA.bind(() => model, "padding"),
                options: [
                    { value: "", label: "None" },
                    { value: "tiny", label: "Tiny" },
                    { value: "small", label: "Small" },
                    { value: "medium", label: "Medium" },
                    { value: "large", label: "Large" }
                ],
                fullWidth: true
            }),

            backgroundColorSelect: useSelect({
                labelView: "Background Color",
                value: UECA.bind(() => model, "backgroundColor"),
                options: [
                    { value: "transparent", label: "Transparent" },
                    { value: "primary.main", label: "Primary" },
                    { value: "secondary.main", label: "Secondary" },
                    { value: "success.main", label: "Success" },
                    { value: "error.main", label: "Error" },
                    { value: "warning.main", label: "Warning" },
                    { value: "info.main", label: "Info" },
                    { value: "background.paper", label: "Paper" },
                    { value: "background.default", label: "Default" }
                ],
                fullWidth: true
            }),

            reverseItemsCheckbox: useCheckbox({
                labelView: "Reverse Items",
                checked: UECA.bind(() => model, "reverseItems")
            }),

            dividerCheckbox: useCheckbox({
                labelView: "Divider",
                checked: UECA.bind(() => model, "divider")
            }),

            flexWrapSelect: useSelect({
                labelView: "Flex Wrap",
                value: UECA.bind(() => model, "flexWrap"),
                options: [
                    { value: "nowrap", label: "No Wrap" },
                    { value: "wrap", label: "Wrap" },
                    { value: "wrap-reverse", label: "Wrap Reverse" }
                ],
                fullWidth: true
            }),

            fillCheckbox: useCheckbox({
                labelView: "Fill (flex: 1)",
                checked: UECA.bind(() => model, "fill")
            }),

            widthField: useTextField({
                labelView: "Width",
                value: UECA.bind(() => model, "width"),
                placeholder: "e.g., 100%, 500px, auto",
                fullWidth: true
            }),

            heightField: useTextField({
                labelView: "Height",
                value: UECA.bind(() => model, "height"),
                placeholder: "e.g., 100px, 50%, auto",
                fullWidth: true
            }),

            childrenCountField: useTextField({
                labelView: "Children Count",
                type: "number",
                value: UECA.bind(() => model, "childrenCount"),
                placeholder: "Number of child blocks",
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
                <model.childrenCountField.View />
                <model.spacingSelect.View />
                <model.horizontalAlignSelect.View />
                <model.verticalAlignSelect.View />
                <model.paddingSelect.View />
                <model.backgroundColorSelect.View />
                <model.flexWrapSelect.View />
                <model.widthField.View />
                <model.heightField.View />
                <model.reverseItemsCheckbox.View />
                <model.dividerCheckbox.View />
                <model.fillCheckbox.View />
                <Block padding={{ top: "medium" }}>
                    <model.resetButton.View />
                </Block>
            </Col>
        )
    };

    const model = useUIBase(struct, params);
    return model;
}

const RowPropertiesEditor = UECA.getFC(useRowPropertiesEditor);

export { RowPropertiesEditorParams, RowPropertiesEditorModel, useRowPropertiesEditor, RowPropertiesEditor };
