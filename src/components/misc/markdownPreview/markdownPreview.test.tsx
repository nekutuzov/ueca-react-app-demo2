import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { MarkdownPreview } from "@components";
import { mount, settle, stubMessages } from "@test";

const SOURCE = [
    "# Getting Started",
    "",
    "Jump to [the install notes](#install%20notes), open [the home screen](/home) or visit [the docs](https://example.com/docs).",
    "",
    "```js",
    "const answer = 42;",
    "```"
].join("\n");

async function stubRouter() {
    return await stubMessages({
        "App.Router.SetRouteParams": vi.fn(async (_payload: unknown) => { }),
        "App.Router.GoToRoute": vi.fn(async () => true)
    });
}

function link(name: string): HTMLAnchorElement {
    return screen.getByRole("link", { name }) as HTMLAnchorElement;
}

describe("MarkdownPreview", () => {
    // Records whether the component cancelled a click, then cancels it anyway: jsdom cannot
    // navigate, and a click it does not cancel would try to.
    let clickWasPrevented: boolean;
    const recordAndCancel = (e: Event) => {
        clickWasPrevented = e.defaultPrevented;
        e.preventDefault();
    };

    beforeEach(() => {
        clickWasPrevented = undefined;
        document.addEventListener("click", recordAndCancel);
        // A screen address with a query, as the router leaves it.
        window.history.replaceState(null, "", "/ueca-react-app-demo2/showcase/overview?tab=api");
    });

    afterEach(() => {
        document.removeEventListener("click", recordAndCancel);
    });

    it("renders markdown headings, paragraphs and code blocks inside its column", async () => {
        await mount(MarkdownPreview, { id: "doc", source: SOURCE });

        const root = document.getElementById("doc");
        expect(root.style.flexDirection).toBe("column");
        expect(root).toContainElement(screen.getByRole("heading", { level: 1, name: "Getting Started" }));
        expect(root.querySelector("pre code")).toHaveTextContent("const answer = 42;");
        expect(link("the docs")).toBeInTheDocument();
    });

    it("re-renders when the source changes", async () => {
        const { model } = await mount(MarkdownPreview, { id: "doc", source: "# First" });

        model.source = "## Second";
        await settle();

        expect(screen.queryByRole("heading", { name: "First" })).toBeNull();
        expect(screen.getByRole("heading", { level: 2, name: "Second" })).toBeInTheDocument();
    });

    describe("in-page links", () => {
        // index.html sets <base href>, so a bare "#id" would resolve against the base and land on
        // Home. The href is rewritten to the page actually being read.
        it("points #anchors at the current address and tags them with the decoded section", async () => {
            await mount(MarkdownPreview, { id: "doc", source: SOURCE });

            const anchor = link("the install notes");
            expect(anchor).toHaveAttribute("href", "/ueca-react-app-demo2/showcase/overview?tab=api#install%20notes");
            expect(anchor.dataset.section).toBe("install notes");
        });

        it("rewrites the anchor each heading gets as well", async () => {
            await mount(MarkdownPreview, { id: "doc", source: SOURCE });

            const headingAnchor = screen.getByRole("heading", { name: "Getting Started" }).querySelector("a");
            expect(headingAnchor).toHaveAttribute("href", "/ueca-react-app-demo2/showcase/overview?tab=api#getting-started");
            expect(headingAnchor.dataset.section).toBe("getting-started");
        });

        it("leaves route and external links untouched", async () => {
            await mount(MarkdownPreview, { id: "doc", source: SOURCE });

            expect(link("the home screen")).toHaveAttribute("href", "/home");
            expect(link("the home screen").dataset.section).toBeUndefined();
            expect(link("the docs")).toHaveAttribute("href", "https://example.com/docs");
            expect(link("the docs").dataset.section).toBeUndefined();
        });

        it("rewrites the links of content that arrives after the first render", async () => {
            const { model } = await mount(MarkdownPreview, { id: "doc", source: "No links yet." });

            model.source = "See [usage](#usage).";
            await settle();

            expect(link("usage")).toHaveAttribute("href", "/ueca-react-app-demo2/showcase/overview?tab=api#usage");
            expect(link("usage").dataset.section).toBe("usage");
        });
    });

    describe("clicks", () => {
        // An address patch, not a route change: GoToRoute would rebuild the screen already showing.
        it("moves to a section by patching the route's section only", async () => {
            const bus = await stubRouter();
            await mount(MarkdownPreview, { id: "doc", source: SOURCE });

            fireEvent.click(link("the install notes"));
            await settle();

            expect(clickWasPrevented).toBe(true);
            expect(bus["App.Router.SetRouteParams"]).toHaveBeenCalledOnce();
            expect(bus["App.Router.SetRouteParams"].mock.calls[0][0]).toStrictEqual({ section: "install notes" });
            expect(bus["App.Router.GoToRoute"]).not.toHaveBeenCalled();
        });

        it("routes an internal /path link through the app router", async () => {
            const bus = await stubRouter();
            await mount(MarkdownPreview, { id: "doc", source: SOURCE });

            fireEvent.click(link("the home screen"));
            await settle();

            expect(clickWasPrevented).toBe(true);
            expect(bus["App.Router.GoToRoute"]).toHaveBeenCalledWith({ path: "/home" });
            expect(bus["App.Router.SetRouteParams"]).not.toHaveBeenCalled();
        });

        it("leaves an external link to the browser", async () => {
            const bus = await stubRouter();
            await mount(MarkdownPreview, { id: "doc", source: SOURCE });

            fireEvent.click(link("the docs"));
            await settle();

            expect(clickWasPrevented).toBe(false);
            expect(bus["App.Router.GoToRoute"]).not.toHaveBeenCalled();
            expect(bus["App.Router.SetRouteParams"]).not.toHaveBeenCalled();
        });

        it("handles a click on the glyph inside a heading anchor as a click on the anchor", async () => {
            const bus = await stubRouter();
            await mount(MarkdownPreview, { id: "doc", source: SOURCE });

            fireEvent.click(screen.getByRole("heading", { name: "Getting Started" }).querySelector("a svg"));
            await settle();

            expect(clickWasPrevented).toBe(true);
            expect(bus["App.Router.SetRouteParams"]).toHaveBeenCalledWith({ section: "getting-started" });
        });

        it("ignores clicks outside links", async () => {
            const bus = await stubRouter();
            await mount(MarkdownPreview, { id: "doc", source: SOURCE });

            fireEvent.click(screen.getByRole("heading", { name: "Getting Started" }));
            await settle();

            expect(clickWasPrevented).toBe(false);
            expect(bus["App.Router.GoToRoute"]).not.toHaveBeenCalled();
            expect(bus["App.Router.SetRouteParams"]).not.toHaveBeenCalled();
        });
    });

    // BUG: skipHtml never takes effect. @uiw/react-markdown-preview always adds rehype-raw to its
    // plugin list, so raw HTML in the source renders whatever skipHtml says.
    it.fails("does not render raw HTML when skipHtml is set", async () => {
        await mount(MarkdownPreview, { id: "doc", source: "Plain <mark>raw html</mark> text", skipHtml: true });

        expect(document.getElementById("doc").querySelector("mark")).toBeNull();
    });
});
