import * as UECA from "ueca-react";
import { AppMessage, AppRoute } from "@core";

// Error with details information
class DetailedError extends Error { 
    details?: string;

    constructor(name: string, message: string, details?: string, stack?: string) {
        super();
        this.name = name;
        this.message = message;
        this.details = details;
        this.stack = stack;
    }
}

// Business logic "bail-out" exception
class AbortExecutionException extends Error { }

function abort(reason?: string) {
    throw new AbortExecutionException(reason);
}

function notImplemented() {
    throw Error("Not implemented");
}

const appMessageBus = UECA.defaultMessageBus<AppMessage>();

type ErrorHandling = "application" | "dialog" | "log" | "suppress" | "none";

function asyncSafe(action: () => (void | Promise<void>), errorHandling: ErrorHandling = "application") {
    try {
        const promise = action();

        if (promise instanceof Promise) {
            promise.catch(error => _handleError(error));
        }
    } catch (e) {
        _handleError(e as Error);
    }

    function _handleError(error: Error) {
        if (error instanceof AbortExecutionException) {
            // AbortExecution is a normal business logic event.
            return;
        }

        try {
            switch (errorHandling) {
                case "application":
                    asyncSafe(async () => await appMessageBus.unicast("App.UnhandledException", error), "log"); // Recursion with error logging
                    break;
                case "dialog":
                    asyncSafe(async () => await appMessageBus.unicast("Dialog.Exception", { error: error }), "log");  // Recursion with error logging
                    break;
                case "log":
                    console.error(error);
                    break;
            }
        } catch (e) {
            console.error(error);
            console.error(e);
            return;
        }

        if (errorHandling === "suppress") {
            return;
        } else if (errorHandling === "none") {
            throw error;
        } else {
            throw new AbortExecutionException(error.message);
        }
    }
}

function runAsync(action: () => void, errorHandling: ErrorHandling = "application") {
    asyncSafe(async () => void setTimeout(action, 0), errorHandling);
}

function goToRoute(route: AppRoute) {
    asyncSafe(async () => { await appMessageBus.unicast("App.Router.GoToRoute", route); }, "log");
}

class AppURL extends URL {
    constructor(appUrl: string) {
        super(appUrl, "http://_");
    }
}

export { notImplemented, asyncSafe, appMessageBus, runAsync, goToRoute, AppURL, DetailedError, AbortExecutionException, abort };
