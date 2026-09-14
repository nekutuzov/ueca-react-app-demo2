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
        // The link's accessible name when its content carries none — an icon-only link, whose glyph
        // is aria-hidden. Leave it unset whenever the content already names the link.
        ariaLabel: string;
        // The route resolved to a real, copyable URL. Held on the model because resolution goes
        // over the bus and a View cannot await — so it is synchronized on route change instead.
        _routeURL: string;
    }

    events: {
        beforeNavigate: (route: AppRoute) => Promise<AppRoute>
        onClick: (source: NavLinkModel) => UECA.MaybePromise;
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
            linkView: undefined,
            ariaLabel: undefined,
            _routeURL: undefined
        },

        methods: {
            click: async () => {
                if (model.onClick) {
                    await model.onClick(model);
                }

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

        events: {
            onChangeRoute: async () => {
                await _syncRouteURL();
            }
        },

        // Seeded on MOUNT, not on init, and the difference is load-bearing twice over. `init` runs
        // before the first `route` assignment has landed — a route reaching a NavItem is bound
        // through to this child, and that write arrives while the model is still initializing,
        // where change events are suppressed — so the auto onChange above cannot cover it either.
        // And `init` can run while the app is BETWEEN activation cycles, when no model is
        // subscribed to answer the resolution: resolveRoute then yields undefined and the link
        // keeps no href, because nothing changes afterwards to try again. React StrictMode makes
        // that window real on every startup (mount → unmount → mount), which is how the whole main
        // menu lost its hrefs. By `mount` the route has landed and the app is live.
        mount: async () => {
            await _syncRouteURL();
        },

        View: () => {
            const colorStyle = resolvePaletteColor(model.color);
            // No `title` on the anchor: it is the link's own visible label (rendered below as
            // `linkView || title`), so the browser's hint popup only repeated what is already on
            // screen — and the accessible name already comes from the content.
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
                    href={model._routeURL}
                    // A link without a route is an action (Sign out). An <a> with no href is neither
                    // focusable nor a link, so the keyboard could not reach it at all: it is a button
                    // with a tab stop instead, pressed by Enter and Space.
                    role={model.route ? undefined : "button"}
                    tabIndex={model.route ? undefined : 0}
                    target={model.newTab ? "_blank" : undefined}
                    rel={model.newTab ? "noopener noreferrer" : undefined}
                    aria-label={model.ariaLabel}
                    style={{ color: colorStyle }}
                    onClick={(e) => asyncSafe(async () => await _onLinkClick(e))}
                    onKeyDown={model.route ? undefined : _onActionKeyDown}
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
        // A modified click belongs to the browser — with a real href it opens a new tab or window.
        // Preventing it unconditionally is what used to swallow ctrl/cmd-click into an in-app
        // navigation. (Middle-click never reaches here: it raises auxclick, not click.)
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) {
            return;
        }
        e.preventDefault();
        return await model.click();
    }

    // A link with an href needs none of this: the browser turns Enter on it into the click above.
    function _onActionKeyDown(e: React.KeyboardEvent) {
        if (e.key !== "Enter" && e.key !== " ") {
            return;
        }
        // Space would otherwise scroll the page.
        e.preventDefault();
        asyncSafe(async () => await model.click());
    }

    async function _syncRouteURL() {
        model._routeURL = model.route ? await model.resolveRoute(model.route) : undefined;
    }
}

const NavLink = UECA.getFC(useNavLink);

export { NavLinkModel, NavLinkParams, NavLinkUnderline, useNavLink, NavLink };
