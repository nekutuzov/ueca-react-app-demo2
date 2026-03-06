import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";
import { AppRoute, asyncSafe, Palette, resolvePaletteColor } from "@core";
import "./navLink.css";

type NavLinkUnderline = "none" | "hover" | "always";

type NavLinkStruct = UIBaseStruct<{
    props: {
        route: AppRoute;
        title: string;
        color: Palette;
        underline: NavLinkUnderline;
        disabled: boolean;
        newTab: boolean;
        linkView: React.ReactNode;
    }

    events: {
        beforeNavigate: (route: AppRoute) => Promise<AppRoute>
    }

    methods: {
        click: () => Promise<void>;
    }
}>;

type NavLinkParams = UIBaseParams<NavLinkStruct>;
type NavLinkModel = UIBaseModel<NavLinkStruct>;

function useNavLink(params?: NavLinkParams): NavLinkModel {
    const struct: NavLinkStruct = {
        props: {
            id: useNavLink.name,
            route: undefined,
            color: "primary.main",
            underline: "hover",
            title: undefined,
            disabled: false,
            newTab: false,
            linkView: undefined
        },

        methods: {
            click: async () => {
                if (!model.route) {
                    return;
                }
                const route = model.beforeNavigate ? await model.beforeNavigate(model.route) : model.route;
                if (!route) {
                    return;
                }
                if (model.newTab) {
                    await model.openNewTab(route);
                } else {
                    await model.goToRoute(route);
                }
            }
        },

        View: () => {
            const colorStyle = resolvePaletteColor(model.color);
            const underlineClass = `nav-link-underline-${model.underline}`;
            
            if (model.disabled) {
                return (
                    <span
                        id={model.htmlId()}
                        className="ueca-nav-link-disabled"
                    >
                        {model.linkView || model.title}
                    </span>
                );
            }
            
            return (
                <a
                    id={model.htmlId()}
                    className={`ueca-nav-link ${underlineClass}`}
                    href={(model.route?.path.startsWith("/") ? "#" : "") + model.route?.path}
                    title={model.title}
                    target={model.newTab ? "_blank" : undefined}
                    rel={model.newTab ? "noopener noreferrer" : undefined}
                    style={{ color: colorStyle }}
                    onClick={(e) => asyncSafe(async () => await _onLinkClick(e))}
                >
                    {model.linkView || model.title}
                </a>
            );
        }
    }

    const model = useUIBase(struct, params);
    return model;

    // Private methods
    async function _onLinkClick(e: React.MouseEvent) {
        e.stopPropagation();
        e.preventDefault();
        return await model.click();
    }
}

const NavLink = UECA.getFC(useNavLink);

export { NavLinkModel, NavLinkUnderline, useNavLink, NavLink };
