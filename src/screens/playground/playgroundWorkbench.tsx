import "./playground.css";

// The Playground's page body: the live instance on a canvas with its source below, beside a
// properties panel. A PLAIN FUNCTION — every control in it is a child on the owning screen's model,
// composed in through these slots, so the layout itself holds nothing.

type PlaygroundWorkbenchProps = {
    // The component being edited, live.
    stageView: React.ReactNode;
    // A line under the canvas that reports what the instance is doing (clicks, value, validity).
    stageStatusView?: React.ReactNode;
    // The source listing — usually a CodeSample.
    codeView: React.ReactNode;
    // The editors, grouped with <PlaygroundGroup>.
    propertiesView: React.ReactNode;
    // Buttons for the panel header — the screen's own reset.
    panelActionsView?: React.ReactNode;
    // A stage that lays out its own content (a table) rather than centring a single control.
    stageFill?: boolean;
};

function PlaygroundWorkbench(props: PlaygroundWorkbenchProps): React.ReactElement {
    return (
        <div className="playground-workbench">
            <div className="playground-main">
                <section className="playground-stage" aria-label="Preview">
                    <div className="playground-stage-bar">
                        <span className="ueca-eyebrow">Preview</span>
                        {props.stageStatusView ? <span className="playground-stage-status">{props.stageStatusView}</span> : null}
                    </div>
                    <div className={`playground-canvas${props.stageFill ? " playground-canvas-fill" : ""}`}>
                        {props.stageView}
                    </div>
                </section>
                {props.codeView}
            </div>
            <aside className="playground-panel" aria-label="Properties">
                <div className="playground-panel-bar">
                    <span className="ueca-eyebrow">Properties</span>
                    {props.panelActionsView}
                </div>
                <div className="playground-panel-body">
                    {props.propertiesView}
                </div>
            </aside>
        </div>
    );
}

type PlaygroundGroupProps = {
    title: string;
    children?: React.ReactNode;
};

// A titled run of editors inside the properties panel — "Content", "Appearance", "State".
function PlaygroundGroup(props: PlaygroundGroupProps): React.ReactElement {
    return (
        <div className="playground-group">
            <div className="playground-group-title">{props.title}</div>
            <div className="playground-group-body">{props.children}</div>
        </div>
    );
}

export { PlaygroundWorkbenchProps, PlaygroundWorkbench, PlaygroundGroupProps, PlaygroundGroup };
