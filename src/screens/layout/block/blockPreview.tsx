import * as UECA from "ueca-react";
import {
    UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase,
    Col, Block
} from "@components";
import { Palette } from "@core";

type BlockPreviewStruct = UIBaseStruct<{
    props: {
        width: string;
        height: string;
        minWidth: string;
        minHeight: string;
        maxWidth: string;
        maxHeight: string;
        padding: string;
        backgroundColor: Palette;
        overflow: string;
        horizontalAlign: "left" | "center" | "right";
        fill: boolean;
        content: string;
    };

    methods: {
        _PreviewBlockView: () => React.ReactElement;
        _CodeDisplayView: () => React.ReactElement;
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
                <Block
                    padding="large"
                    backgroundColor="background.paper"
                    minHeight={"300px"}
                    sx={{
                        border: "1px solid #e0e0e0",
                        borderRadius: "8px",
                    }}
                >
                    <Col spacing="medium" horizontalAlign="center" verticalAlign="center">
                        <Block
                            width={model.width || undefined}
                            height={model.height || undefined}
                            minWidth={model.minWidth || undefined}
                            minHeight={model.minHeight || undefined}
                            maxWidth={model.maxWidth || undefined}
                            maxHeight={model.maxHeight || undefined}
                            padding={model.padding as any || undefined}
                            backgroundColor={model.backgroundColor}
                            overflow={model.overflow as any}
                            horizontalAlign={model.horizontalAlign}
                            fill={model.fill}
                            sx={{
                                border: "2px dashed #999",
                            }}
                        >
                            {model.content}
                        </Block>
                    </Col>
                </Block>
            ),

            _CodeDisplayView: () => (
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
                        <pre>{`<Block${model.width ? `\n    width="${model.width}"` : ""}${model.height ? `\n    height="${model.height}"` : ""}${model.minWidth ? `\n    minWidth="${model.minWidth}"` : ""}${model.minHeight ? `\n    minHeight="${model.minHeight}"` : ""}${model.maxWidth ? `\n    maxWidth="${model.maxWidth}"` : ""}${model.maxHeight ? `\n    maxHeight="${model.maxHeight}"` : ""}${model.padding ? `\n    padding="${model.padding}"` : ""}${model.backgroundColor && model.backgroundColor !== "transparent" ? `\n    backgroundColor="${model.backgroundColor}"` : ""}${model.overflow !== "visible" ? `\n    overflow="${model.overflow}"` : ""}${model.horizontalAlign !== "left" ? `\n    horizontalAlign="${model.horizontalAlign}"` : ""}${model.fill ? `\n    fill={true}` : ""}
>
    ${model.content}
</Block>`}</pre>
                    </Block>
                </Col>
            )
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

const BlockPreview = UECA.getFC(useBlockPreview);

export { BlockPreviewParams, BlockPreviewModel, useBlockPreview, BlockPreview };
