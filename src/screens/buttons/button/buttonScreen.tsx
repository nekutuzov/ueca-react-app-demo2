import * as UECA from "ueca-react";
import {
    UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase,
    Row, Col
} from "@components";
import { CRUDScreenModel, useCRUDScreen, Palette } from "@core";
import { ButtonPropertiesEditorModel, useButtonPropertiesEditor } from "./buttonPropertiesEditor";
import { ButtonPreviewModel, useButtonPreview } from "./buttonPreview";

type ButtonScreenStruct = UIBaseStruct<{
    props: {
        // Button properties
        buttonText: string;
        variant: "text" | "outlined" | "contained";
        size: "small" | "medium" | "large";
        color: Palette;
        disabled: boolean;
        fullWidth: boolean;
        clickCount: number;
    };

    children: {
        crudScreen: CRUDScreenModel;
        propertiesEditor: ButtonPropertiesEditorModel;
        preview: ButtonPreviewModel;
    };

    methods: {
        resetProperties: () => void;
        handleTestButtonClick: () => void;
    };
}>;

type ButtonScreenParams = UIBaseParams<ButtonScreenStruct>;
type ButtonScreenModel = UIBaseModel<ButtonScreenStruct>;

function useButtonScreen(params?: ButtonScreenParams): ButtonScreenModel {
    const struct: ButtonScreenStruct = {
        props: {
            id: useButtonScreen.name,
            buttonText: "Test Button",
            variant: "contained",
            size: "medium",
            color: "primary.main",
            disabled: false,
            fullWidth: false,
            clickCount: 0
        },

        children: {
            crudScreen: useCRUDScreen({
                intent: "none",
                breadcrumbs: [
                    { route: { path: "/" }, label: "Home" },
                    { route: { path: "/button" }, label: "Button Component" }
                ],
                contentView: () => (
                    <Col fill overflow="auto" padding="medium" spacing="large">
                        <Col spacing="medium">
                            <h1>Button Component</h1>                            
                        </Col>
                        <Row spacing="large" fill flexWrap="wrap">
                            <model.propertiesEditor.View />
                            <model.preview.View />
                        </Row>
                    </Col>
                )
            }),

            propertiesEditor: useButtonPropertiesEditor({
                buttonText: UECA.bind(() => model, "buttonText"),
                variant: UECA.bind(() => model, "variant"),
                size: UECA.bind(() => model, "size"),
                color: UECA.bind(() => model, "color") as UECA.Bond<Palette>,
                disabled: UECA.bind(() => model, "disabled"),
                fullWidth: UECA.bind(() => model, "fullWidth"),
                onReset: () => model.resetProperties()
            }),

            preview: useButtonPreview({
                buttonText: UECA.bind(() => model, "buttonText"),
                variant: UECA.bind(() => model, "variant"),
                size: UECA.bind(() => model, "size"),
                color: UECA.bind(() => model, "color") as UECA.Bond<Palette>,
                disabled: UECA.bind(() => model, "disabled"),
                fullWidth: UECA.bind(() => model, "fullWidth"),
                clickCount: UECA.bind(() => model, "clickCount"),
                onButtonClick: () => model.handleTestButtonClick()
            })
        },

        methods: {
            resetProperties: () => {
                model.buttonText = "Test Button";
                model.variant = "contained";
                model.size = "medium";
                model.color = "primary.main";
                model.disabled = false;
                model.fullWidth = false;
                model.clickCount = 0;
                model.alertInformation("Properties reset to defaults");
            },

            handleTestButtonClick: () => {
                model.clickCount++;
                model.alertSuccess(`Button clicked! Count: ${model.clickCount}`);
            }
        },

        View: () => <model.crudScreen.View />
    }

    const model = useUIBase(struct, params);
    return model;
}

const ButtonScreen = UECA.getFC(useButtonScreen);

export { ButtonScreenParams, ButtonScreenModel, useButtonScreen, ButtonScreen };
