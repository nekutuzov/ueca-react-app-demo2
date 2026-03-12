import * as UECA from "ueca-react";
import {
    UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase,
    Col, Block, Card,
    TabsContainerModel, useTabsContainer,
    TabModel, useTab,
    CheckboxModel,
    useCheckbox
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
        homeTab: TabModel;
        userTab: TabModel;
        documentsTab: TabModel;
        staticTabsCodeSample: CodeSampleModel;
        validationCheckbox: CheckboxModel;
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
            homeTab: useTab({
                labelView: () => model.labelText,
                iconView: () => <HomeIcon render={model.showIcon} />,
                iconPosition: () => model.iconPosition,
                disabled: () => model.disabled,
                wrapped: () => model.wrapped,
                contentView: () => (
                    <Col padding="medium" spacing="small">
                        <p>{model.labelText} content.</p>
                        <model.validationCheckbox.View />
                    </Col>
                ),
                onValidate: async () => model.validationCheckbox.checked ? "This tab is not valid" : ""
            }),

            userTab: useTab({
                labelView: "User",
                iconView: () => <PersonIcon render={model.showIcon} />,
                iconPosition: () => model.iconPosition,
                contentView: () => (
                    <Block padding="medium">
                        <p>User content.</p>
                    </Block>
                )
            }),

            documentsTab: useTab({
                labelView: "Documents",
                iconView: () => <DocumentIcon render={model.showIcon} />,
                iconPosition: () => model.iconPosition,
                contentView: () => (
                    <Block padding="medium">
                        <p>Documents content.</p>
                    </Block>
                )
            }),

            tabsContainer: useTabsContainer({
                tabs: () => [model.homeTab, model.userTab, model.documentsTab],
                orientation: () => model.orientation,
                variant: () => model.variant,
                scrollButtons: () => model.scrollButtons === "auto" ? "auto" : model.scrollButtons === "true",
                centered: () => model.centered
            }),

            staticTabsCodeSample: useCodeSample({
                title: "Static Tabs Creation",
                content: () => _getStaticTabsCode()
            }),

            validationCheckbox: useCheckbox({
                labelView: "Invalid Tab",
                checked: false,
                onChange: () => model.tabsContainer.validate() // Trigger validation when checkbox changes
            })
        },

        View: () => (
            <Card id={model.htmlId()}
                title="👁️ Preview"
                fill
                minWidth={400}
                overflow="auto"
            >
                <Col spacing="small" fill>
                    <Block height={180}>
                        <model.tabsContainer.View />
                    </Block>
                    <model.staticTabsCodeSample.View />
                </Col>
            </Card>
        )
    };

    const model = useUIBase(struct, params);
    return model;

    // Helper function to generate static tabs code example
    function _getStaticTabsCode(): string {
        const iconCode = model.showIcon ? `\n        iconView: <HomeIcon />,\n        iconPosition: "${model.iconPosition}",` : '';
        const disabledCode = model.disabled ? `\n        disabled: true,` : '';
        const wrappedCode = model.wrapped ? `\n        wrapped: true,` : '';

        return `// Create tabs using model hooks
children: {
    homeTab: useTab({
        labelView: "${model.labelText}",${iconCode}${disabledCode}${wrappedCode}                
        contentView: () => (
            <Col padding="medium" spacing="small">
                <p>{model.labelText} content.</p>
                <model.validationCheckbox.View />
            </Col>
        ),
        onValidate: async () => model.validationCheckbox.checked ? "This tab is not valid" : ""
    }),

    userTab: useTab({
        labelView: "User",${model.showIcon ? `\n        iconView: <PersonIcon />,` : ''}${iconCode}${disabledCode}${wrappedCode}
        contentView: <Block>User content.</Block>
    }),

    documentsTab: useTab({
        labelView: "Documents",${model.showIcon ? `\n        iconView: <DocumentIcon />,` : ''}${iconCode}${disabledCode}${wrappedCode}
        contentView: <Block>Documents content.</Block>
    }),

    tabsContainer: useTabsContainer({
        tabs: () => [model.homeTab, model.userTab, model.documentsTab],
        orientation: "${model.orientation}",
        variant: "${model.variant}",
        scrollButtons: "${model.scrollButtons === "auto" ? "auto" : model.scrollButtons === "true" ? "true" : "false"}",
        centered: ${model.centered}
    }),

    validationCheckbox: useCheckbox({
        labelView: "Invalid Tab",
        checked: false,
        onChange: () => model.tabsContainer.validate() // Trigger validation when checkbox changes
    })
}`;
    }
}

const TabPreview = UECA.getFC(useTabPreview);

export { TabPreviewParams, TabPreviewModel, useTabPreview, TabPreview };
