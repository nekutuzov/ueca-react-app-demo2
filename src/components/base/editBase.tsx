import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";

// Base UECA Component for all UI components in the application that require validation support

type EditBasePartialStruct = UIBaseStruct<{
    props: {
        modelsToValidate: EditBaseModel[];
        _internalValidationError: string;
    };

    methods: {
        getValidationError: () => string;
        validate: (errorText?: string) => Promise<void>;
        isValid: () => boolean;
        resetValidationErrors: () => void;
    }

    events: {
        onInternalValidate: () => Promise<string>;
        onValidate: () => Promise<string>;
    }
}>;

type EditBaseStruct<T extends UECA.GeneralComponentStruct> = EditBasePartialStruct & UIBaseStruct<T>;
type EditBaseParams<T extends EditBasePartialStruct = EditBaseStruct<UECA.GeneralComponentStruct>> = UIBaseParams<T>;
type EditBaseModel<T extends EditBasePartialStruct = EditBasePartialStruct> = UIBaseModel<T>;

function useEditBase<T extends EditBasePartialStruct>(extStruct?: T, params?: EditBaseParams<T>): EditBaseModel<T> {
    const struct: EditBasePartialStruct = {
        props: {
            modelsToValidate: [],
            _internalValidationError: undefined
        },

        methods: {
            getValidationError: () => {
                const errors: string[] = [];
                model.modelsToValidate?.forEach(x => {
                    const err = x.getValidationError();
                    if (err) {
                        errors.push(err);
                    }
                });
                if (model._internalValidationError) {
                    errors.push(model._internalValidationError);
                }
                return errors.length && errors.join("\r\n") || undefined;
            },

            validate: async (errorText?: string) => {
                // An unset list validates nothing, as it reads in getValidationError and
                // resetValidationErrors. Promise.all(undefined) rejected, so a composite whose list
                // was unset — a TabsContainer whose tabs were not there yet — could not validate.
                await Promise.all((model.modelsToValidate ?? []).map(x => x.validate()));
                model._internalValidationError = await model.onInternalValidate?.();
                if (model._internalValidationError) {
                    return;
                }
                model._internalValidationError = await model.onValidate?.();
                if (model._internalValidationError) {
                    return;
                }
                model._internalValidationError = errorText;
            },

            isValid: () => !model.getValidationError(),

            resetValidationErrors: () => {
                model.modelsToValidate?.map(async x => x.resetValidationErrors());
                model._internalValidationError = undefined;
            }
        }
    }

    const model = UECA.useExtendedComponent(struct, extStruct, params, useUIBase);
    return model;
}

// What `required` counts as no value: nothing at all, or text that is blank. A number or a boolean is
// a value even at 0 or false — inputs used to test `!model.value`, which counted a chosen 0 as empty.
function isEmptyValue(value: unknown): boolean {
    return value == null || (typeof value === "string" && value.trim() === "");
}

export { EditBaseStruct, EditBaseParams, EditBaseModel, useEditBase, isEmptyValue }
