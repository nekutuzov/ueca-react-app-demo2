import * as UECA from "ueca-react";
import {
    ScreenBaseModel, ScreenBaseParams, ScreenBaseStruct, useScreenBase,
    Row, Col
} from "@components";
import { CRUDScreenModel, useCRUDScreen, Palette } from "@core";
import { ColPropertiesEditorModel, useColPropertiesEditor } from "./colPropertiesEditor";
import { ColPreviewModel, useColPreview } from "./colPreview";

type ColScreenStruct = ScreenBaseStruct<{
    props: {
        // Col properties
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
        propertiesEditor: ColPropertiesEditorModel;
        preview: ColPreviewModel;
    };

    methods: {
        resetProperties: () => void;
    };
}>;

type ColScreenParams = ScreenBaseParams<ColScreenStruct>;
type ColScreenModel = ScreenBaseModel<ColScreenStruct>;

function useColScreen(params?: ColScreenParams): ColScreenModel {
    const struct: ColScreenStruct = {
        props: {
            id: useColScreen.name,
            spacing: "medium",
            horizontalAlign: "left",
            verticalAlign: "top",
            padding: "medium",
            backgroundColor: "transparent",
            reverseItems: false,
            divider: false,
            flexWrap: "nowrap",
            fill: false,
            width: "400px",
            height: "",
            childrenCount: 3
        },

        children: {
            crudScreen: useCRUDScreen({
                intent: "none",
                breadcrumbs: [
                    { route: { path: "/" }, label: "Home" },
                    { route: { path: "/col" }, label: "Col Component" }
                ],
                contentView: () => (
                    <Col fill overflow="auto" padding="medium" spacing="large">
                        <Col spacing="medium">
                            <h1>Col Component</h1>                            
                        </Col>
                        <Row spacing="large" fill flexWrap="wrap">
                            <model.propertiesEditor.View />
                            <model.preview.View />
                        </Row>
                    </Col>
                )
            }),

            propertiesEditor: useColPropertiesEditor({
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

            preview: useColPreview({
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
                model.verticalAlign = "top";
                model.padding = "medium";
                model.backgroundColor = "transparent";
                model.reverseItems = false;
                model.divider = false;
                model.flexWrap = "nowrap";
                model.fill = false;
                model.width = "400px";
                model.height = "";
                model.childrenCount = 3;
                model.alertInformation("Properties reset to defaults");
            }
        },

        View: () => <model.crudScreen.View />
    }

    const model = useScreenBase(struct, params);
    return model;
}

const ColScreen = UECA.getFC(useColScreen);

export { ColScreenParams, ColScreenModel, useColScreen, ColScreen };
