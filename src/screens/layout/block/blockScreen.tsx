import * as UECA from "ueca-react";
import {
    UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase,
    Row, Col
} from "@components";
import { CRUDScreenModel, useCRUDScreen, Palette } from "@core";
import { BlockPropertiesEditorModel, useBlockPropertiesEditor } from "./blockPropertiesEditor";
import { BlockPreviewModel, useBlockPreview } from "./blockPreview";

type BlockScreenStruct = UIBaseStruct<{
    props: {
        // Block properties
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

    children: {
        crudScreen: CRUDScreenModel;
        propertiesEditor: BlockPropertiesEditorModel;
        preview: BlockPreviewModel;
    };

    methods: {
        resetProperties: () => void;
    };
}>;

type BlockScreenParams = UIBaseParams<BlockScreenStruct>;
type BlockScreenModel = UIBaseModel<BlockScreenStruct>;

function useBlockScreen(params?: BlockScreenParams): BlockScreenModel {
    const struct: BlockScreenStruct = {
        props: {
            id: useBlockScreen.name,
            width: "400px",
            height: "200px",
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

        children: {
            crudScreen: useCRUDScreen({
                intent: "none",
                breadcrumbs: [
                    { route: { path: "/" }, label: "Home" },
                    { route: { path: "/layout/block" }, label: "Layout" },
                    { route: { path: "/layout/block" }, label: "Block Component" }
                ],
                contentView: () => (
                    <Col fill overflow="auto" padding="medium" spacing="large">
                        <Col spacing="medium">
                            <h1>Block Component</h1>
                            <p>Modify properties and see the changes in real-time.</p>
                        </Col>
                        <Row spacing="large" fill flexWrap="wrap">
                            <model.propertiesEditor.View />
                            <model.preview.View />
                        </Row>
                    </Col>
                )
            }),

            propertiesEditor: useBlockPropertiesEditor({
                width: UECA.bind(() => model, "width"),
                height: UECA.bind(() => model, "height"),
                minWidth: UECA.bind(() => model, "minWidth"),
                minHeight: UECA.bind(() => model, "minHeight"),
                maxWidth: UECA.bind(() => model, "maxWidth"),
                maxHeight: UECA.bind(() => model, "maxHeight"),
                padding: UECA.bind(() => model, "padding"),
                backgroundColor: UECA.bind(() => model, "backgroundColor") as UECA.Bond<Palette>,
                overflow: UECA.bind(() => model, "overflow"),
                horizontalAlign: UECA.bind(() => model, "horizontalAlign"),
                fill: UECA.bind(() => model, "fill"),
                content: UECA.bind(() => model, "content"),
                onReset: () => model.resetProperties()
            }),

            preview: useBlockPreview({
                width: UECA.bind(() => model, "width"),
                height: UECA.bind(() => model, "height"),
                minWidth: UECA.bind(() => model, "minWidth"),
                minHeight: UECA.bind(() => model, "minHeight"),
                maxWidth: UECA.bind(() => model, "maxWidth"),
                maxHeight: UECA.bind(() => model, "maxHeight"),
                padding: UECA.bind(() => model, "padding"),
                backgroundColor: UECA.bind(() => model, "backgroundColor") as UECA.Bond<Palette>,
                overflow: UECA.bind(() => model, "overflow"),
                horizontalAlign: UECA.bind(() => model, "horizontalAlign"),
                fill: UECA.bind(() => model, "fill"),
                content: UECA.bind(() => model, "content")
            })
        },

        methods: {
            resetProperties: () => {
                model.width = "400px";
                model.height = "200px";
                model.minWidth = "";
                model.minHeight = "";
                model.maxWidth = "";
                model.maxHeight = "";
                model.padding = "medium";
                model.backgroundColor = "primary.main";
                model.overflow = "visible";
                model.horizontalAlign = "left";
                model.fill = false;
                model.content = "Block Content";
                model.alertInformation("Properties reset to defaults");
            }
        },

        View: () => <model.crudScreen.View />
    }

    const model = useUIBase(struct, params);
    return model;
}

const BlockScreen = UECA.getFC(useBlockScreen);

export { BlockScreenParams, BlockScreenModel, useBlockScreen, BlockScreen };
