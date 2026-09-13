import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorFallback } from "@components";

const FALLBACK_TEXT = "This page isn’t loading correctly. Please try refreshing it.";

function Healthy() {
    return <span>healthy content</span>;
}

function Broken(): React.ReactElement {
    throw new Error("render failed");
}

// React reports every error a boundary catches on console.error; keep the test output clean.
function silenceReactErrorLog() {
    return vi.spyOn(console, "error").mockImplementation(() => { });
}

describe("ErrorFallback", () => {
    it("renders its children while nothing throws", () => {
        const onError = vi.fn();
        render(<ErrorFallback onError={onError}><Healthy /><span>sibling</span></ErrorFallback>);

        expect(screen.getByText("healthy content")).toBeInTheDocument();
        expect(screen.getByText("sibling")).toBeInTheDocument();
        expect(screen.queryByText(FALLBACK_TEXT)).toBeNull();
        expect(onError).not.toHaveBeenCalled();
    });

    it("renders nothing without children", () => {
        const { container } = render(<ErrorFallback />);

        expect(container).toBeEmptyDOMElement();
    });

    it("replaces the whole subtree with the fallback message when a child fails to render", () => {
        silenceReactErrorLog();

        const { container } = render(<ErrorFallback><Healthy /><Broken /></ErrorFallback>);

        expect(container).toHaveTextContent(FALLBACK_TEXT, { normalizeWhitespace: true });
        expect(container.firstElementChild.tagName).toBe("SPAN");
        expect(screen.queryByText("healthy content")).toBeNull();
    });

    it("reports the error and the component stack to onError", () => {
        silenceReactErrorLog();
        const onError = vi.fn();

        render(<ErrorFallback onError={onError}><Broken /></ErrorFallback>);

        expect(onError).toHaveBeenCalledOnce();
        const [error, info] = onError.mock.calls[0];
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe("render failed");
        expect(info.componentStack).toContain("Broken");
    });

    it("still shows the fallback without an onError handler", () => {
        silenceReactErrorLog();

        render(<ErrorFallback><Broken /></ErrorFallback>);

        expect(screen.getByText(FALLBACK_TEXT)).toBeInTheDocument();
    });

    // The boundary has no reset: once tripped it keeps the fallback, even for healthy children.
    it("keeps showing the fallback after re-rendering with healthy children", () => {
        silenceReactErrorLog();
        const { rerender } = render(<ErrorFallback><Broken /></ErrorFallback>);

        rerender(<ErrorFallback><Healthy /></ErrorFallback>);

        expect(screen.getByText(FALLBACK_TEXT)).toBeInTheDocument();
        expect(screen.queryByText("healthy content")).toBeNull();
    });

    it("contains the failure: content outside the boundary keeps rendering", () => {
        silenceReactErrorLog();

        render(<div><span>outside</span><ErrorFallback><Broken /></ErrorFallback></div>);

        expect(screen.getByText("outside")).toBeInTheDocument();
        expect(screen.getByText(FALLBACK_TEXT)).toBeInTheDocument();
    });
});
