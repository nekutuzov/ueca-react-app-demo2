import * as UECA from "ueca-react";
import { initMocks } from "@api";
import { AbortExecutionException, Application, appMessageBus, runApplication } from "@core";

// Enable detailed UECA trace logging as needed
UECA.globalSettings.traceLog = false;

// Remove mock after integrating with a real backend API
initMocks();

// Application starting point
runApplication(
    () => <Application id={"app"} applicationName={"UECA React Vite App"} appVersion={"1.0.0"} />,
    "root",
    (e) => {
        if (e && !(e instanceof AbortExecutionException)) {
            appMessageBus.unicast("App.UnhandledException", e);
        }
    }
);
