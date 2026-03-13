import * as UECA from "ueca-react";
import {
    UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase,
    Col, Block,
    TextFieldModel, useTextField,
    CheckboxModel, useCheckbox,
    ButtonModel, useButton
} from "@components";

type MiscPropertiesEditorStruct = UIBaseStruct<{
    props: {
        busyDuration: number;
        fileMask: string;
        multiselect: boolean;
    };

    children: {
        durationField: TextFieldModel<number>;
        fileMaskField: TextFieldModel<string>;
        multiselectCheckbox: CheckboxModel;
        resetButton: ButtonModel;
    };

    events: {
        onReset: () => UECA.MaybePromise;
    };
}>;

type MiscPropertiesEditorParams = UIBaseParams<MiscPropertiesEditorStruct>;
type MiscPropertiesEditorModel = UIBaseModel<MiscPropertiesEditorStruct>;

function useMiscPropertiesEditor(params?: MiscPropertiesEditorParams): MiscPropertiesEditorModel {
    const struct: MiscPropertiesEditorStruct = {
        props: {
            id: useMiscPropertiesEditor.name,
            busyDuration: 2000,
            fileMask: ".pdf,.jpg,.png",
            multiselect: true
        },

        children: {
            durationField: useTextField({
                labelView: "Busy Duration (ms)",
                type: "number",
                value: UECA.bind(() => model, "busyDuration"),
                placeholder: "Enter duration in milliseconds",
                fullWidth: true,
                helperTextView: "How long the busy spinner displays"
            }),

            fileMaskField: useTextField({
                labelView: "File Mask",
                value: UECA.bind(() => model, "fileMask"),
                placeholder: "e.g., .pdf,.jpg,.png",
                fullWidth: true,
                helperTextView: "Comma-separated file extensions"
            }),

            multiselectCheckbox: useCheckbox({
                labelView: "Allow Multiple Selection",
                checked: UECA.bind(() => model, "multiselect"),
                onChange: (checked) => {
                    model.multiselect = checked;
                }
            }),

            resetButton: useButton({
                contentView: "Reset to Defaults",
                variant: "outlined",
                color: "secondary.main",
                fullWidth: true,
                onClick: () => model.onReset?.()
            })
        },

        events: {
            onReset: () => { }
        },

        View: () => (
            <Col id={model.htmlId()}
                spacing="medium" sx={{
                minWidth: "300px",
                maxWidth: "400px",
                padding: "20px",
                border: "2px solid #e0e0e0",
                borderRadius: "8px",
                backgroundColor: "white"
            }}>
                <Col spacing="medium" divider>
                    <Block padding={{ bottom: "small" }}>
                        <h2>Configuration</h2>
                        <p style={{ color: "#666", fontSize: "14px" }}>
                            Adjust settings for infrastructure components.
                        </p>
                    </Block>

                    <Block padding={{ bottom: "small" }}>
                        <h3>
                            Busy Display Settings
                        </h3>
                        <model.durationField.View />
                    </Block>                    

                    <Block padding={{ bottom: "small" }}>
                        <h3>
                            File Selector Settings
                        </h3>
                        <Col spacing="medium">
                            <model.fileMaskField.View />
                            <model.multiselectCheckbox.View />
                        </Col>
                    </Block>

                    <Block sx={{ marginTop: "10px" }}>
                        <model.resetButton.View />
                    </Block>
                </Col>
            </Col>
        )
    };

    const model = useUIBase(struct, params);
    return model;
}

const MiscPropertiesEditor = UECA.getFC(useMiscPropertiesEditor);

export { MiscPropertiesEditorParams, MiscPropertiesEditorModel, useMiscPropertiesEditor, MiscPropertiesEditor };
