import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mount } from "@test";
import { DynamicContentTopic } from "./dynamicContentTopic";

const TOPIC = "dynamic";

function byId(id: string): HTMLElement {
    return document.getElementById(`${TOPIC}.${id}`);
}

function countOf(counterId: string): string {
    return byId(counterId).querySelector(".showcase-counter-value").textContent;
}

function noteOf(counterId: string): string {
    return byId(counterId).querySelector(".showcase-counter-note")?.textContent;
}

async function bump(counterId: string, times = 1) {
    for (let i = 0; i < times; i++) {
        await userEvent.click(byId(`${counterId}.bumpButton`));
    }
}

async function press(buttonId: string) {
    await userEvent.click(byId(buttonId));
}

async function toggleMounted() {
    await userEvent.click(within(byId("mountSwitch")).getByRole("switch"));
}

// Newest first, as [phase, source] pairs.
function log(): string[][] {
    return [...document.querySelectorAll(".showcase-log .showcase-log-line")]
        .map((line) => line.textContent.trim().split(/\s+/).slice(1));
}

function logLines(): string[] {
    return [...document.querySelectorAll(".showcase-log .showcase-log-line")].map((line) => line.textContent);
}

describe("DynamicContentTopic", () => {
    it("logs every specimen as created when the page comes up, newest first", async () => {
        await mount(DynamicContentTopic, { id: TOPIC });

        const lines = logLines();
        expect(lines).toHaveLength(9);
        lines.forEach((line, i) => expect(line).toMatch(new RegExp(`^${String(9 - i).padStart(3, "0")} {2}created {4} {2}\\S+$`)));
        expect(log().map(([, source]) => source).sort()).toEqual([
            "boundParamCounter", "cachedCounter", "constantParamCounter", "item-1", "item-2", "jsxCounter",
            "jsxParamCounter", "staticCounter", "uncachedCounter"
        ]);
        expect(lines).toContain("001  created      staticCounter");
    });

    it("places a declared child and a JSX child side by side, each a live model", async () => {
        await mount(DynamicContentTopic, { id: TOPIC });

        expect(noteOf("staticCounter")).toBe("declared in children:");
        expect(noteOf("jsxCounter")).toBe("<ShowcaseCounter id=… />");

        await bump("staticCounter");
        await bump("jsxCounter", 2);

        expect(countOf("staticCounter")).toBe("1");
        expect(countOf("jsxCounter")).toBe("2");
    });

    describe("caching across unmount", () => {
        it("deactivates both counters when Mounted is switched off, and says so", async () => {
            await mount(DynamicContentTopic, { id: TOPIC });

            await toggleMounted();

            expect(byId("cachedCounter")).toBeNull();
            expect(byId("uncachedCounter")).toBeNull();
            expect(screen.getByText(/^Unmounted\. The cached model is still alive/)).toBeInTheDocument();
            expect(log().slice(0, 2).sort()).toEqual([["deactivated", "cachedCounter"], ["deactivated", "uncachedCounter"]]);
        });

        it("restores the cached counter with its count and rebuilds the uncached one from zero", async () => {
            await mount(DynamicContentTopic, { id: TOPIC });
            await bump("cachedCounter", 2);
            await bump("uncachedCounter", 3);

            await toggleMounted();
            await toggleMounted();

            expect(countOf("cachedCounter")).toBe("2");
            expect(countOf("uncachedCounter")).toBe("0");
            expect(log().slice(0, 2).sort()).toEqual([["created", "uncachedCounter"], ["restored", "cachedCounter"]]);
            expect(screen.queryByText(/^Unmounted\./)).toBeNull();
        });
    });

    // The contract: a JSX child gets its params again on every render, a hook-declared child only
    // follows a function (or a binding) — a value param there is an initial value.
    it("bumping the revision reaches the JSX child and the function-param child, not the value-param one", async () => {
        await mount(DynamicContentTopic, { id: TOPIC });
        expect(screen.getByText("_revision = 0")).toBeInTheDocument();

        await press("bumpRevisionButton");
        await press("bumpRevisionButton");

        expect(screen.getByText("_revision = 2")).toBeInTheDocument();
        expect(noteOf("jsxParamCounter")).toBe("rev 2");
        expect(noteOf("boundParamCounter")).toBe("rev 2");
        expect(noteOf("constantParamCounter")).toBe("rev 0");
    });

    describe("a list that comes and goes", () => {
        it("adds a counter under the next id and removes the last one", async () => {
            await mount(DynamicContentTopic, { id: TOPIC });

            await press("addItemButton");
            expect(byId("item-3")).not.toBeNull();
            expect(byId("item-3").querySelector(".showcase-specimen-label")).toHaveTextContent("item-3");
            expect(log()[0]).toEqual(["created", "item-3"]);

            await press("removeItemButton");
            expect(byId("item-3")).toBeNull();
            expect(log()[0]).toEqual(["deactivated", "item-3"]);
        });

        // Ids are reused in order, so a removed item's model comes back from the cache.
        it("brings a removed item back with the count it had", async () => {
            await mount(DynamicContentTopic, { id: TOPIC });
            await bump("item-2", 3);

            await press("removeItemButton");
            await press("addItemButton");

            expect(countOf("item-2")).toBe("3");
            expect(log()[0]).toEqual(["restored", "item-2"]);
        });

        it("disables Remove last once the list is empty, and explains how to get items back", async () => {
            await mount(DynamicContentTopic, { id: TOPIC });
            expect(screen.queryByText(/^Empty\./)).toBeNull();

            await press("removeItemButton");
            await press("removeItemButton");

            expect(byId("removeItemButton")).toBeDisabled();
            expect(screen.getByText("Empty. Add one back and it returns with the count it had.")).toBeInTheDocument();

            await press("addItemButton");
            expect(byId("removeItemButton")).toBeEnabled();
            expect(byId("item-1")).not.toBeNull();
            expect(byId("item-2")).toBeNull();
        });
    });

    describe("activity log", () => {
        it("keeps only the newest 24 entries", async () => {
            await mount(DynamicContentTopic, { id: TOPIC });

            // Each switch flip adds two entries to the nine logged at start: 9 + 8 × 2 = 25.
            for (let i = 0; i < 8; i++) {
                await toggleMounted();
            }

            const lines = logLines();
            expect(lines).toHaveLength(24);
            expect(lines[0]).toMatch(/^025 /);
            expect(lines[23]).toMatch(/^002 /);
        });

        it("Clear log empties it and shows the placeholder until something happens", async () => {
            await mount(DynamicContentTopic, { id: TOPIC });

            await press("clearLogButton");
            expect(logLines()).toEqual(["nothing yet — operate the specimens"]);

            await press("addItemButton");
            expect(log()).toEqual([["created", "item-3"]]);
        });
    });
});
