import * as UECA from "ueca-react";
import {
    UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase, Col, Block, TextFieldModel, useTextField, RadioGroupModel,
    useRadioGroup, SelectModel, useSelect, CheckboxModel, useCheckbox, ButtonModel, useButton, Row, PaddingSize,
    Overflow, BlockHorizontalAlign,
    Card
} from "@components";
import { Palette } from "@core";

type BlockPropertiesEditorStruct = UIBaseStruct<{
    props: {
        width: string;
        height: string;
        minWidth: string;
        minHeight: string;
        maxWidth: string;
        maxHeight: string;
        padding: PaddingSize;
        backgroundColor: Palette;
        overflow: Overflow;
        horizontalAlign: BlockHorizontalAlign;
        fill: boolean;
        content: string;
    };

    children: {
        widthField: TextFieldModel;
        heightField: TextFieldModel;
        minWidthField: TextFieldModel;
        minHeightField: TextFieldModel;
        maxWidthField: TextFieldModel;
        maxHeightField: TextFieldModel;
        paddingRadioGroup: RadioGroupModel<PaddingSize>;
        backgroundColorSelect: SelectModel<Palette>;
        overflowRadioGroup: RadioGroupModel<Overflow>;
        horizontalAlignRadioGroup: RadioGroupModel<BlockHorizontalAlign>;
        fillCheckbox: CheckboxModel;
        contentField: TextFieldModel;
        resetButton: ButtonModel;
    };

    events: {
        onReset: () => UECA.MaybePromise;
    };
}>;

type BlockPropertiesEditorParams = UIBaseParams<BlockPropertiesEditorStruct>;
type BlockPropertiesEditorModel = UIBaseModel<BlockPropertiesEditorStruct>;

function useBlockPropertiesEditor(params?: BlockPropertiesEditorParams): BlockPropertiesEditorModel {
    const struct: BlockPropertiesEditorStruct = {
        props: {
            id: useBlockPropertiesEditor.name,
            width: "200px",
            height: "150px",
            minWidth: "",
            minHeight: "",
            maxWidth: "",
            maxHeight: "",
            padding: "medium",
            backgroundColor: "primary.main",
            overflow: "visible",
            horizontalAlign: "left",
            fill: false,
            content: "Block Content"
        },

        children: {
            widthField: useTextField({
                labelView: "Width",
                value: UECA.bind(() => model, "width"),
                placeholder: "e.g., 200px, 50%, auto",
                fullWidth: true
            }),

            heightField: useTextField({
                labelView: "Height",
                value: UECA.bind(() => model, "height"),
                placeholder: "e.g., 150px, 100%, auto",
                fullWidth: true
            }),

            minWidthField: useTextField({
                labelView: "Min Width",
                value: UECA.bind(() => model, "minWidth"),
                placeholder: "e.g., 100px",
                fullWidth: true
            }),

            minHeightField: useTextField({
                labelView: "Min Height",
                value: UECA.bind(() => model, "minHeight"),
                placeholder: "e.g., 50px",
                fullWidth: true
            }),

            maxWidthField: useTextField({
                labelView: "Max Width",
                value: UECA.bind(() => model, "maxWidth"),
                placeholder: "e.g., 500px",
                fullWidth: true
            }),

            maxHeightField: useTextField({
                labelView: "Max Height",
                value: UECA.bind(() => model, "maxHeight"),
                placeholder: "e.g., 300px",
                fullWidth: true
            }),

            paddingRadioGroup: useRadioGroup<PaddingSize>({
                labelView: "Padding",
                value: UECA.bind(() => model, "padding"),
                options: [
                    { value: "none", label: "None" },
                    { value: "tiny", label: "Tiny" },
                    { value: "small", label: "Small" },
                    { value: "medium", label: "Medium" },
                    { value: "large", label: "Large" }
                ],
                orientation: "row"
            }),

            backgroundColorSelect: useSelect<Palette>({
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
                    { value: "background.paper", label: "Paper" }
                ],
                fullWidth: true
            }),

            overflowRadioGroup: useRadioGroup<Overflow>({
                labelView: "Overflow",
                value: UECA.bind(() => model, "overflow"),
                options: [
                    { value: "visible", label: "Visible" },
                    { value: "hidden", label: "Hidden" },
                    { value: "scroll", label: "Scroll" },
                    { value: "auto", label: "Auto" }
                ],
                orientation: "row"
            }),

            horizontalAlignRadioGroup: useRadioGroup<BlockHorizontalAlign>({
                labelView: "Horizontal Align",
                value: UECA.bind(() => model, "horizontalAlign"),
                options: [
                    { value: "left", label: "Left" },
                    { value: "center", label: "Center" },
                    { value: "right", label: "Right" }
                ],
                orientation: "row"
            }),

            fillCheckbox: useCheckbox({
                labelView: "Fill (flex: 1)",
                checked: UECA.bind(() => model, "fill")
            }),

            contentField: useTextField({
                labelView: "Block Content",
                value: UECA.bind(() => model, "content"),
                placeholder: "Enter content",
                multiline: true,
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
            <Card id={model.htmlId()}
                title="⚙️ Properties"
                fill      
                minWidth={664}          
                overflow="auto"
            >
                <Col spacing="medium" fill>
                    <model.contentField.View />
                    <model.backgroundColorSelect.View />
                    <model.paddingRadioGroup.View />
                    <model.horizontalAlignRadioGroup.View />
                    <model.overflowRadioGroup.View />
                    <Row>
                        <model.widthField.View />
                        <model.minWidthField.View />
                        <model.maxWidthField.View />
                    </Row>
                    <Row>
                        <model.heightField.View />
                        <model.minHeightField.View />
                        <model.maxHeightField.View />
                    </Row>
                    <model.fillCheckbox.View />
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

const BlockPropertiesEditor = UECA.getFC(useBlockPropertiesEditor);

export { BlockPropertiesEditorParams, BlockPropertiesEditorModel, useBlockPropertiesEditor, BlockPropertiesEditor };
