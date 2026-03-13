import * as UECA from "ueca-react";
import {
    UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase,
    Col, Block, Card,
    SelectModel, useSelect, SelectOption
} from "@components";
import { Palette, CodeSampleModel, useCodeSample } from "@core";

type SelectPreviewStruct = UIBaseStruct<{
    props: {
        labelText: string;
        placeholder: string;
        variant: "filled" | "outlined" | "standard";
        size: "small" | "medium";
        color: Palette;
        disabled: boolean;
        required: boolean;
        fullWidth: boolean;
        helperText: string;
        optionsText: string;
        selectedValue: string;
    };

    children: {
        testSelect: SelectModel<string>;
        codeSample: CodeSampleModel;
    };

    methods: {
        _PreviewBlockView: () => React.ReactElement;
        _ValueDisplayView: () => React.ReactElement;
        _parseOptions: () => SelectOption<string>[];
    };

    events: {
        onSelectionChange: (value: string) => UECA.MaybePromise;
    };
}>;

type SelectPreviewParams = UIBaseParams<SelectPreviewStruct>;
type SelectPreviewModel = UIBaseModel<SelectPreviewStruct>;

function useSelectPreview(params?: SelectPreviewParams): SelectPreviewModel {
    const struct: SelectPreviewStruct = {
        props: {
            id: useSelectPreview.name,
            labelText: "Select an Option",
            placeholder: "Choose an option...",
            variant: "outlined",
            size: "medium",
            color: "primary.main",
            disabled: false,
            required: false,
            fullWidth: true,
            helperText: "",
            optionsText: "Option 1=1, Option 2=2, Option 3=3",
            selectedValue: ""
        },

        children: {
            testSelect: useSelect({
                labelView: () => model.labelText,
                placeholder: () => model.placeholder,
                variant: () => model.variant,
                size: () => model.size,
                color: () => model.color,
                disabled: () => model.disabled,
                required: () => model.required,
                fullWidth: () => model.fullWidth,
                helperTextView: () => model.helperText,
                options: () => model._parseOptions(),
                extent: { width: "300px" },
                value: UECA.bind(() => model, "selectedValue"),
                onChange: (value) => model.onSelectionChange?.(value)
            }),

            codeSample: useCodeSample({
                componentName: "Select",
                sourceObject: () => model,
                properties: () => ["labelText", "placeholder", "variant", "size", "color", "disabled", "required", "fullWidth", "helperText", "selectedValue"],                
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
                    <model.testSelect.View />
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

const SelectPreview = UECA.getFC(useSelectPreview);

export { SelectPreviewParams, SelectPreviewModel, useSelectPreview, SelectPreview };
