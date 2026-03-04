import * as UECA from "ueca-react";
import {
    UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase,
    Col, Block,
    RadioGroupModel, useRadioGroup, RadioOption
} from "@components";
import { Palette } from "@core";

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
    };

    methods: {
        _PreviewBlockView: () => React.ReactElement;
        _CodeDisplayView: () => React.ReactElement;
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
                        <model.testRadioGroup.View />
                        <model._ValueDisplayView />
                    </Col>
                </Block>
            ),

            _ValueDisplayView: () => (
                <Block render={!!model.selectedValue} padding={{ top: "medium" }}>
                    Selected: <strong>{model.selectedValue}</strong>
                </Block>
            ),

            _CodeDisplayView: () => {
                const options = model._parseOptions();
                const optionsCode = options.length > 0
                    ? `[\n        ${options.map(opt => `{ value: "${opt.value}", label: "${opt.label}" }`).join(',\n        ')}\n    ]`
                    : '[]';

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
                                {`<RadioGroup
    labelView="${model.labelText}"
    orientation="${model.orientation}"
    size="${model.size}"
    color="${model.color}"
    disabled={${model.disabled}}
    required={${model.required}}
    fullWidth={${model.fullWidth}}${model.helperText ? `\n    helperTextView="${model.helperText}"` : ''}
    options={${optionsCode}}
    value={selectedValue}
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

const RadioGroupPreview = UECA.getFC(useRadioGroupPreview);

export { RadioGroupPreviewParams, RadioGroupPreviewModel, useRadioGroupPreview, RadioGroupPreview };
