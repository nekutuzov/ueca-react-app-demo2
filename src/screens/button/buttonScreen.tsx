import * as UECA from "ueca-react";
import {
    UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase,
    Button, Row, Col, Block, TextField, RadioGroup, Select, Checkbox
} from "@components";
import { CRUDScreenModel, useCRUDScreen, Palette } from "@core";

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
    };

    methods: {
        resetProperties: () => void;
        _PropertiesEditorView: () => React.ReactElement;
        _PreviewAreaView: () => React.ReactElement;
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
                            <p>Modify button properties and see the changes in real-time.</p>
                        </Col>
                        <Row spacing="large" fill flexWrap="wrap">
                            <model._PropertiesEditorView />
                            <model._PreviewAreaView />
                        </Row>
                    </Col>
                )
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

            _PropertiesEditorView: () => {
                return (
                    <Col spacing="medium" sx={{ flex: "1 1 400px", minWidth: "300px" }}>
                        <h2>Properties</h2>
                        <TextField
                            labelView="Button Text"
                            value={UECA.bind(() => model, "buttonText")}
                            placeholder="Enter button text"
                            fullWidth                            
                        />

                        <RadioGroup
                            labelView="Variant"                            
                            value={UECA.bind(() => model, "variant") as UECA.Bond<string | number>}
                            options={[
                                { value: "text", label: "Text" },
                                { value: "outlined", label: "Outlined" },
                                { value: "contained", label: "Contained" }
                            ]}
                            orientation="row"
                        />

                        <RadioGroup
                            labelView="Size"
                            value={UECA.bind(() => model, "size") as UECA.Bond<string | number>}
                            options={[
                                { value: "small", label: "Small" },
                                { value: "medium", label: "Medium" },
                                { value: "large", label: "Large" }
                            ]}
                            orientation="row"
                        />

                        <Select
                            labelView="Color"
                            value={UECA.bind(() => model, "color") as UECA.Bond<string | number>}
                            options={[
                                { value: "primary.main", label: "Primary" },
                                { value: "secondary.main", label: "Secondary" },
                                { value: "success.main", label: "Success" },
                                { value: "error.main", label: "Error" },
                                { value: "warning.main", label: "Warning" },
                                { value: "info.main", label: "Info" }
                            ]}
                            fullWidth
                        />

                        <Checkbox
                            labelView="Disabled"
                            checked={UECA.bind(() => model, "disabled")}
                        />

                        <Checkbox
                            labelView="Full Width"
                            checked={UECA.bind(() => model, "fullWidth")}
                        />

                        <Block padding={{ top: "medium" }}>
                            <Button
                                contentView="Reset to Defaults"
                                variant="outlined"
                                color="secondary.main"
                                size="small"
                                onClick={model.resetProperties}
                            />
                        </Block>
                    </Col>
                );
            },

            _PreviewAreaView: () => {
                return (
                    <Col spacing="medium" sx={{ flex: "1 1 400px", minWidth: "300px" }}>
                        <h2>Preview</h2>
                        <Block
                            padding="large"
                            backgroundColor="background.paper"
                            sx={{
                                border: "1px solid #e0e0e0",
                                borderRadius: "8px",
                                minHeight: "200px"
                            }}
                        >
                            <Col spacing={"medium"} horizontalAlign={"center"} verticalAlign={"center"}>
                                <Button
                                    contentView={model.buttonText}
                                    variant={model.variant}
                                    size={model.size}
                                    color={model.color}
                                    disabled={model.disabled}
                                    fullWidth={model.fullWidth}
                                    onClick={_handleTestButtonClick}
                                />

                                <Block padding={{ top: "large" }}>
                                    <p style={{ textAlign: "center", color: "#666" }}>
                                        Click count: <strong>{model.clickCount}</strong>
                                    </p>
                                </Block>
                            </Col>
                        </Block>

                        {/* Code Display */}
                        <Col spacing={"medium"} padding={{ top: "medium" }}>
                            <h2>JSX Code</h2>
                            <Block
                                backgroundColor="background.default"
                                padding="medium"
                                sx={{
                                    border: "1px solid #e0e0e0",
                                    borderRadius: "4px",
                                    fontFamily: "monospace",
                                    fontSize: "12px",
                                    overflowX: "auto"
                                }}
                            >
                                <pre style={{ margin: 0 }}>
                                    {`<Button
    contentView="${model.buttonText}"
    variant="${model.variant}"
    size="${model.size}"
    color="${model.color}"
    disabled={${model.disabled}}
    fullWidth={${model.fullWidth}}
    onClick={handleClick}
/>`}</pre>
                            </Block>
                        </Col>
                    </Col>
                );
            }
        },

        View: () => <model.crudScreen.View />
    }

    const model = useUIBase(struct, params);
    return model;


    // Private methods
    function _handleTestButtonClick() {
        model.clickCount++;
        model.alertSuccess(`Button clicked! Count: ${model.clickCount}`);
    }
}

const ButtonScreen = UECA.getFC(useButtonScreen);

export { ButtonScreenParams, ButtonScreenModel, useButtonScreen, ButtonScreen };
