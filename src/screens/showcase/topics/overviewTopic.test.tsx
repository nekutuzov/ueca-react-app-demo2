import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { SHOWCASE_TOPICS } from "@screens";
import { mount } from "@test";
import { OverviewTopic } from "./overviewTopic";

// Every topic module in this folder, loaded the way the "Adding a topic" note says to write one.
const TOPIC_MODULES = import.meta.glob<Record<string, unknown>>("./*Topic.tsx", { eager: true });

describe("OverviewTopic", () => {
    it("explains what the showcase is for and how a topic is added", async () => {
        await mount(OverviewTopic, { id: "overviewTopic" });

        const titles = [...document.querySelectorAll(".showcase-section-title")].map((el) => el.textContent);
        expect(titles).toEqual(["What this is for", "Adding a topic"]);
        expect(screen.getByText("Reference.")).toBeInTheDocument();
        expect(screen.getByText("Verification.")).toBeInTheDocument();
        expect(screen.getByText("Theme coverage.")).toBeInTheDocument();
    });

    // The note tells a contributor to add topics/<name>Topic.tsx exporting a <Name>Topic component
    // and to describe it in showcaseTopics.tsx; the existing topics must follow that recipe.
    it("describes a recipe every existing topic follows: one <name>Topic.tsx exporting <Name>Topic", () => {
        const files = Object.keys(TOPIC_MODULES);

        expect(files).toHaveLength(SHOWCASE_TOPICS.length);
        for (const file of files) {
            const name = file.match(/\.\/(\w+)\.tsx$/)[1];
            const component = name[0].toUpperCase() + name.slice(1);
            expect(typeof TOPIC_MODULES[file][component], `${file} exports ${component}`).toBe("function");
        }
    });
});
