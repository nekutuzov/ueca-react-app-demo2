import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase, Button, Row, Col, Block, NavLink, NavItem, useTab, useTabsContainer, Breadcrumbs } from "@components";
import { DetailedError } from "@core";
import { CRUDScreenModel, useCRUDScreen, Breadcrumb } from "@screens";

type HomeScreenStruct = UIBaseStruct<{
    props: {
        message: string;
        busyTestCounter: number;
    };

    children: {
        crudScreen: CRUDScreenModel;
        horizontalTabs: ReturnType<typeof useTabsContainer>;
        verticalTabs: ReturnType<typeof useTabsContainer>;
        scrollableTabs: ReturnType<typeof useTabsContainer>;
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
        testSuccessAlert: () => Promise<void>;
        testInfoAlert: () => Promise<void>;
        testWarningAlert: () => Promise<void>;
        testErrorAlert: () => Promise<void>;
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

        children: {
            crudScreen: useCRUDScreen({
                intent: "none",
                breadcrumbs: [
                    { route: { path: "/" }, label: "Home" }
                ] as Breadcrumb[],
                contentView: () => _homeContent()
            }),

            horizontalTabs: useTabsContainer({
                tabs: [
                    useTab({
                        tabId: "overview",
                        labelView: "Overview",
                        contentView: (
                            <Block sx={{ padding: "20px" }}>
                                <h3>Overview Tab</h3>
                                <p>This is the overview content. Tabs allow you to organize content into separate views that users can switch between.</p>
                                <p>This horizontal tabs container demonstrates the standard variant with labels.</p>
                            </Block>
                        )
                    }),
                    useTab({
                        tabId: "features",
                        labelView: "Features",
                        iconView: (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                        ),
                        iconPosition: "start",
                        contentView: (
                            <Block sx={{ padding: "20px" }}>
                                <h3>Features Tab</h3>
                                <ul>
                                    <li>✓ Icon support with configurable positioning (top, bottom, start, end)</li>
                                    <li>✓ Multiple variants: standard, scrollable, fullWidth</li>
                                    <li>✓ Horizontal and vertical orientations</li>
                                    <li>✓ Automatic selection management</li>
                                    <li>✓ Form validation integration with invalid state styling</li>
                                </ul>
                            </Block>
                        )
                    }),
                    useTab({
                        tabId: "settings",
                        labelView: "Settings",
                        iconView: (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                            </svg>
                        ),
                        iconPosition: "start",
                        contentView: (
                            <Block sx={{ padding: "20px" }}>
                                <h3>Settings Tab</h3>
                                <p>This tab demonstrates icon + label combination with icon positioned at the start.</p>
                                <p>Tab content can include any React components, forms, or complex layouts.</p>
                            </Block>
                        )
                    })
                ],
                selectedTabId: "overview",
                orientation: "horizontal",
                variant: "standard",
                centered: false,
                onChange: (container) => {
                    console.log("Horizontal tabs changed to:", container.selectedTab.getTabId());
                }
            }),

            verticalTabs: useTabsContainer({
                tabs: [
                    useTab({
                        tabId: "profile",
                        labelView: "Profile",
                        iconView: (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                            </svg>
                        ),
                        iconPosition: "start",
                        contentView: (
                            <Block sx={{ padding: "20px" }}>
                                <h3>Profile</h3>
                                <p>Vertical tabs are useful for navigation-heavy interfaces or settings panels.</p>
                            </Block>
                        )
                    }),
                    useTab({
                        tabId: "account",
                        labelView: "Account",
                        iconView: (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                            </svg>
                        ),
                        iconPosition: "start",
                        contentView: (
                            <Block sx={{ padding: "20px" }}>
                                <h3>Account</h3>
                                <p>The vertical orientation provides more space for longer tab labels.</p>
                            </Block>
                        )
                    }),
                    useTab({
                        tabId: "security",
                        labelView: "Security",
                        iconView: (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                            </svg>
                        ),
                        iconPosition: "start",
                        contentView: (
                            <Block sx={{ padding: "20px" }}>
                                <h3>Security</h3>
                                <p>Vertical tabs work well with content that needs maximum horizontal space.</p>
                            </Block>
                        )
                    })
                ],
                selectedTabId: "profile",
                orientation: "vertical",
                variant: "standard"
            }),

            scrollableTabs: useTabsContainer({
                tabs: [
                    useTab({
                        tabId: "tab1",
                        labelView: "First Tab",
                        contentView: <Block sx={{ padding: "20px" }}><p>Content for first tab</p></Block>
                    }),
                    useTab({
                        tabId: "tab2",
                        labelView: "Second Tab",
                        contentView: <Block sx={{ padding: "20px" }}><p>Content for second tab</p></Block>
                    }),
                    useTab({
                        tabId: "tab3",
                        labelView: "Third Tab",
                        contentView: <Block sx={{ padding: "20px" }}><p>Content for third tab</p></Block>
                    }),
                    useTab({
                        tabId: "tab4",
                        labelView: "Fourth Tab",
                        contentView: <Block sx={{ padding: "20px" }}><p>Content for fourth tab</p></Block>
                    }),
                    useTab({
                        tabId: "tab5",
                        labelView: "Fifth Tab",
                        contentView: <Block sx={{ padding: "20px" }}><p>Content for fifth tab</p></Block>
                    }),
                    useTab({
                        tabId: "tab6",
                        labelView: "Sixth Tab",
                        contentView: <Block sx={{ padding: "20px" }}><p>Content for sixth tab</p></Block>
                    }),
                    useTab({
                        tabId: "tab7",
                        labelView: "Seventh Tab",
                        contentView: <Block sx={{ padding: "20px" }}><p>Content for seventh tab</p></Block>
                    }),
                    useTab({
                        tabId: "tab8",
                        labelView: "Eighth Tab",
                        contentView: <Block sx={{ padding: "20px" }}><p>Content for eighth tab</p></Block>
                    })
                ],
                selectedTabId: "tab1",
                orientation: "horizontal",
                variant: "scrollable",
                scrollButtons: "auto"
            })
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
            },

            testSuccessAlert: async () => {
                await model.bus.unicast("Alert.Success", {
                    message: "Operation completed successfully!"
                });
            },

            testInfoAlert: async () => {
                await model.bus.unicast("Alert.Information", {
                    message: "This is an informational message."
                });
            },

            testWarningAlert: async () => {
                await model.bus.unicast("Alert.Warning", {
                    message: "Warning: Please review your input."
                });
            },

            testErrorAlert: async () => {
                await model.bus.unicast("Alert.Error", {
                    message: "Error: Something went wrong!"
                });
            }
        },

        init: () => {
            console.log("HomeScreen initialized");
        },

        View: () => <model.crudScreen.View />
    };

    const model = useUIBase(struct, params);
    return model;


    // Private functions
    function _homeContent() {
        return (
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

                        <h3>📢 Global Alert Tests</h3>
                        <p style={{ fontSize: "14px", color: "#666" }}>Global alerts (app-wide, managed by AppAlertManager via message bus):</p>
                        <Row spacing="small" sx={{ flexWrap: "wrap" }}>
                            <Button
                                contentView="Success Alert"
                                variant="contained"
                                color="success.main"
                                size="small"
                                onClick={model.testSuccessAlert}
                            />
                            <Button
                                contentView="Info Alert"
                                variant="contained"
                                color="info.main"
                                size="small"
                                onClick={model.testInfoAlert}
                            />
                            <Button
                                contentView="Warning Alert"
                                variant="contained"
                                color="warning.main"
                                size="small"
                                onClick={model.testWarningAlert}
                            />
                            <Button
                                contentView="Error Alert"
                                variant="contained"
                                color="error.main"
                                size="small"
                                onClick={model.testErrorAlert}
                            />
                        </Row>
                    </Block>

                    <Block sx={{
                        backgroundColor: "white",
                        padding: "20px",
                        borderRadius: "8px",
                        marginBottom: "20px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                    }}>
                        <h2 style={{ marginTop: 0 }}>🔗 NavLink Component Tests</h2>
                        <p>Test the NavLink component with different colors and underline styles (no Material-UI):</p>

                        <h3>Different Colors</h3>
                        <Row spacing="medium" sx={{ flexWrap: "wrap", marginBottom: "15px" }}>
                            <NavLink
                                route={{ path: "/" }}
                                title="Primary Link"
                                color="primary.main"
                                underline="hover"
                                linkView="Primary Color (hover underline)"
                            />
                            <NavLink
                                route={{ path: "/" }}
                                title="Secondary Link"
                                color="secondary.main"
                                underline="hover"
                                linkView="Secondary Color (hover underline)"
                            />
                            <NavLink
                                route={{ path: "/" }}
                                title="Success Link"
                                color="success.main"
                                underline="hover"
                                linkView="Success Color (hover underline)"
                            />
                            <NavLink
                                route={{ path: "/" }}
                                title="Error Link"
                                color="error.main"
                                underline="hover"
                                linkView="Error Color (hover underline)"
                            />
                        </Row>

                        <h3>Underline Variants</h3>
                        <Row spacing="medium" sx={{ flexWrap: "wrap", marginBottom: "15px" }}>
                            <NavLink
                                route={{ path: "/" }}
                                title="No Underline"
                                color="primary.main"
                                underline="none"
                                linkView="No underline"
                            />
                            <NavLink
                                route={{ path: "/" }}
                                title="Hover Underline"
                                color="primary.main"
                                underline="hover"
                                linkView="Hover underline (default)"
                            />
                            <NavLink
                                route={{ path: "/" }}
                                title="Always Underline"
                                color="primary.main"
                                underline="always"
                                linkView="Always underlined"
                            />
                        </Row>

                        <h3>Disabled State</h3>
                        <Row spacing="medium" sx={{ flexWrap: "wrap", marginBottom: "15px" }}>
                            <NavLink
                                route={{ path: "/" }}
                                title="Enabled Link"
                                color="primary.main"
                                underline="hover"
                                linkView="Enabled link"
                            />
                            <NavLink
                                route={{ path: "/" }}
                                title="Disabled Link"
                                color="primary.main"
                                underline="hover"
                                disabled={true}
                                linkView="Disabled link (not clickable)"
                            />
                        </Row>

                        <h3>External Link (New Tab)</h3>
                        <Row spacing="medium" sx={{ flexWrap: "wrap" }}>
                            <NavLink
                                route={{ path: "https://ueca-react.carrd.co/" }}
                                title="UECA-React Official Website"
                                color="primary.main"
                                underline="always"
                                newTab={true}
                                linkView="UECA-React Official Website →"
                            />
                            <NavLink
                                route={{ path: "https://github.com/nekutuzov/ueca-react-app" }}
                                title="UECA-React Demo App"
                                color="info.main"
                                underline="always"
                                newTab={true}
                                linkView="Demo App on GitHub →"
                            />
                        </Row>
                    </Block>

                    <Block sx={{
                        backgroundColor: "white",
                        padding: "20px",
                        borderRadius: "8px",
                        marginBottom: "20px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                    }}>
                        <h2 style={{ marginTop: 0 }}>📱 NavItem Component Tests</h2>
                        <p>Test the NavItem component with icon buttons and list items (no Material-UI):</p>

                        <h3>Icon Only Mode</h3>
                        <Row spacing="medium" sx={{ marginBottom: "15px", alignItems: "center" }}>
                            <NavItem
                                mode="icon-only"
                                route={{ path: "/" }}
                                active={false}
                                text="Home"
                                icon={
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                                    </svg>
                                }
                            />
                            <NavItem
                                mode="icon-only"
                                route={{ path: "/" }}
                                active={true}
                                text="Active Home"
                                icon={
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                                    </svg>
                                }
                            />
                            <NavItem
                                mode="icon-only"
                                route={{ path: "/" }}
                                active={true}
                                text="Success Color"
                                icon={
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                    </svg>
                                }
                            />
                            <NavItem
                                mode="icon-only"
                                route={{ path: "/" }}
                                active={false}
                                disabled={true}
                                text="Disabled"
                                icon={
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                                    </svg>
                                }
                            />
                        </Row>

                        <h3>Icon + Text Mode (Default)</h3>
                        <Col spacing="small" sx={{ maxWidth: "400px", marginBottom: "15px" }}>
                            <NavItem
                                mode="icon-text"
                                route={{ path: "/" }}
                                active={false}
                                text="Home"
                                icon={
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                                    </svg>
                                }
                            />
                            <NavItem
                                mode="icon-text"
                                route={{ path: "/" }}
                                active={true}
                                text="Active Item (Selected)"
                                icon={
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm0 4c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm6 12H6v-1.4c0-2 4-3.1 6-3.1s6 1.1 6 3.1V19z"/>
                                    </svg>
                                }
                            />
                            <NavItem
                                mode="icon-text"
                                route={{ path: "/" }}
                                active={false}
                                text="Settings"
                                icon={
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                                    </svg>
                                }
                            />
                            <NavItem
                                mode="icon-text"
                                route={{ path: "/" }}
                                active={false}
                                disabled={true}
                                text="Disabled List Item"
                                icon={
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9z"/>
                                    </svg>
                                }
                            />
                        </Col>

                        <h3>Text Only Mode</h3>
                        <Col spacing="small" sx={{ maxWidth: "400px" }}>
                            <NavItem
                                mode="text-only"
                                route={{ path: "/" }}
                                active={false}
                                text="Text Only Item"
                            />
                            <NavItem
                                mode="text-only"
                                route={{ path: "/" }}
                                active={true}
                                text="Active Text Only"
                            />
                        </Col>

                        <h3>External Navigation (New Tab)</h3>
                        <Col spacing="small" sx={{ maxWidth: "400px" }}>
                            <NavItem
                                mode="icon-text"
                                route={{ path: "https://ueca-react.carrd.co/" }}
                                newTab={true}
                                active={false}
                                text="UECA-React Official Website"
                                icon={
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                    </svg>
                                }
                            />
                            <NavItem
                                mode="icon-text"
                                route={{ path: "https://github.com/nekutuzov/ueca-react-app" }}
                                newTab={true}
                                active={false}
                                text="UECA Demo App on GitHub"
                                icon={
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                    </svg>
                                }
                            />
                        </Col>
                    </Block>

                    <Block sx={{
                        backgroundColor: "white",
                        padding: "20px",
                        borderRadius: "8px",
                        marginBottom: "20px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                    }}>
                        <h2 style={{ marginTop: 0 }}>📑 Tabs Component Tests</h2>
                        <p>Test the TabsContainer and Tab components with different orientations and variants (no Material-UI):</p>

                        <h3>Standard Horizontal Tabs</h3>
                        <Block sx={{ 
                            border: "1px solid #e0e0e0", 
                            borderRadius: "4px", 
                            height: "300px",
                            marginBottom: "20px"
                        }}>
                            <model.horizontalTabs.View />
                        </Block>

                        <h3>Vertical Tabs</h3>
                        <Block sx={{ 
                            border: "1px solid #e0e0e0", 
                            borderRadius: "4px", 
                            height: "300px",
                            marginBottom: "20px"
                        }}>
                            <model.verticalTabs.View />
                        </Block>

                        <h3>Scrollable Tabs</h3>
                        <p style={{ fontSize: "14px", color: "#666" }}>When there are many tabs, use scrollable variant with scroll buttons:</p>
                        <Block sx={{ 
                            border: "1px solid #e0e0e0", 
                            borderRadius: "4px", 
                            height: "250px"
                        }}>
                            <model.scrollableTabs.View />
                        </Block>
                    </Block>

                    <Block sx={{
                        backgroundColor: "white",
                        padding: "20px",
                        borderRadius: "8px",
                        marginBottom: "20px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                    }}>
                        <h2 style={{ marginTop: 0 }}>🍞 Breadcrumbs Component Tests</h2>
                        <p>Test the Breadcrumbs component for navigation trails (no Material-UI):</p>

                        <h3>Simple Breadcrumbs with Text</h3>
                        <Breadcrumbs childrenView={<>
                            <span>Home</span>
                            <span>Products</span>
                            <span>Electronics</span>
                            <span>Laptops</span>
                        </>} />

                        <h3 style={{ marginTop: "30px" }}>Breadcrumbs with NavLinks</h3>
                        <Breadcrumbs childrenView={<>
                            <NavLink route={{ path: "/" }} linkView="Home" underline="hover" />
                            <NavLink route={{ path: "/" }} linkView="Category" underline="hover" />
                            <NavLink route={{ path: "/" }} linkView="Subcategory" underline="hover" />
                            <span style={{ color: "#666" }}>Current Page</span>
                        </>} />

                        <h3 style={{ marginTop: "30px" }}>Breadcrumbs with Colored Links</h3>
                        <Breadcrumbs childrenView={<>
                            <NavLink route={{ path: "/" }} linkView="Dashboard" color="secondary.main" underline="hover" />
                            <NavLink route={{ path: "/" }} linkView="Settings" color="info.main" underline="hover" />
                            <NavLink route={{ path: "/" }} linkView="Profile" color="success.main" underline="hover" />
                            <span style={{ fontWeight: 600, color: "#d32f2f" }}>Edit</span>
                        </>} />

                        <h3 style={{ marginTop: "30px" }}>Breadcrumbs with Custom Separator</h3>
                        <Breadcrumbs 
                            separator={<span style={{ margin: "0 8px", color: "#999" }}>/</span>}
                            childrenView={<>
                                <NavLink route={{ path: "/" }} linkView="Root" underline="hover" />
                                <NavLink route={{ path: "/" }} linkView="Folder" underline="hover" />
                                <NavLink route={{ path: "/" }} linkView="Subfolder" underline="hover" />
                                <span>File.txt</span>
                            </>} 
                        />

                        <h3 style={{ marginTop: "30px" }}>Breadcrumbs with Dot Separator</h3>
                        <Breadcrumbs 
                            separator={<span style={{ margin: "0 8px", color: "#ccc" }}>•</span>}
                            childrenView={<>
                                <span>Blog</span>
                                <span>Technology</span>
                                <span>React</span>
                                <span style={{ fontStyle: "italic" }}>Current Article</span>
                            </>} 
                        />

                        <h3 style={{ marginTop: "30px" }}>Complex Breadcrumbs with Icons</h3>
                        <Breadcrumbs childrenView={<>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                                </svg>
                                <NavLink route={{ path: "/" }} linkView="Home" underline="hover" />
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/>
                                </svg>
                                <NavLink route={{ path: "/" }} linkView="Documents" underline="hover" />
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                                </svg>
                                <span>Report.pdf</span>
                            </div>
                        </>} />
                    </Block>
                </Block>
            </Col>
        );
    }
}

const HomeScreen = UECA.getFC(useHomeScreen);

export { HomeScreenModel, useHomeScreen, HomeScreen };
