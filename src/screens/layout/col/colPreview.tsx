import * as UECA from "ueca-react";
import {
    UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase,
    Row, Col, Block
} from "@components";
import { Palette } from "@core";

type ColPreviewStruct = UIBaseStruct<{
    props: {
        spacing: string;
        horizontalAlign: string;
        verticalAlign: string;
        padding: string;
        backgroundColor: Palette;
        reverseItems: boolean;
        divider: boolean;
        flexWrap: string;
        fill: boolean;
        width: string;
        height: string;
        childrenCount: number;
    };

    methods: {
        _PreviewBlockView: () => React.ReactElement;
        _CodeDisplayView: () => React.ReactElement;
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
                            sx={{
                                border: "2px solid #999",
                                minHeight: "50px",
                                textAlign: "center"
                            }}
                        >
                            Item {i + 1}
                        </Block>
                    );
                }

                return (
                    <Block
                        padding="large"
                        backgroundColor="background.paper"
                        minHeight={"400px"}
                        sx={{
                            border: "1px solid #e0e0e0",
                            borderRadius: "8px",
                        }}
                    >
                        <Row spacing="medium" fill>
                            <Col
                                spacing={model.spacing as any}
                                horizontalAlign={model.horizontalAlign as any}
                                verticalAlign={model.verticalAlign as any}
                                padding={model.padding as any || undefined}
                                backgroundColor={model.backgroundColor}
                                reverseItems={model.reverseItems}
                                divider={model.divider}
                                flexWrap={model.flexWrap as any}
                                fill={model.fill}
                                width={model.width || undefined}
                                height={model.height || undefined}
                                sx={{
                                    border: "2px dashed #999",
                                }}
                            >
                                {children}
                            </Col>
                        </Row>
                    </Block>
                );
            },

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
                        <pre>{`<Col${model.spacing !== "default" ? `\n    spacing="${model.spacing}"` : ""}${model.horizontalAlign !== "left" ? `\n    horizontalAlign="${model.horizontalAlign}"` : ""}${model.verticalAlign !== "top" ? `\n    verticalAlign="${model.verticalAlign}"` : ""}${model.padding ? `\n    padding="${model.padding}"` : ""}${model.backgroundColor && model.backgroundColor !== "transparent" ? `\n    backgroundColor="${model.backgroundColor}"` : ""}${model.reverseItems ? `\n    reverseItems={true}` : ""}${model.divider ? `\n    divider={true}` : ""}${model.flexWrap !== "nowrap" ? `\n    flexWrap="${model.flexWrap}"` : ""}${model.fill ? `\n    fill={true}` : ""}${model.width ? `\n    width="${model.width}"` : ""}${model.height ? `\n    height="${model.height}"` : ""}
>
    <Block>Item 1</Block>
    <Block>Item 2</Block>
    <Block>Item 3</Block>
</Col>`}</pre>
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

const ColPreview = UECA.getFC(useColPreview);

export { ColPreviewParams, ColPreviewModel, useColPreview, ColPreview };
