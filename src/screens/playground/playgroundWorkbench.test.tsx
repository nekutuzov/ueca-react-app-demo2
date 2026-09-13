import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { PlaygroundGroup, PlaygroundWorkbench } from "./playgroundWorkbench";

function renderWorkbench(props: Partial<React.ComponentProps<typeof PlaygroundWorkbench>> = {}) {
    return render(
        <PlaygroundWorkbench
            stageView={<button type="button">Live</button>}
            codeView={<pre data-testid="code">&lt;Button /&gt;</pre>}
            propertiesView={<input aria-label="Label" />}
            {...props}
        />
    );
}

describe("PlaygroundWorkbench", () => {
    it("puts the live instance on the canvas of the Preview region", () => {
        renderWorkbench();

        const preview = screen.getByRole("region", { name: "Preview" });
        const live = within(preview).getByRole("button", { name: "Live" });
        expect(live.parentElement).toHaveClass("playground-canvas");
        expect(within(preview).getByText("Preview")).toHaveClass("ueca-eyebrow");
    });

    it("places the source listing below the stage and the editors in the Properties panel", () => {
        renderWorkbench();

        const preview = screen.getByRole("region", { name: "Preview" });
        const code = screen.getByTestId("code");
        expect(preview.nextElementSibling).toBe(code);
        expect(within(preview).queryByTestId("code")).toBeNull();

        const panel = screen.getByRole("complementary", { name: "Properties" });
        expect(within(panel).getByRole("textbox", { name: "Label" }).parentElement).toHaveClass("playground-panel-body");
    });

    it("shows the status line only when one is given", () => {
        const { container, rerender } = renderWorkbench();
        expect(container.querySelector(".playground-stage-status")).toBeNull();

        rerender(
            <PlaygroundWorkbench stageView={null} codeView={null} propertiesView={null} stageStatusView={"clicked once"} />
        );

        expect(container.querySelector(".playground-stage-status")).toHaveTextContent("clicked once");
    });

    it("renders the panel actions in the Properties header", () => {
        renderWorkbench({ panelActionsView: <button type="button">Reset</button> });

        const reset = screen.getByRole("button", { name: "Reset" });
        expect(reset.parentElement).toHaveClass("playground-panel-bar");
        expect(within(reset.parentElement).getByText("Properties")).toHaveClass("ueca-eyebrow");
    });

    it("lets a stage that lays out its own content fill the canvas", () => {
        const { container, rerender } = renderWorkbench();
        expect(container.querySelector(".playground-canvas")).not.toHaveClass("playground-canvas-fill");

        rerender(<PlaygroundWorkbench stageFill stageView={null} codeView={null} propertiesView={null} />);

        expect(container.querySelector(".playground-canvas")).toHaveClass("playground-canvas-fill");
    });
});

describe("PlaygroundGroup", () => {
    it("titles a run of editors", () => {
        const { container } = render(
            <PlaygroundGroup title="Appearance">
                <input aria-label="Size" />
                <input aria-label="Color" />
            </PlaygroundGroup>
        );

        expect(container.querySelector(".playground-group-title")).toHaveTextContent("Appearance");
        const body = container.querySelector(".playground-group-body");
        expect(within(body as HTMLElement).getAllByRole("textbox")).toHaveLength(2);
    });

    it("renders an empty body without children", () => {
        const { container } = render(<PlaygroundGroup title="State" />);

        expect(container.querySelector(".playground-group-body")).toBeEmptyDOMElement();
    });
});
