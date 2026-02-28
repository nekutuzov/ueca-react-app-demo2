import { createRoot } from "react-dom/client";
import * as UECA from "ueca-react";

function runApplication(AppView: () => UECA.ReactElement, rootElementId: string, onExcept?: UECA.ErrorHandler) {
    try {
        UECA.globalSettings.errorHandler = onExcept;
        const root = createRoot(document.getElementById(rootElementId));
        root.render(
            // Don't wrap in React.StrictMode!
            // StrictMode causes double execution of UECA life-cycle hooks that leads to many issues.
            // UECA abstracts away React from the developer, so React.StrictMode is not needed.
            <AppView />
        );
    } catch (e) {
        displayCrashError((e as Error).message, rootElementId);
    }
}

function displayCrashError(error: string, rootElementId: string) {
    const root = document.getElementById(rootElementId);
    if (!root) {
        console.error(`The root element with ID "${rootElementId}" was not found.`);
        console.error("The application has crashed. Please try refreshing the page.");
        console.error(`Error: ${error}`);
        window.alert("The application has crashed. Please check the console log for details.");
        return;
    }
    const errorContainer = document.createElement("div");
    errorContainer.style.display = "flex";
    errorContainer.style.flexDirection = "column";

    _addText("The application has crashed. Please try refreshing the page.");
    _addText(`Error: ${error}`);

    root.appendChild(errorContainer);

    function _addText(text: string) {
        const span = document.createElement("span");
        span.appendChild(document.createTextNode(text));
        errorContainer.appendChild(span);
    }
}

export { runApplication, displayCrashError }
