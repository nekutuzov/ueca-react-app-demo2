import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NavLink } from "@components";
import { AppRoute } from "@core";
import { mount, settle, stubMessages } from "@test";

const HOME: AppRoute = { path: "/home" };
const TOKENS: AppRoute = { path: "/showcase/tokens" };

// Answers the router messages a link sends; ResolveRoute mimics the app's base-relative URLs.
async function stubRouter(overrides?: Parameters<typeof stubMessages>[0]) {
    return await stubMessages({
        "App.Router.ResolveRoute": vi.fn(async (route: AppRoute) => `/ueca-react-app-demo2${route.path}`),
        "App.Router.GoToRoute": vi.fn(async () => true),
        "App.Router.OpenNewTab": vi.fn(async () => { }),
        ...overrides
    });
}

// Clicks `target` and reports whether the link cancelled the browser's default action. The listener
// sits on the React root after React's own, so it sees the link's verdict — and then cancels the
// navigation itself, which jsdom cannot perform.
function clickAndReportPrevented(container: HTMLElement, target: Element, init?: MouseEventInit): boolean {
    let prevented: boolean;
    const listener = (e: Event) => {
        prevented = e.defaultPrevented;
        e.preventDefault();
    };
    container.addEventListener("click", listener);
    try {
        fireEvent.click(target, init);
    } finally {
        container.removeEventListener("click", listener);
    }
    return prevented;
}

