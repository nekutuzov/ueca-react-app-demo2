import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase, RouterModel, useRouter } from "@components";
import { OtherRoute, otherRoutes } from "@core";

type OtherLayoutStruct = UIBaseStruct<{
    props: {
        route: OtherRoute;
    };

    children: {
        router: RouterModel;
    };

    methods: {
        lookupRoute: (path: string) => OtherRoute;
    };
}>;

type OtherLayoutParams = UIBaseParams<OtherLayoutStruct>;
type OtherLayoutModel = UIBaseModel<OtherLayoutStruct>;

function useOtherLayout(params?: OtherLayoutParams): OtherLayoutModel {
    const struct: OtherLayoutStruct = {
        props: {
            id: useOtherLayout.name,
            route: UECA.bind(() => model.router.route as OtherRoute, (newRoute) => { model.router.route = newRoute })
        },

        children: {
            router: useRouter({ routes: otherRoutes })
        },

        methods: {
            lookupRoute: (path) => {
                return model.router.lookupRoute(path) as OtherRoute;
            }
        },

        View: () => <model.router.View />
    }

    const model = useUIBase(struct, params);
    return model;
}

const OtherLayout = UECA.getFC(useOtherLayout);

export { OtherLayoutParams, OtherLayoutModel, useOtherLayout, OtherLayout }
