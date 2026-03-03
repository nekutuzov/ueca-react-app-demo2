import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase, Button, Row, Col, Block, IconButton } from "@components";
import { CRUDScreenModel, useCRUDScreen, Breadcrumb } from "@core";

type ButtonScreenStruct = UIBaseStruct<{
    props: {
        clickCount: number;
    };

    children: {
        crudScreen: CRUDScreenModel;
    };

    methods: {
        handleClick: () => void;
    };
}>;

type ButtonScreenParams = UIBaseParams<ButtonScreenStruct>;
type ButtonScreenModel = UIBaseModel<ButtonScreenStruct>;

function useButtonScreen(params?: ButtonScreenParams): ButtonScreenModel {
    const struct: ButtonScreenStruct = {
        props: {
            id: useButtonScreen.name,
            clickCount: 0
        },

        children: {
            crudScreen: useCRUDScreen({
                intent: "none",
                breadcrumbs: [
                    { route: { path: "/" }, label: "Home" },
                    { route: { path: "/button" }, label: "Button Components" }
                ] as Breadcrumb[],
                contentView: () => (
                    <Col fill overflow={"auto"} padding={"medium"}>
                        <Block>
                            <h1>Button Component</h1>
                            <p>Demonstration of the Button component with various sizes, variants, and states.</p>
                        </Block>

                        {/* Variants Section */}
                        <Block>
                            <h2>Button Variants</h2>
                            <p>Buttons come in three variants: text, outlined, and contained.</p>
                            
                            <Row spacing="medium" padding={{ top: "small" }} verticalAlign="center">
                                <Button
                                    contentView="Text Button"
                                    variant="text"
                                    color="primary.main"
                                    onClick={() => model.alertInformation("Text button clicked")}
                                />
                                <Button
                                    contentView="Outlined Button"
                                    variant="outlined"
                                    color="primary.main"
                                    onClick={() => model.alertInformation("Outlined button clicked")}
                                />
                                <Button
                                    contentView="Contained Button"
                                    variant="contained"
                                    color="primary.main"
                                    onClick={() => model.alertInformation("Contained button clicked")}
                                />
                            </Row>
                        </Block>

                        {/* Sizes Section */}
                        <Block>
                            <h2>Button Sizes</h2>
                            <p>Buttons are available in three sizes: small, medium, and large.</p>
                            
                            <Row spacing="medium" padding={{ top: "small" }} verticalAlign="center">
                                <Button
                                    contentView="Small"
                                    variant="contained"
                                    color="primary.main"
                                    size="small"
                                    onClick={() => model.alertInformation("Small button clicked")}
                                />
                                <Button
                                    contentView="Medium"
                                    variant="contained"
                                    color="primary.main"
                                    size="medium"
                                    onClick={() => model.alertInformation("Medium button clicked")}
                                />
                                <Button
                                    contentView="Large"
                                    variant="contained"
                                    color="primary.main"
                                    size="large"
                                    onClick={() => model.alertInformation("Large button clicked")}
                                />
                            </Row>
                        </Block>

                        {/* Colors Section */}
                        <Block padding={{ bottom: "large" }}>
                            <h2>Button Colors</h2>
                            <p>Buttons support the full color palette from the theme.</p>
                            
                            <Row spacing="medium" padding={{ top: "small" }} verticalAlign="center" flexWrap="wrap">
                                <Button
                                    contentView="Primary"
                                    variant="contained"
                                    color="primary.main"
                                    onClick={() => model.alertInformation("Primary button")}
                                />
                                <Button
                                    contentView="Secondary"
                                    variant="contained"
                                    color="secondary.main"
                                    onClick={() => model.alertInformation("Secondary button")}
                                />
                                <Button
                                    contentView="Success"
                                    variant="contained"
                                    color="success.main"
                                    onClick={() => model.alertSuccess("Success button")}
                                />
                                <Button
                                    contentView="Error"
                                    variant="contained"
                                    color="error.main"
                                    onClick={() => model.alertError("Error button")}
                                />
                                <Button
                                    contentView="Warning"
                                    variant="contained"
                                    color="warning.main"
                                    onClick={() => model.alertWarning("Warning button")}
                                />
                                <Button
                                    contentView="Info"
                                    variant="contained"
                                    color="info.main"
                                    onClick={() => model.alertInformation("Info button")}
                                />
                            </Row>
                        </Block>

                        {/* States Section */}
                        <Block padding={{ bottom: "large" }}>
                            <h2>Button States</h2>
                            <p>Buttons can be disabled or in a loading state.</p>
                            
                            <Row spacing="medium" padding={{ top: "small" }} verticalAlign="center">
                                <Button
                                    contentView="Enabled"
                                    variant="contained"
                                    color="primary.main"
                                    disabled={false}
                                    onClick={() => model.alertInformation("Enabled button clicked")}
                                />
                                <Button
                                    contentView="Disabled"
                                    variant="contained"
                                    color="primary.main"
                                    disabled={true}
                                    onClick={() => model.alertInformation("This shouldn't fire")}
                                />
                            </Row>
                        </Block>

                        {/* Full Width Section */}
                        <Block padding={{ bottom: "large" }}>
                            <h2>Full Width Button</h2>
                            <p>Buttons can span the full width of their container.</p>
                            
                            <Block padding={{ top: "small" }} maxWidth="400px">
                                <Button
                                    contentView="Full Width Button"
                                    variant="contained"
                                    color="primary.main"
                                    fullWidth={true}
                                    onClick={() => model.alertInformation("Full width button clicked")}
                                />
                            </Block>
                        </Block>

                        {/* Icon Buttons Section */}
                        <Block padding={{ bottom: "large" }}>
                            <h2>Icon Buttons</h2>
                            <p>Icon-only buttons for common actions.</p>
                            
                            <Row spacing="medium" padding={{ top: "small" }} verticalAlign="center">
                                <IconButton
                                    kind="ok"
                                    size="medium"
                                    onClick={() => model.alertSuccess("OK!")}
                                />
                                <IconButton
                                    kind="cancel"
                                    size="medium"
                                    onClick={() => model.alertWarning("Cancelled")}
                                />
                                <IconButton
                                    kind="delete"
                                    size="medium"
                                    color="error.main"
                                    onClick={() => model.alertError("Deleted!")}
                                />
                                <IconButton
                                    kind="refresh"
                                    size="medium"
                                    onClick={() => model.alertInformation("Refreshing...")}
                                />
                                <IconButton
                                    kind="close"
                                    size="medium"
                                    onClick={() => model.alertInformation("Closed")}
                                />
                            </Row>

                            <h3 style={{ marginTop: "20px" }}>Icon Button Sizes</h3>
                            <Row spacing="medium" padding={{ top: "small" }} verticalAlign="center">
                                <IconButton
                                    kind="ok"
                                    size="small"
                                    onClick={() => model.alertInformation("Small icon button")}
                                />
                                <IconButton
                                    kind="ok"
                                    size="medium"
                                    onClick={() => model.alertInformation("Medium icon button")}
                                />
                                <IconButton
                                    kind="ok"
                                    size="large"
                                    onClick={() => model.alertInformation("Large icon button")}
                                />
                            </Row>

                            <h3 style={{ marginTop: "20px" }}>Custom Icon</h3>
                            <Row spacing="medium" padding={{ top: "small" }} verticalAlign="center">
                                <IconButton
                                    iconView={
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                        </svg>
                                    }
                                    color="warning.main"
                                    size="medium"
                                    onClick={() => model.alertInformation("Star clicked!")}
                                />
                            </Row>
                        </Block>

                        {/* Interactive Example */}
                        <Block padding={{ bottom: "large" }}>
                            <h2>Interactive Example</h2>
                            <p>Click counter: <strong>{model.clickCount}</strong></p>
                            
                            <Row spacing="medium" padding={{ top: "small" }} verticalAlign="center">
                                <Button
                                    contentView="Click Me!"
                                    variant="contained"
                                    color="primary.main"
                                    onClick={model.handleClick}
                                />
                                <Button
                                    contentView="Reset Counter"
                                    variant="outlined"
                                    color="secondary.main"
                                    onClick={() => {
                                        model.clickCount = 0;
                                        model.alertInformation("Counter reset");
                                    }}
                                />
                            </Row>
                        </Block>
                    </Col>
                )
            })
        },

        methods: {
            handleClick: () => {
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
