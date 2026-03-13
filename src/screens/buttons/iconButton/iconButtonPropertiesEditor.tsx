import * as UECA from "ueca-react";
import {
    UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase,
    Block, Card,
    RadioGroupModel, useRadioGroup,
    SelectModel, useSelect,
    CheckboxModel, useCheckbox,
    ButtonModel, useButton,
    Col,
    IconKind,
    IconSize
} from "@components";
import { Palette } from "@core";

type IconButtonPropertiesEditorStruct = UIBaseStruct<{
    props: {
        kind: IconKind;
        size: IconSize;
        color: Palette | "inherit";
        disabled: boolean;
        useCustomIcon: boolean;
    };

    children: {
        kindRadioGroup: RadioGroupModel<IconKind>;
        sizeRadioGroup: RadioGroupModel<IconSize>;
        colorSelect: SelectModel<Palette | "inherit">;
        disabledCheckbox: CheckboxModel;
        customIconCheckbox: CheckboxModel;
        resetButton: ButtonModel;
    };

    events: {
        onReset: () => UECA.MaybePromise;
    };
}>;

type IconButtonPropertiesEditorParams = UIBaseParams<IconButtonPropertiesEditorStruct>;
type IconButtonPropertiesEditorModel = UIBaseModel<IconButtonPropertiesEditorStruct>;

function useIconButtonPropertiesEditor(params?: IconButtonPropertiesEditorParams): IconButtonPropertiesEditorModel {
    const struct: IconButtonPropertiesEditorStruct = {
        props: {
            id: useIconButtonPropertiesEditor.name,
            kind: "ok",
            size: "medium",
            color: "primary.main",
            disabled: false,
            useCustomIcon: false
        },

        children: {
            kindRadioGroup: useRadioGroup({
                labelView: "Icon Kind",
                value: UECA.bind(() => model, "kind"),
                options: [
                    { value: "ok", label: "OK" },
                    { value: "cancel", label: "Cancel" },
                    { value: "delete", label: "Delete" },
                    { value: "refresh", label: "Refresh" },
                    { value: "close", label: "Close" }
                ],
                orientation: "column"
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
                    { value: "inherit", label: "Inherit" },
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

            customIconCheckbox: useCheckbox({
                labelView: "Use Custom Icon",
                checked: UECA.bind(() => model, "useCustomIcon")
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
                    <model.kindRadioGroup.View />
                    <model.sizeRadioGroup.View />
                    <model.colorSelect.View />
                    <model.disabledCheckbox.View />
                    <model.customIconCheckbox.View />
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

const IconButtonPropertiesEditor = UECA.getFC(useIconButtonPropertiesEditor);

export { IconButtonPropertiesEditorParams, IconButtonPropertiesEditorModel, useIconButtonPropertiesEditor, IconButtonPropertiesEditor };
