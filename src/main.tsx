import * as UECA from "ueca-react";
import { initMocks } from "@api";
import { AbortExecutionException, Application, appMessageBus, runApplication } from "@core";
import "./tokens.css"; // non-colour design tokens (type, spacing, radii, motion, z-index) — theme-independent
import "./themes.css"; // colour: one block per theme, switched at runtime by <html data-theme>
import "./theme.css"; // page surface, focus, selection and the markdown article, built on the theme tokens

// Enable detailed UECA trace logging as needed
UECA.globalSettings.traceLog = false;

// This demo is served as static files with no backend, so the mock API runs in every build —
// production included. Remove it once the app talks to a real server.
initMocks();

// Application starting point
runApplication(
    () => <Application id={"app"} applicationName={"UECA-React Showcase"} appVersion={"3.0"} />,
    "root",
    (e) => {
        if (e && !(e instanceof AbortExecutionException)) {
            appMessageBus.unicast("App.UnhandledException", e);
        }
    }
);
