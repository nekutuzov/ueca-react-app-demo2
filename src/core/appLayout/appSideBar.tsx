import * as UECA from "ueca-react";
import { Col, Row, UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase, IconButtonModel, useIconButton, NavLinkModel, useNavLink } from "@components";
import { AppMenuModel, useAppMenu } from "./appMenu";
import { MenuIcon, MenuCollapseIcon } from "../misc/icons";
import "./appSideBar.css";

// Below this the expanded rail would leave no usable column for the article, so the sidebar
// drops to its icon rail - where the chapter numbers do the work an icon would.
const NARROW_VIEWPORT = 860;

type AppSideBarStruct = UIBaseStruct<{
    props: {
        collapsed: boolean;
        // Non-reactive: the last known side of the breakpoint, and the resize listener itself,
        // which has to be one stable reference to be removable.
        __narrow: boolean;
        __onResize: () => void;
    };

    children: {
        menu: AppMenuModel;
        toggleButton: IconButtonModel;
        logoLink: NavLinkModel;
    };

    methods: {
        toggleCollapse: () => void;
    };
}>;

type AppSideBarParams = UIBaseParams<AppSideBarStruct>;
type AppSideBarModel = UIBaseModel<AppSideBarStruct>;

function useAppSideBar(params?: AppSideBarParams): AppSideBarModel {
    const struct: AppSideBarStruct = {
        props: {
            id: useAppSideBar.name,
            collapsed: false,
            __narrow: false,
            __onResize: undefined
        },

        events: {
            onChangeCollapsed: async (collapsed: boolean) => {
                // Post a broadcast message to notify side bar state change
                await model.bus.broadcast("", "App.SideBarStateChanged", { collapsed });
            }
        },

        children: {
            menu: useAppMenu({
                iconsOnly: () => model.collapsed
            }),

            toggleButton: useIconButton({
                iconView: () => model.collapsed ? <MenuIcon /> : <MenuCollapseIcon />,
                // Icon-only, so this is both its accessible name and its tooltip. A getter, not a
                // constant: it has to follow model.collapsed.
                title: () => model.collapsed ? "Expand the menu" : "Collapse the menu",
                size: "small",
                onClick: () => model.toggleCollapse()
            }),

            logoLink: useNavLink({
                route: { path: "https://cranesoft.net" },
                newTab: true,
                linkView: () => <span className="app-sidebar-logo"><img src="logo.png" alt="UECA-React" /></span>
            }),
        },

        methods: {
            toggleCollapse: () => {
                model.collapsed = !model.collapsed;
            }
        },

        // Start on the right side of the breakpoint before the first paint.
        constr: () => {
            model.__narrow = _isNarrow();
            model.collapsed = model.__narrow;
        },

        mount: () => {
            // Built here, and kept on the model, so unmount removes the same reference - the
            // hook body runs on every render and would otherwise hand over a new function.
            model.__onResize = () => _syncToViewport();
            window.addEventListener("resize", model.__onResize);
        },

        unmount: () => {
            window.removeEventListener("resize", model.__onResize);
        },

        View: () => {
            const width = model.collapsed ? "var(--sidebar-w-collapsed)" : "var(--sidebar-w)";
            return (
                <Col id={model.htmlId()}
                    className="app-sidebar"
                    width={width}
                    minWidth={width}
                    maxWidth={width}
                    fill
                >
                    {/* Header Section */}
                    <Row
                        className="app-sidebar-header"
                        render={!model.collapsed}
                        verticalAlign={"center"}
                        spacing={"default"}
                        padding={{ leftRight: "small" }}
                    >
                        <model.logoLink.View />
                        <span className="app-sidebar-wordmark">UECA-React</span>
                        <span className="app-sidebar-version">3.0</span>
                        <Row fill horizontalAlign={"right"}>
                            <model.toggleButton.View />
                        </Row>
                    </Row>
                    <Row
                        className="app-sidebar-header"
                        render={model.collapsed}
                        horizontalAlign={"center"}
                        verticalAlign={"center"}
                    >
                        <model.toggleButton.View />
                    </Row>

                    {/* Menu Section - fills remaining space, and scrolls when the 21 chapters
                        outrun it. overflow is a prop, not a class: Col writes `overflow: visible`
                        inline when it is omitted, which outranks the stylesheet.
                        Two values, x then y: an index of chapters has no horizontal axis, so
                        sideways is hidden outright rather than left to grow a second scrollbar
                        the first time a label does not fit. */}
                    <Col className="app-sidebar-scroll" fill overflow={"hidden auto"}>
                        <model.menu.View />
                    </Col>
                </Col>
            );
        }
    }

    const model = useUIBase(struct, params);
    return model;

    // Private methods
    function _isNarrow(): boolean {
        return window.innerWidth < NARROW_VIEWPORT;
    }

    // Acts only on the crossing, not on every resize event, so a deliberate toggle survives
    // the user dragging the window around on one side of the breakpoint.
    function _syncToViewport() {
        const narrow = _isNarrow();
        if (narrow === model.__narrow) {
            return;
        }
        model.__narrow = narrow;
        model.collapsed = narrow;
    }
}

const AppSideBar = UECA.getFC(useAppSideBar);

export { AppSideBarParams, AppSideBarModel, useAppSideBar, AppSideBar }
