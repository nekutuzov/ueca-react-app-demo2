import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ButtonPlayground } from "@screens";
import { mount, settle, stubMessages } from "@test";

const SCREEN = "playground-button";

const INITIAL_LISTING = [
    "<Button",
    `    contentView="Save changes"`,
    `    variant="contained"`,
    `    startIconView={<Icon name="save" size="sm" />}`,
    "    onClick={async () => await model.save()}",
    "/>"
].join("\n");

async function mountPlayground() {
    const bus = await stubMessages({
        "App.BrowsingHistory.SetPageTitle": vi.fn(async () => { }),
        "App.Router.GoToRoute": vi.fn(async () => true)
    });
    const result = await mount(ButtonPlayground, { id: SCREEN });
    return { ...result, bus };
}

// Editors are children on the screen's model, so each has a DOM id under the screen's own.
function part(child: string): HTMLElement {
    const el = document.getElementById(`${SCREEN}.${child}`);
    expect(el, `#${SCREEN}.${child}`).not.toBeNull();
    return el;
}

function preview(): HTMLElement {
    return part("preview");
}

// What the Code panel shows, read from the rendered listing rather than the model.
function listing(): string {
    return part("code").querySelector(".code-sample-body").textContent.trimEnd();
}

function status(): string {
    return document.querySelector(".playground-stage-status")?.textContent;
}

async function typeInto(child: string, text: string) {
    const input = part(child).querySelector("input");
    await userEvent.clear(input);
    await userEvent.type(input, text);
}

async function choose(child: string, option: string) {
    await userEvent.click(part(`${child}-trigger`));
    await userEvent.click(within(part(`${child}-listbox`)).getByRole("option", { name: option }));
}

async function pick(child: string, option: string) {
    await userEvent.click(within(part(child)).getByRole("radio", { name: option }));
}

async function toggle(child: string) {
    await userEvent.click(within(part(child)).getByRole("switch"));
}

