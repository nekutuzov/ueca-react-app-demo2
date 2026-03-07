import * as UECA from "ueca-react";
import {
    UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase,
    Col, Block, Card,
    TabsContainerModel, useTabsContainer,
    TabModel, useTab
} from "@components";
import { CodeSampleModel, DocumentIcon, HomeIcon, PersonIcon, useCodeSample } from "@core";

type TabPreviewStruct = UIBaseStruct<{
    props: {
        labelText: string;
        iconPosition: "top" | "bottom" | "start" | "end";
        disabled: boolean;
        wrapped: boolean;
        showIcon: boolean;
        orientation: "horizontal" | "vertical";
        variant: "standard" | "scrollable" | "fullWidth";
        scrollButtons: "auto" | "true" | "false";
        centered: boolean;
    };

    children: {
        tabsContainer: TabsContainerModel;
        demoTab: TabModel;
        otherTab1: TabModel;
        otherTab2: TabModel;
        tabCodeSample: CodeSampleModel;
        tabsContainerCodeSample: CodeSampleModel;
    };

    methods: {
        _PreviewBlockView: () => React.ReactElement;
    };
}>;

type TabPreviewParams = UIBaseParams<TabPreviewStruct>;
type TabPreviewModel = UIBaseModel<TabPreviewStruct>;

function useTabPreview(params?: TabPreviewParams): TabPreviewModel {
    const struct: TabPreviewStruct = {
        props: {
            id: useTabPreview.name,
            labelText: "Tab Label",
            iconPosition: "top",
            disabled: false,
            wrapped: false,
            showIcon: true,
            orientation: "horizontal",
            variant: "standard",
            scrollButtons: "auto",
            centered: false
        },

        children: {
            demoTab: useTab({
                labelView: () => model.labelText,
                iconView: () => <HomeIcon render={model.showIcon} />,
                iconPosition: () => model.iconPosition,
                disabled: () => model.disabled,
                wrapped: () => model.wrapped,
                contentView: () => (
                    <Block padding="medium">
                        <p>This is the demo tab content.</p>
                    </Block>
                )
            }),

            otherTab1: useTab({
                labelView: "User",
                iconView: () => <PersonIcon render={model.showIcon} />,
                iconPosition: () => model.iconPosition,
                contentView: () => (
                    <Block padding="medium">
                        <p>Content for User tab</p>
                    </Block>
                )
            }),

            otherTab2: useTab({
                labelView: "Documents",
                iconView: () => <DocumentIcon render={model.showIcon} />,
                iconPosition: () => model.iconPosition,
                contentView: () => (
                    <Block padding="medium">
                        <p>Content for Documents Tab</p>
                    </Block>
                )
            }),

            tabsContainer: useTabsContainer({
                tabs: () => [model.demoTab, model.otherTab1, model.otherTab2],
                orientation: () => model.orientation,
                variant: () => model.variant,
                scrollButtons: () => model.scrollButtons === "auto" ? "auto" : model.scrollButtons === "true",
                centered: () => model.centered
            }),

            tabCodeSample: useCodeSample({
                title: "JSX Code Tab",
                componentName: "Tab",
                sourceObject: () => model,
                properties: () => [
                    "labelText",
                    ...(model.showIcon ? ["iconView", "iconPosition"] : []),
                    "disabled",
                    "wrapped"
                ]
            }),

            tabsContainerCodeSample: useCodeSample({
                title: "JSX Code TabsContainer",
                componentName: "TabsContainer",
                sourceObject: () => model,
                properties: () => [
                    "orientation",
                    "variant",
                    "scrollButtons",
                    "centered"
                ]
            })
        },

        methods: {
            _PreviewBlockView: () => (
                <Col spacing="medium" height={120}>
                    <model.tabsContainer.View />
                </Col>
            )
        },

        View: () => (
            <Card id={model.htmlId()}
                title="👁️ Preview"
                fill
                minWidth={400}
                overflow="auto"
            >
                <Col spacing="medium" fill>
                    <model._PreviewBlockView />
                    <model.tabCodeSample.View />
                    <model.tabsContainerCodeSample.View />
                </Col>
            </Card>
        )
    };

    const model = useUIBase(struct, params);
    return model;
}

const TabPreview = UECA.getFC(useTabPreview);

export { TabPreviewParams, TabPreviewModel, useTabPreview, TabPreview };
