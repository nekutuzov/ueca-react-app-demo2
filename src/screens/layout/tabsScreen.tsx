import * as UECA from "ueca-react";
import { Col, TabModel, TabsContainerModel, UIBaseModel, UIBaseParams, UIBaseStruct, useTabsContainer, useUIBase } from "@components";
import { CRUDScreenEvents, CRUDScreenMethods, CRUDScreenModel, CRUDScreenProps, useCRUDScreen } from "@screens";

type TabsScreenStruct = UIBaseStruct<{
    props: Omit<CRUDScreenProps, "contentView"> & {
        tabs: TabModel[];
        selectedTabId: string;
    };

    children: {
        crudScreen: CRUDScreenModel;
        tabsContainer: TabsContainerModel;
    }

    methods: CRUDScreenMethods;

    events: CRUDScreenEvents;
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
        },

        children: {
            crudScreen: useCRUDScreen({
                modelsToValidate: () => [model.tabsContainer],
                onRefresh: async () => await model.onRefresh?.(),
                onSave: async () => await model.onSave?.(),
                onValidate: async () => model.onValidate ? await model.onValidate() : true,
                onCancel: async () => await model.onCancel?.(),
                onDelete: async () => await model.onDelete?.(),
                onModify: async () => await model.onModify?.(),
                contentView: () => <model.tabsContainer.View />
            }),

            tabsContainer: useTabsContainer()
        },

        methods: {
            getScreenState: () => model.crudScreen.getScreenState(),
            setScreenState: (state) => model.crudScreen.setScreenState(state),
            refresh: async () => await model.crudScreen.refresh(),
            save: async () => await model.crudScreen.save(),
            cancel: async () => await model.crudScreen.cancel(),
            delete: async () => await model.crudScreen.delete(),
            validate: async (showDialog) => await model.crudScreen.validate(showDialog),
            resetValidationErrors: () => model.crudScreen.resetValidationErrors()
        },

        View: () =>
            <Col id={model.htmlId()} fill verticalAlign={"top"} overflow={"auto"}>
                <model.crudScreen.View />
            </Col >
    }

    const model = useUIBase(struct, params);

    return model;
}

const TabsScreen = UECA.getFC(useTabsScreen);

export { TabsScreenModel, useTabsScreen, TabsScreen }
