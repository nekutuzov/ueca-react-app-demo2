import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, within } from "@testing-library/react";
import { Breadcrumbs, NavLink } from "@components";
import { AppRoute } from "@core";
import { mount, settle, stubMessages } from "@test";

function crumbs(): HTMLElement[] {
    return within(screen.getByRole("list")).getAllByRole("listitem");
}

describe("Breadcrumbs", () => {
    it("renders a labelled navigation landmark with one list item per crumb", async () => {
        await mount(Breadcrumbs, {
            id: "trail",
            childrenView: [<span key="a">Home</span>, <span key="b">Showcase</span>, <span key="c">Tokens</span>]
        });

        const nav = screen.getByRole("navigation", { name: "breadcrumb" });
        expect(nav).toHaveAttribute("id", "trail");
        const list = within(nav).getByRole("list");
        expect(list.tagName).toBe("OL");
        expect(list).toHaveClass("ueca-breadcrumbs");
        expect(crumbs().map((li) => li.textContent)).toEqual(["Home", "Showcase", "Tokens"]);
    });

    it("puts the default chevron separator between crumbs, never after the last", async () => {
        await mount(Breadcrumbs, {
            id: "trail",
            childrenView: [<span key="a">Home</span>, <span key="b">Showcase</span>, <span key="c">Tokens</span>]
        });

        const list = screen.getByRole("list");
        const separators = list.querySelectorAll(":scope > .ueca-breadcrumbs-separator");
        expect(separators).toHaveLength(2);
        separators.forEach((separator) => expect(separator.querySelector("svg")).not.toBeNull());
        expect(Array.from(list.children).map((child) => child.tagName)).toEqual(["LI", "SPAN", "LI", "SPAN", "LI"]);
    });

    it("uses a custom separator in place of the chevron", async () => {
        await mount(Breadcrumbs, {
            id: "trail",
            separator: <span data-testid="slash">/</span>,
            childrenView: [<span key="a">Home</span>, <span key="b">Tokens</span>]
        });

        expect(screen.getAllByTestId("slash")).toHaveLength(1);
        expect(document.querySelector(".ueca-breadcrumbs-separator")).toBeNull();
    });

    // A trail written as a fragment would otherwise count as one child: a single crumb, no separators.
    it("splits a fragment into separate crumbs", async () => {
        await mount(Breadcrumbs, {
            id: "trail",
            childrenView: <><span>Home</span><span>Tokens</span></>
        });

        expect(crumbs().map((li) => li.textContent)).toEqual(["Home", "Tokens"]);
        expect(screen.getAllByRole("listitem")).toHaveLength(2);
        expect(document.querySelectorAll(".ueca-breadcrumbs-separator")).toHaveLength(1);
    });

    it("renders a single crumb without a separator, and an empty list without crumbs", async () => {
        const { model } = await mount(Breadcrumbs, { id: "trail", childrenView: <span>Home</span> });
        expect(crumbs()).toHaveLength(1);
        expect(document.querySelector(".ueca-breadcrumbs-separator")).toBeNull();

        model.childrenView = undefined;
        await settle();

        expect(screen.getByRole("list")).toBeEmptyDOMElement();
    });

    it("hosts UECA links as crumbs", async () => {
        await stubMessages({ "App.Router.ResolveRoute": vi.fn(async (route: AppRoute) => `/app${route.path}`) });
        await mount(Breadcrumbs, {
            id: "trail",
            childrenView: [
                <NavLink key="home" id="bc0" route={{ path: "/home" }} title="Home" />,
                <NavLink key="tokens" id="bc1" route={{ path: "/showcase/tokens" }} title="Tokens" disabled />
            ]
        });
        await settle();

        const [first, last] = crumbs();
        expect(within(first).getByRole("link", { name: "Home" })).toHaveAttribute("href", "/app/home");
        expect(within(last).queryByRole("link")).toBeNull();
        expect(last).toHaveTextContent("Tokens");
    });

    it("raises onClick with its own model for a click inside the trail", async () => {
        const onClick = vi.fn();
        const { model } = await mount(Breadcrumbs, {
            id: "trail",
            onClick,
            childrenView: [<span key="a">Home</span>, <span key="b">Tokens</span>]
        });

        fireEvent.click(screen.getByText("Tokens"));
        await settle();

        expect(onClick).toHaveBeenCalledOnce();
        expect(onClick).toHaveBeenCalledWith(model);
    });

    it("ignores a click when no onClick handler is set", async () => {
        const bus = await stubMessages({ "App.UnhandledException": vi.fn(async () => { }) });
        await mount(Breadcrumbs, { id: "trail", childrenView: <span>Home</span> });

        fireEvent.click(screen.getByText("Home"));
        await settle();

        expect(bus["App.UnhandledException"]).not.toHaveBeenCalled();
    });
});
