import * as UECA from "ueca-react";
import {
    ScreenBaseModel, ScreenBaseParams, ScreenBaseStruct, useScreenBase,
    Row, Col
} from "@components";
import { CRUDScreenModel, useCRUDScreen } from "@core";
import { BlockPropertiesEditorModel, useBlockPropertiesEditor } from "./blockPropertiesEditor";
import { BlockPreviewModel, useBlockPreview } from "./blockPreview";

type BlockScreenStruct = ScreenBaseStruct<{
    children: {
        crudScreen: CRUDScreenModel;
        propertiesEditor: BlockPropertiesEditorModel;
        preview: BlockPreviewModel;
    };

    methods: {
        resetProperties: () => void;
    };
}>;

type BlockScreenParams = ScreenBaseParams<BlockScreenStruct>;
type BlockScreenModel = ScreenBaseModel<BlockScreenStruct>;

function useBlockScreen(params?: BlockScreenParams): BlockScreenModel {
    const struct: BlockScreenStruct = {
        props: {
            id: useBlockScreen.name
        },

        children: {
            crudScreen: useCRUDScreen({
                intent: "none",
                breadcrumbs: [
                    { route: { path: "/" }, label: "Home" },
                    { route: { path: "/block" }, label: "Block Component" }
                ],
                contentView: () => (
                    <Col fill overflow="auto" padding="medium" spacing="large">
                        <Col spacing="medium">
                            <h1>Block Component</h1>                            
                        </Col>
                        <Row spacing="large" fill flexWrap="wrap">
                            <model.propertiesEditor.View />
                            <model.preview.View />
                        </Row>
                    </Col>
                )
            }),

            propertiesEditor: useBlockPropertiesEditor({
                onReset: () => model.resetProperties()
            }),

            preview: useBlockPreview({
                width: UECA.bind(() => model.propertiesEditor, "width"),
                height: UECA.bind(() => model.propertiesEditor, "height"),
                minWidth: UECA.bind(() => model.propertiesEditor, "minWidth"),
                minHeight: UECA.bind(() => model.propertiesEditor, "minHeight"),
                maxWidth: UECA.bind(() => model.propertiesEditor, "maxWidth"),
                maxHeight: UECA.bind(() => model.propertiesEditor, "maxHeight"),
                padding: UECA.bind(() => model.propertiesEditor, "padding"),
                backgroundColor: UECA.bind(() => model.propertiesEditor, "backgroundColor"),
                overflow: UECA.bind(() => model.propertiesEditor, "overflow"),
                horizontalAlign: UECA.bind(() => model.propertiesEditor, "horizontalAlign"),
                fill: UECA.bind(() => model.propertiesEditor, "fill"),
                content: UECA.bind(() => model.propertiesEditor, "content")
            })
        },

        methods: {
            resetProperties: () => {
                model.propertiesEditor.width = "400px";
                model.propertiesEditor.height = "200px";
                model.propertiesEditor.minWidth = "";
                model.propertiesEditor.minHeight = "";
                model.propertiesEditor.maxWidth = "";
                model.propertiesEditor.maxHeight = "";
                model.propertiesEditor.padding = "small";
                model.propertiesEditor.backgroundColor = "primary.main";
                model.propertiesEditor.overflow = "visible";
                model.propertiesEditor.horizontalAlign = "left";
                model.propertiesEditor.fill = false;
                model.propertiesEditor.content = "Block Content";
            }
        },

        constr: () => {
            // Initialize properties with default values on model construction
            model.resetProperties();
        },

        View: () => <model.crudScreen.View />
    }

    const model = useScreenBase(struct, params);
    return model;
}

const BlockScreen = UECA.getFC(useBlockScreen);

export { BlockScreenParams, BlockScreenModel, useBlockScreen, BlockScreen };
