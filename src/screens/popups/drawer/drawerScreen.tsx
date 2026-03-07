import * as UECA from "ueca-react";
import {
    ScreenBaseModel, ScreenBaseParams, ScreenBaseStruct, useScreenBase,
    Row, Col
} from "@components";
import { CRUDScreenModel, useCRUDScreen } from "@core";
import { DrawerPropertiesEditorModel, useDrawerPropertiesEditor } from "./drawerPropertiesEditor";
import { DrawerPreviewModel, useDrawerPreview } from "./drawerPreview";

type DrawerScreenStruct = ScreenBaseStruct<{
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
            id: useDrawerScreen.name
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
                onReset: () => model.resetProperties()
            }),

            preview: useDrawerPreview({
                anchor: UECA.bind(() => model.propertiesEditor, "anchor"),
                severity: UECA.bind(() => model.propertiesEditor, "severity"),
                buttonType: UECA.bind(() => model.propertiesEditor, "buttonType"),
                width: UECA.bind(() => model.propertiesEditor, "width")
            })
        },

        methods: {
            resetProperties: () => {
                model.propertiesEditor.anchor = "right";
                model.propertiesEditor.severity = undefined;
                model.propertiesEditor.buttonType = "cancel";
                model.propertiesEditor.width = 600;
            }
        },

        constr: () => {
            model.resetProperties();
        },

        View: () => <model.crudScreen.View />
    };

    const model = useScreenBase(struct, params);
    return model;
}

const DrawerScreen = UECA.getFC(useDrawerScreen);

export { DrawerScreenParams, DrawerScreenModel, useDrawerScreen, DrawerScreen };
