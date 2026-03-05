import * as UECA from "ueca-react";
import {
    ButtonModel, Col, EditBaseModel, IconButtonModel, UIBaseModel, UIBaseParams, UIBaseStruct, useButton, useIconButton,
    useUIBase, useValidator
} from "@components";
import { AppRoute, asyncSafe } from "@core";
import { Breadcrumb, ScreenLayoutModel, useScreenLayout } from "@core";

type CRUDScreenStruct = UIBaseStruct<{
    props: CRUDScreenProps & {
        modelsToValidate: EditBaseModel["modelsToValidate"];
        _state: CRUDScreenState;
    };

    children: {
        screenLayout: ScreenLayoutModel;
        validator: EditBaseModel;
        actionButton: ButtonModel;
        saveButton: IconButtonModel;
        cancelButton: IconButtonModel;
        deleteButton: IconButtonModel;
        refreshButton: IconButtonModel;
    };

    methods: CRUDScreenMethods & {
        _toolsView: () => React.ReactNode;
        _hiddenToolsView: () => React.ReactNode;
        _canNavigate: (url?: string) => Promise<boolean>;
    };

    events: CRUDScreenEvents;
}>

type CRUDScreenState = {
    dataNew?: boolean;
    dataLoading?: boolean;
    dataValidating?: boolean;
    dataSaving?: boolean;
    dataCanceling?: boolean;
    dataModified?: boolean;
};

type CRUDScreenProps = {
    intent: "none" | "view" | "edit" | "edit-record" | "action";
    breadcrumbs: Breadcrumb[];
    toolsView: React.ReactNode;
    contentView: React.ReactNode;
    hiddenToolsView: React.ReactNode;
    readonly: boolean;
    actionButtonText: string;
}

type CRUDScreenMethods = {
    getScreenState: () => CRUDScreenState;
    setScreenState: (state: CRUDScreenState) => void;
    refresh: () => Promise<void>;
    validate: (showDialog?: boolean) => Promise<boolean>;
    resetValidationErrors: () => void;
    save: () => Promise<void>;
    cancel: () => Promise<void>;
    delete: () => Promise<void>;
    goToParentScreen: (redirect?: boolean) => Promise<void>;
}

type CRUDScreenEvents = {
    onRefresh: () => Promise<void>;
    onModify: () => Promise<void>;
    onValidate: () => Promise<boolean>;
    onSave: () => Promise<void>;
    onCancel: () => Promise<void>;
    onDelete: () => Promise<void>;
}

type CRUDScreenParams = UIBaseParams<CRUDScreenStruct>;
type CRUDScreenModel = UIBaseModel<CRUDScreenStruct>;

