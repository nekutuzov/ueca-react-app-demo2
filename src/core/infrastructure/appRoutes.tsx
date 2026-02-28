import * as UECA from "ueca-react";
import { HomeScreen } from "@screens";

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
}

const otherRoutes = {
    // Add routes without the app layout like document viewers and external links
    "https://cranesoft.net": () => null,
}

type OtherRoutes = typeof otherRoutes;
type OtherRoute = Route<OtherRoutes>;

type ScreenRoutes = typeof screenRoutes;
type ScreenRoute = Route<ScreenRoutes>;

type AppRoute = ScreenRoute | OtherRoute;

type AppRouteParams<T extends AppRoute["path"]> = Extract<AppRoute, { path: T }>["params"];

export { otherRoutes, screenRoutes, OtherRoute, ScreenRoute, AppRoute, AppRouteParams, AnyRoute, Route, Routing }
