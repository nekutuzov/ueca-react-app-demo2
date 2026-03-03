import * as UECA from "ueca-react";
import { Col, Row, UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase, AnyRoute, RouterModel, useRouter } from "@components";
import { ScreenRoute, screenRoutes, AppSideBarModel, useAppSideBar } from "@core";

type AppLayoutStruct = UIBaseStruct<{
    props: {
        route: ScreenRoute;
    },

    children: {
        sideBar: AppSideBarModel;
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
            sideBar: useAppSideBar(),

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
            <Col id={model.htmlId()} fill overflow="hidden">
                <Row fill divider spacing={"none"} overflow="hidden">
                    <model.sideBar.View />
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
