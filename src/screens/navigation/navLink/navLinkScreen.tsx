import * as UECA from "ueca-react";
import {
    ScreenBaseModel, ScreenBaseParams, ScreenBaseStruct, useScreenBase, Row, Col, NavLinkUnderline
} from "@components";
import { CRUDScreenModel, useCRUDScreen, Palette } from "@core";
import { NavLinkPropertiesEditorModel, useNavLinkPropertiesEditor } from "./navLinkPropertiesEditor";
import { NavLinkPreviewModel, useNavLinkPreview } from "./navLinkPreview";
import { NavLinkExamplesModel, useNavLinkExamples } from "./navLinkExamples";

type NavLinkScreenStruct = ScreenBaseStruct<{
    props: {
        text: string;
        color: Palette;
        underline: NavLinkUnderline;
        disabled: boolean;
        newTab: boolean;
    };

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
            id: useNavLinkScreen.name,
            text: "Navigation Link",
            color: "primary.main",
            underline: "hover",
            disabled: false,
            newTab: false
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
                text: UECA.bind(() => model, "text"),
                color: UECA.bind(() => model, "color"),
                underline: UECA.bind(() => model, "underline"),
                disabled: UECA.bind(() => model, "disabled"),
                newTab: UECA.bind(() => model, "newTab"),
                onReset: () => model.resetProperties()
            }),

            preview: useNavLinkPreview({
                text: UECA.bind(() => model, "text"),
                color: UECA.bind(() => model, "color"),
                underline: UECA.bind(() => model, "underline"),
                disabled: UECA.bind(() => model, "disabled"),
                newTab: UECA.bind(() => model, "newTab")
            }),

            examples: useNavLinkExamples()
        },

        methods: {
            resetProperties: () => {
                model.text = "Navigation Link";
                model.color = "primary.main";
                model.underline = "hover";
                model.disabled = false;
                model.newTab = false;
                model.alertInformation("Properties reset to defaults");
            }
        },

        View: () => <model.crudScreen.View />
    };

    const model = useScreenBase(struct, params);
    return model;
}

const NavLinkScreen = UECA.getFC(useNavLinkScreen);

export { NavLinkScreenParams, NavLinkScreenModel, useNavLinkScreen, NavLinkScreen };
