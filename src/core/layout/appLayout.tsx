import * as UECA from "ueca-react";
import { Col, Row, UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase, AnyRoute, RouterModel, useRouter } from "@components";
import { ScreenRoute, screenRoutes } from "@core";

type AppLayoutStruct = UIBaseStruct<{
    props: {
        route: ScreenRoute;
    },

    children: {
        router: RouterModel;
    },

    methods: {
        lookupRoute: (path: string) => ScreenRoute;
    }
}>;

type AppLayoutParams = UIBaseParams<AppLayoutStruct>;
type AppLayoutModel = UIBaseModel<AppLayoutStruct>;

function useAppLayout(params?: AppLayoutParams): AppLayoutModel {
    const struct: AppLayoutStruct = {
        props: {
            id: useAppLayout.name,
            route: undefined
        },

        children: {
            router: useRouter({
                routes: screenRoutes,
                route: UECA.bind(() => model, "route") as UECA.Bond<AnyRoute>
            })
        },

        methods: {
            lookupRoute: (path) => {
                return model.router.lookupRoute(path) as ScreenRoute;
            }
        },

        View: () => (
            <Col id={model.htmlId()} fill>
                <Row fill divider spacing={"none"}>
                    <model.router.View />
                </Row>
            </Col>
        )
    }

    const model = useUIBase(struct, params);
    return model;
}

const AppLayout = UECA.getFC(useAppLayout);

export { AppLayoutParams, AppLayoutModel, useAppLayout, AppLayout }
