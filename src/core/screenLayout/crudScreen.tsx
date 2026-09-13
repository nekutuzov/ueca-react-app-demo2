import * as UECA from "ueca-react";
import {
    ButtonModel, EditBaseModel, EditBaseParams, EditBaseStruct, IconButtonModel, MenuItemModel,
    useButton, useEditBase, useIconButton, useMenuItem
} from "@components";
import { AppRoute, asyncSafe, AddIcon, runAsync } from "@core";
import { Breadcrumb, ScreenLayoutModel, useScreenLayout } from "@core";

// An EditBase, not a UIBase-plus-validator: the CRUDScreen IS the editable entity — the screen's
// fields register through the inherited modelsToValidate, and validate()/isValid()/
// getValidationError()/resetValidationErrors() come from the base. The screen-level lifecycle
// wrapper (busy display, state flags, warning dialog) is validateScreen(), a separate name so it
// never shadows the EditBase composite contract. Cross-field rules use the inherited onValidate,
// which follows EditBase semantics: return an error STRING to fail, undefined when valid.
type CRUDScreenStruct = EditBaseStruct<{
    props: CRUDScreenProps & {
        _state: CRUDScreenState;
    };

    children: {
        screenLayout: ScreenLayoutModel;
        actionButton: ButtonModel;
        addButton: IconButtonModel;
        saveButton: ButtonModel;
        cancelButton: ButtonModel;
        deleteMenuItem: MenuItemModel;
        refreshButton: IconButtonModel;
    };

    methods: CRUDScreenMethods & {
        _toolsView: () => React.ReactNode;
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
    intent: "none" | "view" | "edit" | "edit-record" | "action" | "add-record" | "add-edit-record";
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
    add: () => Promise<void>;
    refresh: () => Promise<void>;
    validateScreen: (showDialog?: boolean) => Promise<boolean>;
    save: () => Promise<void>;
    cancel: () => Promise<void>;
    delete: () => Promise<void>;
    goToParentScreen: (redirect?: boolean) => Promise<void>;
    scheduleSetRoute: (route: AppRoute) => void;
    scheduleGoToRoute: (route: AppRoute) => void;
}

// Validation events (onValidate, onInternalValidate) are inherited from EditBase.
type CRUDScreenEvents = {
    onAdd: () => Promise<void>;
    onRefresh: () => Promise<void>;
    onModify: () => Promise<void>;
    onSave: () => Promise<void>;
    onCancel: () => Promise<void>;
    onDelete: () => Promise<void>;
}

type CRUDScreenParams = EditBaseParams<CRUDScreenStruct>;
type CRUDScreenModel = EditBaseModel<CRUDScreenStruct>;

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
                // The screen's slot with the Delete row folded in. Computed HERE rather than in a
                // `methods` entry: the layout hides its "…" button on a null slot, and a method is
                // wrapped by the framework so it can never report null (the legacy baseScreen
                // carried a TODO about exactly this).
                hiddenToolsView: () => {
                    if (!_showDeleteButton()) {
                        return model.hiddenToolsView;
                    }
                    return (
                        <>
                            {model.hiddenToolsView}
                            <model.deleteMenuItem.View />
                        </>
                    );
                },
                contentView: () => model.contentView
            }),

            addButton: useIconButton({
                iconView: <AddIcon />,
                title: "Add new",
                size: "large",
                // Disabled while already adding a new record (dataNew), saving, loading, or read-only.
                disabled: () => model._state.dataNew || model.readonly || model._state.dataSaving || model._state.dataLoading,
                onClick: () => model.add()
            }),

            // Cancel and Save are TEXT buttons in the legacy toolbar, not icon squares — outlined,
            // 32px tall, no glyph. Only Refresh is an icon square. Plain useButton rather than the
            // useCancelButton/useSaveButton shorthands: those carry a start icon (and Cancel its own
            // confirm dialog), and the toolbar wants neither — cancel() is already gated on the
            // button being enabled solely while the record is dirty.
            cancelButton: useButton({
                contentView: "Cancel",
                variant: "outlined",
                size: "small",
                title: "Cancel",
                // A brand-new record (dataNew) is savable/cancelable even before any field is edited.
                disabled: () => (!model._state.dataModified && !model._state.dataNew) || model._state.dataSaving || model.readonly,
                onClick: () => model.cancel()
            }),

            // Delete is NOT a toolbar button: legacy puts it in the "…" overflow menu, so the
            // toolbar carries only the three buttons a record edit needs at a glance.
            deleteMenuItem: useMenuItem({
                labelView: "Delete",
                iconName: "delete",
                danger: true,
                disabled: () => _isDeleteDisabled(),
                onClick: () => model.delete()
            }),

            refreshButton: useIconButton({
                kind: "refresh",
                title: "Refresh",
                size: "large",
                disabled: () => {
                    return model._state.dataNew ||
                        model._state.dataLoading ||
                        model._state.dataSaving ||
                        model._state.dataModified
                },
                onClick: () => model.refresh()
            }),

            saveButton: useButton({
                contentView: "Save",
                variant: "outlined",
                size: "small",
                title: "Save",
                disabled: () => (!model._state.dataModified && !model._state.dataNew) || model._state.dataSaving || model.readonly,
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

            add: async () => {
                if (model.onAdd) {
                    await model.onAdd();
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

            validateScreen: async (showDialog) => {
                let result = true;
                await model.setAppBusy(true);
                try {
                    model.setScreenState({ dataValidating: true });
                    // The inherited EditBase validate: fields in modelsToValidate first, then the
                    // screen's own onInternalValidate/onValidate (which return error TEXT, not a
                    // boolean). The joined errors ride into the dialog as its details.
                    await model.validate();
                    if (!model.isValid()) {
                        if (showDialog) {
                            model.dialogWarning(
                                "Warning",
                                "There are validation errors. Please review your input.",
                                model.getValidationError()
                            );
                        }
                        result = false;
                    }
                } finally {
                    model.setScreenState({ dataValidating: false });
                    await model.setAppBusy(false);
                }

                return result;
            },

            save: async () => {
                if (!await model.validateScreen(true)) {
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
                // Add-* intents are self-contained (the screen restores its own context on cancel);
                // only the record-detail flows navigate back to the parent when a new record is abandoned.
                if (newRecord && !_isAddIntent()) {
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
                // Self-contained add-* intents let the screen pick the next record; only the
                // record-detail flows return to the parent list after a delete.
                if (!_isAddIntent()) {
                    await model.goToParentScreen();
                }
            },

            goToParentScreen: async (redirect) => {
                let route: AppRoute = { path: "/" };
                if (model.breadcrumbs?.length > 1) {
                    route = model.breadcrumbs[model.breadcrumbs.length - 2].route;
                }

                if (redirect) {
                    model.scheduleSetRoute(route);
                } else {
                    model.scheduleGoToRoute(route);
                }
            },

            // Deferred, never awaited: the route change unmounts this screen, so navigating inline
            // would tear the model down while the method that asked for it is still on the stack.
            // Callers must treat goToParentScreen as their last act.
            scheduleSetRoute: (route) => {
                runAsync(() => model.setRoute(route));
            },

            scheduleGoToRoute: (route) => {
                runAsync(() => model.goToRoute(route));
            },

            // Legacy order: the screen's own tools, then Refresh, then Cancel and Save (or the
            // action button). Refresh leads because it is the one button every intent but "none"
            // shows — see legacy:src/screens/common/baseScreen.tsx:272.
            _toolsView: () =>
                <>
                    {model.toolsView}
                    <model.addButton.View render={_showAddButton()} />
                    <model.refreshButton.View render={model.intent !== "none"} />
                    <model.cancelButton.View render={_showCancelButton()} />
                    <model.saveButton.View render={_showEditButtons()} />
                    <model.actionButton.View render={model.intent === "action"} />
                </>,

            _canNavigate: async () => {
                if (model._state.dataLoading || model._state.dataSaving) {
                    return false;
                }

                // A brand-new record (dataNew) is a dirty state too — leaving loses it, so prompt
                // just like unsaved edits do.
                if (!model._state.dataModified && !model._state.dataNew) {
                    return true;
                }

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

    const model = useEditBase(struct, params);
    return model;


    // Private methods
    function _isDeleteDisabled() {
        return model._state.dataNew || model._state.dataSaving || model.readonly
    }

    function _isAddIntent() {
        return model.intent === "add-record" || model.intent === "add-edit-record";
    }

    function _showAddButton() {
        return _isAddIntent();
    }

    function _showEditButtons() {
        // Cancel + Save show whenever the current record is editable (edit or add flows).
        return model.intent === "edit"
            || model.intent === "edit-record"
            || model.intent === "add-record"
            || model.intent === "add-edit-record";
    }

    function _showCancelButton() {
        // Cancel also backs the "action" intent (paired with the action button).
        return _showEditButtons() || model.intent === "action";
    }

    function _showDeleteButton() {
        // Record flows only. A plain "edit" screen edits settings, not a record — legacy shows no
        // delete there (legacy:baseScreen.tsx `_isDeleteVisible`), and "add-record" has nothing
        // persisted to delete.
        return model.intent === "edit-record" || model.intent === "add-edit-record";
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

export { CRUDScreenProps, CRUDScreenEvents, CRUDScreenMethods, CRUDScreenModel, CRUDScreenParams, useCRUDScreen, CRUDScreen };
