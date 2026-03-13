import * as UECA from "ueca-react";
import { ScreenBaseModel, ScreenBaseParams, ScreenBaseStruct, useScreenBase, Col, Row, Block, ButtonModel, useButton } from "@components";
import { CRUDScreenModel, useCRUDScreen } from "@core";

type ToastScreenStruct = ScreenBaseStruct<{
    props: {};

    children: {
        crudScreen: CRUDScreenModel;
        successButton: ButtonModel;
        informationButton: ButtonModel;
        warningButton: ButtonModel;
        errorButton: ButtonModel;
    };

    methods: {
        testSuccessToast: () => Promise<void>;
        testInformationToast: () => Promise<void>;
        testWarningToast: () => Promise<void>;
        testErrorToast: () => Promise<void>;
        _ToastDemosView: () => React.ReactNode;
        _CodeBlockView(props: { code: string }): React.ReactElement;
    };
}>;

type ToastScreenParams = ScreenBaseParams<ToastScreenStruct>;
type ToastScreenModel = ScreenBaseModel<ToastScreenStruct>;

function useToastScreen(params?: ToastScreenParams): ToastScreenModel {
    const struct: ToastScreenStruct = {
        props: {
            id: useToastScreen.name
        },

        children: {
            crudScreen: useCRUDScreen({
                intent: "none",
                breadcrumbs: [
                    { route: { path: "/" }, label: "Home" },
                    { route: { path: "/toast" }, label: "Popup Components" }
                ],
                contentView: () => (
                    <Col fill overflow="auto" padding="medium" spacing="large">
                        <Col spacing="small">
                            <h1>Toast Notifications</h1>
                            <p>Brief messages that appear temporarily to inform users about actions or events. Also known as snackbars or alerts.</p>
                        </Col>

                        <model._ToastDemosView />

                        <Block sx={{
                            padding: "16px",
                            border: "1px solid #e0e0e0",
                            borderRadius: "4px",
                            backgroundColor: "#f5f5f5"
                        }}>
                            <Block padding={{ bottom: "small" }}><h3>ℹ️ Usage Guidelines</h3></Block>
                            <ul style={{ paddingLeft: "20px", color: "#666", fontSize: "14px" }}>
                                <li>Toast notifications automatically disappear after a few seconds</li>
                                <li>Use Success for completed actions (saved, deleted, updated)</li>
                                <li>Use Information for neutral updates and tips</li>
                                <li>Use Warning for potential issues that need attention</li>
                                <li>Use Error for failed operations or problems</li>
                                <li>Keep messages brief and actionable</li>
                                <li>Avoid disrupting the user's workflow</li>
                            </ul>
                        </Block>
                    </Col>
                )
            }),

            successButton: useButton({
                contentView: "Show Success Toast",
                variant: "contained",
                color: "success.main",
                onClick: () => model.testSuccessToast()
            }),

            informationButton: useButton({
                contentView: "Show Information Toast",
                variant: "contained",
                color: "info.main",
                onClick: () => model.testInformationToast()
            }),

            warningButton: useButton({
                contentView: "Show Warning Toast",
                variant: "contained",
                color: "warning.main",
                onClick: () => model.testWarningToast()
            }),

            errorButton: useButton({
                contentView: "Show Error Toast",
                variant: "contained",
                color: "error.main",
                onClick: () => model.testErrorToast()
            })
        },

        methods: {
            testSuccessToast: async () => {
                await model.alertSuccess("Operation completed successfully!");
            },

            testInformationToast: async () => {
                await model.alertInformation("New notification received");
            },

            testWarningToast: async () => {
                await model.alertWarning("Your session will expire in 5 minutes");
            },

            testErrorToast: async () => {
                await model.alertError("Failed to save changes. Please try again.");
            },

            _ToastDemosView: () => (
                <Block sx={{
                    padding: "20px",
                    border: "2px solid #e0e0e0",
                    borderRadius: "8px",
                    backgroundColor: "white"
                }}>
                    <Block padding={{ bottom: "small" }}><h2>🔔 Toast Notification Types</h2></Block>
                    <Block padding={{ bottom: "medium" }}>
                        <p style={{ color: "#666", fontSize: "14px" }}>
                            Click buttons below to display toast notifications. They appear at the top-center of the screen and auto-dismiss.
                        </p>
                    </Block>

                    <Row spacing="large" flexWrap="wrap">
                        <Col spacing="small" sx={{ flex: "1 1 300px" }}>
                            <Block sx={{ fontWeight: 600, color: "#2e7d32" }}>Success</Block>
                            <model.successButton.View />
                            <model._CodeBlockView code={_getSuccessCode()} />
                        </Col>

                        <Col spacing="small" sx={{ flex: "1 1 300px" }}>
                            <Block sx={{ fontWeight: 600, color: "#0288d1" }}>Information</Block>
                            <model.informationButton.View />
                            <model._CodeBlockView code={_getInformationCode()} />
                        </Col>
                    </Row>

                    <Row spacing="large" flexWrap="wrap" sx={{ marginTop: "20px" }}>
                        <Col spacing="small" sx={{ flex: "1 1 300px" }}>
                            <Block sx={{ fontWeight: 600, color: "#ed6c02" }}>Warning</Block>
                            <model.warningButton.View />
                            <model._CodeBlockView code={_getWarningCode()} />
                        </Col>

                        <Col spacing="small" sx={{ flex: "1 1 300px" }}>
                            <Block sx={{ fontWeight: 600, color: "#d32f2f" }}>Error</Block>
                            <model.errorButton.View />
                            <model._CodeBlockView code={_getErrorCode()} />
                        </Col>
                    </Row>
                </Block>
            ),

            _CodeBlockView: ({ code }) => (
                <pre style={{
                    height: "100%",
                    backgroundColor: "#f5f5f5",
                    padding: "12px",
                    border: "1px solid #e0e0e0",
                    borderRadius: "4px",
                    fontSize: "12px",
                    lineHeight: "1.5",
                    overflow: "auto",
                    margin: "5px 0 0 0"
                }}>
                    <code>{code}</code>
                </pre>
            )
        },

        View: () => <model.crudScreen.View />
    };

    const model = useScreenBase(struct, params);
    return model;

    // Private helper functions for code examples
    function _getSuccessCode() {
        return `// Shorthand method
await model.alertSuccess("Operation completed successfully!");

// Or using message bus
await model.bus.unicast("Alert.Success", {
    message: "Operation completed successfully!"
});`;
    }

    function _getInformationCode() {
        return `// Shorthand method
await model.alertInformation("New notification received");

// Or using message bus
await model.bus.unicast("Alert.Information", {
    message: "New notification received"
});`;
    }

    function _getWarningCode() {
        return `// Shorthand method
await model.alertWarning("Your session will expire in 5 minutes");

// Or using message bus
await model.bus.unicast("Alert.Warning", {
    message: "Your session will expire in 5 minutes"
});`;
    }

    function _getErrorCode() {
        return `// Shorthand method
await model.alertError("Failed to save changes. Please try again.");

// Or using message bus
await model.bus.unicast("Alert.Error", {
    message: "Failed to save changes. Please try again."
});`;
    }
}

const ToastScreen = UECA.getFC(useToastScreen);

export { ToastScreenModel, ToastScreenParams, useToastScreen, ToastScreen };
