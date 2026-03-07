import * as UECA from "ueca-react";
import {
    UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase, Col, Block, PaddingSize, Overflow, BlockHorizontalAlign,
    Card
} from "@components";
import { Palette, CodeSampleModel, useCodeSample } from "@core";

type BlockPreviewStruct = UIBaseStruct<{
    props: {
        width: string;
        height: string;
        minWidth: string;
        minHeight: string;
        maxWidth: string;
        maxHeight: string;
        padding: PaddingSize;
        backgroundColor: Palette;
        overflow: Overflow;
        horizontalAlign: BlockHorizontalAlign;
        fill: boolean;
        content: string;
    };

    children: {
        codeSample: CodeSampleModel;
    };

    methods: {
        _PreviewBlockView: () => React.ReactElement;
    };
}>;

type BlockPreviewParams = UIBaseParams<BlockPreviewStruct>;
type BlockPreviewModel = UIBaseModel<BlockPreviewStruct>;

function useBlockPreview(params?: BlockPreviewParams): BlockPreviewModel {
    const struct: BlockPreviewStruct = {
        props: {
            id: useBlockPreview.name,
            width: "200px",
            height: "150px",
            minWidth: "",
            minHeight: "",
            maxWidth: "",
            maxHeight: "",
            padding: "medium",
            backgroundColor: "primary.main",
            overflow: "visible",
            horizontalAlign: "left",
            fill: false,
            content: "Block Content"
        },

        methods: {
            _PreviewBlockView: () => (
                <Col horizontalAlign="center" minHeight={"300px"}>
                    <Block
                        width={model.width}
                        height={model.height}
                        minWidth={model.minWidth}
                        minHeight={model.minHeight}
                        maxWidth={model.maxWidth}
                        maxHeight={model.maxHeight}
                        padding={model.padding}
                        backgroundColor={model.backgroundColor}
                        overflow={model.overflow}
                        horizontalAlign={model.horizontalAlign}
                        fill={model.fill}
                        border="dashed"
                    >
                        <pre>{model.content}</pre>
                    </Block>
                </Col>
            )
        },

        children: {
            codeSample: useCodeSample({
                componentName: "Block",
                sourceObject: () => model,
                properties: () => [
                    "width",
                    "height",
                    "minWidth",
                    "minHeight",
                    "maxWidth",
                    "maxHeight",
                    "padding",
                    "backgroundColor",
                    "overflow",
                    "horizontalAlign",
                    "fill"
                ],
                content: () => model.content
            })
        },

        View: () => (
            <Card id={model.htmlId()}
                title="👁️ Preview"
                fill
                minWidth={400}
                overflow="auto"
            >
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

const BlockPreview = UECA.getFC(useBlockPreview);

export { BlockPreviewParams, BlockPreviewModel, useBlockPreview, BlockPreview };
