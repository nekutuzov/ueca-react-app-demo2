import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase, Button, Row, Col, Block } from "@components";
import { DetailedError } from "@core";

type HomeScreenStruct = UIBaseStruct<{
    props: {
        message: string;
        busyTestCounter: number;
    };

    methods: {
        testInformationDialog: () => Promise<void>;
        testWarningDialog: () => Promise<void>;
        testErrorDialog: () => Promise<void>;
        testExceptionDialog: () => Promise<void>;
        testConfirmationDialog: () => Promise<void>;
        testActionConfirmationDialog: () => Promise<void>;
        testBusyDisplay: () => Promise<void>;
        testFileSelector: () => Promise<void>;
    };
}>;

type HomeScreenParams = UIBaseParams<HomeScreenStruct>;
type HomeScreenModel = UIBaseModel<HomeScreenStruct>;

function useHomeScreen(params?: HomeScreenParams): HomeScreenModel {
    const struct: HomeScreenStruct = {
        props: {
            id: useHomeScreen.name,
            message: "Welcome to UECA-React!",
            busyTestCounter: 0
        },

        methods: {
            testInformationDialog: async () => {
                await model.bus.unicast("Dialog.Information", {
                    title: "Information",
                    message: "This is an information dialog. It provides helpful information to the user."
                });
            },

            testWarningDialog: async () => {
                await model.bus.unicast("Dialog.Warning", {
                    title: "Warning",
                    message: "This is a warning dialog. It alerts the user about potential issues.",
                    details: "Additional details about the warning can be shown here. Click 'Show details' to see this information in a side drawer."
                });
            },

            testErrorDialog: async () => {
                await model.bus.unicast("Dialog.Error", {
                    title: "Error",
                    message: "An error has occurred during the operation.",
                    details: "Error code: 500\nError details: Internal server error\nTimestamp: " + new Date().toISOString()
                });
            },

            testExceptionDialog: async () => {
                const error = new DetailedError(
                    "Network request failed",
                    "The server returned a 404 status code. The requested resource could not be found.\n\nRequest URL: https://api.example.com/users/12345\nMethod: GET"
                );
                error.stack = "Error: Network request failed\n    at fetchUser (api.js:42:15)\n    at async loadUserData (users.js:18:9)";
                
                await model.bus.unicast("Dialog.Exception", {
                    title: "Operation Failed",
                    error
                });
            },

            testConfirmationDialog: async () => {
                const confirmed = await model.bus.unicast("Dialog.Confirmation", {
                    title: "Confirm Action",
                    message: "Are you sure you want to proceed with this action?"
                });
                
                if (confirmed) {
                    await model.bus.unicast("Dialog.Information", {
                        title: "Success",
                        message: "Action confirmed and executed!"
                    });
                } else {
                    console.log("Action cancelled by user");
                }
            },

            testActionConfirmationDialog: async () => {
                const confirmed = await model.bus.unicast("Dialog.ActionConfirmation", {
                    title: "Delete Item",
                    message: "This action cannot be undone. All data associated with this item will be permanently deleted.",
                    action: "Delete"
                });
                
                if (confirmed) {
                    await model.bus.unicast("Dialog.Information", {
                        title: "Deleted",
                        message: "Item has been permanently deleted."
                    });
                } else {
                    console.log("Delete cancelled by user");
                }
            },

            testBusyDisplay: async () => {
                model.busyTestCounter++;
                await model.bus.unicast("BusyDisplay.Set", true);
                
                try {
                    // Simulate async operation
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    await model.bus.unicast("Dialog.Information", {
                        title: "Operation Complete",
                        message: `Busy display test #${model.busyTestCounter} completed successfully!`
                    });
                } finally {
                    await model.bus.unicast("BusyDisplay.Set", false);
                }
            },

            testFileSelector: async () => {
                const files = await model.bus.unicast("App.SelectFiles", {
                    fileMask: ".pdf,.jpg,.png,.txt",
                    multiselect: true
                });
                
                if (files && files.length > 0) {
                    const fileList = files.map(f => f.name).join("\n");
                    const message = `You selected ${files.length} file(s):\n\n${fileList}`;
                    await model.bus.unicast("Dialog.Information", {
                        title: "Files Selected",
                        message
                    });
                } else {
                    console.log("No files selected");
                }
            }
        },

        init: () => {
            console.log("HomeScreen initialized");
        },

        View: () => (
            <Col id={model.htmlId()} fill sx={{ padding: "20px", fontFamily: "Arial, sans-serif", backgroundColor: "#f5f5f5" }}>
                <Block sx={{ maxWidth: "1200px", width: "100%", margin: "0 auto" }}>
                    <h1>{model.message}</h1>
                    <p>Your minimal UECA-React application is ready to go!</p>

                    <Block sx={{
                        backgroundColor: "white", 
                        padding: "20px", 
                        borderRadius: "8px", 
                        marginBottom: "20px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                    }}>
                        <h2 style={{ marginTop: 0 }}>🧪 Dialog Component Tests</h2>
                        <p>Test the newly implemented dialog system with plain HTML/CSS (no Material-UI):</p>
                        
                        <Row spacing="small" sx={{ flexWrap: "wrap", marginBottom: "10px" }}>
                            <Button 
                                contentView="Information Dialog"
                                variant="contained"
                                color="info.main"
                                onClick={model.testInformationDialog}
                            />
                            <Button 
                                contentView="Warning Dialog"
                                variant="contained"
                                color="warning.main"
                                onClick={model.testWarningDialog}
                            />
                            <Button 
                                contentView="Error Dialog"
                                variant="contained"
                                color="error.main"
                                onClick={model.testErrorDialog}
                            />
                        </Row>
                        
                        <Row spacing="small" sx={{ flexWrap: "wrap", marginBottom: "10px" }}>
                            <Button 
                                contentView="Exception Dialog"
                                variant="outlined"
                                color="error.main"
                                onClick={model.testExceptionDialog}
                            />
                            <Button 
                                contentView="Confirmation Dialog"
                                variant="outlined"
                                color="primary.main"
                                onClick={model.testConfirmationDialog}
                            />
                            <Button 
                                contentView="Action Confirmation"
                                variant="outlined"
                                color="error.main"
                                onClick={model.testActionConfirmationDialog}
                            />
                        </Row>

                        <h3>🔧 Infrastructure Tests</h3>
                        <Row spacing="small" sx={{ flexWrap: "wrap" }}>
                            <Button 
                                contentView="Test Busy Display"
                                variant="text"
                                color="primary.main"
                                onClick={model.testBusyDisplay}
                            />
                            <Button 
                                contentView="Test File Selector"
                                variant="text"
                                color="primary.main"
                                onClick={model.testFileSelector}
                            />
                        </Row>
                    </Block>

                    <Block sx={{
                        backgroundColor: "white", 
                        padding: "20px", 
                        borderRadius: "8px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                    }}>
                        <h2 style={{ marginTop: 0 }}>What is UECA-React?</h2>
                        <p>
                            UECA (Unified Encapsulated Component Architecture) is a React framework that provides:
                        </p>
                        <ul>
                            <li>Component-based architecture with structured props, children, methods, and events</li>
                            <li>Message bus communication for decoupled components</li>
                            <li>MobX-powered reactive state management</li>
                            <li>Lifecycle hooks (init, mount, draw, erase, unmount, deinit)</li>
                            <li>Property bindings (unidirectional, bidirectional, custom)</li>
                            <li>Automatic onChange events for all properties</li>
                        </ul>

                        <h2>Getting Started</h2>
                        <p>Check out the following resources:</p>
                        <ul>
                            <li>Documentation: <code>node_modules/ueca-react/docs/index.md</code></li>
                            <li>Copilot Instructions: <code>.github/copilot-instructions.md</code></li>
                            <li>Example Project: <a href="https://github.com/nekutuzov/ueca-react-app" target="_blank">https://github.com/nekutuzov/ueca-react-app</a></li>
                        </ul>

                        <h2>Next Steps</h2>
                        <ol>
                            <li>Run <code>npm install</code> to install dependencies</li>
                            <li>Run <code>npm run dev</code> to start the development server</li>
                            <li>Copy the <code>.github/copilot-instructions.md</code> file from the source project for AI assistance</li>
                            <li>Explore the component patterns in <code>src/components/base/</code></li>
                            <li>Add your screens in <code>src/screens/</code></li>
                            <li>Define routes in <code>src/core/infrastructure/appRoutes.tsx</code></li>
                        </ol>

                        <h2>Key Files Created</h2>
                        <ul>
                            <li><strong>Configuration:</strong> package.json, vite.config.ts, tsconfig files, eslint.config.js</li>
                            <li><strong>Base Components:</strong> base.tsx, uiBase.tsx, editBase.tsx</li>
                            <li><strong>Core Infrastructure:</strong> application.tsx, appStart.tsx, appMessage.ts, appUtils.ts, appBrowsingHistory.ts, appRoutes.tsx</li>
                            <li><strong>API:</strong> restApiClient.ts, mocks/handlers.ts (MSW setup)</li>
                        </ul>

                        <p style={{ marginTop: "40px", color: "#666" }}>
                            <em>This bare-bone template provides a minimal foundation to build UECA-React applications with native HTML controls!</em>
                        </p>
                    </Block>
                </Block>
            </Col>
        )
    }

    const model = useUIBase(struct, params);
    return model;
}

const HomeScreen = UECA.getFC(useHomeScreen);

export { HomeScreenModel, useHomeScreen, HomeScreen };
