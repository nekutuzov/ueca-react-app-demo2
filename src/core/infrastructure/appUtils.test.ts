import { describe, expect, it, vi } from "vitest";
import {
    abort, AbortExecutionException, AppURL, asyncSafe, DetailedError, goToRoute, notImplemented, runAsync
} from "@core";
import { settle, stubMessages } from "@test";

type Mode = "application" | "dialog" | "log" | "suppress" | "none";

const MODES: Mode[] = ["application", "dialog", "log", "suppress", "none"];

// asyncSafe answers an async failure inside promise.catch(), so whatever that handler throws
// rejects the promise catch() returns — one nobody holds. Capturing it (the last catch() made while
// `run` executes synchronously is asyncSafe's own) lets a test observe the outcome and keeps an
// expected rejection from surfacing as an unhandled one.
function asyncOutcome(run: () => void): Promise<unknown> {
    const spy = vi.spyOn(Promise.prototype, "catch");
    let results: unknown[];
    try {
        run();
    } finally {
        results = spy.mock.results.map((result) => result.value);
        spy.mockRestore();
    }
    return results[results.length - 1] as Promise<unknown>;
}

function thrownBy(run: () => void): unknown {
    try {
        run();
    } catch (error) {
        return error;
    }
    return undefined;
}

// Both reporting channels, mocked, plus a silent console.
async function observeReporting() {
    const bus = await stubMessages({
        "App.UnhandledException": vi.fn(async () => { }),
        "Dialog.Exception": vi.fn(async () => { })
    });
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => { });
    return { unhandled: bus["App.UnhandledException"], dialog: bus["Dialog.Exception"], consoleError };
}

