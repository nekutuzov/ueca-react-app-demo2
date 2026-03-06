import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";

type ScreenBasePartialStruct = UIBaseStruct<{
    props: {
        routeParams: Record<string, unknown>;
    },

    methods: {
        updateRouteParams: (params: Record<string, unknown>, patch: boolean) => Promise<void>;
    }
}>;

type ScreenBaseStruct<T extends UECA.GeneralComponentStruct> = ScreenBasePartialStruct & UIBaseStruct<T>;
type ScreenBaseParams<T extends ScreenBasePartialStruct = ScreenBaseStruct<UECA.GeneralComponentStruct>> = UIBaseParams<T>;
type ScreenBaseModel<T extends ScreenBasePartialStruct = ScreenBasePartialStruct> = UIBaseModel<T>;

function useScreenBase<T extends ScreenBasePartialStruct>(extStruct: T, params?: ScreenBaseParams<T>): ScreenBaseModel<T> {
    const struct: ScreenBasePartialStruct = {
        props: {
            id: useScreenBase.name,
            routeParams: {}
        },

        methods: {
            updateRouteParams: async (params, patch) => {
                await model.setRouteParams(params, patch);
                const route = await model.getRoute();
                model.routeParams = route.params;
            }
        },

        init: () => {
            // Uncomment for rendering before finishing initialization
            // model.invalidateView();  
        }
    }

    const model = UECA.useExtendedComponent(struct, extStruct, params, useUIBase);
    return model;
}

export { useScreenBase, ScreenBaseModel, ScreenBaseStruct, ScreenBaseParams }
