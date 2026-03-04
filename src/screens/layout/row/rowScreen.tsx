import * as UECA from "ueca-react";
import {
    UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase,
    Row, Col
} from "@components";
import { CRUDScreenModel, useCRUDScreen, Palette } from "@core";
import { RowPropertiesEditorModel, useRowPropertiesEditor } from "./rowPropertiesEditor";
import { RowPreviewModel, useRowPreview } from "./rowPreview";

type RowScreenStruct = UIBaseStruct<{
    props: {
        // Row properties
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

    children: {
        crudScreen: CRUDScreenModel;
        propertiesEditor: RowPropertiesEditorModel;
        preview: RowPreviewModel;
    };

    methods: {
        resetProperties: () => void;
    };
}>;

type RowScreenParams = UIBaseParams<RowScreenStruct>;
type RowScreenModel = UIBaseModel<RowScreenStruct>;

function useRowScreen(params?: RowScreenParams): RowScreenModel {
    const struct: RowScreenStruct = {
        props: {
            id: useRowScreen.name,
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
            height: "200px",
            childrenCount: 3
        },

        children: {
            crudScreen: useCRUDScreen({
                intent: "none",
                breadcrumbs: [
                    { route: { path: "/" }, label: "Home" },
                    { route: { path: "/layout/row" }, label: "Layout" },
                    { route: { path: "/layout/row" }, label: "Row Component" }
                ],
                contentView: () => (
                    <Col fill overflow="auto" padding="medium" spacing="large">
                        <Col spacing="medium">
                            <h1>Row Component</h1>
                            <p>Modify row properties and see the changes in real-time.</p>
                        </Col>
                        <Row spacing="large" fill flexWrap="wrap">
                            <model.propertiesEditor.View />
                            <model.preview.View />
                        </Row>
                    </Col>
                )
            }),

            propertiesEditor: useRowPropertiesEditor({
                spacing: UECA.bind(() => model, "spacing"),
                horizontalAlign: UECA.bind(() => model, "horizontalAlign"),
                verticalAlign: UECA.bind(() => model, "verticalAlign"),
                padding: UECA.bind(() => model, "padding"),
                backgroundColor: UECA.bind(() => model, "backgroundColor") as UECA.Bond<Palette>,
                reverseItems: UECA.bind(() => model, "reverseItems"),
                divider: UECA.bind(() => model, "divider"),
                flexWrap: UECA.bind(() => model, "flexWrap"),
                fill: UECA.bind(() => model, "fill"),
                width: UECA.bind(() => model, "width"),
                height: UECA.bind(() => model, "height"),
                childrenCount: UECA.bind(() => model, "childrenCount"),
                onReset: () => model.resetProperties()
            }),

            preview: useRowPreview({
                spacing: UECA.bind(() => model, "spacing"),
                horizontalAlign: UECA.bind(() => model, "horizontalAlign"),
                verticalAlign: UECA.bind(() => model, "verticalAlign"),
                padding: UECA.bind(() => model, "padding"),
                backgroundColor: UECA.bind(() => model, "backgroundColor") as UECA.Bond<Palette>,
                reverseItems: UECA.bind(() => model, "reverseItems"),
                divider: UECA.bind(() => model, "divider"),
                flexWrap: UECA.bind(() => model, "flexWrap"),
                fill: UECA.bind(() => model, "fill"),
                width: UECA.bind(() => model, "width"),
                height: UECA.bind(() => model, "height"),
                childrenCount: UECA.bind(() => model, "childrenCount")
            })
        },

        methods: {
            resetProperties: () => {
                model.spacing = "medium";
                model.horizontalAlign = "left";
                model.verticalAlign = "center";
                model.padding = "medium";
                model.backgroundColor = "transparent";
                model.reverseItems = false;
                model.divider = false;
                model.flexWrap = "nowrap";
                model.fill = false;
                model.width = "";
                model.height = "";
                model.childrenCount = 3;
                model.alertInformation("Properties reset to defaults");
            }
        },

        View: () => <model.crudScreen.View />
    }

    const model = useUIBase(struct, params);
    return model;
}

const RowScreen = UECA.getFC(useRowScreen);

export { RowScreenParams, RowScreenModel, useRowScreen, RowScreen };
