import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SHOWCASE_TOPICS, ShowcaseScreen, ShowcaseTopicKey } from "@screens";
import { mount, settle, stubMessages } from "@test";
import { ControlsTopic, useControlsTopic } from "./topics/controlsTopic";
import { DataTopic, useDataTopic } from "./topics/dataTopic";
import { DynamicContentTopic, useDynamicContentTopic } from "./topics/dynamicContentTopic";
import { IconsTopic, useIconsTopic } from "./topics/iconsTopic";
import { LayoutTopic, useLayoutTopic } from "./topics/layoutTopic";
import { ListsTopic, useListsTopic } from "./topics/listsTopic";
import { OverlaysTopic, useOverlaysTopic } from "./topics/overlaysTopic";
import { OverviewTopic, useOverviewTopic } from "./topics/overviewTopic";
import { StatusTopic, useStatusTopic } from "./topics/statusTopic";
import { TokensTopic, useTokensTopic } from "./topics/tokensTopic";

// Every function a topic module exports — its component and its hook — is wrapped in a spy that
// calls straight through, so the real topics render while the test sees which were built.
const spyOnExports = vi.hoisted(() => async (load: () => Promise<Record<string, unknown>>) => {
    const actual = await load();
    return Object.fromEntries(Object.entries(actual).map(([name, value]) =>
        [name, typeof value === "function" ? vi.fn(value as (...args: unknown[]) => unknown) : value]));
});

vi.mock("./topics/overviewTopic", (importOriginal) => spyOnExports(importOriginal));
vi.mock("./topics/tokensTopic", (importOriginal) => spyOnExports(importOriginal));
vi.mock("./topics/layoutTopic", (importOriginal) => spyOnExports(importOriginal));
vi.mock("./topics/controlsTopic", (importOriginal) => spyOnExports(importOriginal));
vi.mock("./topics/statusTopic", (importOriginal) => spyOnExports(importOriginal));
vi.mock("./topics/iconsTopic", (importOriginal) => spyOnExports(importOriginal));
vi.mock("./topics/overlaysTopic", (importOriginal) => spyOnExports(importOriginal));
vi.mock("./topics/dataTopic", (importOriginal) => spyOnExports(importOriginal));
vi.mock("./topics/listsTopic", (importOriginal) => spyOnExports(importOriginal));
vi.mock("./topics/dynamicContentTopic", (importOriginal) => spyOnExports(importOriginal));

const TOPICS: Record<ShowcaseTopicKey, { id: string; component: unknown; hook: unknown }> = {
    overview: { id: "overviewTopic", component: OverviewTopic, hook: useOverviewTopic },
    tokens: { id: "tokensTopic", component: TokensTopic, hook: useTokensTopic },
    layout: { id: "layoutTopic", component: LayoutTopic, hook: useLayoutTopic },
    controls: { id: "controlsTopic", component: ControlsTopic, hook: useControlsTopic },
    status: { id: "statusTopic", component: StatusTopic, hook: useStatusTopic },
    icons: { id: "iconsTopic", component: IconsTopic, hook: useIconsTopic },
    overlays: { id: "overlaysTopic", component: OverlaysTopic, hook: useOverlaysTopic },
    data: { id: "dataTopic", component: DataTopic, hook: useDataTopic },
    lists: { id: "listsTopic", component: ListsTopic, hook: useListsTopic },
    dynamic: { id: "dynamicContentTopic", component: DynamicContentTopic, hook: useDynamicContentTopic }
};

async function mountScreen(topic: ShowcaseTopicKey) {
    const bus = await stubMessages({
        "App.BrowsingHistory.SetPageTitle": vi.fn(async () => { }),
        "App.Router.GoToRoute": vi.fn(async () => true)
    });
    const result = await mount(ShowcaseScreen, { id: `showcase-${topic}`, topic });
    return { ...result, bus };
}

function topicRoots(): HTMLElement[] {
    return [...document.querySelectorAll<HTMLElement>(".showcase-topic")];
}

function pager() {
    return screen.getByRole("navigation", { name: "Showcase pages" });
}

// The lead is JSX, so its expected text is read from rendering it on its own, off the document.
function textOf(node: React.ReactNode): string {
    return render(<>{node}</>, { container: document.createElement("div") }).container.textContent;
}

