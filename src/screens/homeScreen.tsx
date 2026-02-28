import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";

type HomeScreenStruct = UIBaseStruct<{
    props: {
        message: string;
    };
}>;

type HomeScreenParams = UIBaseParams<HomeScreenStruct>;
type HomeScreenModel = UIBaseModel<HomeScreenStruct>;

function useHomeScreen(params?: HomeScreenParams): HomeScreenModel {
    const struct: HomeScreenStruct = {
        props: {
            id: useHomeScreen.name,
            message: "Welcome to UECA-React!"
        },

        init: () => {
            console.log("HomeScreen initialized");
        },

        View: () => (
            <div id={model.htmlId()} style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
                <h1>{model.message}</h1>
                <p>Your minimal UECA-React application is ready to go!</p>
                
                <h2>What is UECA-React?</h2>
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
            </div>
        )
    }

    const model = useUIBase(struct, params);
    return model;
}

const HomeScreen = UECA.getFC(useHomeScreen);

export { HomeScreenModel, useHomeScreen, HomeScreen };