describe("asyncSafe", () => {
    it("runs a successful action and returns nothing", () => {
        const action = vi.fn();

        expect(asyncSafe(action)).toBeUndefined();
        expect(action).toHaveBeenCalledOnce();
    });

    describe("a synchronous action that throws", () => {
        it("reports the error as App.UnhandledException by default and bails the caller out", async () => {
            const { unhandled, dialog, consoleError } = await observeReporting();
            const error = new Error("disk full");

            const thrown = thrownBy(() => asyncSafe(() => { throw error; }));
            await settle();

            expect(thrown).toBeInstanceOf(AbortExecutionException);
            expect((thrown as Error).message).toBe("disk full");
            expect(unhandled).toHaveBeenCalledExactlyOnceWith(error);
            expect(dialog).not.toHaveBeenCalled();
            expect(consoleError).not.toHaveBeenCalled();
        });

        it("shows the error with Dialog.Exception in dialog mode", async () => {
            const { unhandled, dialog } = await observeReporting();
            const error = new Error("disk full");

            expect(thrownBy(() => asyncSafe(() => { throw error; }, "dialog"))).toBeInstanceOf(AbortExecutionException);
            await settle();

            expect(dialog).toHaveBeenCalledExactlyOnceWith({ error });
            expect(unhandled).not.toHaveBeenCalled();
        });

        it("logs the error to the console in log mode", async () => {
            const { unhandled, dialog, consoleError } = await observeReporting();
            const error = new Error("disk full");

            expect(thrownBy(() => asyncSafe(() => { throw error; }, "log"))).toBeInstanceOf(AbortExecutionException);
            await settle();

            expect(consoleError).toHaveBeenCalledExactlyOnceWith(error);
            expect(unhandled).not.toHaveBeenCalled();
            expect(dialog).not.toHaveBeenCalled();
        });

        it("swallows the error without a trace in suppress mode", async () => {
            const { unhandled, dialog, consoleError } = await observeReporting();

            expect(thrownBy(() => asyncSafe(() => { throw new Error("disk full"); }, "suppress"))).toBeUndefined();
            await settle();

            expect(unhandled).not.toHaveBeenCalled();
            expect(dialog).not.toHaveBeenCalled();
            expect(consoleError).not.toHaveBeenCalled();
        });

        it("rethrows the original error, unreported, in none mode", async () => {
            const { unhandled, dialog, consoleError } = await observeReporting();
            const error = new Error("disk full");

            expect(thrownBy(() => asyncSafe(() => { throw error; }, "none"))).toBe(error);
            await settle();

            expect(unhandled).not.toHaveBeenCalled();
            expect(dialog).not.toHaveBeenCalled();
            expect(consoleError).not.toHaveBeenCalled();
        });

        // AbortExecution is a normal business-logic event, not a failure.
        it.each(MODES)("lets an AbortExecutionException end the action quietly in %s mode", async (mode) => {
            const { unhandled, dialog, consoleError } = await observeReporting();

            expect(thrownBy(() => asyncSafe(() => abort("user cancelled"), mode))).toBeUndefined();
            await settle();

            expect(unhandled).not.toHaveBeenCalled();
            expect(dialog).not.toHaveBeenCalled();
            expect(consoleError).not.toHaveBeenCalled();
        });

        // A report that cannot even be logged must not take the caller down with it.
        it("logs both errors and lets the caller continue when reporting itself fails", async () => {
            const { consoleError } = await observeReporting();
            const error = new Error("disk full");
            const logFailure = new Error("console unavailable");
            consoleError.mockImplementationOnce(() => { throw logFailure; });

            expect(thrownBy(() => asyncSafe(() => { throw error; }, "log"))).toBeUndefined();

            expect(consoleError).toHaveBeenNthCalledWith(2, error);
            expect(consoleError).toHaveBeenNthCalledWith(3, logFailure);
        });
    });

    describe("an asynchronous action that rejects", () => {
        it("returns to the caller at once and reports the failure when it lands", async () => {
            const { unhandled } = await observeReporting();
            const error = new Error("timeout");
            let outcome: Promise<unknown>;

            expect(() => { outcome = asyncOutcome(() => asyncSafe(async () => { throw error; })); }).not.toThrow();
            await expect(outcome).rejects.toBeInstanceOf(AbortExecutionException);
            await settle();

            expect(unhandled).toHaveBeenCalledExactlyOnceWith(error);
        });

        it.each([
            ["dialog", "dialog"],
            ["log", "console"]
        ] as const)("reports through the %s channel and ends in an AbortExecutionException", async (mode, channel) => {
            const reporting = await observeReporting();
            const error = new Error("timeout");

            const outcome = asyncOutcome(() => asyncSafe(async () => { throw error; }, mode));
            await expect(outcome).rejects.toBeInstanceOf(AbortExecutionException);
            await expect(outcome).rejects.toThrow("timeout");
            await settle();

            if (channel === "dialog") {
                expect(reporting.dialog).toHaveBeenCalledExactlyOnceWith({ error });
            } else {
                expect(reporting.consoleError).toHaveBeenCalledExactlyOnceWith(error);
            }
            expect(reporting.unhandled).not.toHaveBeenCalled();
        });

        it("swallows the failure in suppress mode", async () => {
            const { unhandled, dialog, consoleError } = await observeReporting();

            await expect(asyncOutcome(() => asyncSafe(async () => { throw new Error("timeout"); }, "suppress"))).resolves.toBeUndefined();
            await settle();

            expect(unhandled).not.toHaveBeenCalled();
            expect(dialog).not.toHaveBeenCalled();
            expect(consoleError).not.toHaveBeenCalled();
        });

        it("passes the original failure on, unreported, in none mode", async () => {
            const { unhandled, consoleError } = await observeReporting();
            const error = new Error("timeout");

            await expect(asyncOutcome(() => asyncSafe(async () => { throw error; }, "none"))).rejects.toBe(error);
            await settle();

            expect(unhandled).not.toHaveBeenCalled();
            expect(consoleError).not.toHaveBeenCalled();
        });

        it.each(MODES)("lets an AbortExecutionException end the action quietly in %s mode", async (mode) => {
            const { unhandled, dialog, consoleError } = await observeReporting();

            await expect(asyncOutcome(() => asyncSafe(async () => abort(), mode))).resolves.toBeUndefined();
            await settle();

            expect(unhandled).not.toHaveBeenCalled();
            expect(dialog).not.toHaveBeenCalled();
            expect(consoleError).not.toHaveBeenCalled();
        });
    });
});

