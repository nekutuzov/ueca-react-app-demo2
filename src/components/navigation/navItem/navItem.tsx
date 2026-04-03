import * as UECA from "ueca-react";
import { Block, Row, NavLinkModel, UIBaseModel, UIBaseParams, UIBaseStruct, useNavLink, useUIBase } from "@components";
import { AppRoute, resolvePaletteColor } from "@core";
import "./navItem.css";

type NavItemMode = "icon-only" | "text-only" | "icon-text";

type NavItemStruct = UIBaseStruct<{
    props: {
        active: boolean;
        route: AppRoute;
        disabled: boolean;
        newTab: boolean;
        icon: React.ReactNode;
        text: string;
        mode: NavItemMode;
    },

    children: {
        navLink: NavLinkModel;
    },

    events: {
        onClick: (source: NavItemModel) => UECA.MaybePromise;
    }

    methods: {
        _linkView: () => React.JSX.Element;
    }
}>;

type NavItemParams = UIBaseParams<NavItemStruct>;
type NavItemModel = UIBaseModel<NavItemStruct>;

function useNavItem(params?: NavItemParams): NavItemModel {
    const struct: NavItemStruct = {
        props: {
            id: useNavItem.name,
            active: false,
            route: UECA.bind(() => model.navLink, "route"),
            disabled: UECA.bind(() => model.navLink, "disabled"),
            newTab: UECA.bind(() => model.navLink, "newTab"),
            text: UECA.bind(() => model.navLink, "title"),
            icon: undefined,
            mode: "icon-text",
        },

        children: {
            navLink: useNavLink({
                underline: "none",
                linkView: () => <model._linkView />,
                onClick: async () => {
                    await model.onClick?.(model);
                },
                beforeNavigate: async (route) => {
                    const currentRoute = await model.getRoute();
                    if (currentRoute.path != route.path) {
                        return route;
                    }
                }
            })
        },

        methods: {
            _linkView: () => {
                return (
                    <Block
                        className={`ueca-nav-item ${model.active ? "active" : ""} ${model.disabled ? "disabled" : ""}`}
                        height={model.extent?.height}
                        width={model.extent?.width}
                        padding={{
                            topBottom: "small",
                            leftRight: model.mode === "icon-only" ? undefined : "small"
                        }}
                        cursor={model.disabled ? "default" : "pointer"}
                        sx={{
                            "--nav-item-hover": resolvePaletteColor("menu.hover"),
                            "--nav-item-disabled": resolvePaletteColor("menu.disabled"),
                            "--nav-item-active": resolvePaletteColor("menu.active")
                        } as React.CSSProperties}
                    >
                        <Row
                            horizontalAlign={model.mode === "icon-only" ? "center" : "left"}
                            verticalAlign={"center"}
                            spacing={model.mode === "icon-only" ? undefined : "small"}
                            fill
                        >
                            <UECA.IF condition={model.icon && model.mode !== "text-only"}>
                                {model.icon}
                            </UECA.IF>
                            <UECA.IF condition={model.mode !== "icon-only"}>
                                {model.text}
                            </UECA.IF>
                        </Row>
                    </Block>
                );
            }
        },

        View: () => (
            <Block id={model.htmlId()}>
                <model.navLink.View />
            </Block>
        )
    }

    const model = useUIBase(struct, params);
    return model;
}

const NavItem = UECA.getFC(useNavItem);

export { NavItemParams, NavItemModel, NavItemMode, useNavItem, NavItem };
