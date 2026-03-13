import * as UECA from "ueca-react";
import {
    UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase,
    Row, Col, Block, Card,
    Spacing,
    ColHorizontalAlign,
    ColVerticalAlign,
    PaddingSize,
    FlexWrap
} from "@components";
import { Palette, CodeSampleModel, useCodeSample } from "@core";

type ColPreviewStruct = UIBaseStruct<{
    props: {
        spacing: Spacing;
        horizontalAlign: ColHorizontalAlign;
        verticalAlign: ColVerticalAlign;
        padding: PaddingSize;
        backgroundColor: Palette;
        reverseItems: boolean;
        divider: boolean;
        flexWrap: FlexWrap;
        fill: boolean;
        width: string;
        height: string;
        childrenCount: number;
    };

    children: {
        codeSample: CodeSampleModel;
    };

    methods: {
        _PreviewBlockView: () => React.ReactElement;
    };
}>;

type ColPreviewParams = UIBaseParams<ColPreviewStruct>;
type ColPreviewModel = UIBaseModel<ColPreviewStruct>;

function useColPreview(params?: ColPreviewParams): ColPreviewModel {
    const struct: ColPreviewStruct = {
        props: {
            id: useColPreview.name,
            spacing: "medium",
            horizontalAlign: "left",
            verticalAlign: "top",
            padding: "medium",
            backgroundColor: "transparent",
            reverseItems: false,
            divider: false,
            flexWrap: "nowrap",
            fill: false,
            width: "",
            height: "",
            childrenCount: 3
        },

        methods: {
            _PreviewBlockView: () => {
                const children = [];
                for (let i = 0; i < Math.min(Math.max(1, model.childrenCount), 10); i++) {
                    children.push(
                        <Block
                            key={i}
                            padding="small"
                            backgroundColor="secondary.main"
                            border="solid"
                            minHeight={50}
                            horizontalAlign="center"
                        >
                            Item {i + 1}
                        </Block>
                    );
                }

                return (
                    <Row horizontalAlign="center" minHeight={"400px"}>
                        <Col
                            border={"dashed"}                            
                            spacing={model.spacing}
                            horizontalAlign={model.horizontalAlign}
                            verticalAlign={model.verticalAlign}
                            padding={model.padding}
                            backgroundColor={model.backgroundColor}
                            reverseItems={model.reverseItems}
                            divider={model.divider}
                            flexWrap={model.flexWrap}
                            fill={model.fill}
                            width={model.width || undefined}
                            height={model.height || undefined}
                        >
                            {children}
                        </Col>
                    </Row>
                );
            }
        },

        children: {
            codeSample: useCodeSample({
                componentName: "Col",
                sourceObject: () => model,
                properties: () => [
                    "spacing",
                    "horizontalAlign",
                    "verticalAlign",
                    "padding",
                    "backgroundColor",
                    "reverseItems",
                    "divider",
                    "flexWrap",
                    "fill",
                    "width",
                    "height"
                ],
                content: () => _generateChildrenContent()
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

    // Helper function to generate children content for code sample
    function _generateChildrenContent(): string {
        const count = Math.min(Math.max(1, model.childrenCount), 10);
        const children = [];
        for (let i = 0; i < count; i++) {
            children.push(`<Block>Item ${i + 1}</Block>`);
        }
        return children.join("\n    ");
    }
}

const ColPreview = UECA.getFC(useColPreview);

export { ColPreviewParams, ColPreviewModel, useColPreview, ColPreview };
