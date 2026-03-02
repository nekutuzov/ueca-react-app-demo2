import { Route } from "@components";
import { HomeScreen } from "@screens";


const screenRoutes = {
    // Add routes within the app layout
    "/": () => <HomeScreen id={"homeScreen"} />,
    "/home": () => <HomeScreen id={"homeScreen"} />,
};

const otherRoutes = {
    // Add routes without the app layout like document viewers and external links
    "https://cranesoft.net": () => null,
    "https://ueca-react.carrd.co/": () => null,
    "https://github.com/nekutuzov/ueca-react-app": () => null,
};

type OtherRoutes = typeof otherRoutes;
type OtherRoute = Route<OtherRoutes>;

type ScreenRoutes = typeof screenRoutes;
type ScreenRoute = Route<ScreenRoutes>;

type AppRoute = ScreenRoute | OtherRoute;

type AppRouteParams<T extends AppRoute["path"]> = Extract<AppRoute, { path: T }>["params"];

export { otherRoutes, screenRoutes, OtherRoute, ScreenRoute, AppRoute, AppRouteParams };