describe("NavLink", () => {
    it("renders a link to the resolved URL with the hover underline and primary colour by default", async () => {
        const bus = await stubRouter();
        await mount(NavLink, { id: "home", route: HOME, title: "Home" });

        const link = screen.getByRole("link", { name: "Home" });
        expect(link).toHaveAttribute("id", "home");
        expect(link).toHaveAttribute("href", "/ueca-react-app-demo2/home");
        expect(link).toHaveAttribute("class", "ueca-nav-link nav-link-underline-hover");
        expect(link.style.color).toBe("var(--accent)");
        expect(link).not.toHaveAttribute("target");
        expect(link).not.toHaveAttribute("rel");
        // The label is already on screen, so a native hint popup would only repeat it.
        expect(link).not.toHaveAttribute("title");
        expect(bus["App.Router.ResolveRoute"]).toHaveBeenCalledWith(HOME);
    });

    it("renders no href when the route cannot be resolved", async () => {
        await stubRouter({ "App.Router.ResolveRoute": vi.fn(async () => undefined) });
        await mount(NavLink, { id: "home", route: HOME, title: "Home" });

        const anchor = document.getElementById("home");
        expect(anchor.tagName).toBe("A");
        expect(anchor).not.toHaveAttribute("href");
        expect(screen.queryByRole("link")).toBeNull();
    });

    it("asks for no URL and renders no href without a route", async () => {
        const bus = await stubRouter();
        await mount(NavLink, { id: "action", title: "Run" });

        expect(document.getElementById("action")).not.toHaveAttribute("href");
        expect(bus["App.Router.ResolveRoute"]).not.toHaveBeenCalled();
    });

    // Resolved on mount rather than init: init can run while nothing is live to answer the bus, and
    // a link resolved then kept no href for good — which is how the whole main menu lost its hrefs.
    it("resolves its URL once mounted, when the app is live, not during init", async () => {
        let live = false;
        await stubRouter({
            "App.Router.ResolveRoute": vi.fn(async (route: AppRoute) => live ? `/app${route.path}` : undefined)
        });

        await mount(NavLink, { id: "home", route: HOME, title: "Home", init: () => { live = true; } });

        expect(screen.getByRole("link")).toHaveAttribute("href", "/app/home");
    });

    it("re-resolves the href when the route changes and drops it when the route is cleared", async () => {
        const bus = await stubRouter();
        const { model } = await mount(NavLink, { id: "link", route: HOME, title: "Go" });

        model.route = TOKENS;
        await settle();
        expect(bus["App.Router.ResolveRoute"]).toHaveBeenLastCalledWith(TOKENS);
        expect(screen.getByRole("link")).toHaveAttribute("href", "/ueca-react-app-demo2/showcase/tokens");

        model.route = undefined;
        await settle();
        expect(document.getElementById("link")).not.toHaveAttribute("href");
    });

    it("shows linkView in preference to title", async () => {
        await stubRouter();
        await mount(NavLink, { id: "link", route: HOME, title: "Plain", linkView: <strong>Rich</strong> });

        const link = screen.getByRole("link");
        expect(link).toHaveTextContent("Rich");
        expect(link).not.toHaveTextContent("Plain");
        expect(link.querySelector("strong")).not.toBeNull();
    });

    it.each(["none", "hover", "always"] as const)("marks the %s underline variant with its class", async (underline) => {
        await stubRouter();
        await mount(NavLink, { id: "link", route: HOME, title: "Go", underline });

        expect(screen.getByRole("link")).toHaveAttribute("class", `ueca-nav-link nav-link-underline-${underline}`);
    });

    // For a link whose content names nothing: NavItem's icon-only mode, where the glyph is aria-hidden.
    it("takes its accessible name from ariaLabel when given one, and from its content otherwise", async () => {
        await stubRouter();
        const { model } = await mount(NavLink, { id: "home", route: HOME, linkView: <svg aria-hidden="true" /> });
        expect(document.getElementById("home")).not.toHaveAttribute("aria-label");

        model.ariaLabel = "Home";
        await settle();

        expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("id", "home");
    });

    it("resolves a palette colour to its theme variable and passes a plain CSS colour through", async () => {
        await stubRouter();
        const { model } = await mount(NavLink, { id: "link", route: HOME, title: "Go", color: "error.main" });
        expect(screen.getByRole("link").style.color).toBe("var(--error)");

        model.color = "rebeccapurple";
        await settle();

        expect(screen.getByRole("link").style.color).toBe("rebeccapurple");
    });

    it("targets a new browsing context without an opener when newTab is set", async () => {
        await stubRouter();
        await mount(NavLink, { id: "link", route: HOME, title: "Go", newTab: true });

        const link = screen.getByRole("link");
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("renders as inert text while disabled and as a link again once enabled", async () => {
        const bus = await stubRouter();
        const onClick = vi.fn();
        const { model } = await mount(NavLink, { id: "link", route: HOME, title: "Home", disabled: true, onClick });

        const text = document.getElementById("link");
        expect(text.tagName).toBe("SPAN");
        expect(text).toHaveAttribute("class", "ueca-nav-link-disabled");
        expect(text).toHaveTextContent("Home");
        expect(screen.queryByRole("link")).toBeNull();

        await userEvent.click(text);
        await settle();
        expect(onClick).not.toHaveBeenCalled();
        expect(bus["App.Router.GoToRoute"]).not.toHaveBeenCalled();

        model.disabled = false;
        await settle();
        expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/ueca-react-app-demo2/home");
    });

    describe("clicks", () => {
        it("navigate in-app on a plain click and cancel the browser's own navigation", async () => {
            const bus = await stubRouter();
            const { container } = await mount(NavLink, { id: "link", route: HOME, title: "Home" });

            const prevented = clickAndReportPrevented(container, screen.getByRole("link"));
            await settle();

            expect(prevented).toBe(true);
            expect(bus["App.Router.GoToRoute"]).toHaveBeenCalledOnce();
            expect(bus["App.Router.GoToRoute"]).toHaveBeenCalledWith(HOME);
            expect(bus["App.Router.OpenNewTab"]).not.toHaveBeenCalled();
        });

        it("open the route through App.Router.OpenNewTab when newTab is set", async () => {
            const bus = await stubRouter();
            const { container } = await mount(NavLink, { id: "link", route: HOME, title: "Home", newTab: true });

            const prevented = clickAndReportPrevented(container, screen.getByRole("link"));
            await settle();

            expect(prevented).toBe(true);
            expect(bus["App.Router.OpenNewTab"]).toHaveBeenCalledWith(HOME);
            expect(bus["App.Router.GoToRoute"]).not.toHaveBeenCalled();
        });

        // A modified click belongs to the browser. Preventing it unconditionally is what used to
        // swallow ctrl/cmd-click into an in-app navigation instead of opening a new tab.
        it.each(["ctrlKey", "metaKey", "shiftKey", "altKey"] as const)("with %s are left to the browser", async (modifier) => {
            const bus = await stubRouter();
            const onClick = vi.fn();
            const { container } = await mount(NavLink, { id: "link", route: HOME, title: "Home", onClick });

            const prevented = clickAndReportPrevented(container, screen.getByRole("link"), { [modifier]: true });
            await settle();

            expect(prevented).toBe(false);
            expect(onClick).not.toHaveBeenCalled();
            expect(bus["App.Router.GoToRoute"]).not.toHaveBeenCalled();
        });

        // Middle-click raises auxclick, never click, so the browser keeps its open-in-new-tab.
        it("leave a middle-click to the browser", async () => {
            const bus = await stubRouter();
            await mount(NavLink, { id: "link", route: HOME, title: "Home" });

            const notPrevented = fireEvent(screen.getByRole("link"), new MouseEvent("auxclick", { bubbles: true, cancelable: true, button: 1 }));
            await settle();

            expect(notPrevented).toBe(true);
            expect(bus["App.Router.GoToRoute"]).not.toHaveBeenCalled();
        });

        it("do not bubble to handlers around the link", async () => {
            await stubRouter();
            const outer = vi.fn();
            const { container } = await mount(
                NavLink,
                { id: "link", route: HOME, title: "Home" },
                { wrapper: ({ children }) => <div onClick={outer}>{children}</div> }
            );

            clickAndReportPrevented(container, screen.getByRole("link"));
            clickAndReportPrevented(container, screen.getByRole("link"), { ctrlKey: true });
            await settle();

            expect(outer).not.toHaveBeenCalled();
        });

        it("raise onClick with the link's model and wait for it before navigating", async () => {
            const bus = await stubRouter();
            let finishOnClick: () => void;
            const onClick = vi.fn(() => new Promise<void>((resolve) => { finishOnClick = resolve; }));
            const { model, container } = await mount(NavLink, { id: "link", route: HOME, title: "Home", onClick });

            clickAndReportPrevented(container, screen.getByRole("link"));
            await settle();
            expect(onClick).toHaveBeenCalledWith(model);
            expect(bus["App.Router.GoToRoute"]).not.toHaveBeenCalled();

            finishOnClick();
            await settle();
            expect(bus["App.Router.GoToRoute"]).toHaveBeenCalledWith(HOME);
        });

        it("let beforeNavigate redirect the navigation to another route", async () => {
            const bus = await stubRouter();
            const beforeNavigate = vi.fn(async () => TOKENS);
            const { container } = await mount(NavLink, { id: "link", route: HOME, title: "Home", beforeNavigate });

            clickAndReportPrevented(container, screen.getByRole("link"));
            await settle();

            expect(beforeNavigate).toHaveBeenCalledWith(HOME);
            expect(bus["App.Router.GoToRoute"]).toHaveBeenCalledOnce();
            expect(bus["App.Router.GoToRoute"]).toHaveBeenCalledWith(TOKENS);
        });

        it("are cancelled when beforeNavigate returns no route", async () => {
            const bus = await stubRouter();
            const beforeNavigate = vi.fn(async () => undefined as AppRoute);
            const { container } = await mount(NavLink, { id: "link", route: HOME, title: "Home", newTab: true, beforeNavigate });

            const prevented = clickAndReportPrevented(container, screen.getByRole("link"));
            await settle();

            expect(prevented).toBe(true);
            expect(beforeNavigate).toHaveBeenCalledOnce();
            expect(bus["App.Router.GoToRoute"]).not.toHaveBeenCalled();
            expect(bus["App.Router.OpenNewTab"]).not.toHaveBeenCalled();
        });

        it("on a link without a route raise onClick and go nowhere", async () => {
            const bus = await stubRouter();
            const onClick = vi.fn();
            const beforeNavigate = vi.fn(async (route: AppRoute) => route);
            const { container } = await mount(NavLink, { id: "action", title: "Run", onClick, beforeNavigate });

            clickAndReportPrevented(container, document.getElementById("action"));
            await settle();

            expect(onClick).toHaveBeenCalledOnce();
            expect(beforeNavigate).not.toHaveBeenCalled();
            expect(bus["App.Router.GoToRoute"]).not.toHaveBeenCalled();
        });
    });

    it("click() runs the same navigation without a DOM event", async () => {
        const bus = await stubRouter();
        const onClick = vi.fn();
        const { model } = await mount(NavLink, { id: "link", route: TOKENS, title: "Tokens", onClick });

        await model.click();

        expect(onClick).toHaveBeenCalledWith(model);
        expect(bus["App.Router.GoToRoute"]).toHaveBeenCalledWith(TOKENS);
    });
});
