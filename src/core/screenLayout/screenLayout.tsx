import * as UECA from "ueca-react";
import {
    AlertDrawerModel, BlockProps, Col, Icon, IconButtonModel, MenuList, PopoverModel, Row,
    UIBaseModel, UIBaseParams, UIBaseStruct, useAlertDrawer, useIconButton, usePopover, useUIBase
} from "@components";
import { Breadcrumb, LocationBreadcrumbsModel, useLocationBreadcrumbs, UECAContactsModel, useUECAContacts } from "@core";
import { ThemeToggleModel, useThemeToggle } from "../appComponents/themeToggle/themeToggle";
import "./screenLayout.css";

type ScreenLayoutStruct = UIBaseStruct<{
    props: {
        breadcrumbs: Breadcrumb[];
        toolsView: React.ReactNode;
        // Overflow ("…") menu: secondary screen actions that do not earn a toolbar button —
        // export, print, delete. A VIEW SLOT (composition over configuration): the screen declares
        // useMenuItem children on its own model and composes their Views here — usually bare, the
        // layout provides the <MenuList> shell and the popover. The "…" button appears only while
        // this is non-null.
        hiddenToolsView: React.ReactNode;
        contentView: React.ReactNode;
        contentPaddings: "none" | "default" | BlockProps["padding"],
    };

    children: {
        breadcrumbsControl: LocationBreadcrumbsModel;
        drawerPanel: AlertDrawerModel;
        hiddenToolsButton: IconButtonModel;
        hiddenToolsPopover: PopoverModel;
        themeToggle: ThemeToggleModel;
        contacts: UECAContactsModel;
    };
}>;

type ScreenLayoutParams = UIBaseParams<ScreenLayoutStruct>;
type ScreenLayoutModel = UIBaseModel<ScreenLayoutStruct>;

function useScreenLayout(params?: ScreenLayoutParams): ScreenLayoutModel {
    const struct: ScreenLayoutStruct = {
        props: {
            id: useScreenLayout.name,
            breadcrumbs: [],
            toolsView: undefined,
            hiddenToolsView: undefined,
            contentView: undefined,
            contentPaddings: "default",
        },

        children: {
            breadcrumbsControl: useLocationBreadcrumbs({
                items: () => model.breadcrumbs
            }),

            drawerPanel: useAlertDrawer({
                titleView: "Alert",
                contentView: "This is an alert drawer.",
                width: 1000,
            }),

            hiddenToolsButton: useIconButton({
                iconView: <Icon name="more" size="md" />,
                title: "More actions",
                size: "small",
                onClick: (source) => {
                    if (model.hiddenToolsPopover.open) {
                        model.hiddenToolsPopover.close();
                        return;
                    }
                    const el = document.getElementById(source.htmlId());
                    if (!el) {
                        return;
                    }
                    // Anchored under the button, where an overflow menu belongs; the popover's
                    // shared positioner flips it above when there is no room below.
                    const r = el.getBoundingClientRect();
                    model.hiddenToolsPopover.anchor = { top: r.top, left: r.left, width: r.width, height: r.height };
                    model.hiddenToolsPopover.open = true;
                }
            }),

            // The menu surface. The layout owns only the shell — the rows are the screen's own
            // MenuItem children, composed through the hiddenToolsView slot. Any click that lands
            // inside (i.e. on an enabled item — disabled buttons swallow their clicks) closes the
            // menu after the item's own handler has run.
            hiddenToolsPopover: usePopover({
                placement: "bottom",
                className: "ueca-popover-menu",
                // Without this the outside-click close races the button's own toggle: mousedown
                // closes the menu, the click that follows sees it closed and re-opens it.
                onGetTrigger: () => document.getElementById(model.hiddenToolsButton.htmlId()),
                contentView: () => (
                    <div onClick={() => model.hiddenToolsPopover.close()}>
                        <MenuList>{model.hiddenToolsView}</MenuList>
                    </div>
                )
            }),

            themeToggle: useThemeToggle(),

            contacts: useUECAContacts({
                orientation: "horizontal"
            })
        },

        events: {
            onChangeBreadcrumbs: async () => {
                await _syncPageTitle();
            }
        },

        // On mount as well as on change: a screen returned to keeps its breadcrumbs, so no change
        // event fires, but the history service cleared the title when the path changed.
        mount: async () => {
            await _syncPageTitle();
        },

        View: () => {
            const contentPaddings: BlockProps["padding"] =
                model.contentPaddings === "none" ?
                    undefined :
                    (model.contentPaddings === "default" || !model.contentPaddings) ?
                        // All four sides, so right-aligned content does not sit flush against the
                        // window edge and the last row of a scrolled list does not touch the bottom.
                        {
                            topBottom: "medium",
                            leftRight: "medium",
                        } :
                        model.contentPaddings;

            return (
                <Col id={model.htmlId()} fill overflow={"hidden"} spacing={"none"}>
                    <Row
                        className="app-topbar"
                        verticalAlign={"center"}
                        horizontalAlign={"spaceBetween"}
                        height={"var(--topbar-h)"}
                        spacing={"default"}
                        // Makes the bar a scroll container, which is the only way it can carry
                        // the same scrollbar-gutter as the content below it - see the CSS.
                        // Its padding is left to CSS for the same reason: the bar and the page
                        // have to read one --page-pad, and the prop would write a fixed px.
                        overflow={"hidden"}
                    >
                        <model.breadcrumbsControl.View />
                        <Row spacing={"tiny"} verticalAlign={"center"}>
                            {/* The screen's own tools first, then the app-level controls behind a
                                hairline, so the two groups never read as one run of buttons. */}
                            <Row className={"ueca-screen-tools ueca-chromed-icon-buttons"} spacing={"default"} verticalAlign={"center"}>
                                {model.toolsView}
                                {/* Only shown when there is something in it — an empty "…" is a dead end. */}
                                <model.hiddenToolsButton.View render={model.hiddenToolsView != null} />
                                <model.hiddenToolsPopover.View />
                            </Row>
                            <div className="app-topbar-divider" />
                            <model.themeToggle.View />
                            <model.contacts.View />
                        </Row>
                    </Row>
                    {/* Named so a screen can find the box that actually scrolls. Anything moving
                        the view to an anchor has to scroll THIS, not call scrollIntoView, which
                        walks every scrollable ancestor and drags the app shell with it.
                        overflow stays a prop: Col writes `overflow: visible` inline when it is
                        omitted, which would outrank the stylesheet. */}
                    <Col className={"app-content ueca-screen-content"} fill padding={contentPaddings} overflow={"auto"} spacing="default">
                        {model.contentView}
                    </Col>
                    <model.drawerPanel.View />
                </Col>
            )
        }
    }

    const model = useUIBase(struct, params);
    return model;

    // Private methods
    // The document title, from the screen's own breadcrumb trail: the last crumb, most specific part
    // first ("Showcase · Controls" reads "Controls · Showcase", so a narrow browser tab still shows
    // which page it is). A one-crumb trail is the home page, which takes the app name alone, and a
    // crumb drawn as JSX has no text to offer.
    async function _syncPageTitle() {
        const crumbs = model.breadcrumbs ?? [];
        const label = crumbs.length > 1 ? crumbs[crumbs.length - 1].label : undefined;
        const title = typeof label === "string" ? label.split(" · ").reverse().join(" · ") : undefined;
        await model.bus.unicast("App.BrowsingHistory.SetPageTitle", title);
    }
}

const ScreenLayout = UECA.getFC(useScreenLayout);

export { ScreenLayoutParams, ScreenLayoutModel, useScreenLayout, ScreenLayout };
