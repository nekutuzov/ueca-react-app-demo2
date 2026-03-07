import * as UECA from "ueca-react";
import {
    UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase,
    Row, Col, Block, Card,
    NavLinkModel, useNavLink
} from "@components";
import { CodeSampleModel, useCodeSample } from "@core";

type NavLinkExamplesStruct = UIBaseStruct<{
    children: {
        homeNavLink: NavLinkModel;
        toastNavLink: NavLinkModel;
        uecaWebsiteNavLink: NavLinkModel;
        githubNavLink: NavLinkModel;
        internalRoutesCodeSample: CodeSampleModel;
        externalUrlsCodeSample: CodeSampleModel;
        routingSystemCodeSample: CodeSampleModel;
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
            }),

            internalRoutesCodeSample: useCodeSample({
                content: () => _getInternalRoutesCode()
            }),

            externalUrlsCodeSample: useCodeSample({
                content: () => _getExternalUrlsCode()
            }),

            routingSystemCodeSample: useCodeSample({
                content: () => _getRoutingSystemCode()
            })
        },

        View: () => (
            <Card title="📚 Examples" fill minWidth={400}>
                <Row spacing="medium" flexWrap="wrap">
                    {/* Internal Routes */}
                    <Block fill
                        sx={{
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
                        <model.internalRoutesCodeSample.View />
                    </Block>

                    {/* External URLs */}
                    <Block fill
                        sx={{
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
                        <model.externalUrlsCodeSample.View />
                    </Block>

                    {/* Routing System */}
                    <Block fill
                        sx={{
                            padding: "16px",
                            backgroundColor: "#fff3e0",
                            border: "1px solid #ffb74d",
                            borderRadius: "4px"
                        }}>
                        <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#e65100" }}>📡 Routing System</h4>
                        <p style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#555" }}>
                            Register new routes in <code>appRoutes.tsx</code>:
                        </p>
                        <model.routingSystemCodeSample.View />
                    </Block>
                </Row>
            </Card>
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
    "/settings?:tab": (p: { tab?: string }) => <SettingsScreen id="settingsScreen" routeParams={p} />,    
    "/users/:id?:tab&:section": 
        (p: { id?: string, tab?: string, section?: string }) => <UserScreen id="userScreen" routeParams={p} />,
};

// Navigation methods (available in all components via BaseModel)
// Programmatic navigation
await model.goToRoute({ path: "/my-route" });

// With params
await model.goToRoute({ 
    path: "/users/:id", 
    params: { id: "123", tab: "profile", section: "info" } 
});

// Open in new tab
await model.openNewTab({ path: "/settings", params: {tab: "address"} });`;
    }
}

const NavLinkExamples = UECA.getFC(useNavLinkExamples);

export { NavLinkExamplesParams, NavLinkExamplesModel, useNavLinkExamples, NavLinkExamples };