describe("ButtonPlayground", () => {
    it("starts from a contained Save changes button with a save icon", async () => {
        await mountPlayground();

        expect(preview()).toHaveTextContent("Save changes");
        expect(preview()).toHaveClass("ueca-button-contained", "ueca-button-medium");
        expect(preview()).not.toHaveClass("ueca-button-fullwidth", "ueca-button-selected");
        expect(preview()).toBeEnabled();
        expect(preview().querySelector(".button-start-icon")).not.toBeNull();
        expect(preview().querySelector(".button-end-icon")).toBeNull();
    });

    it("shows the starting state in every editor", async () => {
        await mountPlayground();

        expect(part("labelInput").querySelector("input")).toHaveValue("Save changes");
        expect(within(part("variantInput")).getByRole("radio", { name: "Contained" })).toBeChecked();
        expect(part("sizeInput-trigger")).toHaveTextContent("Medium");
        expect(part("colorInput-trigger")).toHaveTextContent("Theme accent");
        expect(part("startIconInput-trigger")).toHaveTextContent("Save");
        expect(part("endIconInput-trigger")).toHaveTextContent("None");
        for (const child of ["fullWidthInput", "selectedInput", "disabledInput"]) {
            expect(within(part(child)).getByRole("switch")).not.toBeChecked();
        }
        expect(within(part("alignInput")).getByRole("radio", { name: "Center" })).toBeChecked();
    });

    it("lists the starting button with every prop at its default left out", async () => {
        const { model } = await mountPlayground();

        expect(model.code.code).toBe(INITIAL_LISTING);
        expect(listing()).toBe(INITIAL_LISTING);
    });

    it("titles the page from the Playground topic", async () => {
        const { bus } = await mountPlayground();

        expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Button");
        expect(within(screen.getByRole("banner")).getByText("Playground")).toBeInTheDocument();
        expect(bus["App.BrowsingHistory.SetPageTitle"]).toHaveBeenLastCalledWith("Button · Playground");
    });

    describe("an edit reaches the preview and the listing", () => {
        it("label", async () => {
            await mountPlayground();

            await typeInto("labelInput", `Book "now"`);

            expect(preview()).toHaveTextContent(`Book "now"`);
            expect(listing()).toContain(`contentView="Book &quot;now&quot;"`);
        });

        it("variant, dropping it from the listing at the default", async () => {
            await mountPlayground();

            await pick("variantInput", "Outlined");
            expect(preview()).toHaveClass("ueca-button-outlined");
            expect(listing()).toContain(`variant="outlined"`);

            await pick("variantInput", "Text");
            expect(preview()).toHaveClass("ueca-button-text");
            expect(listing()).not.toContain("variant=");
        });

        it("size, dropping it from the listing at the default", async () => {
            await mountPlayground();

            await choose("sizeInput", "Large");
            expect(preview()).toHaveClass("ueca-button-large");
            expect(listing()).toContain(`size="large"`);

            await choose("sizeInput", "Medium");
            expect(preview()).toHaveClass("ueca-button-medium");
            // An attribute line, not the icon expression's own size="sm".
            expect(listing()).not.toMatch(/^\s+size=/m);
        });

        it("colour, which sets the button's colour variable", async () => {
            await mountPlayground();

            await choose("colorInput", "Error");

            expect(preview().style.getPropertyValue("--button-color")).toBe("var(--error)");
            expect(listing()).toContain(`color="error.main"`);
        });

        it("start icon, removed entirely when set to None", async () => {
            await mountPlayground();

            await choose("startIconInput", "None");

            expect(preview().querySelector(".button-start-icon")).toBeNull();
            expect(listing()).not.toContain("startIconView");
        });

        it("end icon", async () => {
            await mountPlayground();

            await choose("endIconInput", "Arrow right");

            expect(preview().querySelector(".button-end-icon .ueca-icon")).not.toBeNull();
            expect(listing()).toContain(`endIconView={<Icon name="arrowRight" size="sm" />}`);
        });

        it.each([
            ["fullWidthInput", "fullWidth", "ueca-button-fullwidth"],
            ["selectedInput", "selected", "ueca-button-selected"]
        ])("%s, written as the bare %s attribute", async (child, attribute, className) => {
            await mountPlayground();

            await toggle(child);

            expect(preview()).toHaveClass(className);
            expect(listing().split("\n")).toContain(`    ${attribute}`);
        });

        it("disabled, written as the bare attribute", async () => {
            await mountPlayground();

            await toggle("disabledInput");

            expect(preview()).toBeDisabled();
            expect(listing().split("\n")).toContain("    disabled");
        });

        // Alignment only has room to show inside a full-width button.
        it("alignment, which is editable and listed only for a full-width button", async () => {
            await mountPlayground();
            const right = () => within(part("alignInput")).getByRole("radio", { name: "Right" });
            expect(right()).toBeDisabled();

            await toggle("fullWidthInput");
            expect(right()).toBeEnabled();
            await pick("alignInput", "Right");

            expect(preview()).toHaveStyle({ justifyContent: "flex-end" });
            expect(listing()).toContain(`align="right"`);

            await toggle("fullWidthInput");
            expect(right()).toBeDisabled();
            expect(listing()).not.toContain("align=");
        });
    });

    it("moves an editor when its property is set from code", async () => {
        const { model } = await mountPlayground();

        model.label = "Send";
        model.size = "small";
        model.disabled = true;
        await settle();

        expect(part("labelInput").querySelector("input")).toHaveValue("Send");
        expect(part("sizeInput-trigger")).toHaveTextContent("Small");
        expect(within(part("disabledInput")).getByRole("switch")).toBeChecked();
    });

    describe("status line", () => {
        it("counts clicks on the live button", async () => {
            await mountPlayground();
            expect(status()).toBe("clicked 0 times");

            await userEvent.click(preview());
            expect(status()).toBe("clicked once");

            await userEvent.click(preview());
            expect(status()).toBe("clicked 2 times");
        });

        it("says a disabled button ignores clicks, and does not count them", async () => {
            const { model } = await mountPlayground();

            await toggle("disabledInput");
            await userEvent.click(preview());
            expect(status()).toBe("disabled — clicks are ignored");

            await toggle("disabledInput");
            expect(model._clicks).toBe(0);
            expect(status()).toBe("clicked 0 times");
        });
    });

    it("Reset restores the starting button, its editors, its listing and the click count", async () => {
        const { model } = await mountPlayground();
        await typeInto("labelInput", "Book now");
        await pick("variantInput", "Text");
        await choose("sizeInput", "Large");
        await choose("colorInput", "Success");
        await choose("endIconInput", "Download");
        await toggle("fullWidthInput");
        await pick("alignInput", "Left");
        await toggle("selectedInput");
        await userEvent.click(preview());
        await toggle("disabledInput");

        await userEvent.click(part("resetButton"));

        expect(model.code.code).toBe(INITIAL_LISTING);
        expect(listing()).toBe(INITIAL_LISTING);
        expect(preview()).toHaveTextContent("Save changes");
        expect(preview()).toHaveClass("ueca-button-contained", "ueca-button-medium");
        expect(preview()).toBeEnabled();
        expect(preview().style.getPropertyValue("--button-color")).toBe("");
        expect(part("labelInput").querySelector("input")).toHaveValue("Save changes");
        expect(within(part("alignInput")).getByRole("radio", { name: "Center" })).toBeChecked();
        expect(within(part("fullWidthInput")).getByRole("switch")).not.toBeChecked();
        expect(status()).toBe("clicked 0 times");
    });

    it("links on to the Text field page, with no page before it", async () => {
        const { bus } = await mountPlayground();
        const pager = screen.getByRole("navigation", { name: "Playground pages" });

        const links = within(pager).getAllByRole("button");
        expect(links).toHaveLength(1);
        expect(links[0]).toHaveTextContent("Next");
        expect(links[0]).toHaveTextContent("Text field");

        await userEvent.click(links[0]);

        expect(bus["App.Router.GoToRoute"]).toHaveBeenCalledWith({ path: "/playground/text-field" });
    });
});
