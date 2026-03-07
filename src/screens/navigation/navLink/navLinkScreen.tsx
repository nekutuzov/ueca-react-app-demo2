import * as UECA from "ueca-react";
import {
    ScreenBaseModel, ScreenBaseParams, ScreenBaseStruct, useScreenBase, Row, Col
} from "@components";
import { CRUDScreenModel, useCRUDScreen } from "@core";
import { NavLinkPropertiesEditorModel, useNavLinkPropertiesEditor } from "./navLinkPropertiesEditor";
import { NavLinkPreviewModel, useNavLinkPreview } from "./navLinkPreview";
import { NavLinkExamplesModel, useNavLinkExamples } from "./navLinkExamples";

type NavLinkScreenStruct = ScreenBaseStruct<{
    children: {
        crudScreen: CRUDScreenModel;
        propertiesEditor: NavLinkPropertiesEditorModel;
        preview: NavLinkPreviewModel;
        examples: NavLinkExamplesModel;
    };

    methods: {
        resetProperties: () => void;
    };
}>;

type NavLinkScreenParams = ScreenBaseParams<NavLinkScreenStruct>;
type NavLinkScreenModel = ScreenBaseModel<NavLinkScreenStruct>;

function useNavLinkScreen(params?: NavLinkScreenParams): NavLinkScreenModel {
    const struct: NavLinkScreenStruct = {
        props: {
            id: useNavLinkScreen.name
        },

        children: {
            crudScreen: useCRUDScreen({
                intent: "none",
                breadcrumbs: [
                    { route: { path: "/" }, label: "Home" },
                    { route: { path: "/navlink" }, label: "NavLink Component" }
                ],
                contentView: () => (
                    <Col padding="medium" spacing="large">
                        <Col spacing="medium">
                            <h1>NavLink Component</h1>                            
                        </Col>
                        <Row spacing="large" fill flexWrap="wrap">
                            <model.propertiesEditor.View />
                            <model.preview.View />
                        </Row>
                        <model.examples.View />
                    </Col>
                )
            }),

            propertiesEditor: useNavLinkPropertiesEditor({
                onReset: () => model.resetProperties()
            }),

            preview: useNavLinkPreview({
                text: UECA.bind(() => model.propertiesEditor, "text"),
                color: UECA.bind(() => model.propertiesEditor, "color"),
                underline: UECA.bind(() => model.propertiesEditor, "underline"),
                disabled: UECA.bind(() => model.propertiesEditor, "disabled"),
                newTab: UECA.bind(() => model.propertiesEditor, "newTab")
            }),

            examples: useNavLinkExamples()
        },

        methods: {
            resetProperties: () => {
                model.propertiesEditor.text = "Navigation Link";
                model.propertiesEditor.color = "primary.main";
                model.propertiesEditor.underline = "hover";
                model.propertiesEditor.disabled = false;
                model.propertiesEditor.newTab = false;
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

const NavLinkScreen = UECA.getFC(useNavLinkScreen);

export { NavLinkScreenParams, NavLinkScreenModel, useNavLinkScreen, NavLinkScreen };
