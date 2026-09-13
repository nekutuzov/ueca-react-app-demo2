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
//
// THE ONE DELIBERATE EXCEPTION to "state lives on the model" (CLAUDE.md). Stacking order is a
// property of the whole app, not of any one overlay: a dialog opened over a drawer has to sit above
// it, and neither owns the other. Putting the stack on a model would mean electing an owner —
// AppUI — and routing every open/close through the bus, which buys nothing here because the value
// is read synchronously during enterModalMode() and never rendered.
//
// It stays safe because nothing observes it: zIndex is copied onto the model at push time and the
// stack itself is never read from a View, so MobX has nothing to track and there is no reactivity
// to lose. Do not read _modalStack from render code — that is the point at which this stops working
// and has to become model state after all.
//
// Entries are removed by leaveModalMode(), which every overlay must call on close; the splice is
// by identity, so a missed call leaks one entry and pushes later overlays progressively higher.
const _modalStack: UIBaseModel[] = [];

export { UIBaseStruct, UIBaseParams, UIBaseModel, useUIBase }
