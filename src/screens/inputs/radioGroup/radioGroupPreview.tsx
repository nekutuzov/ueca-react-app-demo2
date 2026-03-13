import * as UECA from "ueca-react";
import {
    UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase,
    Col, Block, Card,
    RadioGroupModel, useRadioGroup, RadioOption
} from "@components";
import { Palette, CodeSampleModel, useCodeSample } from "@core";

type RadioOrientation = "row" | "column";
type RadioSize = "small" | "medium" | "large";

type RadioGroupPreviewStruct = UIBaseStruct<{
    props: {
        labelText: string;
        orientation: RadioOrientation;
        size: RadioSize;
        color: Palette;
        disabled: boolean;
        required: boolean;
        fullWidth: boolean;
        helperText: string;
        optionsText: string;
        selectedValue: string;
    };

    children: {
        testRadioGroup: RadioGroupModel<string>;
        codeSample: CodeSampleModel;
    };

    methods: {
        _PreviewBlockView: () => React.ReactElement;
        _ValueDisplayView: () => React.ReactElement;
        _parseOptions: () => RadioOption<string>[];
    };

    events: {
        onSelectionChange: (value: string) => UECA.MaybePromise;
    };
}>;

type RadioGroupPreviewParams = UIBaseParams<RadioGroupPreviewStruct>;
type RadioGroupPreviewModel = UIBaseModel<RadioGroupPreviewStruct>;

function useRadioGroupPreview(params?: RadioGroupPreviewParams): RadioGroupPreviewModel {
    const struct: RadioGroupPreviewStruct = {
        props: {
            id: useRadioGroupPreview.name,
            labelText: "Select an Option",
            orientation: "column",
            size: "medium",
            color: "primary.main",
            disabled: false,
            required: false,
            fullWidth: false,
            helperText: "",
            optionsText: "Option 1=1, Option 2=2, Option 3=3",
            selectedValue: ""
        },

        children: {
            testRadioGroup: useRadioGroup({
                labelView: () => model.labelText,
                orientation: () => model.orientation,
                size: () => model.size,
                color: () => model.color,
                disabled: () => model.disabled,
                required: () => model.required,
                fullWidth: () => model.fullWidth,
                helperTextView: () => model.helperText,
                options: () => model._parseOptions(),
                value: UECA.bind(() => model, "selectedValue"),
                onChange: (value) => model.onSelectionChange?.(value)
            }),

            codeSample: useCodeSample({
                componentName: "RadioGroup",
                sourceObject: () => model,
                properties: () => ["labelText", "orientation", "size", "color", "disabled", "required", "fullWidth", "helperText", "selectedValue"],                
            })
        },

        methods: {
            _parseOptions: () => {
                if (!model.optionsText.trim()) {
                    return [];
                }

                return model.optionsText
                    .split(',')
                    .map(item => item.trim())
                    .filter(item => item.length > 0)
                    .map(item => {
                        const [label, value] = item.split('=').map(part => part.trim());
                        return {
                            value: value || label,
                            label: label
                        };
                    });
            },

            _PreviewBlockView: () => (
                <Col spacing="medium" horizontalAlign="center" verticalAlign="center" minHeight={"200px"}>
                    <model.testRadioGroup.View />
                    <model._ValueDisplayView />
                </Col>
            ),

            _ValueDisplayView: () => (
                <Block render={!!model.selectedValue} padding={{ top: "medium" }}>
                    Selected: <strong>{model.selectedValue}</strong>
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

const RadioGroupPreview = UECA.getFC(useRadioGroupPreview);

export { RadioGroupPreviewParams, RadioGroupPreviewModel, useRadioGroupPreview, RadioGroupPreview };
