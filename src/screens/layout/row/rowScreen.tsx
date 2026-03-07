import * as UECA from "ueca-react";
import {
    ScreenBaseModel, ScreenBaseParams, ScreenBaseStruct, useScreenBase,
    Row, Col
} from "@components";
import { CRUDScreenModel, useCRUDScreen } from "@core";
import { RowPropertiesEditorModel, useRowPropertiesEditor } from "./rowPropertiesEditor";
import { RowPreviewModel, useRowPreview } from "./rowPreview";

type RowScreenStruct = ScreenBaseStruct<{
    children: {
        crudScreen: CRUDScreenModel;
        propertiesEditor: RowPropertiesEditorModel;
        preview: RowPreviewModel;
    };

    methods: {
        resetProperties: () => void;
    };
}>;

type RowScreenParams = ScreenBaseParams<RowScreenStruct>;
type RowScreenModel = ScreenBaseModel<RowScreenStruct>;

function useRowScreen(params?: RowScreenParams): RowScreenModel {
    const struct: RowScreenStruct = {
        props: {
            id: useRowScreen.name
        },

        children: {
            crudScreen: useCRUDScreen({
                intent: "none",
                breadcrumbs: [
                    { route: { path: "/" }, label: "Home" },
                    { route: { path: "/row" }, label: "Row Component" }
                ],
                contentView: () => (
                    <Col fill overflow="auto" padding="medium" spacing="large">
                        <Col spacing="medium">
                            <h1>Row Component</h1>                            
                        </Col>
                        <Row spacing="large" fill flexWrap="wrap">                            
                            <model.propertiesEditor.View />
                            <model.preview.View />
                        </Row>
                    </Col>
                )
            }),

            propertiesEditor: useRowPropertiesEditor({
                onReset: () => model.resetProperties()
            }),

            preview: useRowPreview({
                spacing: UECA.bind(() => model.propertiesEditor, "spacing"),
                horizontalAlign: UECA.bind(() => model.propertiesEditor, "horizontalAlign"),
                verticalAlign: UECA.bind(() => model.propertiesEditor, "verticalAlign"),
                padding: UECA.bind(() => model.propertiesEditor, "padding"),
                backgroundColor: UECA.bind(() => model.propertiesEditor, "backgroundColor"),
                reverseItems: UECA.bind(() => model.propertiesEditor, "reverseItems"),
                divider: UECA.bind(() => model.propertiesEditor, "divider"),
                flexWrap: UECA.bind(() => model.propertiesEditor, "flexWrap"),
                fill: UECA.bind(() => model.propertiesEditor, "fill"),
                width: UECA.bind(() => model.propertiesEditor, "width"),
                height: UECA.bind(() => model.propertiesEditor, "height"),
                childrenCount: UECA.bind(() => model.propertiesEditor, "childrenCount")
            })
        },

        methods: {
            resetProperties: () => {
                model.propertiesEditor.spacing = "medium";
                model.propertiesEditor.horizontalAlign = "left";
                model.propertiesEditor.verticalAlign = "top";
                model.propertiesEditor.padding = "medium";
                model.propertiesEditor.backgroundColor = "transparent";
                model.propertiesEditor.reverseItems = false;
                model.propertiesEditor.divider = false;
                model.propertiesEditor.flexWrap = "nowrap";
                model.propertiesEditor.fill = false;
                model.propertiesEditor.width = "";
                model.propertiesEditor.height = "200px";
                model.propertiesEditor.childrenCount = 3;
            }
        },

        constr: () => {
            model.resetProperties();
        },

        View: () => <model.crudScreen.View />
    }

    const model = useScreenBase(struct, params);
    return model;
}

const RowScreen = UECA.getFC(useRowScreen);

export { RowScreenParams, RowScreenModel, useRowScreen, RowScreen };
