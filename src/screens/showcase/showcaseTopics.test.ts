import { describe, expect, it } from "vitest";
import { iconNames, screenRoutes } from "@core";
import { SHOWCASE_TOPICS, ShowcaseScreen, ShowcaseTopicKey, showcaseNeighbours, showcaseTopic } from "@screens";

type RouteElement = React.ReactElement<{ id: string; topic: ShowcaseTopicKey }>;

const routes = screenRoutes as unknown as Record<string, () => RouteElement>;
const showcasePaths = Object.keys(routes).filter((path) => path.startsWith("/showcase/"));

describe("SHOWCASE_TOPICS", () => {
    it("lists every key, path and title once", () => {
        const unique = (values: string[]) => new Set(values).size;

        expect(unique(SHOWCASE_TOPICS.map((t) => t.key))).toBe(SHOWCASE_TOPICS.length);
        expect(unique(SHOWCASE_TOPICS.map((t) => t.path))).toBe(SHOWCASE_TOPICS.length);
        expect(unique(SHOWCASE_TOPICS.map((t) => t.title))).toBe(SHOWCASE_TOPICS.length);
    });

    // Order is the menu order and the previous/next chain: the foundation first, controls after it.
    it("opens with the overview and puts the foundation before the controls built on it", () => {
        const keys = SHOWCASE_TOPICS.map((t) => t.key);

        expect(keys[0]).toBe("overview");
        expect(keys.indexOf("tokens")).toBeLessThan(keys.indexOf("controls"));
        expect(keys.indexOf("layout")).toBeLessThan(keys.indexOf("controls"));
    });

    it.each(SHOWCASE_TOPICS.map((t) => [t.path, t] as const))("routes %s to a ShowcaseScreen showing that topic", (path, topic) => {
        const element = routes[path]?.();

        expect(element?.type).toBe(ShowcaseScreen);
        expect(element.props.topic).toBe(topic.key);
    });

    // Each topic's page state is its own, so no two topic routes may share a screen id.
    it("gives every showcase route its own screen id", () => {
        const ids = showcasePaths.map((path) => routes[path]().props.id);

        expect(ids.every(Boolean)).toBe(true);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it("describes every /showcase/ route in the route table", () => {
        expect(showcasePaths.sort()).toEqual(SHOWCASE_TOPICS.map((t) => t.path).sort());
    });

    it.each(SHOWCASE_TOPICS.map((t) => [t.key, t] as const))("%s names a registered icon and carries a summary and a lead", (_, topic) => {
        expect(iconNames()).toContain(topic.icon);
        expect(topic.summary.trim()).not.toBe("");
        expect(topic.lead).toBeTruthy();
    });
});

describe("showcaseTopic", () => {
    it("finds a topic by key", () => {
        expect(showcaseTopic("lists")).toBe(SHOWCASE_TOPICS.find((t) => t.key === "lists"));
    });

    it("returns undefined for an unknown key", () => {
        expect(showcaseTopic("nope" as ShowcaseTopicKey)).toBeUndefined();
    });
});

describe("showcaseNeighbours", () => {
    const first = SHOWCASE_TOPICS[0];
    const last = SHOWCASE_TOPICS[SHOWCASE_TOPICS.length - 1];

    it("has no previous page for the first topic", () => {
        expect(showcaseNeighbours(first.key)).toEqual({ prev: undefined, next: SHOWCASE_TOPICS[1] });
    });

    it("has no next page for the last topic", () => {
        expect(showcaseNeighbours(last.key)).toEqual({ prev: SHOWCASE_TOPICS[SHOWCASE_TOPICS.length - 2], next: undefined });
    });

    it("links a middle topic both ways", () => {
        expect(showcaseNeighbours(SHOWCASE_TOPICS[4].key)).toEqual({ prev: SHOWCASE_TOPICS[3], next: SHOWCASE_TOPICS[5] });
    });

    it("chains every topic, in list order, from the first to the last", () => {
        const visited: string[] = [];
        for (let topic = first; topic; topic = showcaseNeighbours(topic.key).next) {
            visited.push(topic.key);
        }

        expect(visited).toEqual(SHOWCASE_TOPICS.map((t) => t.key));
    });

    // An index of -1 must not read as "before the first topic" and offer the first one as next.
    it("has no neighbours for an unknown key", () => {
        expect(showcaseNeighbours("nope" as ShowcaseTopicKey)).toEqual({ prev: undefined, next: undefined });
    });
});
