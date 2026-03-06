import * as UECA from "ueca-react";
import {
    ScreenBaseModel, ScreenBaseParams, ScreenBaseStruct, useScreenBase,
    Row, Col
} from "@components";
import { CRUDScreenModel, useCRUDScreen } from "@core";
import { DrawerPropertiesEditorModel, useDrawerPropertiesEditor } from "./drawerPropertiesEditor";
import { DrawerPreviewModel, useDrawerPreview } from "./drawerPreview";

type DrawerAnchor = "left" | "top" | "right" | "bottom";
type DrawerSeverity = "success" | "info" | "warning" | "error" | undefined;
type DrawerButtonType = "ok" | "cancel" | "okCancel" | "none";

type DrawerScreenStruct = ScreenBaseStruct<{
    props: {
        anchor: DrawerAnchor;
        severity: DrawerSeverity;
        buttonType: DrawerButtonType;
        width: number;
    };

    children: {
        crudScreen: CRUDScreenModel;
        propertiesEditor: DrawerPropertiesEditorModel;
        preview: DrawerPreviewModel;
    };

    methods: {
        resetProperties: () => void;
    };
}>;

type DrawerScreenParams = ScreenBaseParams<DrawerScreenStruct>;
type DrawerScreenModel = ScreenBaseModel<DrawerScreenStruct>;

function useDrawerScreen(params?: DrawerScreenParams): DrawerScreenModel {
    const struct: DrawerScreenStruct = {
        props: {
            id: useDrawerScreen.name,
            anchor: "right",
            severity: undefined,
            buttonType: "cancel",
            width: 600
        },

        children: {
            crudScreen: useCRUDScreen({
                intent: "none",
                breadcrumbs: [
                    { route: { path: "/" }, label: "Home" },
                    { route: { path: "/drawer" }, label: "Alert Drawer Component" }
                ],
                contentView: () => (
                    <Col fill overflow="auto" padding="medium" spacing="large">
                        <Col spacing="medium">
                            <h1>AlertDrawer Component</h1>                            
                        </Col>
                        <Row spacing="large" fill flexWrap="wrap">
                            <model.propertiesEditor.View />
                            <model.preview.View />
                        </Row>
                    </Col>
                )
            }),

            propertiesEditor: useDrawerPropertiesEditor({
                anchor: UECA.bind(() => model, "anchor"),
                severity: UECA.bind(() => model, "severity"),
                buttonType: UECA.bind(() => model, "buttonType"),
                width: UECA.bind(() => model, "width"),
                onReset: () => model.resetProperties()
            }),

            preview: useDrawerPreview({
                anchor: UECA.bind(() => model, "anchor"),
                severity: UECA.bind(() => model, "severity"),
                buttonType: UECA.bind(() => model, "buttonType"),
                width: UECA.bind(() => model, "width")
            })
        },

        methods: {
            resetProperties: () => {
                model.anchor = "right";
                model.severity = undefined;
                model.buttonType = "cancel";
                model.width = 600;
                model.alertInformation("Properties reset to defaults");
            }
        },

        View: () => <model.crudScreen.View />
    };

    const model = useScreenBase(struct, params);
    return model;
}

const DrawerScreen = UECA.getFC(useDrawerScreen);

export { DrawerScreenParams, DrawerScreenModel, useDrawerScreen, DrawerScreen };
