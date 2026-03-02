import * as UECA from "ueca-react";
import { Block, NavLinkModel, UIBaseModel, UIBaseParams, UIBaseStruct, useNavLink, useUIBase } from "@components";
import { AppRoute, Palette, resolvePaletteColor } from "@core";
import "./navItem.css";

type NavItemStruct = UIBaseStruct<{
    props: {
        kind: "list-item" | "button";
        active: boolean;
        route: AppRoute;
        disabled: boolean;
        newTab: boolean;
        activeColor: Palette;
        icon: React.ReactNode;
        text: string;
    },

    children: {
        navLink: NavLinkModel;
    },

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
            kind: "list-item",
            active: false,
            route: UECA.bind(() => model.navLink, "route"),
            disabled: UECA.bind(() => model.navLink, "disabled"),
            newTab: UECA.bind(() => model.navLink, "newTab"),
            activeColor: "primary.main",
            icon: undefined,
            text: undefined,
        },

        children: {
            navLink: useNavLink({
                title: () => model.text,
                underline: "none",
                linkView: () => <model._linkView />,
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
                const activeColorStyle = resolvePaletteColor(model.activeColor);
                const height = model.extent?.height;
                const width = model.extent?.width;
                
                return model.kind === "button" ? (
                    <button
                        className={`nav-item-icon-button ${model.active ? 'active' : ''}`}
                        disabled={model.disabled}
                        style={{
                            height,
                            width,
                            ...(model.active ? { 
                                '--nav-item-active-color': activeColorStyle 
                            } as React.CSSProperties : {})
                        }}
                    >
                        {model.icon}
                    </button>
                ) : (
                    <div
                        className={`nav-item-list-button ${model.active ? 'selected' : ''}`}
                        style={{ height, width }}
                    >
                        {model.icon && <div className="nav-item-icon">{model.icon}</div>}
                        {model.text && <div className="nav-item-text">{model.text}</div>}
                    </div>
                );
            }
        },

        View: () => (
            <Block id={model.htmlId()} className="ueca-nav-item" fill overflow={"hidden"}>
                <model.navLink.View />
            </Block>
        )
    }

    const model = useUIBase(struct, params);
    return model;
}

const NavItem = UECA.getFC(useNavItem);

export { NavItemParams, NavItemModel, useNavItem, NavItem };
