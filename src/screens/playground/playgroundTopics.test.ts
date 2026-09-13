import { describe, expect, it } from "vitest";
import { iconNames, screenRoutes } from "@core";
import {
    ButtonPlayground, PLAYGROUND_TOPICS, PlaygroundTopicKey, playgroundNeighbours, playgroundTopic, TablePlayground,
    TextFieldPlayground
} from "@screens";

type RouteElement = React.ReactElement<{ id: string }>;

const routes = screenRoutes as unknown as Record<string, () => RouteElement>;
const playgroundPaths = Object.keys(routes).filter((path) => path.startsWith("/playground/"));

const SCREENS: Record<PlaygroundTopicKey, unknown> = {
    button: ButtonPlayground,
    textField: TextFieldPlayground,
    table: TablePlayground
};

describe("PLAYGROUND_TOPICS", () => {
    it("lists every key, path and title once", () => {
        const unique = (values: string[]) => new Set(values).size;

        expect(unique(PLAYGROUND_TOPICS.map((t) => t.key))).toBe(PLAYGROUND_TOPICS.length);
        expect(unique(PLAYGROUND_TOPICS.map((t) => t.path))).toBe(PLAYGROUND_TOPICS.length);
        expect(unique(PLAYGROUND_TOPICS.map((t) => t.title))).toBe(PLAYGROUND_TOPICS.length);
    });

    it.each(PLAYGROUND_TOPICS.map((t) => [t.path, t] as const))("routes %s to its own editor screen", (path, topic) => {
        expect(routes[path]?.().type).toBe(SCREENS[topic.key]);
    });

    it("gives every playground route its own screen id", () => {
        const ids = playgroundPaths.map((path) => routes[path]().props.id);

        expect(ids.every(Boolean)).toBe(true);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it("describes every /playground/ route in the route table", () => {
        expect(playgroundPaths.sort()).toEqual(PLAYGROUND_TOPICS.map((t) => t.path).sort());
    });

    it.each(PLAYGROUND_TOPICS.map((t) => [t.key, t] as const))("%s names a registered icon and carries a summary and a lead", (_, topic) => {
        expect(iconNames()).toContain(topic.icon);
        expect(topic.summary.trim()).not.toBe("");
        expect(topic.lead).toBeTruthy();
    });
});

describe("playgroundTopic", () => {
    it("finds a topic by key", () => {
        expect(playgroundTopic("textField")).toBe(PLAYGROUND_TOPICS.find((t) => t.key === "textField"));
    });

    it("returns undefined for an unknown key", () => {
        expect(playgroundTopic("nope" as PlaygroundTopicKey)).toBeUndefined();
    });
});

describe("playgroundNeighbours", () => {
    it.each(PLAYGROUND_TOPICS.map((t, i) => [t.key, i] as const))("links %s to the pages either side of it in list order", (key, i) => {
        expect(playgroundNeighbours(key)).toEqual({
            prev: PLAYGROUND_TOPICS[i - 1],
            next: PLAYGROUND_TOPICS[i + 1]
        });
    });

    it("has no neighbours for an unknown key", () => {
        expect(playgroundNeighbours("nope" as PlaygroundTopicKey)).toEqual({ prev: undefined, next: undefined });
    });
});
