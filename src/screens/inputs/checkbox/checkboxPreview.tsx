import * as UECA from "ueca-react";
import {
    UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase,
    Col, Block, Button, Card,
    CheckboxModel, useCheckbox
} from "@components";
import { Palette, CodeSampleModel, useCodeSample } from "@core";

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
        codeSample: CodeSampleModel;
    };

    methods: {
        _PreviewBlockView: () => React.ReactElement;
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
            }),

            codeSample: useCodeSample({
                componentName: "Checkbox",
                sourceObject: () => model,
                properties: () => ["labelText", "size", "color", "disabled", "required", "indeterminate", "helperText", "checked"],
                content: () => ""
            })
        },

        methods: {
            _PreviewBlockView: () => (
                <Col spacing="medium" horizontalAlign="center" verticalAlign="center" minHeight={"200px"}>
                    <model.testCheckbox.View />
                    <Button
                        contentView="Validate"
                        variant="outlined"
                        size="small"
                        onClick={() => model.testCheckbox.validate()}
                    />
                    <model._ValueDisplayView />
                </Col>
            ),

            _ValueDisplayView: () => (
                <Block padding={{ top: "medium" }}>
                    Checked: <strong>{model.checked ? "true" : "false"}</strong>
                </Block>
            )
        },

        View: () => (
            <Card id={model.htmlId()}
                title="👁️ Preview" fill minWidth={400} overflow="auto">
                <Col spacing="medium" fill>
                    <model._PreviewBlockView />
                    <model.codeSample.View />
                </Col>
            </Card>
        )
    };

    const model = useUIBase(struct, params);
    return model;
}

const CheckboxPreview = UECA.getFC(useCheckboxPreview);

export { CheckboxPreviewParams, CheckboxPreviewModel, useCheckboxPreview, CheckboxPreview };
