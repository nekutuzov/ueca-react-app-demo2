import { Route } from "@components";
import { ButtonPlayground, HomeScreen, ShowcaseScreen, TablePlayground, TextFieldPlayground } from "@screens";


const screenRoutes = {
    "/": () => <HomeScreen id={"homeScreen"} />,
    "/home": () => <HomeScreen id={"homeScreen"} />,

    // One route per showcase topic, each with its own screen id so a topic's page state is its own.
    // The paths, titles and order live in screens/showcase/showcaseTopics.tsx.
    "/showcase/overview": () => <ShowcaseScreen id={"showcase-overview"} topic={"overview"} />,
    "/showcase/tokens": () => <ShowcaseScreen id={"showcase-tokens"} topic={"tokens"} />,
    "/showcase/layout": () => <ShowcaseScreen id={"showcase-layout"} topic={"layout"} />,
    "/showcase/controls": () => <ShowcaseScreen id={"showcase-controls"} topic={"controls"} />,
    "/showcase/status": () => <ShowcaseScreen id={"showcase-status"} topic={"status"} />,
    "/showcase/icons": () => <ShowcaseScreen id={"showcase-icons"} topic={"icons"} />,
    "/showcase/overlays": () => <ShowcaseScreen id={"showcase-overlays"} topic={"overlays"} />,
    "/showcase/data": () => <ShowcaseScreen id={"showcase-data"} topic={"data"} />,
    "/showcase/lists": () => <ShowcaseScreen id={"showcase-lists"} topic={"lists"} />,
    "/showcase/dynamic-content": () => <ShowcaseScreen id={"showcase-dynamic"} topic={"dynamic"} />,

    // The Playground. Paths, titles and order live in screens/playground/playgroundTopics.tsx.
    "/playground/button": () => <ButtonPlayground id={"playground-button"} />,
    "/playground/text-field": () => <TextFieldPlayground id={"playground-text-field"} />,
    "/playground/table": () => <TablePlayground id={"playground-table"} />,
};


const otherRoutes = {
    // Routes without the app layout, such as external links.
    // External URLs must be registered here before openNewTab can use them — the route union is
    // derived from these keys, so an unregistered URL is a compile error at the call site. They
    // never render: an absolute URL opens in a new tab and never mounts OtherLayout.
    "https://cranesoft.net": () => null as never,
    "https://ueca-react.carrd.co/": () => null as never,
    "https://github.com/nekutuzov/ueca-react-app-demo2": () => null as never,
    "https://nekutuzov.github.io/ueca-react-app-demo1": () => null as never,
    "https://github.com/nekutuzov/ueca-react-app-demo1": () => null as never,
    "https://nekutuzov.github.io/ueca-react-doc/": () => null as never,
    "https://github.com/nekutuzov/ueca-react-doc": () => null as never,
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
