import * as UECA from "ueca-react";
import {
    UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase, Col, Block
} from "@components";

type CodeSampleStruct = UIBaseStruct<{
    props: {
        componentName: string;
        sourceObject: unknown;
        properties: string[];
        content: string;
    };

    methods: {
        _generateJsxCode: () => string;
    };
}>;

type CodeSampleParams = UIBaseParams<CodeSampleStruct>;
type CodeSampleModel = UIBaseModel<CodeSampleStruct>;

function useCodeSample(params?: CodeSampleParams): CodeSampleModel {
    const struct: CodeSampleStruct = {
        props: {
            id: useCodeSample.name,
            componentName: "Component",
            sourceObject: {},
            properties: [],
            content: ""
        },

        methods: {
            _generateJsxCode: () => {
                const obj = model.sourceObject;
                const propAssignment = (prop: string, value: unknown) => {
                    if (!UECA.isUndefined(value) && obj[prop]) {
                        return `    ${prop}="${obj[prop]}"`;
                    }
                    return "";
                };

                const propAssignments = model.properties
                    .map(prop => propAssignment(prop, obj[prop]))
                    .filter(Boolean)
                    .join("\n");

                if (model.content) {
                    return `<${model.componentName}\n${propAssignments}\n>\n    ${model.content}\n</${model.componentName}>`;
                } else {
                    return `<${model.componentName}\n${propAssignments}\n/>`;
                }
            }
        },

        View: () => (
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
                    <pre><code>{model._generateJsxCode()}</code></pre>
                </Block>
            </Col>
        )
    };

    const model = useUIBase(struct, params);
    return model;
}

const CodeSample = UECA.getFC(useCodeSample);

export { CodeSampleParams, CodeSampleModel, useCodeSample, CodeSample };
