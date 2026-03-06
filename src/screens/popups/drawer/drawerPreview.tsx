import * as UECA from "ueca-react";
import {
    UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase,
    Col, Block, Card,
    ButtonModel, useButton,
    AlertDrawerModel, useAlertDrawer
} from "@components";

type DrawerAnchor = "left" | "top" | "right" | "bottom";
type DrawerSeverity = "success" | "info" | "warning" | "error" | undefined;
type DrawerButtonType = "ok" | "cancel" | "okCancel" | "none";

type DrawerPreviewStruct = UIBaseStruct<{
    props: {
        anchor: DrawerAnchor;
        severity: DrawerSeverity;
        buttonType: DrawerButtonType;
        width: number;
    };

    children: {
        openDrawerButton: ButtonModel;
        alertDrawer: AlertDrawerModel;
    };

    methods: {
        openDrawer: () => void;
        _PreviewBlockView: () => React.ReactNode;
    };
}>;

type DrawerPreviewParams = UIBaseParams<DrawerPreviewStruct>;
type DrawerPreviewModel = UIBaseModel<DrawerPreviewStruct>;

function useDrawerPreview(params?: DrawerPreviewParams): DrawerPreviewModel {
    const struct: DrawerPreviewStruct = {
        props: {
            id: useDrawerPreview.name,
            anchor: "right",
            severity: undefined,
            buttonType: "cancel",
            width: 600
        },

        children: {
            openDrawerButton: useButton({
                contentView: "Open Alert Drawer",
                variant: "contained",
                color: "primary.main",
                size: "large",
                onClick: () => model.openDrawer()
            }),

            alertDrawer: useAlertDrawer({
                anchor: () => model.anchor,
                severity: () => model.severity || undefined,
                titleView: () => _getTitle(),
                contentView: () => _getContent(),
                width: () => model.width,
                buttons: () => ({
                    ok: model.buttonType === "ok" || model.buttonType === "okCancel",
                    cancel: model.buttonType === "cancel" || model.buttonType === "okCancel",
                    okCancel: false
                }),
                onClose: async (result) => {
                    const resultText = typeof result === "boolean"
                        ? (result ? "OK" : "Cancel")
                        : result;
                    await model.alertInformation(`Drawer closed with: ${resultText}`);
                }
            })
        },

        methods: {
            openDrawer: () => {
                model.alertDrawer.open = true;
            },

            _PreviewBlockView: () => (
                <Col spacing="medium" horizontalAlign="center" verticalAlign="center" minHeight={"200px"}>
                    <h3 style={{ margin: 0 }}>Preview</h3>
                    <model.openDrawerButton.View />
                    <Block sx={{ fontSize: "14px", color: "#666", textAlign: "center", maxWidth: "400px" }}>
                        Click the button to open the AlertDrawer. Modify properties on the left to see the changes.
                    </Block>
                </Col>
            )
        },

        View: () => (
            <Card title="👁️ Preview" fill minWidth={400} overflow="auto">
                <Col spacing="medium" fill>
                    <model._PreviewBlockView />
                    <model.alertDrawer.View />
                </Col>
            </Card>
        )
    };

    const model = useUIBase(struct, params);
    return model;

    // Private helper functions
    function _getTitle() {
        const severityLabels: Record<string, string> = {
            success: "Success",
            info: "Information",
            warning: "Warning",
            error: "Error"
        };
        return model.severity ? severityLabels[model.severity] : "Alert Drawer";
    }

    function _getContent() {
        return (
            <Col spacing="large">
                <Block>
                    <h3 style={{ marginTop: 0 }}>Welcome to AlertDrawer!</h3>
                    <p>
                        This is an <strong>AlertDrawer</strong> component demonstrating side panel functionality.
                        It's perfect for displaying additional information, forms, settings, or any supplementary
                        content without navigating away from the current page.
                    </p>
                </Block>

                <Block sx={{
                    padding: "16px",
                    backgroundColor: "rgba(0, 0, 0, 0.04)",
                    borderRadius: "4px",
                    border: "1px solid rgba(0, 0, 0, 0.12)"
                }}>
                    <h4 style={{ marginTop: 0 }}>Current Configuration</h4>
                    <ul style={{ margin: 0, paddingLeft: "20px" }}>
                        <li><strong>Anchor:</strong> {model.anchor}</li>
                        <li><strong>Severity:</strong> {model.severity || "None"}</li>
                        <li><strong>Button Type:</strong> {model.buttonType}</li>
                        <li><strong>Width:</strong> {model.width}px</li>
                    </ul>
                </Block>

                <Block>
                    <h4>Key Features</h4>
                    <ul style={{ lineHeight: "1.8" }}>
                        <li><strong>Flexible Positioning:</strong> Can slide in from left, right, top, or bottom</li>
                        <li><strong>Severity Indicators:</strong> Visual color coding for different alert types</li>
                        <li><strong>Customizable Actions:</strong> Support for OK, Cancel, or both buttons</li>
                        <li><strong>Responsive Width:</strong> Adjustable panel width to fit your content</li>
                        <li><strong>Auto-scroll content:</strong> Content area scrolls independently when overflow occurs</li>
                        <li><strong>Modal behavior:</strong> Backdrop click closes the drawer</li>
                    </ul>
                </Block>

                <Block>
                    <h4>Usage Example</h4>
                    <pre style={{
                        backgroundColor: "#f5f5f5",
                        padding: "12px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        overflow: "auto",
                        border: "1px solid #e0e0e0"
                    }}>
                        {`const drawer = useAlertDrawer({
    anchor: "right",
    severity: "info",
    titleView: "Information",
    contentView: <YourContent />,
    width: 600,
    buttons: { ok: true, cancel: true },
    onClose: (result) => {
        console.log("Closed with:", result);
    }
});

// Open the drawer
drawer.open = true;`}
                    </pre>
                </Block>

                <Block>
                    <h4>Best Practices</h4>
                    <p>
                        Use drawers for contextual information that supplements the main content. They're ideal for:
                    </p>
                    <ul style={{ lineHeight: "1.8" }}>
                        <li>Detailed information panels</li>
                        <li>Filter and settings controls</li>
                        <li>Form inputs and data entry</li>
                        <li>Help and documentation</li>
                        <li>Navigation menus on mobile</li>
                    </ul>
                </Block>

                <Block sx={{
                    padding: "16px",
                    backgroundColor: "rgba(25, 118, 210, 0.08)",
                    borderRadius: "4px",
                    borderLeft: "4px solid #1976d2"
                }}>
                    <strong>💡 Tip:</strong> Try changing the properties on the left to see how they affect
                    the drawer's appearance and behavior in real-time!
                </Block>
            </Col>
        );
    }
}

const DrawerPreview = UECA.getFC(useDrawerPreview);

export { DrawerPreviewParams, DrawerPreviewModel, useDrawerPreview, DrawerPreview };
