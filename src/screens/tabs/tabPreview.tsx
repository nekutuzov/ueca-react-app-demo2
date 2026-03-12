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
        tabCodeSample: CodeSampleModel;
        tabsContainerCodeSample: CodeSampleModel;
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
                onValidate: async () => model.validationCheckbox.checked ? "Demo validation error: This tab is not valid." : "",
                contentView: () => (
                    <Col padding="medium" spacing="small">
                        <p>This is the {model.labelText} tab content.</p>
                        <model.validationCheckbox.View />
                    </Col>
                )
            }),

            userTab: useTab({
                labelView: "User",
                iconView: () => <PersonIcon render={model.showIcon} />,
                iconPosition: () => model.iconPosition,                
                contentView: () => (
                    <Block padding="medium">
                        <p>This is the User tab content.</p>
                    </Block>
                )
            }),

            documentsTab: useTab({
                labelView: "Documents",
                iconView: () => <DocumentIcon render={model.showIcon} />,
                iconPosition: () => model.iconPosition,
                contentView: () => (
                    <Block padding="medium">
                        <p>This is the Documents tab content.</p>
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
                <Col spacing="medium" fill>
                    <Col spacing="medium" height={180}>
                        <model.tabsContainer.View />
                    </Col>
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
