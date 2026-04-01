import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase, Col, Row, Block, ButtonModel, useButton } from "@components";

type MiscPreviewStruct = UIBaseStruct<{
    props: {
        busyDuration: number;
        fileMask: string;
        multiselect: boolean;
        _selectedFiles: File[];
    };

    children: {
        busyButton: ButtonModel;
        fileButton: ButtonModel;
        clearButton: ButtonModel;
    };

    methods: {
        testBusyDisplay: () => Promise<void>;
        testFileSelector: () => Promise<void>;
        clearSelectedFiles: () => void;
        _SelectedFilesDisplayView: () => React.ReactNode;
        _CodeDisplayView: () => React.ReactNode;
    };
}>;

type MiscPreviewParams = UIBaseParams<MiscPreviewStruct>;
type MiscPreviewModel = UIBaseModel<MiscPreviewStruct>;

function useMiscPreview(params?: MiscPreviewParams): MiscPreviewModel {
    const struct: MiscPreviewStruct = {
        props: {
            id: useMiscPreview.name,
            busyDuration: 2000,
            fileMask: ".pdf,.jpg,.png",
            multiselect: true,
            _selectedFiles: []
        },

        children: {
            busyButton: useButton({
                contentView: "Test Busy Display",
                variant: "contained",
                color: "primary.main",
                onClick: () => model.testBusyDisplay()
            }),
            fileButton: useButton({
                contentView: "Select Files",
                variant: "contained",
                color: "secondary.main",
                onClick: () => model.testFileSelector()
            }),
            clearButton: useButton({
                contentView: "Clear Selection",
                variant: "outlined",
                color: "error.main",
                onClick: () => model.clearSelectedFiles()
            })
        },

        methods: {
            testBusyDisplay: async () => {
                await model.bus.unicast("BusyDisplay.Set", true);
                await new Promise(resolve => setTimeout(resolve, model.busyDuration));
                await model.bus.unicast("BusyDisplay.Set", false);
            },

            testFileSelector: async () => {
                const files = await model.bus.unicast("App.SelectFiles", {
                    fileMask: model.fileMask,
                    multiselect: model.multiselect
                });
                if (files?.length) {
                    model._selectedFiles = files;
                }
            },

            clearSelectedFiles: () => {
                model._selectedFiles = [];
            },

            _SelectedFilesDisplayView: () => {
                if (model._selectedFiles.length === 0) {
                    return (
                        <Block sx={{
                            padding: "10px",
                            backgroundColor: "#f5f5f5",
                            border: "1px dashed #ccc",
                            borderRadius: "4px",
                            color: "#666",
                            fontStyle: "italic"
                        }}>
                            No files selected
                        </Block>
                    );
                }

                return (
                    <Col spacing="small">
                        <Block sx={{ fontWeight: 600, marginBottom: "5px" }}>
                            Selected Files ({model._selectedFiles.length}):
                        </Block>
                        {model._selectedFiles.map((file, index) => (
                            <Block reactKey={index} sx={{
                                padding: "8px",
                                backgroundColor: "#f0f7ff",
                                border: "1px solid #90caf9",
                                borderRadius: "4px",
                                fontSize: "14px"
                            }}>
                                <div><strong>Name:</strong> {file.name}</div>
                                <div><strong>Size:</strong> {(file.size / 1024).toFixed(2)} KB</div>
                                <div><strong>Type:</strong> {file.type || "unknown"}</div>
                            </Block>
                        ))}
                    </Col>
                );
            },

            _CodeDisplayView: () => {
                const busyCode = `// Busy Display Example
await model.bus.unicast("BusyDisplay.Set", true);
await new Promise(resolve => setTimeout(resolve, ${model.busyDuration}));
await model.bus.unicast("BusyDisplay.Set", false);`;

                const fileCode = `// File Selector Example
const files = await model.bus.unicast("App.SelectFiles", { 
    fileMask: "${model.fileMask}", 
    multiselect: ${model.multiselect} 
});
if (files?.length) {
    // Process files
    console.log(\`Selected \${files.length} file(s)\`);
}`;

                return (
                    <Col spacing="medium" sx={{ marginTop: "20px" }}>
                        <Block>
                            <h3 style={{ margin: "0 0 10px 0" }}>Code Examples</h3>
                        </Block>
                        <Block>
                            <Block sx={{
                                fontWeight: 600,
                                marginBottom: "5px",
                                color: "#1976d2"
                            }}>
                                Busy Display
                            </Block>
                            <pre style={{
                                backgroundColor: "#f5f5f5",
                                padding: "15px",
                                border: "1px solid #e0e0e0",
                                borderRadius: "4px",
                                overflow: "auto",
                                fontSize: "13px",
                                lineHeight: "1.5",
                                margin: 0
                            }}>
                                <code>{busyCode}</code>
                            </pre>
                        </Block>
                        <Block>
                            <Block sx={{
                                fontWeight: 600,
                                marginBottom: "5px",
                                color: "#9c27b0"
                            }}>
                                File Selector
                            </Block>
                            <pre style={{
                                backgroundColor: "#f5f5f5",
                                padding: "15px",
                                border: "1px solid #e0e0e0",
                                borderRadius: "4px",
                                overflow: "auto",
                                fontSize: "13px",
                                lineHeight: "1.5",
                                margin: 0
                            }}>
                                <code>{fileCode}</code>
                            </pre>
                        </Block>
                    </Col>
                );
            }
        },

        View: () => (
            <Col id={model.htmlId()} fill spacing="medium" sx={{ minWidth: "500px", maxWidth: "700px" }}>
                <Block sx={{
                    padding: "20px",
                    border: "2px solid #e0e0e0",
                    borderRadius: "8px",
                    backgroundColor: "white"
                }}>
                    <Col spacing="large" divider>
                        <Block>
                            <h2 style={{ margin: "0 0 10px 0" }}>Preview & Testing</h2>
                            <p style={{ margin: "0", color: "#666", fontSize: "14px" }}>
                                Test infrastructure components with configured settings.
                            </p>
                        </Block>
                        <Col spacing="medium">
                            <Block sx={{ fontWeight: 600, fontSize: "16px" }}>
                                🔄 Busy Display
                            </Block>
                            <Block sx={{ fontSize: "14px", color: "#666" }}>
                                Shows a loading spinner overlay for {model.busyDuration}ms
                            </Block>
                            <model.busyButton.View />
                        </Col>

                        <Col spacing="medium">
                            <Block sx={{ fontWeight: 600, fontSize: "16px" }}>
                                📁 File Selector
                            </Block>
                            <Block sx={{ fontSize: "14px", color: "#666" }}>
                                File mask: {model.fileMask} | Multiselect: {model.multiselect ? "Yes" : "No"}
                            </Block>
                            <Row spacing="small">
                                <model.fileButton.View />
                                {model._selectedFiles.length > 0 && <model.clearButton.View />}
                            </Row>
                            <model._SelectedFilesDisplayView />
                        </Col>
                    </Col>
                </Block>

                <model._CodeDisplayView />
            </Col>
        )
    };

    const model = useUIBase(struct, params);
    return model;
}

const MiscPreview = UECA.getFC(useMiscPreview);

export { MiscPreviewParams, MiscPreviewModel, useMiscPreview, MiscPreview };
