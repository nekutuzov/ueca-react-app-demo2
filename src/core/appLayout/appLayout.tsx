import * as UECA from "ueca-react";
import { Col, Row, UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase, RouterModel, useRouter } from "@components";
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
            // The router's own route, read and written through, as OtherLayout's is: a route the
            // router refuses is never taken, so the layout cannot hold one that is not showing.
            // Bound the other way — this prop fed into the router's params — nothing at the source
            // refused what the router's onChangingRoute rejected, and the binding retried until UECA
            // reported it had not settled.
            route: UECA.bind(() => model.router.route as ScreenRoute, (newRoute) => { model.router.route = newRoute; })
        },

        children: {
            sideBar: useAppSideBar(),

            router: useRouter({
                routes: screenRoutes
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
