import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PLAYGROUND_TOPICS, playgroundNeighbours, SHOWCASE_TOPICS, showcaseNeighbours } from "@screens";
import { ScreenPage, ScreenPager } from "./screenPage";

describe("ScreenPage", () => {
    it("draws the eyebrow, title and lead in the header, then the body, then the footer", () => {
        const { container } = render(
            <ScreenPage
                eyebrow={"Showcase"}
                icon={"grid"}
                title={"Controls"}
                lead={"Every control in every state."}
                footerView={<footer data-testid="footer">Foot</footer>}
            >
                <section data-testid="body">Body</section>
            </ScreenPage>
        );

        const header = screen.getByRole("banner");
        expect(within(header).getByRole("heading", { level: 1, name: "Controls" })).toHaveClass("screen-page-title");
        const eyebrow = header.querySelector(".screen-page-eyebrow");
        expect(eyebrow).toHaveTextContent("Showcase");
        expect(eyebrow.querySelector(".ueca-icon")).not.toBeNull();
        expect(header.querySelector(".screen-page-lead")).toHaveTextContent("Every control in every state.");

        const page = container.firstElementChild;
        expect(page).toHaveClass("screen-page");
        expect([...page.children]).toEqual([header, screen.getByTestId("body"), screen.getByTestId("footer")]);
    });

    it("leaves out the icon and the lead when they are not given", () => {
        render(<ScreenPage eyebrow={"Playground"} title={"Button"} />);

        const header = screen.getByRole("banner");
        expect(header.querySelector(".screen-page-eyebrow .ueca-icon")).toBeNull();
        expect(header.querySelector(".screen-page-lead")).toBeNull();
        expect(header.querySelector(".screen-page-eyebrow")).toHaveTextContent("Playground");
    });

    it("takes a title drawn as JSX", () => {
        render(<ScreenPage eyebrow={"Showcase"} title={<em>Dynamic</em>} />);

        expect(screen.getByRole("heading", { level: 1 }).querySelector("em")).toHaveTextContent("Dynamic");
    });
});

describe("ScreenPager", () => {
    const prev = { title: "Layout", path: "/showcase/layout" };
    const next = { title: "Status", path: "/showcase/status" };

    it("renders nothing when the page has no neighbour on either side", () => {
        const { container } = render(<ScreenPager label={"Pages"} onGo={vi.fn()} />);

        expect(container).toBeEmptyDOMElement();
    });

    it("offers the previous page first and the next page second, named by the label", () => {
        render(<ScreenPager label={"Showcase pages"} prev={prev} next={next} onGo={vi.fn()} />);

        const nav = screen.getByRole("navigation", { name: "Showcase pages" });
        const [previousLink, nextLink] = within(nav).getAllByRole("button");
        expect(previousLink).toHaveTextContent("Previous");
        expect(previousLink.querySelector(".screen-pager-title")).toHaveTextContent("Layout");
        expect(previousLink).not.toHaveClass("screen-pager-next");
        expect(nextLink).toHaveTextContent("Next");
        expect(nextLink.querySelector(".screen-pager-title")).toHaveTextContent("Status");
        expect(nextLink).toHaveClass("screen-pager-link", "screen-pager-next");
    });

    it("hands the chosen neighbour's path to onGo", async () => {
        const onGo = vi.fn();
        render(<ScreenPager label={"Pages"} prev={prev} next={next} onGo={onGo} />);

        await userEvent.click(screen.getByRole("button", { name: /Next/ }));
        expect(onGo).toHaveBeenLastCalledWith("/showcase/status");

        await userEvent.click(screen.getByRole("button", { name: /Previous/ }));
        expect(onGo).toHaveBeenLastCalledWith("/showcase/layout");
        expect(onGo).toHaveBeenCalledTimes(2);
    });

    // The pager is a two-column row: an empty placeholder keeps a lone link in its own column, so
    // "Next" stays on the right on the first page and "Previous" on the left on the last.
    it("holds the empty side's place with a placeholder", () => {
        const { rerender } = render(<ScreenPager label={"Pages"} next={next} onGo={vi.fn()} />);
        let slots = [...screen.getByRole("navigation").children];
        expect(slots.map((s) => s.tagName)).toEqual(["SPAN", "BUTTON"]);
        expect(slots[0]).toBeEmptyDOMElement();

        rerender(<ScreenPager label={"Pages"} prev={prev} onGo={vi.fn()} />);
        slots = [...screen.getByRole("navigation").children];
        expect(slots.map((s) => s.tagName)).toEqual(["BUTTON", "SPAN"]);
        expect(slots[1]).toBeEmptyDOMElement();
    });

    // The topic lists are the single source of the previous/next chain: following Next from the
    // first page has to visit every page once, in menu order, and stop at the last.
    describe.each([
        ["showcase", SHOWCASE_TOPICS, showcaseNeighbours],
        ["playground", PLAYGROUND_TOPICS, playgroundNeighbours]
    ] as const)("fed from the %s topic list", (_name, topics, neighbours) => {
        it("has no previous link on the first page and no next link on the last", () => {
            const first = neighbours(topics[0].key as never);
            const { rerender } = render(<ScreenPager label={"Pages"} prev={first.prev} next={first.next} onGo={vi.fn()} />);
            expect(screen.queryByRole("button", { name: /Previous/ })).toBeNull();
            expect(screen.getByRole("button", { name: /Next/ })).toHaveTextContent(topics[1].title);

            const last = neighbours(topics[topics.length - 1].key as never);
            rerender(<ScreenPager label={"Pages"} prev={last.prev} next={last.next} onGo={vi.fn()} />);
            expect(screen.getByRole("button", { name: /Previous/ })).toHaveTextContent(topics[topics.length - 2].title);
            expect(screen.queryByRole("button", { name: /Next/ })).toBeNull();
        });

        it("chains every page to the next one in list order", async () => {
            const visited: string[] = [topics[0].path];
            const onGo = vi.fn((path: string) => { visited.push(path); });

            for (const topic of topics) {
                const { prev: p, next: n } = neighbours(topic.key as never);
                const { unmount } = render(<ScreenPager label={"Pages"} prev={p} next={n} onGo={onGo} />);
                const nextLink = screen.queryByRole("button", { name: /Next/ });
                if (nextLink) {
                    await userEvent.click(nextLink);
                }
                unmount();
            }

            expect(visited).toEqual(topics.map((t) => t.path));
        });
    });
});
