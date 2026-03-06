import * as UECA from "ueca-react";
import {
    UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase,
    Row, Col, Block,
    NavLinkModel, useNavLink
} from "@components";

type NavLinkExamplesStruct = UIBaseStruct<{
    children: {
        homeNavLink: NavLinkModel;
        toastNavLink: NavLinkModel;
        uecaWebsiteNavLink: NavLinkModel;
        githubNavLink: NavLinkModel;
    };

    methods: {
        _CodeBlockView(props: { code: string }): React.ReactElement;
    };
}>;

type NavLinkExamplesParams = UIBaseParams<NavLinkExamplesStruct>;
type NavLinkExamplesModel = UIBaseModel<NavLinkExamplesStruct>;

function useNavLinkExamples(params?: NavLinkExamplesParams): NavLinkExamplesModel {
    const struct: NavLinkExamplesStruct = {
        props: {
            id: useNavLinkExamples.name
        },

        children: {
            homeNavLink: useNavLink({
                route: { path: "/home" },
                linkView: "Home",
                color: "primary.main",
                underline: "hover"
            }),

            toastNavLink: useNavLink({
                route: { path: "/toast" },
                linkView: "Toast Notifications",
                color: "secondary.main",
                underline: "none"
            }),

            uecaWebsiteNavLink: useNavLink({
                route: { path: "https://ueca-react.carrd.co/" },
                linkView: "UECA React Website",
                color: "info.main",
                underline: "always",
                newTab: true
            }),

            githubNavLink: useNavLink({
                route: { path: "https://github.com/nekutuzov/ueca-react-app" },
                linkView: "GitHub Example App",
                color: "text.primary",
                underline: "hover",
                newTab: true
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
                    {/* Internal Routes */}
                    <Block sx={{
                        padding: "16px",
                        backgroundColor: "#f5f5f5",
                        borderRadius: "4px",
                        border: "1px solid #e0e0e0"
                    }}>
                        <Block sx={{ fontWeight: 600, marginBottom: "8px", fontSize: "14px" }}>
                            Internal Routes
                        </Block>
                        <Row spacing="medium" flexWrap="wrap">
                            <model.homeNavLink.View />
                            <model.toastNavLink.View />
                        </Row>
                        <model._CodeBlockView code={_getInternalRoutesCode()} />
                    </Block>

                    {/* External URLs */}
                    <Block sx={{
                        padding: "16px",
                        backgroundColor: "#f5f5f5",
                        borderRadius: "4px",
                        border: "1px solid #e0e0e0"
                    }}>
                        <Block sx={{ fontWeight: 600, marginBottom: "8px", fontSize: "14px" }}>
                            External URLs (Open in New Tab)
                        </Block>
                        <Col spacing="small">
                            <model.uecaWebsiteNavLink.View />
                            <model.githubNavLink.View />
                        </Col>
                        <model._CodeBlockView code={_getExternalUrlsCode()} />
                    </Block>

                    {/* Routing System */}
                    <Block sx={{
                        padding: "16px",
                        backgroundColor: "#fff3e0",
                        border: "1px solid #ffb74d",
                        borderRadius: "4px"
                    }}>
                        <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#e65100" }}>📡 Routing System</h4>
                        <p style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#555" }}>
                            Register new routes in <code>appRoutes.tsx</code>:
                        </p>
                        <model._CodeBlockView code={_getRoutingSystemCode()} />
                    </Block>
                </Col>
            </Block>
        )
    };

    const model = useUIBase(struct, params);
    return model;

    // Private helper functions for code examples
    function _getInternalRoutesCode() {
        return `// NavLink to internal app routes
<NavLink 
    route={{ path: "/home" }}
    linkView="Home"
    color="primary.main"
    underline="hover"
/>

<NavLink
    route={{ path: "/toast" }}
    linkView="Toast Notifications"
    color="secondary.main"
    underline="none"
/>`;
    }

    function _getExternalUrlsCode() {
        return `// NavLink to external URLs - opens in new tab
<NavLink
    route={{ path: "https://ueca-react.carrd.co/" }}
    linkView="UECA React Website"
    color="info.main"
    underline="always"
    newTab={true}
/>

<NavLink
    route={{ path: "https://github.com/nekutuzov/ueca-react-app" }}
    linkView="GitHub Example App"
    color="text.primary"
    underline="hover"
    newTab={true}
/>`;
    }

    function _getRoutingSystemCode() {
        return `// In appRoutes.tsx - Define your routes
import { MyNewScreen } from "@screens";

const screenRoutes = {
    "/my-route": () => <MyNewScreen id="myNewScreen" />,
    "/users/:id": () => <UserScreen id="userScreen" />,
    "/settings?:tab": () => <SettingsScreen id="settingsScreen" />
};

// Navigation methods (available in all components via BaseModel)
// Programmatic navigation
await model.goToRoute({ path: "/my-route" });

// With params
await model.goToRoute({ 
    path: "/users/:id", 
    params: { id: "123" } 
});

// Open in new tab
await model.openNewTab({ path: "/settings" });`;
    }
}

const NavLinkExamples = UECA.getFC(useNavLinkExamples);

export { NavLinkExamplesParams, NavLinkExamplesModel, useNavLinkExamples, NavLinkExamples };
