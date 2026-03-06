import * as UECA from "ueca-react";
import {
    UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase,
    Row, Col,
    NavItemMode
} from "@components";
import { CRUDScreenModel, useCRUDScreen } from "@core";
import { NavItemPropertiesEditorModel, useNavItemPropertiesEditor } from "./navItemPropertiesEditor";
import { NavItemPreviewModel, useNavItemPreview } from "./navItemPreview";
import { NavItemExamplesModel, useNavItemExamples } from "./navItemExamples";

type NavItemScreenStruct = UIBaseStruct<{
    props: {
        text: string;
        mode: NavItemMode;
        disabled: boolean;
        newTab: boolean;
        active: boolean;
    };

    children: {
        crudScreen: CRUDScreenModel;
        propertiesEditor: NavItemPropertiesEditorModel;
        preview: NavItemPreviewModel;
        examples: NavItemExamplesModel;
    };

    methods: {
        resetProperties: () => void;
    };
}>;

type NavItemScreenParams = UIBaseParams<NavItemScreenStruct>;
type NavItemScreenModel = UIBaseModel<NavItemScreenStruct>;

function useNavItemScreen(params?: NavItemScreenParams): NavItemScreenModel {
    const struct: NavItemScreenStruct = {
        props: {
            id: useNavItemScreen.name,
            text: "Navigation Item",
            mode: "icon-text",
            disabled: false,
            newTab: false,
            active: false
        },

        children: {
            crudScreen: useCRUDScreen({
                intent: "none",
                breadcrumbs: [
                    { route: { path: "/" }, label: "Home" },
                    { route: { path: "/navitem" }, label: "NavItem Component" }
                ],
                contentView: () => (
                    <Col fill overflow="auto" padding="medium" spacing="large">
                        <Col spacing="medium">
                            <h1>NavItem Component</h1>
                            <p>Full-featured navigation menu item with icon support and visual states (active, hover, disabled). Perfect for sidebar menus and navigation lists.</p>
                        </Col>
                        <Row spacing="large" fill flexWrap="wrap">
                            <model.propertiesEditor.View />
                            <model.preview.View />
                        </Row>
                        <model.examples.View />
                    </Col>
                )
            }),

            propertiesEditor: useNavItemPropertiesEditor({
                text: UECA.bind(() => model, "text"),
                mode: UECA.bind(() => model, "mode"),
                disabled: UECA.bind(() => model, "disabled"),
                newTab: UECA.bind(() => model, "newTab"),
                active: UECA.bind(() => model, "active"),
                onReset: () => model.resetProperties()
            }),

            preview: useNavItemPreview({
                text: UECA.bind(() => model, "text"),
                mode: UECA.bind(() => model, "mode"),
                disabled: UECA.bind(() => model, "disabled"),
                newTab: UECA.bind(() => model, "newTab"),
                active: UECA.bind(() => model, "active")
            }),

            examples: useNavItemExamples()
        },

        methods: {
            resetProperties: () => {
                model.text = "Navigation Item";
                model.mode = "icon-text";
                model.disabled = false;
                model.newTab = false;
                model.active = false;
                model.alertInformation("Properties reset to defaults");
            }
        },

        View: () => <model.crudScreen.View />
    };

    const model = useUIBase(struct, params);
    return model;
}

const NavItemScreen = UECA.getFC(useNavItemScreen);

export { NavItemScreenParams, NavItemScreenModel, useNavItemScreen, NavItemScreen };
