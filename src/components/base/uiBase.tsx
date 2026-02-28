import * as UECA from "ueca-react";
import { BaseModel, BaseParams, BaseStruct, useBase } from "@components";

// Base UECA Component for all UI components in the application

type UIBasePartialStruct = BaseStruct<{
    props: {
        extent: {
            width?: number | string;
            height?: number | string;
        };
        zIndex: number;
    };

    methods: {
        // zIndex management for modal dialogs
        enterModalMode: () => void;
        leaveModalMode: () => void;
        activeModalDialog: () => UIBaseModel;
    }
}>;

type UIBaseStruct<T extends UECA.GeneralComponentStruct> = UIBasePartialStruct & BaseStruct<T>;
type UIBaseParams<T extends UIBasePartialStruct = UIBaseStruct<UECA.GeneralComponentStruct>> = BaseParams<T>;
type UIBaseModel<T extends UIBasePartialStruct = UIBasePartialStruct> = BaseModel<T>;

function useUIBase<T extends UIBasePartialStruct>(extStruct: T, params?: UIBaseParams<T>): UIBaseModel<T> {
    const struct: UIBasePartialStruct = {
        props: {
            extent: undefined,
            zIndex: undefined,
        },

        methods: {
            enterModalMode: () => {
                model.zIndex = (model.activeModalDialog()?.zIndex ?? 900) + 100;
                _modalStack.push(model);
            },

            leaveModalMode: () => {
                const index = _modalStack.indexOf(model);
                if (index !== -1) {
                    _modalStack.splice(index, 1);
                }
            },

            activeModalDialog: () => _modalStack[_modalStack.length - 1],
        }
    }

    const model = UECA.useExtendedComponent(struct, extStruct, params, useBase);
    return model;
}

// Stack of nested modal dialogs, drawers, etc to automatically set zIndex.
const _modalStack: UIBaseModel[] = [];

export { UIBaseStruct, UIBaseParams, UIBaseModel, useUIBase }
