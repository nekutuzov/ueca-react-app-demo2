import * as UECA from "ueca-react";
import {
    UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase,
    Row, Col, Block,
    NavItemModel, useNavItem
} from "@components";
import { HomeIcon, NavigationIcon } from "@core";

type NavItemExamplesStruct = UIBaseStruct<{
    children: {
        homeNavItem: NavItemModel;
        toastNavItem: NavItemModel;
        activeNavItem: NavItemModel;
        disabledNavItem: NavItemModel;
        iconOnlyNavItem: NavItemModel;
        textOnlyNavItem: NavItemModel;
    };

    methods: {
        _CodeBlockView(props: { code: string }): React.ReactElement;
    };
}>;

type NavItemExamplesParams = UIBaseParams<NavItemExamplesStruct>;
type NavItemExamplesModel = UIBaseModel<NavItemExamplesStruct>;

function useNavItemExamples(params?: NavItemExamplesParams): NavItemExamplesModel {
    const struct: NavItemExamplesStruct = {
        props: {
            id: useNavItemExamples.name
        },

        children: {
            homeNavItem: useNavItem({
                route: { path: "/home" },
                text: "Home",
                icon: <HomeIcon />,
                mode: "icon-text"
            }),

            toastNavItem: useNavItem({
                route: { path: "/toast" },
                text: "Toast Notifications",
                icon: <NavigationIcon />,
                mode: "icon-text"
            }),

            activeNavItem: useNavItem({
                route: { path: "/navitem" },
                text: "NavItem (Active)",
                icon: <NavigationIcon />,
                mode: "icon-text",
                active: true
            }),

            disabledNavItem: useNavItem({
                route: { path: "/home" },
                text: "Disabled Item",
                icon: <HomeIcon />,
                mode: "icon-text",
                disabled: true
            }),

            iconOnlyNavItem: useNavItem({
                route: { path: "/home" },
                text: "Home",
                icon: <HomeIcon />,
                mode: "icon-only"
            }),

            textOnlyNavItem: useNavItem({
                route: { path: "/toast" },
                text: "Toast",
                mode: "text-only"
            })
        },

        methods: {
            _CodeBlockView: ({ code }) => (
                <pre style={{
                    backgroundColor: "#f5f5f5",
                    padding: "12px",
                    border: "1px solid #e0e0e0",
                    borderRadius: "4px",
                    fontSize: "12px",
                    lineHeight: "1.5",
                    overflow: "auto",
                    margin: "8px 0 0 0"
                }}>
                    <code>{code}</code>
                </pre>
            )
        },

        View: () => (
            <Block sx={{
                padding: "24px",
                border: "2px solid #e0e0e0",
                borderRadius: "8px",
                backgroundColor: "white"
            }}>
                <h2 style={{ margin: "0 0 20px 0" }}>📚 Examples</h2>
                <Col spacing="large">
                    {/* Different States */}
                    <Block sx={{
                        padding: "16px",
                        backgroundColor: "#f5f5f5",
                        borderRadius: "4px",
                        border: "1px solid #e0e0e0"
                    }}>
                        <Block sx={{ fontWeight: 600, marginBottom: "8px", fontSize: "14px" }}>
                            Different States
                        </Block>
                        <Col spacing="small">
                            <model.homeNavItem.View />
                            <model.toastNavItem.View />
                            <model.activeNavItem.View />
                            <model.disabledNavItem.View />
                        </Col>
                        <model._CodeBlockView code={_getDifferentStatesCode()} />
                    </Block>

                    {/* Display Modes */}
                    <Block sx={{
                        padding: "16px",
                        backgroundColor: "#f5f5f5",
                        borderRadius: "4px",
                        border: "1px solid #e0e0e0"
                    }}>
                        <Block sx={{ fontWeight: 600, marginBottom: "8px", fontSize: "14px" }}>
                            Display Modes
                        </Block>
                        <Row spacing="large">
                            <Col spacing="small">
                                <Block sx={{ fontSize: "12px", fontWeight: 600, color: "#666" }}>Icon + Text</Block>
                                <model.homeNavItem.View />
                            </Col>
                            <Col spacing="small">
                                <Block sx={{ fontSize: "12px", fontWeight: 600, color: "#666" }}>Icon Only</Block>
                                <model.iconOnlyNavItem.View />
                            </Col>
                            <Col spacing="small">
                                <Block sx={{ fontSize: "12px", fontWeight: 600, color: "#666" }}>Text Only</Block>
                                <model.textOnlyNavItem.View />
                            </Col>
                        </Row>
                        <model._CodeBlockView code={_getDisplayModesCode()} />
                    </Block>

                    {/* Usage in Menus */}
                    <Block sx={{
                        padding: "16px",
                        backgroundColor: "#fff3e0",
                        border: "1px solid #ffb74d",
                        borderRadius: "4px"
                    }}>
                        <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#e65100" }}>📋 Usage in Menu Systems</h4>
                        <p style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#555" }}>
                            NavItem is designed for sidebar menus. Set <code>active</code> based on current route:
                        </p>
                        <model._CodeBlockView code={_getMenuSystemCode()} />
                    </Block>
                </Col>
            </Block>
        )
    };

    const model = useUIBase(struct, params);
    return model;

    // Private helper functions for code examples
    function _getDifferentStatesCode() {
        return `// Normal state
<NavItem
    route={{ path: "/home" }}
    text="Home"
    icon={<HomeIcon />}
    mode="icon-text"
/>

// Active state (current page)
<NavItem
    route={{ path: "/navitem" }}
    text="NavItem (Active)"
    icon={<NavigationIcon />}
    mode="icon-text"
    active={true}
/>

// Disabled state
<NavItem
    route={{ path: "/home" }}
    text="Disabled Item"
    icon={<HomeIcon />}
    mode="icon-text"
    disabled={true}
/>`;
    }

    function _getDisplayModesCode() {
        return `// Icon + Text (default)
<NavItem
    route={{ path: "/home" }}
    text="Home"
    icon={<HomeIcon />}
    mode="icon-text"
/>

// Icon Only (for collapsed sidebars)
<NavItem
    route={{ path: "/home" }}
    text="Home"
    icon={<HomeIcon />}
    mode="icon-only"
/>

// Text Only (no icon)
<NavItem
    route={{ path: "/toast" }}
    text="Toast"
    mode="text-only"
/>`;
    }

    function _getMenuSystemCode() {
        return `// In your menu component - track active route
props: {
    _activeRoute: AppRoute  // Store current route
}

messages: {
    "App.Router.AfterRouteChange": async (route) => {
        model._activeRoute = route;  // Update on route change
    }
}

// Helper to create menu items with auto-active detection
function _useMenuItem(params: { 
    text: string; 
    route: AppRoute; 
    icon?: React.ReactNode 
}): NavItemModel {
    return useNavItem({
        text: params.text,
        route: params.route,
        icon: params.icon,
        // Auto-detect active state
        active: () => model._activeRoute?.path === params.route.path,
        mode: () => model.collapsed ? "icon-only" : "icon-text"
    });
}

// Usage
children: {
    homeMenuItem: _useMenuItem({ 
        text: "Home", 
        route: { path: "/home" },
        icon: <HomeIcon />
    })
}`;
    }
}

const NavItemExamples = UECA.getFC(useNavItemExamples);

export { NavItemExamplesParams, NavItemExamplesModel, useNavItemExamples, NavItemExamples };
