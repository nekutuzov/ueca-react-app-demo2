import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase, Col, Row, Block, ButtonModel, useButton } from "@components";
import { CRUDScreenModel, useCRUDScreen, Breadcrumb } from "@core";

type DialogScreenStruct = UIBaseStruct<{
    props: {};

    children: {
        crudScreen: CRUDScreenModel;
        informationButton: ButtonModel;
        warningButton: ButtonModel;
        errorButton: ButtonModel;
        exceptionButton: ButtonModel;
        confirmationButton: ButtonModel;
        actionConfirmationButton: ButtonModel;
    };

    methods: {
        testInformationDialog: () => Promise<void>;
        testWarningDialog: () => Promise<void>;
        testErrorDialog: () => Promise<void>;
        testExceptionDialog: () => Promise<void>;
        testConfirmationDialog: () => Promise<void>;
        testActionConfirmationDialog: () => Promise<void>;
        _InformationalDialogsView: () => React.ReactNode;
        _ConfirmationDialogsView: () => React.ReactNode;
        _CodeBlockView(props: { code: string }): React.ReactElement;
    };
}>;

type DialogScreenParams = UIBaseParams<DialogScreenStruct>;
type DialogScreenModel = UIBaseModel<DialogScreenStruct>;

function useDialogScreen(params?: DialogScreenParams): DialogScreenModel {
    const struct: DialogScreenStruct = {
        props: {
            id: useDialogScreen.name
        },

        children: {
            crudScreen: useCRUDScreen({
                intent: "none",
                breadcrumbs: [
                    { route: { path: "/" }, label: "Home" },
                    { route: { path: "/popups" }, label: "Popup Components" }
                ] as Breadcrumb[],
                contentView: () => (
                    <Col fill overflow="auto" padding="medium" spacing="large">
                        <Col spacing="small">
                            <h1>Dialog Components</h1>
                            <p>Interactive modal dialogs for user communication and confirmation.</p>
                        </Col>

                        <model._InformationalDialogsView />
                        <model._ConfirmationDialogsView />
                    </Col>
                )
            }),

            informationButton: useButton({
                contentView: "Information Dialog",
                variant: "contained",
                color: "info.main",
                onClick: () => model.testInformationDialog()
            }),

            warningButton: useButton({
                contentView: "Warning Dialog",
                variant: "contained",
                color: "warning.main",
                onClick: () => model.testWarningDialog()
            }),

            errorButton: useButton({
                contentView: "Error Dialog",
                variant: "contained",
                color: "error.main",
                onClick: () => model.testErrorDialog()
            }),

            exceptionButton: useButton({
                contentView: "Exception Dialog",
                variant: "outlined",
                color: "error.main",
                onClick: () => model.testExceptionDialog()
            }),

            confirmationButton: useButton({
                contentView: "Confirmation Dialog",
                variant: "contained",
                color: "primary.main",
                onClick: () => model.testConfirmationDialog()
            }),

            actionConfirmationButton: useButton({
                contentView: "Action Confirmation",
                variant: "outlined",
                color: "error.main",
                onClick: () => model.testActionConfirmationDialog()
            })
        },

        methods: {
            testInformationDialog: async () => {
                await model.dialogInfo(
                    "Information",
                    "This is an information dialog. It provides helpful information to the user."
                );
                await model.alertInformation("Information dialog closed");
            },

            testWarningDialog: async () => {
                await model.dialogWarning(
                    "Warning",
                    "This is a warning dialog. It alerts the user about potential issues.",
                    "Additional details about the warning can be shown here. Click 'Show details' to see this information in a side drawer."
                );
                await model.alertInformation("Warning dialog closed");
            },

            testErrorDialog: async () => {
                await model.dialogError(
                    "Error",
                    "An error has occurred during the operation.",
                    "Error code: 500\nError details: Internal server error\nTimestamp: " + new Date().toISOString()
                );
                await model.alertInformation("Error dialog closed");
            },

            testExceptionDialog: async () => {
                const error = new Error("Network request failed");
                error.message = "The server returned a 404 status code. The requested resource could not be found.\n\nRequest URL: https://api.example.com/users/12345\nMethod: GET";
                error.stack = "Error: Network request failed\n    at fetchUser (api.js:42:15)\n    at async loadUserData (users.js:18:9)";

                await model.dialogException("Operation Failed", error);
                await model.alertInformation("Exception dialog closed");
            },

            testConfirmationDialog: async () => {
                const confirmed = await model.dialogYesNo(
                    "Confirm Action",
                    "Are you sure you want to proceed with this action?"
                );
                if (confirmed) {
                    await model.alertSuccess("Action confirmed");
                } else {
                    await model.alertInformation("Action cancelled");
                }
            },

            testActionConfirmationDialog: async () => {
                const confirmed = await model.dialogConfirmAction(
                    "Delete Item",
                    "This action cannot be undone. All data associated with this item will be permanently deleted.",
                    "Delete"
                );
                if (confirmed) {
                    await model.alertSuccess("Deletion confirmed");
                } else {
                    await model.alertInformation("Deletion cancelled");
                }
            },

            _InformationalDialogsView: () => (
                <Block sx={{
                    padding: "20px",
                    border: "2px solid #e0e0e0",
                    borderRadius: "8px",
                    backgroundColor: "white"
                }}>
                    <h2 style={{ margin: "0 0 15px 0" }}>📢 Informational Dialogs</h2>
                    <p style={{ margin: "0 0 20px 0", color: "#666", fontSize: "14px" }}>
                        Display information, warnings, errors, and exceptions to users.
                    </p>

                    <Col spacing="large">
                        <Row spacing="medium" flexWrap="wrap">
                            <Col spacing="small" sx={{ flex: "1 1 300px" }}>
                                <Block sx={{ fontWeight: 600, color: "#1976d2" }}>Information</Block>
                                <model.informationButton.View />
                                <model._CodeBlockView code={_getInfoCode()} />
                            </Col>

                            <Col spacing="small" sx={{ flex: "1 1 300px" }}>
                                <Block sx={{ fontWeight: 600, color: "#ed6c02" }}>Warning</Block>
                                <model.warningButton.View />
                                <model._CodeBlockView code={_getWarningCode()} />
                            </Col>
                        </Row>

                        <Row spacing="medium" flexWrap="wrap">
                            <Col spacing="small" sx={{ flex: "1 1 300px" }}>
                                <Block sx={{ fontWeight: 600, color: "#d32f2f" }}>Error</Block>
                                <model.errorButton.View />
                                <model._CodeBlockView code={_getErrorCode()} />
                            </Col>

                            <Col spacing="small" sx={{ flex: "1 1 300px" }}>
                                <Block sx={{ fontWeight: 600, color: "#d32f2f" }}>Exception</Block>
                                <model.exceptionButton.View />
                                <model._CodeBlockView code={_getExceptionCode()} />
                            </Col>
                        </Row>
                    </Col>
                </Block>
            ),

            _ConfirmationDialogsView: () => (
                <Block sx={{
                    padding: "20px",
                    border: "2px solid #e0e0e0",
                    borderRadius: "8px",
                    backgroundColor: "white"
                }}>
                    <h2 style={{ margin: "0 0 15px 0" }}>✅ Confirmation Dialogs</h2>
                    <p style={{ margin: "0 0 20px 0", color: "#666", fontSize: "14px" }}>
                        Request user confirmation before performing actions. Returns boolean result.
                    </p>

                    <Row spacing="large" flexWrap="wrap">
                        <Col spacing="small" sx={{ flex: "1 1 300px" }}>
                            <Block sx={{ fontWeight: 600, color: "#1976d2" }}>Standard Confirmation</Block>
                            <model.confirmationButton.View />
                            <model._CodeBlockView code={_getConfirmationCode()} />
                        </Col>

                        <Col spacing="small" sx={{ flex: "1 1 300px" }}>
                            <Block sx={{ fontWeight: 600, color: "#d32f2f" }}>Destructive Action</Block>
                            <model.actionConfirmationButton.View />
                            <model._CodeBlockView code={_getActionConfirmationCode()} />
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

    const model = useUIBase(struct, params);
    return model;

    // Private helper functions for code examples
    function _getInfoCode() {
        return `// Shorthand method
await model.dialogInfo("Information", "This is an information dialog.");

// Or using message bus
await model.bus.unicast("Dialog.Information", {
    title: "Information",
    message: "This is an information dialog."
});`;
    }

    function _getWarningCode() {
        return `// Shorthand method
await model.dialogWarning(
    "Warning",
    "This is a warning dialog.",
    "Additional details..."
);

// Or using message bus
await model.bus.unicast("Dialog.Warning", {
    title: "Warning",
    message: "This is a warning dialog.",
    details: "Additional details..."
});`;
    }

    function _getErrorCode() {
        return `// Shorthand method
await model.dialogError(
    "Error",
    "An error has occurred.",
    "Error code: 500\\nTimestamp: ..."
);

// Or using message bus
await model.bus.unicast("Dialog.Error", {
    title: "Error",
    message: "An error has occurred.",
    details: "Error code: 500\\nTimestamp: ..."
});`;
    }

    function _getExceptionCode() {
        return `const error = new Error("Network request failed");
error.stack = "Error: Network request failed\\n    at fetchUser...";

// Shorthand method
await model.dialogException("Operation Failed", error);

// Or using message bus
await model.bus.unicast("Dialog.Exception", {
    title: "Operation Failed",
    error
});`;
    }

    function _getConfirmationCode() {
        return `// Shorthand method
const confirmed = await model.dialogYesNo(
    "Confirm Action",
    "Are you sure you want to proceed?"
);

// Or using message bus
const confirmed = await model.bus.unicast("Dialog.Confirmation", {
    title: "Confirm Action",
    message: "Are you sure you want to proceed?"
});

if (confirmed) {
    // User clicked Yes
} else {
    // User clicked No
}`;
    }

    function _getActionConfirmationCode() {
        return `// Shorthand method
const confirmed = await model.dialogConfirmAction(
    "Delete Item",
    "This action cannot be undone.",
    "Delete"  // Custom button text
);

// Or using message bus
const confirmed = await model.bus.unicast("Dialog.ActionConfirmation", {
    title: "Delete Item",
    message: "This action cannot be undone.",
    action: "Delete"
});

if (confirmed) {
    // User confirmed deletion
} else {
    // User cancelled
}`;
    }
}

const DialogScreen = UECA.getFC(useDialogScreen);

export { DialogScreenParams, DialogScreenModel, useDialogScreen, DialogScreen };
