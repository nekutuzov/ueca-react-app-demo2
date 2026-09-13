import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TextFieldPlayground } from "@screens";
import { mount, settle, stubMessages } from "@test";

const SCREEN = "playground-text-field";

const INITIAL_LISTING = [
    "<TextField",
    `    labelView="Email address"`,
    `    placeholder="you@example.com"`,
    `    helperTextView="We only use it to send the receipt."`,
    `    type="email"`,
    `    startView={<Icon name="email" />}`,
    "    required",
    `    value={UECA.bind(() => model, "email")}`,
    "/>"
].join("\n");

async function mountPlayground() {
    const bus = await stubMessages({
        "App.BrowsingHistory.SetPageTitle": vi.fn(async () => { }),
        "App.Router.GoToRoute": vi.fn(async () => true)
    });
    const result = await mount(TextFieldPlayground, { id: SCREEN });
    return { ...result, bus };
}

// Editors are children on the screen's model, so each has a DOM id under the screen's own.
function part(child: string): HTMLElement {
    const el = document.getElementById(`${SCREEN}.${child}`);
    expect(el, `#${SCREEN}.${child}`).not.toBeNull();
    return el;
}

// The live field's own input (or textarea, once multiline).
function previewInput(): HTMLInputElement | HTMLTextAreaElement {
    return part("preview").querySelector("input, textarea");
}

function listing(): string {
    return part("code").querySelector(".code-sample-body").textContent.trimEnd();
}

function listingLines(): string[] {
    return listing().split("\n").map((line) => line.trim());
}

function status(): string {
    return document.querySelector(".playground-stage-status")?.textContent;
}

async function typeInto(child: string, text: string) {
    const input = part(child).querySelector("input");
    await userEvent.clear(input);
    if (text) {
        await userEvent.type(input, text);
    }
}

async function choose(child: string, option: string) {
    await userEvent.click(part(`${child}-trigger`));
    await userEvent.click(within(part(`${child}-listbox`)).getByRole("option", { name: option }));
}

async function toggle(child: string) {
    await userEvent.click(within(part(child)).getByRole("switch"));
}

async function validate() {
    await userEvent.click(part("validateButton"));
    await settle();
}