function useCRUDScreen(params?: CRUDScreenParams): CRUDScreenModel {
    const struct: CRUDScreenStruct = {
        props: {
            id: useCRUDScreen.name,
            intent: "none",
            breadcrumbs: [],
            toolsView: undefined,
            contentView: undefined,
            hiddenToolsView: undefined,
            readonly: false,
            actionButtonText: undefined,
            modelsToValidate: UECA.bind(() => model.validator, "modelsToValidate"),
            _state: {
                dataNew: false,
                dataModified: false,
                dataLoading: false,
                dataValidating: false,
                dataSaving: false,
                dataCanceling: false
            }
        },

        messages: {
            "App.Router.BeforeRouteChange": async () => {
                const allow = await model._canNavigate();
                if (allow) {
                    await model.clearAppBusy();
                }
                return allow;
            }
        },

        children: {
            screenLayout: useScreenLayout({
                breadcrumbs: () => model.breadcrumbs,
                toolsView: () => model._toolsView(),
                hiddenToolsView: () => _hiddenToolsView(),
                contentView: () => model.contentView
            }),

            validator: useValidator(),

            cancelButton: useIconButton({
                kind: "cancel",
                size: "large",
                disabled: () => !model._state.dataModified || model._state.dataSaving || model.readonly,
                onClick: () => model.cancel()
            }),

            deleteButton: useIconButton({
                kind: "delete",
                size: "large",
                disabled: () => _isDeleteDisabled(),
                onClick: () => model.delete()
            }),

            refreshButton: useIconButton({
                kind: "refresh",
                size: "large",
                disabled: () => {
                    return model._state.dataNew ||
                        model._state.dataLoading ||
                        model._state.dataSaving ||
                        model._state.dataModified
                },
                onClick: () => model.refresh()
            }),

            saveButton: useIconButton({
                kind: "ok",
                size: "large",
                disabled: () => !model._state.dataModified || model._state.dataSaving || model.readonly,
                onClick: () => model.save()
            }),

            actionButton: useButton({
                contentView: () => model.actionButtonText,
                disabled: () => !model._state.dataModified || model._state.dataSaving || model.readonly,
                onClick: () => model.save()
            }),
        },

        methods: {
            getScreenState: () => ({
                ...model._state
            }),

            setScreenState: (state) => {
                const oldModified = model._state.dataModified;
                model._state = { ...model._state, ...state };
                if (!oldModified && model._state.dataModified && model.onModify) {
                    asyncSafe(model.onModify);
                }
            },

            refresh: async () => {
                model.resetValidationErrors();

                if (model._state.dataNew) {
                    model.setScreenState({ dataModified: true });
                }

                if (model.onRefresh) {
                    await model.setAppBusy(true);
                    try {
                        model.setScreenState({ dataLoading: true });
                        await model.onRefresh();
                    } finally {
                        model.setScreenState({ dataLoading: false });
                        await model.setAppBusy(false);
                    }
                }

                model.setScreenState({ dataModified: model._state.dataNew });
            },

            validate: async (showDialog) => {
                let result = true;
                await model.setAppBusy(true);
                try {
                    model.setScreenState({ dataValidating: true });
                    await model.validator.validate();
                    let customRulesValid = (model.onValidate ? await model.onValidate() : true);
                    if (!customRulesValid && (customRulesValid ?? true)) {
                        result = false; // Don't display the warning if custom validation returned undefined/null
                    } else {
                        if (!customRulesValid || !model.validator.isValid()) {
                            if (showDialog) {
                                model.dialogWarning("Warning", "There are validation errors. Please review your input.");
                            }
                            result = false;
                        }
                    }
                } finally {
                    model.setScreenState({ dataValidating: false });
                    await model.setAppBusy(false);
                }

                return result;
            },

            resetValidationErrors: () => {
                model.validator.resetValidationErrors();
            },

            save: async () => {
                if (!await model.validate(true)) {
                    return;
                }

                if (model.onSave) {
                    await model.setAppBusy(true);
                    try {
                        model.setScreenState({ dataSaving: true });
                        await model.onSave();
                    } finally {
                        model.setScreenState({ dataSaving: false });
                        await model.setAppBusy(false);
                    }
                }
                model.setScreenState({ dataNew: false, dataModified: false });
            },

            cancel: async () => {
                const newRecord = model._state.dataNew;
                await _cancel();
                if (newRecord) {
                    await model.goToParentScreen();
                }
            },

            delete: async () => {
                if (model.onDelete) {
                    const confirm = await model.dialogConfirmAction();
                    if (!confirm) {
                        return;
                    }
                    await model.setAppBusy(true);
                    try {
                        model.setScreenState({ dataSaving: true });
                        await model.onDelete();
                    } finally {
                        model.setScreenState({ dataSaving: false });
                        await model.setAppBusy(false);
                    }
                }
                model.setScreenState({ dataNew: false, dataModified: false });
                await model.goToParentScreen();
            },

            goToParentScreen: async (redirect) => {
                let route: AppRoute = { path: "/" };
                if (model.breadcrumbs?.length > 1) {
                    route = model.breadcrumbs[model.breadcrumbs.length - 2].route;
                }

                // Use timeout to allow the current navigation to complete before navigating to the parent screen                    
                setTimeout(async () => {
                    if (redirect) {
                        await model.setRoute(route);
                    } else {
                        await model.goToRoute(route);
                    }
                });
            },

            _toolsView: () =>
                <>
                    {model.toolsView}
                    {(model.intent === "edit" || model.intent === "edit-record") &&
                        <>
                            <model.cancelButton.View />
                            <model.saveButton.View />
                            <model.deleteButton.View />
                        </>
                    }
                    {model.intent === "action" &&
                        <>
                            <model.cancelButton.View />
                            <model.actionButton.View />
                        </>
                    }
                    {model.intent !== "none" && <model.refreshButton.View />}
                </>,

            _hiddenToolsView: () => {
                if (_isDeleteVisible()) {
                    return (
                        <Col>
                            {model.hiddenToolsView}
                        </Col>
                    )
                } else if (model.hiddenToolsView) {
                    return model.hiddenToolsView;
                }
            },

            _canNavigate: async () => {
                if (model._state.dataLoading || model._state.dataSaving) return false;

                if (!model._state.dataModified) return true;

                const canNavigate = !!(await model.dialogYesNo(
                    "Unsaved",
                    "All unsaved changes will be lost! Would you like to leave current screen?")
                );

                if (canNavigate) {
                    await model.runWithErrorDisplay(_cancel);
                }

                return canNavigate;
            }
        },

        View: () => <model.screenLayout.View />
    }

    const model = useUIBase(struct, params);
    return model;


    // Private methods
    function _isDeleteDisabled() {
        return model._state.dataNew || model._state.dataSaving || model.readonly
    }

    function _isDeleteVisible() {
        return model.intent === "edit-record";
    }

    function _hiddenToolsView() {
        // IMPORTANT: model._hiddenToolsView is an observer. It's never undefined.
        // ScreenLayout.hiddenToolsView logic uses undefined state to hide the button. 
        // TODO: Better is to use a flag ScreenLayout.hiddenToolsVisible.
        if (_isDeleteVisible() || (model.hiddenToolsView)) {
            return model._hiddenToolsView()
        }
    }

    async function _cancel() {
        model.resetValidationErrors();
        await model.setAppBusy(true);
        try {
            model.setScreenState({ dataCanceling: true });
            if (model.onCancel) {
                await model.onCancel();
            }
        } finally {
            model.setScreenState({ dataCanceling: false });
            await model.setAppBusy(false);
        }
        model.setScreenState({ dataNew: false, dataModified: false });
    }
}

const CRUDScreen = UECA.getFC(useCRUDScreen);

export { CRUDScreenProps, CRUDScreenEvents, CRUDScreenMethods, CRUDScreenModel, useCRUDScreen, CRUDScreen };
