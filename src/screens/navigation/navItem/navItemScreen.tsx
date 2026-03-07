import * as UECA from "ueca-react";
import {
    ScreenBaseModel, ScreenBaseParams, ScreenBaseStruct, useScreenBase,
    Row, Col
} from "@components";
import { CRUDScreenModel, useCRUDScreen } from "@core";
import { NavItemPropertiesEditorModel, useNavItemPropertiesEditor } from "./navItemPropertiesEditor";
import { NavItemPreviewModel, useNavItemPreview } from "./navItemPreview";
import { NavItemExamplesModel, useNavItemExamples } from "./navItemExamples";

type NavItemScreenStruct = ScreenBaseStruct<{
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

type NavItemScreenParams = ScreenBaseParams<NavItemScreenStruct>;
type NavItemScreenModel = ScreenBaseModel<NavItemScreenStruct>;

function useNavItemScreen(params?: NavItemScreenParams): NavItemScreenModel {
    const struct: NavItemScreenStruct = {
        props: {
            id: useNavItemScreen.name
        },

        children: {
            crudScreen: useCRUDScreen({
                intent: "none",
                breadcrumbs: [
                    { route: { path: "/" }, label: "Home" },
                    { route: { path: "/navitem" }, label: "NavItem Component" }
                ],
                contentView: () => (
                    <Col padding="medium" spacing="large">
                        <Col spacing="medium">
                            <h1>NavItem Component</h1>                  
                        </Col>
                        <Row spacing="large" flexWrap="wrap">
                            <model.propertiesEditor.View />
                            <model.preview.View />
                        </Row>
                        <model.examples.View />
                    </Col>
                )
            }),

            propertiesEditor: useNavItemPropertiesEditor({
                onReset: () => model.resetProperties()
            }),

            preview: useNavItemPreview({
                text: UECA.bind(() => model.propertiesEditor, "text"),
                mode: UECA.bind(() => model.propertiesEditor, "mode"),
                disabled: UECA.bind(() => model.propertiesEditor, "disabled"),
                newTab: UECA.bind(() => model.propertiesEditor, "newTab"),
                active: UECA.bind(() => model.propertiesEditor, "active")
            }),

            examples: useNavItemExamples()
        },

        methods: {
            resetProperties: () => {
                model.propertiesEditor.text = "Navigation Item";
                model.propertiesEditor.mode = "icon-text";
                model.propertiesEditor.disabled = false;
                model.propertiesEditor.newTab = false;
                model.propertiesEditor.active = false;
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

const NavItemScreen = UECA.getFC(useNavItemScreen);

export { NavItemScreenParams, NavItemScreenModel, useNavItemScreen, NavItemScreen };
