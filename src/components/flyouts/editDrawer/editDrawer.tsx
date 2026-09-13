import * as UECA from "ueca-react";
import {
    Block, ButtonModel, DrawerModel, EditBaseModel, EditBaseParams, EditBaseStruct, Row, useButton,
    useCancelButton, useDeleteButton, useDrawer, useEditBase, useSaveButton
} from "@components";

// A Drawer with a record editor's footer — the legacy `slider`. Two ready-made footers:
//
//   mode="edit"  [Delete]            [Cancel] [Save]   validates before saving
//   mode="view"                               [OK]
//
// and `footerView` for anything else (the change-password drawer's Cancel/Apply pair).
//
// An EditBase, so the owner lists the drawer's fields in `modelsToValidate` and Save honours them —
// the same aggregation a screen uses. The record itself stays on the OWNER: this component holds
// the shell, not the data.
//
// `showModal()` resolves true when the user saved (or acknowledged a view drawer) and false when
// they cancelled or closed it, so a caller can await the outcome instead of wiring both events.
type EditDrawerMode = "view" | "edit";

type EditDrawerStruct = EditBaseStruct<{
    props: {
        open: boolean;
        titleView: React.ReactNode;
        contentView: React.ReactNode;
        // Undefined means "use footerView" — a drawer whose actions are none of the standard ones.
        mode: EditDrawerMode;
        footerView: React.ReactNode;
        showDeleteButton: boolean;
        // Confirm before raising onDelete. Off only when the owner asks in its own way.
        deleteConfirmation: boolean;
        width: number;
        // The pending showModal() resolver. A prop, not a closure variable: the model is what
        // survives re-renders.
        __resolveShowModal: (value: boolean) => void;
    };

    children: {
        drawer: DrawerModel;
        deleteButton: ButtonModel;
        cancelButton: ButtonModel;
        saveButton: ButtonModel;
        okButton: ButtonModel;
    };

    methods: {
        show: () => void;
        hide: () => void;
        showModal: () => Promise<boolean>;
        _FooterView: () => React.JSX.Element;
    };

    events: {
        onOpen: () => UECA.MaybePromise;
        onClose: () => UECA.MaybePromise;
        onSave: () => UECA.MaybePromise;
        onCancel: () => UECA.MaybePromise;
        // Returning false leaves the drawer open — the delete was refused or failed.
        onDelete: () => Promise<boolean>;
    };
}>;

type EditDrawerParams = EditBaseParams<EditDrawerStruct>;
type EditDrawerModel = EditBaseModel<EditDrawerStruct>;

function useEditDrawer(params?: EditDrawerParams): EditDrawerModel {
    const struct: EditDrawerStruct = {
        props: {
            id: useEditDrawer.name,
            open: UECA.bind(() => model.drawer, "open"),
            titleView: undefined,
            contentView: undefined,
            mode: undefined,
            footerView: undefined,
            showDeleteButton: false,
            deleteConfirmation: true,
            width: undefined
        },

        children: {
            drawer: useDrawer({
                anchor: "right",
                variant: "temporary",
                width: () => model.width,
                titleView: () => model.titleView,
                contentView: () => model.contentView,
                actionView: () => <model._FooterView />,
                onOpen: async () => await model.onOpen?.(),
                // The close X and the backdrop both land here. An edit drawer treats that as a
                // cancel, exactly as the legacy panel did.
                onClose: async () => {
                    if (model.mode === "edit") {
                        await model.onCancel?.();
                    }
                    _resolveShowModal(false);
                    await model.onClose?.();
                }
            }),

            deleteButton: useDeleteButton({
                size: "small",
                // Asked here rather than by the button: useDeleteButton captures `showDialog` once
                // at creation, while `deleteConfirmation` is a prop the owner can change later.
                showDialog: false,
                onClick: async () => {
                    if (model.deleteConfirmation && !await model.dialogConfirmAction()) {
                        return;
                    }
                    const deleted = await model.onDelete?.();
                    if (deleted) {
                        model.hide();
                        _resolveShowModal(false);
                    }
                }
            }),

            // Nothing to discard beyond what the owner already knows about, and the owner's own
            // cancel path asks if it needs to — a second prompt here would double up.
            cancelButton: useCancelButton({
                size: "small",
                skipConfirmation: true,
                onClick: async () => {
                    await model.onCancel?.();
                    model.hide();
                    _resolveShowModal(false);
                }
            }),

            saveButton: useSaveButton({
                size: "small",
                onClick: async () => {
                    await model.validate();
                    if (!model.isValid()) {
                        return;
                    }
                    await model.onSave?.();
                    model.hide();
                    _resolveShowModal(true);
                }
            }),

            okButton: useButton({
                contentView: "OK",
                variant: "contained",
                size: "small",
                onClick: () => {
                    model.hide();
                    _resolveShowModal(true);
                }
            })
        },

        methods: {
            show: () => model.open = true,

            hide: () => model.open = false,

            showModal: async () => {
                model.show();
                return await new Promise<boolean>((resolve) => model.__resolveShowModal = resolve);
            },

            _FooterView: () => {
                if (model.mode === "edit") {
                    return (
                        <Row spacing="default" verticalAlign="center">
                            <model.deleteButton.View render={model.showDeleteButton} />
                            <Block fill />
                            <model.cancelButton.View />
                            <model.saveButton.View />
                        </Row>
                    );
                }
                if (model.mode === "view") {
                    return (
                        <Row spacing="default" horizontalAlign="right">
                            <model.okButton.View />
                        </Row>
                    );
                }
                return <>{model.footerView}</>;
            }
        },

        View: () => <model.drawer.View />
    };

    const model = useEditBase(struct, params);
    return model;

    // Private methods
    function _resolveShowModal(value: boolean) {
        if (model.__resolveShowModal) {
            model.__resolveShowModal(value);
            model.__resolveShowModal = undefined;
        }
    }
}

const EditDrawer = UECA.getFC(useEditDrawer);

export { EditDrawerMode, EditDrawerParams, EditDrawerModel, useEditDrawer, EditDrawer };