describe("ShowcaseScreen", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it.each(SHOWCASE_TOPICS.map((t) => [t.key, t] as const))("renders the %s topic under its own heading and lead", async (key, topic) => {
        await mountScreen(key);

        const header = screen.getByRole("banner");
        expect(within(header).getByRole("heading", { level: 1 })).toHaveTextContent(topic.title);
        expect(within(header).getByText("Showcase")).toBeInTheDocument();
        expect(header.querySelector(".screen-page-lead").textContent).toBe(textOf(topic.lead));

        expect(topicRoots()).toHaveLength(1);
        expect(topicRoots()[0].id).toMatch(new RegExp(`\\.${TOPICS[key].id}$`));
    });

    // Children are built with their owner, so declaring all ten topics would construct every one
    // on every visit — tables and virtual lists thousands of rows long among them.
    it.each(SHOWCASE_TOPICS.map((t) => [t.key] as const))("builds only the %s topic, never the other nine", async (key) => {
        await mountScreen(key);

        for (const [other, spies] of Object.entries(TOPICS)) {
            expect(vi.isMockFunction(spies.component) && vi.isMockFunction(spies.hook)).toBe(true);
            expect(spies.hook, `use${other} hook`).not.toHaveBeenCalled();
            if (other === key) {
                expect(spies.component).toHaveBeenCalled();
            } else {
                expect(spies.component, `${other} component`).not.toHaveBeenCalled();
            }
        }
    });

    it("sends the page title with the most specific part first", async () => {
        const { bus } = await mountScreen("controls");

        expect(bus["App.BrowsingHistory.SetPageTitle"]).toHaveBeenLastCalledWith("Controls · Showcase");
    });

    it("leads the breadcrumbs from Home to the topic", async () => {
        const { model } = await mountScreen("data");

        expect(model.crudScreen.breadcrumbs).toEqual([
            { route: { path: "/" }, label: "Home" },
            { route: { path: "/showcase/data" }, label: "Showcase · Data" }
        ]);
        expect(screen.getByText("Home")).toBeInTheDocument();
        expect(screen.getByText("Showcase · Data")).toBeInTheDocument();
    });

    describe("previous and next links", () => {
        it("offers only the next page on the first topic", async () => {
            await mountScreen("overview");

            const links = within(pager()).getAllByRole("button");
            expect(links).toHaveLength(1);
            expect(links[0]).toHaveTextContent("Next");
            expect(links[0]).toHaveTextContent("Design tokens");
        });

        it("offers only the previous page on the last topic", async () => {
            await mountScreen("dynamic");

            const links = within(pager()).getAllByRole("button");
            expect(links).toHaveLength(1);
            expect(links[0]).toHaveTextContent("Previous");
            expect(links[0]).toHaveTextContent("Lists");
        });

        it("routes to the neighbouring topics", async () => {
            const { bus } = await mountScreen("status");

            await userEvent.click(within(pager()).getByRole("button", { name: /Next/ }));
            expect(bus["App.Router.GoToRoute"]).toHaveBeenLastCalledWith({ path: "/showcase/icons" });

            await userEvent.click(within(pager()).getByRole("button", { name: /Previous/ }));
            expect(bus["App.Router.GoToRoute"]).toHaveBeenLastCalledWith({ path: "/showcase/controls" });
        });
    });

    it("swaps the page, the topic and the title when its topic changes", async () => {
        const { model, bus } = await mountScreen("overview");

        model.topic = "icons";
        await settle();

        expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Icons");
        expect(topicRoots()).toHaveLength(1);
        expect(topicRoots()[0].id).toMatch(/\.iconsTopic$/);
        expect(within(pager()).getByRole("button", { name: /Next/ })).toHaveTextContent("Overlays");
        expect(bus["App.BrowsingHistory.SetPageTitle"]).toHaveBeenLastCalledWith("Icons · Showcase");
    });

    it("names the page after the overview for a topic key it does not know", async () => {
        const { model, bus } = await mountScreen("retired" as ShowcaseTopicKey);

        expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Overview");
        expect(model.crudScreen.breadcrumbs[1]).toEqual({ route: { path: "/showcase/overview" }, label: "Showcase · Overview" });
        expect(bus["App.BrowsingHistory.SetPageTitle"]).toHaveBeenLastCalledWith("Overview · Showcase");
    });
});
