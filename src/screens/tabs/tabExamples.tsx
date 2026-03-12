import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase, Col, Row, Block, Button, useTabsContainer, TabParams } from "@components";

type TabExamplesStruct = UIBaseStruct<{
    props: {
        tabCounter: number;
        _tabsConfig: TabParams[];
    };

    children: {
        tabsContainer: ReturnType<typeof useTabsContainer>;
    };

    methods: {
        addTab: () => void;
        removeTab: (tabId: string) => void;
    };
}>;

type TabExamplesParams = UIBaseParams<TabExamplesStruct>;
type TabExamplesModel = UIBaseModel<TabExamplesStruct>;

function useTabExamples(params?: TabExamplesParams): TabExamplesModel {
    const struct: TabExamplesStruct = {
        props: {
            id: useTabExamples.name,
            tabCounter: 0,
            _tabsConfig: []
        },

        children: {
            tabsContainer: useTabsContainer({
                tabsConfig: () => model._tabsConfig,
                variant: "scrollable",
                scrollButtons: "auto"
            })
        },

        methods: {
            addTab: () => {
                model.tabCounter++;
                const tabId = `tab${model.tabCounter}`;

                // Create tab configuration (no hooks needed!)
                const newTabConfig: TabParams = {
                    id: tabId,
                    tabId: tabId,
                    labelView: <Row spacing="tiny" verticalAlign="center">
                        <span>{`Tab ${model.tabCounter}`}</span>
                        <div
                            style={{
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                                fontSize: "16px",
                                padding: "2px 4px",
                                marginLeft: "4px",
                                opacity: 0.7
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                model.removeTab(tabId);
                            }}
                            title="Close tab"
                        >
                            ×
                        </div>
                    </Row>,

                    contentView: <Col fill padding="medium" spacing="small">
                        <h4>Content of Tab {model.tabCounter}</h4>
                        <p>This tab was created dynamically using the <strong>tabsConfig</strong> pattern with inline JSX:</p>
                        <Block
                            padding="small"
                            backgroundColor="background.default"
                            border="rounded"
                        >
                            <pre style={{ fontSize: "12px", lineHeight: "1.4" }}>{_getCodeExample(tabId)}</pre>
                        </Block>
                        <Block>
                            <p><strong>Key advantages:</strong></p>
                            <ul>
                                <li><strong>Declarative</strong>: Tabs defined as configuration objects</li>
                                <li><strong>No manual hooks</strong>: TabsContainer handles model creation</li>
                                <li><strong>Clean state</strong>: Just manage an array of TabParams</li>
                            </ul>
                        </Block>
                        <Block padding="small" backgroundColor="info.light" border="rounded">
                            <p><strong>How it works:</strong></p>
                            <ol style={{ margin: "8px 0", paddingLeft: "20px" }}>
                                <li>Create TabParams config object</li>
                                <li>Add configs to a reactive array (e.g., <code>_tabsConfig</code>)</li>
                                <li>Pass array to TabsContainer via <code>tabsConfig</code> prop</li>
                                <li>TabsContainer renders <code>&lt;Tab /&gt;</code> components automatically</li>
                            </ol>
                        </Block>
                    </Col>
                };

                // Add config to array - TabsContainer handles the rest!
                model._tabsConfig = [...model._tabsConfig, newTabConfig];
            },

            removeTab: (tabId: string) => {
                model._tabsConfig = model._tabsConfig.filter(tab => tab.tabId !== tabId);
            }
        },

        View: () => (
            <Col fill overflow="auto" padding="medium">
                <Col fill overflow="auto" spacing="medium">
                    <Block>
                        <h3>Dynamic Tabs Example</h3>
                        <p>This example demonstrates the <strong>tabsConfig</strong> pattern for creating tabs dynamically.</p>
                        <p>Click "Add Tab" to create new tabs. Each tab has a close button (×) to remove it.</p>
                    </Block >

                    <Row spacing="small">
                        <Button
                            contentView="Add Tab"
                            variant="contained"
                            onClick={model.addTab}
                        />
                        <Button
                            contentView="Clear All"
                            variant="outlined"
                            onClick={() => {
                                model._tabsConfig = [];
                                model.tabCounter = 0;
                            }}
                            disabled={() => model._tabsConfig.length === 0}
                        />
                        <Block>
                            <span style={{ color: "#666", fontSize: "14px" }}>
                                {model._tabsConfig.length} tab{model._tabsConfig.length !== 1 ? 's' : ''}
                            </span>
                        </Block>
                    </Row>

                    {/* Dynamic TabsContainer */}
                    <Block fill render={model._tabsConfig.length > 0}>
                        <model.tabsContainer.View />
                    </Block>

                    {/* Empty state */}
                    <Block
                        fill
                        render={model._tabsConfig.length === 0}
                        padding="huge"
                        horizontalAlign="center"
                    >
                        <Block>
                            <p style={{ color: "#999", fontSize: "16px" }}>
                                No tabs yet. Click "Add Tab" to create your first tab!
                            </p>
                        </Block>
                    </Block>
                </Col >
            </Col >
        )
    };

    const model = useUIBase(struct, params);
    return model;

    // Helper function to generate code example
    function _getCodeExample(tabId: string): string {
        return `// 1. Create tab configuration
const newTabConfig: TabParams = {
    id: "${tabId}",
    tabId: "${tabId}",
    labelView: <span>Tab ${tabId.replace('tab', '')}</span>,
    contentView: <div>Your content here</div>
};

// 2. Add to tabsConfig array (reactive)
model._tabsConfig = [...model._tabsConfig, newTabConfig];

// 3. Pass to TabsContainer (in children definition)
tabsContainer: useTabsContainer({
    tabsConfig: () => model._tabsConfig,  // Binding
    variant: "scrollable"
})

// TabsContainer automatically renders:
// <Tab key={config.id} {...config} />`;
    }
}

const TabExamples = UECA.getFC(useTabExamples);

export { TabExamplesModel, TabExamplesParams, useTabExamples, TabExamples };
