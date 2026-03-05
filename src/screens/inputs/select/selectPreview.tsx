import * as UECA from "ueca-react";
import {
    UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase,
    Col, Block,
    SelectModel, useSelect, SelectOption
} from "@components";
import { Palette } from "@core";

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
    };

    methods: {
        _PreviewBlockView: () => React.ReactElement;
        _CodeDisplayView: () => React.ReactElement;
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
                        <model.testSelect.View />
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
                                {`<Select
    labelView="${model.labelText}"
    placeholder="${model.placeholder}"
    variant="${model.variant}"
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

const SelectPreview = UECA.getFC(useSelectPreview);

export { SelectPreviewParams, SelectPreviewModel, useSelectPreview, SelectPreview };
