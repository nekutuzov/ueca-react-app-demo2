import * as UECA from "ueca-react";
import {
    Row, Col, ScreenBaseStruct, ScreenBaseParams, ScreenBaseModel, useScreenBase
} from "@components";
import { CRUDScreenModel, useCRUDScreen } from "@core";
import { IconButtonPropertiesEditorModel, useIconButtonPropertiesEditor } from "./iconButtonPropertiesEditor";
import { IconButtonPreviewModel, useIconButtonPreview } from "./iconButtonPreview";

type IconButtonScreenStruct = ScreenBaseStruct<{
    children: {
        crudScreen: CRUDScreenModel;
        propertiesEditor: IconButtonPropertiesEditorModel;
        preview: IconButtonPreviewModel;
    };

    methods: {
        resetProperties: () => void;
        handleTestIconButtonClick: () => void;
    };
}>;

type IconButtonScreenParams = ScreenBaseParams<IconButtonScreenStruct>;
type IconButtonScreenModel = ScreenBaseModel<IconButtonScreenStruct>;

function useIconButtonScreen(params?: IconButtonScreenParams): IconButtonScreenModel {
    const struct: IconButtonScreenStruct = {
        props: {
            id: useIconButtonScreen.name
        },

        children: {
            crudScreen: useCRUDScreen({
                intent: "none",
                breadcrumbs: [
                    { route: { path: "/" }, label: "Home" },
                    { route: { path: "/icon-button" }, label: "IconButton Component" }
                ],
                contentView: () => (
                    <Col fill overflow="auto" padding="medium" spacing="large">
                        <Col spacing="medium">
                            <h1>IconButton Component</h1>
                        </Col>
                        <Row spacing="large" fill flexWrap="wrap">
                            <model.propertiesEditor.View />
                            <model.preview.View />
                        </Row>
                    </Col>
                )
            }),

            propertiesEditor: useIconButtonPropertiesEditor({
                onReset: () => model.resetProperties()
            }),

            preview: useIconButtonPreview({
                kind: UECA.bind(() => model.propertiesEditor, "kind"),
                size: UECA.bind(() => model.propertiesEditor, "size"),
                color: UECA.bind(() => model.propertiesEditor, "color"),
                disabled: UECA.bind(() => model.propertiesEditor, "disabled"),
                useCustomIcon: UECA.bind(() => model.propertiesEditor, "useCustomIcon"),
                onIconButtonClick: () => model.handleTestIconButtonClick()
            })
        },

        methods: {
            resetProperties: () => {
                model.propertiesEditor.kind = "ok";
                model.propertiesEditor.size = "medium";
                model.propertiesEditor.color = "primary.main";
                model.propertiesEditor.disabled = false;
                model.propertiesEditor.useCustomIcon = false;
                model.preview.clickCount = 0;
            },

            handleTestIconButtonClick: () => {
                model.preview.clickCount++;
                model.alertSuccess(`IconButton clicked! Count: ${model.preview.clickCount}`);
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

const IconButtonScreen = UECA.getFC(useIconButtonScreen);

export { IconButtonScreenParams, IconButtonScreenModel, useIconButtonScreen, IconButtonScreen };
