import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase, Button, Row, Col, Block, NavLink, NavItem, useTab, useTabsContainer, Breadcrumbs } from "@components";
import { DetailedError } from "@core";
import { CRUDScreenModel, useCRUDScreen, Breadcrumb } from "@core";
import { CheckIcon, SettingsIcon, PersonIcon, AccountIcon, SecurityIcon, HomeIcon, ClipboardIcon, InfoIcon, BlockIcon, GitHubIcon, FolderIcon, DocumentIcon } from "@core";

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
                        iconView: <CheckIcon size={20} />,
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
                        iconView: <SettingsIcon size={20} />,
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
                        iconView: <PersonIcon size={20} />,
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
                        iconView: <AccountIcon size={20} />,
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
                        iconView: <SecurityIcon size={20} />,
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
                                icon={<HomeIcon />}
                            />
                            <NavItem
                                mode="icon-only"
                                route={{ path: "/" }}
                                active={true}
                                text="Active Home"
                                icon={<HomeIcon />}
                            />
                            <NavItem
                                mode="icon-only"
                                route={{ path: "/" }}
                                active={true}
                                text="Success Color"
                                icon={<CheckIcon />}
                            />
                            <NavItem
                                mode="icon-only"
                                route={{ path: "/" }}
                                active={false}
                                disabled={true}
                                text="Disabled"
                                icon={<InfoIcon />}
                            />
                        </Row>

                        <h3>Icon + Text Mode (Default)</h3>
                        <Col spacing="small" sx={{ maxWidth: "400px", marginBottom: "15px" }}>
                            <NavItem
                                mode="icon-text"
                                route={{ path: "/" }}
                                active={false}
                                text="Home"
                                icon={<HomeIcon />}
                            />
                            <NavItem
                                mode="icon-text"
                                route={{ path: "/" }}
                                active={true}
                                text="Active Item (Selected)"
                                icon={<ClipboardIcon />}
                            />
                            <NavItem
                                mode="icon-text"
                                route={{ path: "/" }}
                                active={false}
                                text="Settings"
                                icon={<SettingsIcon />}
                            />
                            <NavItem
                                mode="icon-text"
                                route={{ path: "/" }}
                                active={false}
                                disabled={true}
                                text="Disabled List Item"
                                icon={<BlockIcon />}
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
                                icon={<CheckIcon />}
                            />
                            <NavItem
                                mode="icon-text"
                                route={{ path: "https://github.com/nekutuzov/ueca-react-app" }}
                                newTab={true}
                                active={false}
                                text="UECA Demo App on GitHub"
                                icon={<GitHubIcon />}
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
                                <HomeIcon size={16} />
                                <NavLink route={{ path: "/" }} linkView="Home" underline="hover" />
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <FolderIcon size={16} />
                                <NavLink route={{ path: "/" }} linkView="Documents" underline="hover" />
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <DocumentIcon size={16} />
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
