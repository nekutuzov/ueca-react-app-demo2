import * as UECA from "ueca-react";
import {
    ButtonModel, ButtonParams, Icon, IconButtonModel, IconButtonParams,
    useButton, useIconButton
} from "@components";

// The screen-toolbar shorthands. Each is a use* factory returning the base Button/IconButton
// model — content, icon, and (for destructive ones) the confirmation dialog are the defaults; any
// of them can be overridden by the caller.

function useSaveButton(params?: ButtonParams): ButtonModel {
    return useButton({
        contentView: "Save",
        variant: "contained",
        startIconView: <Icon name="save" size="sm" />,
        ...params
    });
}

const SaveButton = UECA.getFC(useSaveButton);

function useAddNewButton(params?: ButtonParams): ButtonModel {
    // Outlined primary with the circled-plus glyph, lowercase "new". Size is deliberately NOT set
    // here — every sibling tool button leaves it at the Button default, and pinning it would
    // desynchronise this one from the rest of a toolbar under any theme. A caller that wants
    // 32px (one step down our control ladder) passes size="small".
    return useButton({
        contentView: "Add new",
        variant: "outlined",
        // 16px — its 20px advance is what makes the button's width.
        startIconView: <Icon name="addCircle" size="md" />,
        ...params
    });
}

const AddNewButton = UECA.getFC(useAddNewButton);

function useEditButton(params?: ButtonParams): ButtonModel {
    return useButton({
        contentView: "Edit",
        variant: "outlined",
        startIconView: <Icon name="edit" size="sm" />,
        ...params
    });
}

const EditButton = UECA.getFC(useEditButton);

type CancelButtonParams = ButtonParams & {
    // Confirm discarding unsaved changes before raising onClick; pass true when the owner knows
    // nothing was edited (or asks its own way).
    skipConfirmation?: boolean;
};

function useCancelButton(params?: CancelButtonParams): ButtonModel {
    const { skipConfirmation = false, onClick, ...rest } = params ?? {};
    const model = useButton({
        contentView: "Cancel",
        variant: "outlined",
        ...rest,

        onClick: async (source) => {
            if (!skipConfirmation) {
                const confirmed = await model.dialogYesNo(
                    "Confirmation",
                    "All unsaved changes will be lost! Are you sure you want to cancel?"
                );
                if (!confirmed) {
                    return;
                }
            }
            if (onClick) {
                await onClick(source);
            }
        }
    });
    return model;
}

const CancelButton = UECA.getFC(useCancelButton);

type DeleteButtonParams = ButtonParams & {
    showDialog?: boolean;
    dialogTitle?: string;
    dialogMessage?: string;
};

function useDeleteButton(params?: DeleteButtonParams): ButtonModel {
    const { showDialog = true, dialogTitle, dialogMessage, onClick, ...rest } = params ?? {};
    const model = useButton({
        contentView: "Delete",
        variant: "outlined",
        color: "error.main",
        startIconView: <Icon name="delete" size="sm" />,
        ...rest,

        onClick: async (source) => {
            if (showDialog) {
                const confirmed = await model.dialogConfirmAction(dialogTitle, dialogMessage, "Delete");
                if (!confirmed) {
                    return;
                }
            }
            if (onClick) {
                await onClick(source);
            }
        }
    });
    return model;
}

const DeleteButton = UECA.getFC(useDeleteButton);

function useRefreshButton(params?: IconButtonParams): IconButtonModel {
    return useIconButton({
        kind: "refresh",
        title: "Refresh",
        ...params
    });
}

const RefreshButton = UECA.getFC(useRefreshButton);

export {
    CancelButtonParams, DeleteButtonParams,
    useSaveButton, SaveButton,
    useAddNewButton, AddNewButton,
    useEditButton, EditButton,
    useCancelButton, CancelButton,
    useDeleteButton, DeleteButton,
    useRefreshButton, RefreshButton
};
