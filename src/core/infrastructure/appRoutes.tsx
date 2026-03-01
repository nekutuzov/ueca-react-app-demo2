import * as UECA from "ueca-react";
import { HomeScreen } from "@screens";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";

// Route type definitions for typed routing
type RouteComp = (params?: Record<string, unknown>) => UECA.ReactElement;
type Routing = Record<string, RouteComp>;
type Route<R extends Routing> = {
    [K in keyof R]: { path: K, params?: Parameters<R[K]>[0] }
}[keyof R];
type AnyRoute = Route<Routing>;

const screenRoutes = {
    // Add routes within the app layout
    "/": () => <HomeScreen id={"homeScreen"} />,
    "/home": () => <HomeScreen id={"homeScreen"} />,
};

const otherRoutes = {
    // Add routes without the app layout like document viewers and external links
    "https://cranesoft.net": () => null,
};

type OtherRoutes = typeof otherRoutes;
type OtherRoute = Route<OtherRoutes>;

type ScreenRoutes = typeof screenRoutes;
type ScreenRoute = Route<ScreenRoutes>;

type AppRoute = ScreenRoute | OtherRoute;

type AppRouteParams<T extends AppRoute["path"]> = Extract<AppRoute, { path: T }>["params"];

// AppRoutes Component
type AppRoutesStruct = UIBaseStruct<{
    props: {
        // Future: Add current route path
    };
}>;

type AppRoutesParams = UIBaseParams<AppRoutesStruct>;
type AppRoutesModel = UIBaseModel<AppRoutesStruct>;

function useAppRoutes(params?: AppRoutesParams): AppRoutesModel {
    const struct: AppRoutesStruct = {
        props: {
            id: useAppRoutes.name,
        },

        View: () => {
            // Future: Implement full routing based on current path
            // For now, just render the home screen
            const route = screenRoutes["/"];
            return <>{route()}</>;
        }
    };

    const model = useUIBase(struct, params);
    return model;
}

const AppRoutes = UECA.getFC(useAppRoutes);

export { 
    otherRoutes, 
    screenRoutes, 
    OtherRoute, 
    ScreenRoute, 
    AppRoute, 
    AppRouteParams, 
    AnyRoute, 
    Route, 
    Routing,
    AppRoutesModel,
    AppRoutesParams,
    useAppRoutes,
    AppRoutes
};
