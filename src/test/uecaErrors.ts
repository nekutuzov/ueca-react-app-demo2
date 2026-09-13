import * as UECA from "ueca-react";

// UECA swallows the errors that matter most in a test — a View that throws renders as nothing, a
// throwing onChange handler is caught inside the dispatcher — and hands them to
// globalSettings.errorHandler instead. Collecting them here and failing the test in afterEach turns
// "the element is missing" into the actual error.

const collected: Error[] = [];

function installUecaErrorCollector() {
    collected.length = 0;
    UECA.globalSettings.errorHandler = (error: Error) => {
        collected.push(error);
    };
}

// For a test that EXPECTS errors: returns them and clears the list, so afterEach stays quiet.
function takeUecaErrors(): Error[] {
    return collected.splice(0);
}

function assertNoUecaErrors() {
    const errors = takeUecaErrors();
    if (errors.length) {
        const details = errors.map((e) => `  - ${e?.stack ?? e?.message ?? String(e)}`).join("\n");
        throw new Error(`UECA reported ${errors.length} unexpected error(s):\n${details}`);
    }
}

export { installUecaErrorCollector, takeUecaErrors, assertNoUecaErrors };
