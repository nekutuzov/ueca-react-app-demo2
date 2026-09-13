import * as UECA from "ueca-react";
import { Col, TabModel, TabsContainerModel, UIBaseModel, UIBaseParams, UIBaseStruct, useTabsContainer, useUIBase } from "@components";
import { CRUDScreenEvents, CRUDScreenMethods, CRUDScreenModel, CRUDScreenProps, useCRUDScreen } from "@core";

type TabsScreenStruct = UIBaseStruct<{
    props: Omit<CRUDScreenProps, "contentView"> & {
        tabs: TabModel[];
        selectedTabId: string;
    };

    children: {
        crudScreen: CRUDScreenModel;
        tabsContainer: TabsContainerModel;
    }

    // resetValidationErrors and onValidate are EditBase members on CRUDScreen; the TabsScreen is a
    // plain UIBase wrapper, so it re-declares the two it forwards.
    methods: CRUDScreenMethods & {
        resetValidationErrors: () => void;
    };

    events: CRUDScreenEvents & {
        onValidate: () => Promise<string>;
    };
}>;

type TabsScreenParams = UIBaseParams<TabsScreenStruct>;
type TabsScreenModel = UIBaseModel<TabsScreenStruct>;

function useTabsScreen(params?: TabsScreenParams): TabsScreenModel {
    const struct: TabsScreenStruct = {
        props: {
            id: useTabsScreen.name,
            tabs: UECA.bind(() => model.tabsContainer, "tabs"),
            selectedTabId: UECA.bind(() => model.tabsContainer, "selectedTabId"),
            intent: UECA.bind(() => model.crudScreen, "intent"),
            breadcrumbs: UECA.bind(() => model.crudScreen, "breadcrumbs"),
            toolsView: UECA.bind(() => model.crudScreen, "toolsView"),
            hiddenToolsView: UECA.bind(() => model.crudScreen, "hiddenToolsView"),
            readonly: UECA.bind(() => model.crudScreen, "readonly"),
            actionButtonText: UECA.bind(() => model.crudScreen, "actionButtonText"),
            // Part of the props type like the rest, but neither declared nor bound, so a value given
            // here was dropped and the tabs always sat in the default padding.
            contentPaddings: UECA.bind(() => model.crudScreen, "contentPaddings"),
        },

        children: {
            crudScreen: useCRUDScreen({
                modelsToValidate: () => [model.tabsContainer],
                // Every CRUD event is forwarded. onAdd was missing, so the Add button an add intent
                // shows did nothing and the screen's handler never ran.
                onAdd: async () => await model.onAdd?.(),
                onRefresh: async () => await model.onRefresh?.(),
                onSave: async () => await model.onSave?.(),
                onValidate: async () => await model.onValidate?.(),
                onCancel: async () => await model.onCancel?.(),
                onDelete: async () => await model.onDelete?.(),
                onModify: async () => await model.onModify?.(),
                contentView: () => <model.tabsContainer.View />
            }),

            tabsContainer: useTabsContainer()
        },

        // Every CRUDScreenMethods member the model's type promises. add, goToParentScreen,
        // scheduleSetRoute and scheduleGoToRoute were missing, so a call that type-checked threw
        // "is not a function".
        methods: {
            getScreenState: () => model.crudScreen.getScreenState(),
            setScreenState: (state) => model.crudScreen.setScreenState(state),
            add: async () => await model.crudScreen.add(),
            refresh: async () => await model.crudScreen.refresh(),
            save: async () => await model.crudScreen.save(),
            cancel: async () => await model.crudScreen.cancel(),
            delete: async () => await model.crudScreen.delete(),
            validateScreen: async (showDialog) => await model.crudScreen.validateScreen(showDialog),
            goToParentScreen: async (redirect) => await model.crudScreen.goToParentScreen(redirect),
            scheduleSetRoute: (route) => model.crudScreen.scheduleSetRoute(route),
            scheduleGoToRoute: (route) => model.crudScreen.scheduleGoToRoute(route),
            resetValidationErrors: () => model.crudScreen.resetValidationErrors()
        },

        View: () =>
            <Col id={model.htmlId()} fill verticalAlign={"top"} spacing="default">
                <model.crudScreen.View />
            </Col >
    }

    const model = useUIBase(struct, params);

    return model;
}

const TabsScreen = UECA.getFC(useTabsScreen);

export { TabsScreenModel, TabsScreenParams, useTabsScreen, TabsScreen }
