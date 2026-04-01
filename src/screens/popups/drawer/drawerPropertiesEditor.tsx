import * as UECA from "ueca-react";
import {
    UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase,
    Col, Block, Card,
    RadioGroupModel, useRadioGroup,
    SelectModel, useSelect,
    ButtonModel, useButton,
    DrawerAnchor,
    DrawerSeverity
} from "@components";
import { DrawerButtonType } from "./drawerPreview";

type DrawerPropertiesEditorStruct = UIBaseStruct<{
    props: {
        anchor: DrawerAnchor;
        severity: DrawerSeverity;
        buttonType: DrawerButtonType;
        width: number;
    };

    children: {
        anchorRadioGroup: RadioGroupModel<DrawerAnchor>;
        severitySelect: SelectModel<DrawerSeverity>;
        buttonTypeRadioGroup: RadioGroupModel<DrawerButtonType>;
        widthSlider: RadioGroupModel<number>;
        resetButton: ButtonModel;
    };

    events: {
        onReset: () => UECA.MaybePromise;
    };
}>;

type DrawerPropertiesEditorParams = UIBaseParams<DrawerPropertiesEditorStruct>;
type DrawerPropertiesEditorModel = UIBaseModel<DrawerPropertiesEditorStruct>;

function useDrawerPropertiesEditor(params?: DrawerPropertiesEditorParams): DrawerPropertiesEditorModel {
    const struct: DrawerPropertiesEditorStruct = {
        props: {
            id: useDrawerPropertiesEditor.name,
            anchor: "right",
            severity: undefined,
            buttonType: "cancel",
            width: 600
        },

        children: {
            anchorRadioGroup: useRadioGroup({
                labelView: "Anchor Position",
                value: UECA.bind(() => model, "anchor"),
                options: [
                    { value: "left", label: "Left" },
                    { value: "top", label: "Top" },
                    { value: "right", label: "Right" },
                    { value: "bottom", label: "Bottom" }
                ],
                orientation: "row"
            }),

            severitySelect: useSelect({
                labelView: "Severity Icon",
                value: UECA.bind(() => model, "severity"),
                options: [
                    { value: "none", label: "None" },
                    { value: "success", label: "Success" },
                    { value: "info", label: "Info" },
                    { value: "warning", label: "Warning" },
                    { value: "error", label: "Error" }
                ],
                fullWidth: true
            }),

            buttonTypeRadioGroup: useRadioGroup({
                labelView: "Buttons",
                value: UECA.bind(() => model, "buttonType"),
                options: [
                    { value: "none", label: "None" },
                    { value: "ok", label: "OK Only" },
                    { value: "cancel", label: "Cancel Only" },
                    { value: "okCancel", label: "OK & Cancel" }
                ],
                orientation: "column"
            }),

            widthSlider: useRadioGroup({
                labelView: "Width (px)",
                value: UECA.bind(() => model, "width"),
                options: [
                    { value: 600, label: "600" },
                    { value: 800, label: "800" },
                    { value: 1000, label: "1000" },
                    { value: 2000, label: "2000" }
                ],
                orientation: "row"
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
                    <model.anchorRadioGroup.View />
                    <model.severitySelect.View />
                    <model.buttonTypeRadioGroup.View />
                    <model.widthSlider.View />
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

const DrawerPropertiesEditor = UECA.getFC(useDrawerPropertiesEditor);

export { DrawerPropertiesEditorParams, DrawerPropertiesEditorModel, useDrawerPropertiesEditor, DrawerPropertiesEditor };