describe("TextFieldPlayground", () => {
    it("starts from a required email field with an icon, a placeholder and a helper", async () => {
        await mountPlayground();

        const field = part("preview");
        expect(field).toHaveClass("ueca-textfield-outlined");
        expect(field.querySelector(".textfield-label")).toHaveTextContent("*Email address");
        expect(previewInput()).toHaveAttribute("type", "email");
        expect(previewInput()).toHaveAttribute("placeholder", "you@example.com");
        expect(previewInput()).toHaveValue("");
        expect(field.querySelector(".textfield-adornment-start .ueca-icon")).not.toBeNull();
        expect(field.querySelector(".textfield-helper-text")).toHaveTextContent("We only use it to send the receipt.");
        expect(status()).toBe("empty · press Validate to check");
    });

    it("lists the starting field with every prop at its default left out", async () => {
        const { model } = await mountPlayground();

        expect(model.code.code).toBe(INITIAL_LISTING);
        expect(listing()).toBe(INITIAL_LISTING);
    });

    it("titles the page from the Playground topic", async () => {
        const { bus } = await mountPlayground();

        expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Text field");
        expect(bus["App.BrowsingHistory.SetPageTitle"]).toHaveBeenLastCalledWith("Text field · Playground");
    });

    describe("an edit reaches the preview and the listing", () => {
        it("label", async () => {
            await mountPlayground();

            await typeInto("labelInput", "Work email");

            expect(part("preview").querySelector(".textfield-label")).toHaveTextContent("Work email");
            expect(listingLines()).toContain(`labelView="Work email"`);
        });

        it("placeholder, left out of the listing once empty", async () => {
            await mountPlayground();

            await typeInto("placeholderInput", "");

            expect(previewInput()).toHaveAttribute("placeholder", "");
            expect(listing()).not.toContain("placeholder=");
        });

        it("helper text, which disappears from both once empty", async () => {
            await mountPlayground();

            await typeInto("helperInput", "");

            expect(part("preview").querySelector(".textfield-helper-text")).toBeNull();
            expect(listing()).not.toContain("helperTextView");
        });

        it("start icon, gone from both when set to None", async () => {
            await mountPlayground();

            await choose("startIconInput", "Lock");
            expect(listingLines()).toContain(`startView={<Icon name="lock" />}`);

            await choose("startIconInput", "None");
            expect(part("preview").querySelector(".textfield-adornment-start")).toBeNull();
            expect(listing()).not.toContain("startView");
        });

        it("variant", async () => {
            await mountPlayground();

            await userEvent.click(within(part("variantInput")).getByRole("radio", { name: "Filled" }));

            expect(part("preview")).toHaveClass("ueca-textfield-filled");
            expect(listingLines()).toContain(`variant="filled"`);
        });

        it("required, left out of the listing once off", async () => {
            await mountPlayground();

            await toggle("requiredInput");

            expect(part("preview").querySelector(".textfield-required")).toBeNull();
            expect(listingLines()).not.toContain("required");
        });

        it.each([
            ["readOnlyInput", "readOnly", "readonly"],
            ["disabledInput", "disabled", "disabled"]
        ])("%s, written as the bare %s attribute", async (child, attribute, domAttribute) => {
            await mountPlayground();

            await toggle(child);

            expect(previewInput()).toHaveAttribute(domAttribute);
            expect(listingLines()).toContain(attribute);
        });
    });

    describe("type", () => {
        it.each([
            ["Text", "name"],
            ["Email", "email"],
            ["Password", "password"],
            ["Number", "quantity"],
            ["Telephone", "phone"],
            ["URL", "website"],
            ["Search", "query"]
        ])("%s binds the listing to a plausible %s prop", async (label, field) => {
            await mountPlayground();

            await choose("typeInput", label);

            expect(listingLines()).toContain(`value={UECA.bind(() => model, "${field}")}`);
        });

        it("drives the live input's type, and is left out of the listing as text", async () => {
            await mountPlayground();

            await choose("typeInput", "URL");
            expect(previewInput()).toHaveAttribute("type", "url");
            expect(listingLines()).toContain(`type="url"`);

            await choose("typeInput", "Text");
            expect(previewInput()).toHaveAttribute("type", "text");
            expect(listing()).not.toContain("type=");
        });

        it("offers the show-password toggle only for a password", async () => {
            await mountPlayground();
            const revealSwitch = () => within(part("revealableInput")).getByRole("switch");
            expect(revealSwitch()).toBeDisabled();

            await choose("typeInput", "Password");
            expect(revealSwitch()).toBeEnabled();
            expect(listing()).not.toContain("revealable");

            await toggle("revealableInput");
            expect(within(part("preview")).getByRole("button", { name: "Show password" })).toBeInTheDocument();
            expect(listingLines()).toContain("revealable");

            await choose("typeInput", "Email");
            expect(revealSwitch()).toBeDisabled();
            expect(within(part("preview")).queryByRole("button", { name: "Show password" })).toBeNull();
            expect(listing()).not.toContain("revealable");
        });
    });

    describe("multiline", () => {
        it("swaps the input for a textarea of the chosen rows, without an adornment", async () => {
            await mountPlayground();
            expect(within(part("startIconInput")).getByRole("combobox")).toBeEnabled();
            expect(part("rowsInput").querySelector("input")).toBeDisabled();

            await toggle("multilineInput");

            expect(previewInput().tagName).toBe("TEXTAREA");
            expect(previewInput()).toHaveAttribute("rows", "3");
            expect(part("preview").querySelector(".textfield-adornment-start")).toBeNull();
            // Adornments belong to single-line fields only.
            expect(within(part("startIconInput")).getByRole("combobox")).toBeDisabled();
            expect(part("rowsInput").querySelector("input")).toBeEnabled();

            const lines = listingLines();
            expect(lines).toContain("multiline");
            expect(lines).toContain("rows={3}");
            expect(listing()).not.toContain("startView");
        });

        it("follows the rows editor, clamped to 2–12", async () => {
            await mountPlayground();
            await toggle("multilineInput");
            const rows = part("rowsInput").querySelector("input");

            await userEvent.clear(rows);
            await userEvent.type(rows, "5");
            await userEvent.tab();
            expect(previewInput()).toHaveAttribute("rows", "5");
            expect(listingLines()).toContain("rows={5}");

            await userEvent.clear(rows);
            await userEvent.type(rows, "40");
            await userEvent.tab();
            expect(previewInput()).toHaveAttribute("rows", "12");
            expect(listingLines()).toContain("rows={12}");
        });

        it("binds a multiline text field to notes rather than name", async () => {
            await mountPlayground();
            await choose("typeInput", "Text");

            await toggle("multilineInput");

            expect(listingLines()).toContain(`value={UECA.bind(() => model, "notes")}`);
        });

        it("keeps a single-line field at one row whatever the rows editor holds", async () => {
            const { model } = await mountPlayground();

            model.rows = 7;
            await settle();

            expect(model.preview.rows).toBe(1);
            expect(listing()).not.toContain("rows=");
        });
    });

    describe("Validate", () => {
        it("reports the field's own verdict in the status line", async () => {
            await mountPlayground();

            await validate();
            expect(status()).toBe("empty · invalid — Email address cannot be empty");
            expect(part("preview")).toHaveClass("ueca-textfield-error");

            await userEvent.type(previewInput(), "bob");
            await validate();
            expect(status()).toBe(`"bob" · invalid — Email address must be a valid email address`);

            await userEvent.type(previewInput(), "@example.com");
            await validate();
            expect(status()).toBe(`"bob@example.com" · valid`);
            expect(part("preview")).not.toHaveClass("ueca-textfield-error");
        });

        // The verdict is on the value as it stood when Validate was pressed.
        it("keeps the last verdict while the value is edited", async () => {
            await mountPlayground();
            await validate();

            await userEvent.type(previewInput(), "bob");

            expect(status()).toBe(`"bob" · invalid — Email address cannot be empty`);
        });

        // A verdict was about the old type's rules.
        it("clears the verdict when the type is changed", async () => {
            await mountPlayground();
            await userEvent.type(previewInput(), "not a url");
            await validate();

            await choose("typeInput", "URL");

            expect(status()).toBe(`"not a url" · press Validate to check`);
        });
    });

    it("Reset restores the starting field and clears its value, verdict and error", async () => {
        const { model } = await mountPlayground();
        await typeInto("labelInput", "Notes");
        await userEvent.click(within(part("variantInput")).getByRole("radio", { name: "Standard" }));
        await toggle("multilineInput");
        await userEvent.type(previewInput(), "not an email");
        await validate();
        expect(part("preview")).toHaveClass("ueca-textfield-error");

        await userEvent.click(part("resetButton"));

        expect(listing()).toBe(INITIAL_LISTING);
        expect(model.value).toBe("");
        expect(previewInput().tagName).toBe("INPUT");
        expect(previewInput()).toHaveValue("");
        expect(status()).toBe("empty · press Validate to check");
        expect(model.preview.isValid()).toBe(true);
        expect(part("preview")).not.toHaveClass("ueca-textfield-error");
    });

    it("links back to Button and on to Table", async () => {
        const { bus } = await mountPlayground();
        const pager = screen.getByRole("navigation", { name: "Playground pages" });

        await userEvent.click(within(pager).getByRole("button", { name: /Previous/ }));
        expect(bus["App.Router.GoToRoute"]).toHaveBeenLastCalledWith({ path: "/playground/button" });

        await userEvent.click(within(pager).getByRole("button", { name: /Next/ }));
        expect(bus["App.Router.GoToRoute"]).toHaveBeenLastCalledWith({ path: "/playground/table" });
    });
});
