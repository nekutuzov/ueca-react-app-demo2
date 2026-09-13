import { describe, expect, it } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as UECA from "ueca-react";
import { NavItemExpandable, NavItemExpandableModel, NavItemModel, useNavItem, useNavItemExpandable } from "@components";
import { AppMessage, AppRoute } from "@core";
import { mount, settle } from "@test";

const TOKENS: AppRoute = { path: "/showcase/tokens" };
const LAYOUT: AppRoute = { path: "/showcase/layout" };

// The group's clickable heading.
function heading(): HTMLElement {
    return document.querySelector(".ueca-nav-item-expandable");
}

// The element that turns the chevron.
function chevron(): HTMLElement {
    return heading().querySelector("svg")?.parentElement;
}

describe("NavItemExpandable", () => {
    it("draws its icon, its text and a downward chevron, collapsed by default", async () => {
        const { model } = await mount(NavItemExpandable, { id: "group", text: "Showcase", icon: <i data-testid="icon" /> });

        expect(model.expanded).toBe(false);
        const box = heading();
        expect(document.getElementById("group")).toContainElement(box);
        expect(box).toHaveTextContent("Showcase");
        expect(box).toContainElement(screen.getByTestId("icon"));
        expect(box).not.toHaveClass("active");
        expect(box).toHaveStyle({ cursor: "pointer" });
        expect(chevron().style.transform).toBe("rotate(0deg)");
    });

    it("toggles expanded with every click on its heading, turning the chevron", async () => {
        const { model } = await mount(NavItemExpandable, { id: "group", text: "Showcase" });

        fireEvent.click(heading());
        await settle();
        expect(model.expanded).toBe(true);
        expect(chevron().style.transform).toBe("rotate(180deg)");

        fireEvent.click(heading());
        await settle();
        expect(model.expanded).toBe(false);
        expect(chevron().style.transform).toBe("rotate(0deg)");
    });

    it.each([
        ["icon-text", { icon: true, text: true, chevron: true, justifyContent: "space-between", paddingLeft: "16px" }],
        ["text-only", { icon: false, text: true, chevron: true, justifyContent: "space-between", paddingLeft: "16px" }],
        ["icon-only", { icon: true, text: false, chevron: false, justifyContent: "center", paddingLeft: "" }]
    ] as const)("lays out its heading in %s mode", async (mode, expected) => {
        await mount(NavItemExpandable, { id: "group", text: "Showcase", icon: <i data-testid="icon" />, mode });

        const box = heading();
        expect(screen.queryByTestId("icon") !== null).toBe(expected.icon);
        expect(box.textContent.includes("Showcase")).toBe(expected.text);
        expect(box.querySelector("svg") !== null).toBe(expected.chevron);
        expect((box.firstElementChild as HTMLElement).style.justifyContent).toBe(expected.justifyContent);
        expect(box.style.paddingLeft).toBe(expected.paddingLeft);
    });

    // Regression: the heading was a bare clickable <div> — no role, no tab stop — so a keyboard user
    // could not open a group at all.
    it("is a button the keyboard can reach and press, reporting whether it is expanded", async () => {
        const { model } = await mount(NavItemExpandable, { id: "group", text: "Showcase" });
        const button = screen.getByRole("button", { name: "Showcase" });
        expect(button).toBe(heading());
        expect(button).toHaveAttribute("aria-expanded", "false");

        await userEvent.tab();
        expect(button).toHaveFocus();
        await userEvent.keyboard("{Enter}");
        await settle();
        expect(model.expanded).toBe(true);
        expect(heading()).toHaveAttribute("aria-expanded", "true");

        await userEvent.keyboard(" ");
        await settle();
        expect(model.expanded).toBe(false);

        await userEvent.keyboard("a");
        await settle();
        expect(model.expanded).toBe(false);
    });

    it("names its button after its text only while the label is hidden", async () => {
        const { model } = await mount(NavItemExpandable, {
            id: "group", text: "Showcase", icon: <svg aria-hidden="true" />, mode: "icon-only"
        });
        expect(screen.getByRole("button", { name: "Showcase" })).toHaveAttribute("aria-label", "Showcase");

        model.mode = "icon-text";
        await settle();

        expect(heading()).not.toHaveAttribute("aria-label");
        expect(screen.getByRole("button", { name: "Showcase" })).toBe(heading());
    });

    it("marks an active group", async () => {
        const { model } = await mount(NavItemExpandable, { id: "group", text: "Showcase" });

        model.active = true;
        await settle();

        expect(heading()).toHaveClass("active");
    });

    it("sizes its heading from extent", async () => {
        await mount(NavItemExpandable, { id: "group", text: "Showcase", extent: { width: 200, height: 40 } });

        expect(heading()).toHaveStyle({ width: "200px", height: "40px" });
    });

    describe("sub-items", () => {
        it("are shown in order, indented under the heading, only while expanded", async () => {
            const { model } = await mount(GroupHost, { id: "menu" });
            expect(screen.queryByText("Tokens")).toBeNull();

            model.group.expanded = true;
            await settle();

            const tokens = document.getElementById("menu.tokensItem");
            const layout = document.getElementById("menu.layoutItem");
            expect(tokens).toHaveTextContent("Tokens");
            expect(layout).toHaveTextContent("Layout");
            expect(tokens.compareDocumentPosition(layout) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
            expect(tokens.parentElement.style.paddingLeft).toBe("24px");

            model.group.expanded = false;
            await settle();
            expect(document.getElementById("menu.tokensItem")).toBeNull();
        });

        // Hidden in the icon rail, the group's click toggled `expanded` with nothing to show for it and
        // every item in the group was unreachable without first widening the menu.
        it("stay reachable in icon-only mode, without the indent", async () => {
            const { model } = await mount(GroupHost, { id: "menu" });

            model.group.mode = "icon-only";
            model.tokensItem.mode = "icon-only";
            model.layoutItem.mode = "icon-only";
            fireEvent.click(heading());
            await settle();

            const tokens = document.getElementById("menu.tokensItem");
            expect(tokens).toContainElement(screen.getByTestId("tokens-icon"));
            expect(document.getElementById("menu.layoutItem")).toContainElement(screen.getByTestId("layout-icon"));
            expect(tokens.parentElement.style.paddingLeft).toBe("");
        });

        it("drive the group's active state, and a group that becomes active opens", async () => {
            const { model } = await mount(GroupHost, { id: "menu" });
            expect(model.group.active).toBe(false);

            model.activePath = LAYOUT.path;
            await settle();
            expect(model.group.active).toBe(true);
            expect(heading()).toHaveClass("active");
            expect(model.group.expanded).toBe(true);
            expect(document.getElementById("menu.layoutItem")).toBeInTheDocument();

            model.activePath = "/home";
            await settle();
            expect(model.group.active).toBe(false);
            expect(heading()).not.toHaveClass("active");
        });
    });
});

// A menu that owns a group and its two items, wired the way CLAUDE.md prescribes for app menus: an
// item is active on its route, the group is active when any item is, and becoming active opens it.
type GroupHostStruct = UECA.ComponentStruct<{
    props: {
        activePath: string;
    };

    children: {
        tokensItem: NavItemModel;
        layoutItem: NavItemModel;
        group: NavItemExpandableModel;
    };
}, AppMessage>;

function useGroupHost(params?: UECA.ComponentParams<GroupHostStruct, AppMessage>) {
    const struct: GroupHostStruct = {
        props: {
            id: useGroupHost.name,
            activePath: undefined
        },

        children: {
            tokensItem: useNavItem({
                text: "Tokens",
                route: TOKENS,
                icon: <i data-testid="tokens-icon" />,
                active: () => model.activePath === TOKENS.path
            }),

            layoutItem: useNavItem({
                text: "Layout",
                route: LAYOUT,
                icon: <i data-testid="layout-icon" />,
                active: () => model.activePath === LAYOUT.path
            }),

            group: useNavItemExpandable({
                text: "Showcase",
                subItems: () => [model.tokensItem, model.layoutItem],
                active: () => [model.tokensItem, model.layoutItem].some((item) => item?.active),
                onChangeActive: (active) => {
                    if (active) {
                        model.group.expanded = true;
                    }
                }
            })
        },

        View: () => (
            <div id={model.htmlId()}>
                <model.group.View />
            </div>
        )
    };

    const model = UECA.useComponent(struct, params);
    return model;
}

const GroupHost = UECA.getFC(useGroupHost);
