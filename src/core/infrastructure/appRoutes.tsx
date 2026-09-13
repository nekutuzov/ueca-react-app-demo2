import { Route } from "@components";
import { HomeScreen } from "@screens";


const screenRoutes = {
    "/": () => <HomeScreen id={"homeScreen"} />,
    "/home": () => <HomeScreen id={"homeScreen"} />,
};


const otherRoutes = {
    // Routes without the app layout, such as external links.
    // External URLs must be registered here before openNewTab can use them — the route union is
    // derived from these keys, so an unregistered URL is a compile error at the call site. They
    // never render: an absolute URL opens in a new tab and never mounts OtherLayout.
    "https://cranesoft.net": () => null as never,
    "https://ueca-react.carrd.co/": () => null as never,
    "https://github.com/nekutuzov/ueca-react-app-demo2": () => null as never,
    "https://nekutuzov.github.io/ueca-react-doc/": () => null as never,
    "https://youtu.be/SQl8f-qGxwU?si=-YTWPpPB7ExBZ6L0": () => null as never,
    "https://www.npmjs.com/package/ueca-react": () => null as never,
    "mailto:cranesoft@protonmail.com": () => null as never,
};

type OtherRoutes = typeof otherRoutes;
type OtherRoute = Route<OtherRoutes>;

type ScreenRoutes = typeof screenRoutes;
type ScreenRoute = Route<ScreenRoutes>;

type AppRoute = ScreenRoute | OtherRoute;

type AppRouteParams<T extends AppRoute["path"]> = Extract<AppRoute, { path: T }>["params"];

export { otherRoutes, screenRoutes, OtherRoute, ScreenRoute, AppRoute, AppRouteParams };