describe("runAsync", () => {
    it("runs the action on a later task, not synchronously", () => {
        vi.useFakeTimers();
        const action = vi.fn();

        runAsync(action);
        expect(action).not.toHaveBeenCalled();

        vi.advanceTimersByTime(0);
        expect(action).toHaveBeenCalledOnce();
    });

    // Regression: runAsync wrapped only the setTimeout() call in asyncSafe; the action ran later,
    // outside that guard, so its errors ignored the errorHandling argument entirely and escaped as
    // uncaught errors — "suppress" did not suppress, and "application" or "dialog" never reported
    // them. A CRUD screen that navigates after a save with runAsync failed without a word.
    it("applies errorHandling to an error thrown by the deferred action", () => {
        vi.useFakeTimers();

        runAsync(() => { throw new Error("late failure"); }, "suppress");

        expect(() => vi.advanceTimersByTime(0)).not.toThrow();
    });

    it("reports an error thrown by the deferred action as App.UnhandledException by default, throwing nothing into the timer", async () => {
        const { unhandled } = await observeReporting();
        const error = new Error("late failure");
        vi.useFakeTimers();

        runAsync(() => { throw error; });

        expect(() => vi.advanceTimersByTime(0)).not.toThrow();
        vi.useRealTimers();
        await settle();
        expect(unhandled).toHaveBeenCalledExactlyOnceWith(error);
    });

    it("reports a deferred async action that rejects through the channel it was given", async () => {
        const { dialog, unhandled } = await observeReporting();
        const error = new Error("navigation refused");
        vi.useFakeTimers();

        runAsync(async () => { throw error; }, "dialog");
        const outcome = asyncOutcome(() => vi.advanceTimersByTime(0));

        await expect(outcome).rejects.toBeInstanceOf(AbortExecutionException);
        vi.useRealTimers();
        await settle();
        expect(dialog).toHaveBeenCalledExactlyOnceWith({ error });
        expect(unhandled).not.toHaveBeenCalled();
    });

    // "none" means no handling at all, deferred or not.
    it("lets the deferred action's error through in none mode", () => {
        const error = new Error("late failure");
        vi.useFakeTimers();

        runAsync(() => { throw error; }, "none");

        expect(() => vi.advanceTimersByTime(0)).toThrow(error);
    });
});

describe("goToRoute", () => {
    it("asks the router to navigate", async () => {
        const bus = await stubMessages({ "App.Router.GoToRoute": vi.fn(async () => true) });

        goToRoute({ path: "/showcase/overview" });
        await settle();

        expect(bus["App.Router.GoToRoute"]).toHaveBeenCalledExactlyOnceWith({ path: "/showcase/overview" });
    });

    it("logs a failed navigation instead of throwing it at the caller", async () => {
        const failure = new Error("navigation refused");
        await stubMessages({ "App.Router.GoToRoute": vi.fn(async () => { throw failure; }) });
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => { });

        await expect(asyncOutcome(() => goToRoute({ path: "/home" }))).rejects.toBeInstanceOf(AbortExecutionException);

        expect(consoleError).toHaveBeenCalledWith(failure);
    });
});

describe("DetailedError", () => {
    it("is an Error with a name, message and details", () => {
        const error = new DetailedError("Conflict", "Order is locked", "Order 7 is open elsewhere");

        expect(error).toBeInstanceOf(Error);
        expect(error).toMatchObject({ name: "Conflict", message: "Order is locked", details: "Order 7 is open elsewhere" });
    });

    // Assigning the stack unconditionally wiped it whenever the caller had none — e.g. the API
    // returning a null errorCallStack.
    it.each([undefined, null, ""])("keeps the stack captured at construction when given %j", (stack) => {
        const error = new DetailedError("Conflict", "Order is locked", undefined, stack);

        expect(error.stack).toContain("appUtils.test");
    });

    it("takes a supplied stack in place of its own", () => {
        const error = new DetailedError("Conflict", "Order is locked", undefined, "at OrderService.save (orders.cs:42)");

        expect(error.stack).toBe("at OrderService.save (orders.cs:42)");
    });
});

describe("abort and notImplemented", () => {
    it("abort bails out with an AbortExecutionException carrying the reason", () => {
        const thrown = thrownBy(() => abort("user cancelled"));

        expect(thrown).toBeInstanceOf(AbortExecutionException);
        expect((thrown as Error).message).toBe("user cancelled");
        expect(thrownBy(() => abort())).toBeInstanceOf(AbortExecutionException);
    });

    it("notImplemented throws a plain error", () => {
        const thrown = thrownBy(() => notImplemented());

        expect(thrown).not.toBeInstanceOf(AbortExecutionException);
        expect(thrown).toEqual(new Error("Not implemented"));
    });
});

describe("AppURL", () => {
    it("parses an app path against a placeholder host", () => {
        const url = new AppURL("/users/7?tab=orders");

        expect(url.host).toBe("_");
        expect(url.pathname).toBe("/users/7");
        expect(url.searchParams.get("tab")).toBe("orders");
    });

    it("keeps the host of an absolute URL", () => {
        expect(new AppURL("https://docs.example.com/guide").host).toBe("docs.example.com");
    });

    // Why the Router rewrites "//" routes to a tag before parsing them.
    it("reads a protocol-relative path's first segment as a host", () => {
        expect(new AppURL("//admin/users").host).toBe("admin");
    });
});
