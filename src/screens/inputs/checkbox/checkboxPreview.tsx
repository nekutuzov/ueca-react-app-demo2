import * as UECA from "ueca-react";
import {
    UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase,
    Col, Block, Button,
    CheckboxModel, useCheckbox
} from "@components";
import { Palette } from "@core";

type CheckboxSize = "small" | "medium" | "large";

type CheckboxPreviewStruct = UIBaseStruct<{
    props: {
        labelText: string;
        size: CheckboxSize;
        color: Palette;
        disabled: boolean;
        required: boolean;
        indeterminate: boolean;
        helperText: string;
        checked: boolean;
    };

    children: {
        testCheckbox: CheckboxModel;
    };

    methods: {
        _PreviewBlockView: () => React.ReactElement;
        _CodeDisplayView: () => React.ReactElement;
        _ValueDisplayView: () => React.ReactElement;
    };

    events: {
        onCheckChange: (checked: boolean) => UECA.MaybePromise;
    };
}>;

type CheckboxPreviewParams = UIBaseParams<CheckboxPreviewStruct>;
type CheckboxPreviewModel = UIBaseModel<CheckboxPreviewStruct>;

function useCheckboxPreview(params?: CheckboxPreviewParams): CheckboxPreviewModel {
    const struct: CheckboxPreviewStruct = {
        props: {
            id: useCheckboxPreview.name,
            labelText: "I agree to terms and conditions",
            size: "medium",
            color: "primary.main",
            disabled: false,
            required: false,
            indeterminate: false,
            helperText: "",
            checked: false
        },

        children: {
            testCheckbox: useCheckbox({
                labelView: () => model.labelText,
                size: () => model.size,
                color: () => model.color,
                disabled: () => model.disabled,
                required: () => model.required,
                indeterminate: () => model.indeterminate,
                helperTextView: () => model.helperText,
                checked: UECA.bind(() => model, "checked"),
                onChange: (checked) => model.onCheckChange?.(checked)
            })
        },

        methods: {
            _PreviewBlockView: () => (
                <Block
                    padding="large"
                    backgroundColor="background.paper"
                    minHeight={"200px"}
                    sx={{
                        border: "1px solid #e0e0e0",
                        borderRadius: "8px",
                    }}
                >
                    <Col spacing="medium" horizontalAlign="center" verticalAlign="center">
                        <model.testCheckbox.View />
                        <Button
                            contentView="Validate"
                            variant="outlined"
                            size="small"
                            onClick={() => model.testCheckbox.validate()}
                        />
                        <model._ValueDisplayView />
                    </Col>
                </Block>
            ),

            _ValueDisplayView: () => (
                <Block padding={{ top: "medium" }}>
                    Checked: <strong>{model.checked ? "true" : "false"}</strong>
                </Block>
            ),

            _CodeDisplayView: () => {
                return (
                    <Col spacing="tiny" padding={{ top: "medium" }}>
                        <h4>JSX Code</h4>
                        <Block
                            backgroundColor="background.default"
                            padding="medium"
                            sx={{
                                border: "1px solid #e0e0e0",
                                borderRadius: "4px",
                                fontFamily: "monospace",
                                fontSize: "12px",
                                overflowX: "auto"
                            }}
                        >
                            <pre>
                                {`<Checkbox
    labelView="${model.labelText}"
    size="${model.size}"
    color="${model.color}"
    disabled={${model.disabled}}
    required={${model.required}}
    indeterminate={${model.indeterminate}}${model.helperText ? `\n    helperTextView="${model.helperText}"` : ''}
    checked={checked}
    onChange={handleChange}
/>`}
                            </pre>
                        </Block>
                    </Col>
                );
            }
        },

        View: () => (
            <Col spacing="medium" minWidth={"300px"} fill>
                <h2>Preview</h2>
                <model._PreviewBlockView />
                <model._CodeDisplayView />
            </Col>
        )
    };

    const model = useUIBase(struct, params);
    return model;
}

const CheckboxPreview = UECA.getFC(useCheckboxPreview);

export { CheckboxPreviewParams, CheckboxPreviewModel, useCheckboxPreview, CheckboxPreview };
