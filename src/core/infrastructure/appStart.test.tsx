import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "@testing-library/react";
import { createRoot, Root } from "react-dom/client";
import * as UECA from "ueca-react";
import { displayCrashError, runApplication } from "@core";

// runApplication creates its React root internally and returns nothing, so createRoot is wrapped
// (still the real one) to reach the roots a test started and unmount them afterwards.
vi.mock("react-dom/client", async (importOriginal) => {
    const actual = await importOriginal<typeof import("react-dom/client")>();
    return { ...actual, createRoot: vi.fn(actual.createRoot) };
});

const CRASH_TEXT = "The application has crashed. Please try refreshing the page.";
const roots: Root[] = [];
let container: HTMLElement;

async function start(AppView: () => UECA.ReactElement, rootElementId: string, onExcept?: UECA.ErrorHandler) {
    const before = vi.mocked(createRoot).mock.results.length;
    await act(async () => {
        runApplication(AppView, rootElementId, onExcept);
    });
    for (const result of vi.mocked(createRoot).mock.results.slice(before)) {
        if (result.type === "return") {
            roots.push(result.value);
        }
    }
}

beforeEach(() => {
    container = document.createElement("div");
    container.id = "root";
    document.body.append(container);
});

afterEach(() => {
    act(() => roots.splice(0).forEach((root) => root.unmount()));
    container.remove();
});

describe("runApplication", () => {
    // Set before the first render, so nothing the application does while starting goes unreported.
    it("installs the error handler before the application first renders, then renders it into the root", async () => {
        const onExcept = vi.fn();
        let handlerDuringRender: UECA.ErrorHandler;
        const AppView = () => {
            handlerDuringRender = UECA.globalSettings.errorHandler;
            return <span>application ready</span>;
        };

        await start(AppView, "root", onExcept);

        expect(container).toHaveTextContent("application ready");
        expect(handlerDuringRender).toBe(onExcept);
        expect(UECA.globalSettings.errorHandler).toBe(onExcept);
    });

    it("contains a render crash in an error boundary, logs it and reports it to onExcept", async () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => { });
        const onExcept = vi.fn();
        const crash = new Error("render failed");
        const AppView = (): UECA.ReactElement => { throw crash; };

        await start(AppView, "root", onExcept);

        expect(container).toHaveTextContent(/isn.t loading correctly/);
        expect(onExcept).toHaveBeenCalledExactlyOnceWith(crash);
        expect(consoleError).toHaveBeenCalledWith(
            "React Error Boundary caught an error:", crash, expect.objectContaining({ componentStack: expect.any(String) })
        );
    });

    it("contains a render crash without an onExcept handler", async () => {
        vi.spyOn(console, "error").mockImplementation(() => { });
        const AppView = (): UECA.ReactElement => { throw new Error("render failed"); };

        await start(AppView, "root");

        expect(container).toHaveTextContent(/isn.t loading correctly/);
        expect(UECA.globalSettings.errorHandler).toBeUndefined();
    });

    it("falls back to the crash report when the root element does not exist", async () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => { });
        const alert = vi.spyOn(window, "alert");
        const AppView = vi.fn(() => <span>application ready</span>);

        await start(AppView, "no-such-root", vi.fn());

        expect(AppView).not.toHaveBeenCalled();
        expect(consoleError).toHaveBeenCalledWith('The root element with ID "no-such-root" was not found.');
        expect(consoleError).toHaveBeenCalledWith("Error: Target container is not a DOM element.");
        expect(alert).toHaveBeenCalledOnce();
    });
});

describe("displayCrashError", () => {
    it("writes the crash and the error, one line each, into the root element", () => {
        displayCrashError("Out of memory", "root");

        const report = container.lastElementChild as HTMLElement;
        expect(report.style.display).toBe("flex");
        expect(report.style.flexDirection).toBe("column");
        expect([...report.children].map((line) => [line.tagName, line.textContent])).toEqual([
            ["SPAN", CRASH_TEXT],
            ["SPAN", "Error: Out of memory"]
        ]);
    });

    it("writes the error as text, never as markup", () => {
        displayCrashError('<img src="x" onerror="alert(1)">', "root");

        expect(container.querySelector("img")).toBeNull();
        expect(container).toHaveTextContent('Error: <img src="x" onerror="alert(1)">');
    });

    it("logs to the console and alerts the user when there is no root element to write into", () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => { });
        const alert = vi.spyOn(window, "alert");

        displayCrashError("Out of memory", "no-such-root");

        expect(consoleError.mock.calls).toEqual([
            ['The root element with ID "no-such-root" was not found.'],
            [CRASH_TEXT],
            ["Error: Out of memory"]
        ]);
        expect(alert).toHaveBeenCalledExactlyOnceWith("The application has crashed. Please check the console log for details.");
        expect(document.body).not.toHaveTextContent(CRASH_TEXT);
    });
});
