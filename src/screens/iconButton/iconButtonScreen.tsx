import * as UECA from "ueca-react";
import {
    UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase,
    Row, Col
} from "@components";
import { CRUDScreenModel, useCRUDScreen, Palette } from "@core";
import { IconButtonPropertiesEditorModel, useIconButtonPropertiesEditor } from "./iconButtonPropertiesEditor";
import { IconButtonPreviewModel, useIconButtonPreview } from "./iconButtonPreview";

type IconKind = "ok" | "cancel" | "delete" | "refresh" | "close";

type IconButtonScreenStruct = UIBaseStruct<{
    props: {
        // IconButton properties
        kind: IconKind;
        size: "small" | "medium" | "large";
        color: Palette | "inherit";
        disabled: boolean;
        useCustomIcon: boolean;
        clickCount: number;
    };

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

type IconButtonScreenParams = UIBaseParams<IconButtonScreenStruct>;
type IconButtonScreenModel = UIBaseModel<IconButtonScreenStruct>;

function useIconButtonScreen(params?: IconButtonScreenParams): IconButtonScreenModel {
    const struct: IconButtonScreenStruct = {
        props: {
            id: useIconButtonScreen.name,
            kind: "ok",
            size: "medium",
            color: "primary.main",
            disabled: false,
            useCustomIcon: false,
            clickCount: 0
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
                            <p>Modify properties and see the changes in real-time.</p>
                        </Col>
                        <Row spacing="large" fill flexWrap="wrap">
                            <model.propertiesEditor.View />
                            <model.preview.View />
                        </Row>
                    </Col>
                )
            }),

            propertiesEditor: useIconButtonPropertiesEditor({
                kind: UECA.bind(() => model, "kind"),
                size: UECA.bind(() => model, "size"),
                color: UECA.bind(() => model, "color") as UECA.Bond<Palette | "inherit">,
                disabled: UECA.bind(() => model, "disabled"),
                useCustomIcon: UECA.bind(() => model, "useCustomIcon"),
                onReset: () => model.resetProperties()
            }),

            preview: useIconButtonPreview({
                kind: UECA.bind(() => model, "kind"),
                size: UECA.bind(() => model, "size"),
                color: UECA.bind(() => model, "color") as UECA.Bond<Palette | "inherit">,
                disabled: UECA.bind(() => model, "disabled"),
                useCustomIcon: UECA.bind(() => model, "useCustomIcon"),
                clickCount: UECA.bind(() => model, "clickCount"),
                onIconButtonClick: () => model.handleTestIconButtonClick()
            })
        },

        methods: {
            resetProperties: () => {
                model.kind = "ok";
                model.size = "medium";
                model.color = "primary.main";
                model.disabled = false;
                model.useCustomIcon = false;
                model.clickCount = 0;
                model.alertInformation("Properties reset to defaults");
            },

            handleTestIconButtonClick: () => {
                model.clickCount++;
                model.alertSuccess(`IconButton clicked! Count: ${model.clickCount}`);
            }
        },

        View: () => <model.crudScreen.View />
    }

    const model = useUIBase(struct, params);
    return model;
}

const IconButtonScreen = UECA.getFC(useIconButtonScreen);

export { IconButtonScreenParams, IconButtonScreenModel, useIconButtonScreen, IconButtonScreen };
