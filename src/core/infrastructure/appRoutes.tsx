import { Route } from "@components";
import { HomeScreen, ButtonScreen, LayoutScreen } from "@screens";


const screenRoutes = {
    // Add routes within the app layout
    "/": () => <HomeScreen id={"homeScreen"} />, // Default route, can be used for dashboard or welcome screen
    "/home": () => <HomeScreen id={"homeScreen"} />, // TODO: after refactoring this screen add some general info about the app and its architecture.
    "/layout": () => <LayoutScreen id={"layoutScreen"} />,
    "/buttons": () => <ButtonScreen id={"buttonScreen"} />,
    "/inputs": () => null, // Placeholder for future screens demonstrating input components    
    "/popups": () => null, // Placeholder for future screens demonstrating popupcomponents
    "/flyouts": () => null, // Placeholder for future screens demonstrating flyout components
    "/navigation": () => null, // Placeholder for future screens demonstrating navigation components    
    "/tabs": () => null, // Placeholder for future screens demonstrating tab components
    "/misc": () => null, // Placeholder for future screens demonstrating miscellaneous components
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
