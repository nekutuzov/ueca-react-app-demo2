import { Route } from "@components";
import {
    HomeScreen,
    ButtonScreen,
    IconButtonScreen,
    BlockScreen,
    RowScreen,
    ColScreen,
    TextFieldScreen,
    SelectScreen,
    RadioGroupScreen,
    CheckboxScreen,
    DialogScreen,
    DrawerScreen,
    FlyoutsScreen,
    NavigationScreen,
    TabsComponentScreen,
    MiscScreen
} from "@screens";


const screenRoutes = {
    // Add routes within the app layout
    "/": () => <HomeScreen id={"homeScreen"} />, // Default route, can be used for dashboard or welcome screen
    "/home": () => <HomeScreen id={"homeScreen"} />, // TODO: after refactoring this screen add some general info about the app and its architecture.    
    "/block": () => <BlockScreen id={"blockScreen"} />,
    "/row": () => <RowScreen id={"rowScreen"} />,
    "/col": () => <ColScreen id={"colScreen"} />,
    "/button": () => <ButtonScreen id={"buttonScreen"} />,
    "/icon-button": () => <IconButtonScreen id={"iconButtonScreen"} />,
    "/text-field": () => <TextFieldScreen id={"textFieldScreen"} />,
    "/select": () => <SelectScreen id={"selectScreen"} />,
    "/radio-group": () => <RadioGroupScreen id={"radioGroupScreen"} />,
    "/checkbox": () => <CheckboxScreen id={"checkboxScreen"} />,
    "/dialogs": () => <DialogScreen id={"dialogScreen"} />,
    "/drawer": () => <DrawerScreen id={"drawerScreen"} />,
    "/flyouts": () => <FlyoutsScreen id={"flyoutsScreen"} />,
    "/navigation": () => <NavigationScreen id={"navigationScreen"} />,
    "/tabs": () => <TabsComponentScreen id={"tabsComponentScreen"} />,
    "/misc": () => <MiscScreen id={"miscScreen"} />,
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
