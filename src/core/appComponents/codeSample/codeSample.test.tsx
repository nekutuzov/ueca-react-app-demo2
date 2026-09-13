import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { CodeSample } from "@core";
import { mount, settle, stubMessages } from "@test";

function codeBlocks(): HTMLElement[] {
    return Array.from(document.querySelectorAll(".code-sample-body pre code"));
}

// The listing is one code block holding exactly `code`. The markdown renderer ends a code block with
// a newline of its own, so that one is expected too.
function expectListing(code: string) {
    const blocks = codeBlocks();
    expect(blocks).toHaveLength(1);
    expect(blocks[0].textContent).toBe(`${code}\n`);
}

describe("CodeSample", () => {
    it("shows its title over a syntax-highlighted listing of the code", async () => {
        const { model } = await mount(CodeSample, { id: "sample", title: "JSX", code: "<Button contentView=\"Save\" />", language: "tsx" });

        expect(document.getElementById("sample")).toHaveClass("code-sample");
        expect(document.querySelector(".code-sample-title")).toHaveTextContent("JSX");
        expect(model.listing.source).toBe("```tsx\n<Button contentView=\"Save\" />\n```");
        expectListing("<Button contentView=\"Save\" />");
        expect(codeBlocks()[0]).toHaveClass("language-tsx");
    });

    it("defaults to a \"Code\" title and the tsx language", async () => {
        const { model } = await mount(CodeSample, { id: "sample", code: "const x = 1;" });

        expect(document.querySelector(".code-sample-title")).toHaveTextContent(/^Code$/);
        expect(model.listing.source).toBe("```tsx\nconst x = 1;\n```");
    });

    // A fence one backtick longer than the longest run inside the code, so a snippet that itself
    // contains a fence cannot close the block early.
    it.each([
        ["no backticks", "let a = 1;", "```"],
        ["an inline code span", "const s = `x`;", "```"],
        ["a double backtick", "``pair``", "```"],
        ["a markdown fence", "```ts\nlet a = 1;\n```", "````"],
        ["a longer run beside a fence", "`````\n```", "``````"]
    ])("fences code with %s so it renders intact", async (_case, code, fence) => {
        const { model } = await mount(CodeSample, { id: "sample", code, language: "md" });

        expect(model.listing.source).toBe(`${fence}md\n${code}\n${fence}`);
        expectListing(code);
    });

    it("follows changes to the code and the language", async () => {
        const { model } = await mount(CodeSample, { id: "sample", code: "a {}", language: "tsx" });

        model.code = ".button { color: red; }";
        model.language = "css";
        await settle();

        expectListing(".button { color: red; }");
        expect(codeBlocks()[0]).toHaveClass("language-css");
    });

    it("copies the exact code to the clipboard, then confirms with a success alert", async () => {
        const code = "  indented\n\t```fence``` and trailing space ";
        const calls: string[] = [];
        const writeText = vi.spyOn(navigator.clipboard, "writeText").mockImplementation(async () => { calls.push("copy"); });
        const bus = await stubMessages({ "Alert.Success": vi.fn(async () => { calls.push("alert"); }) });
        await mount(CodeSample, { id: "sample", code });

        fireEvent.click(screen.getByRole("button", { name: "Copy code" }));
        await settle();

        expect(writeText).toHaveBeenCalledOnce();
        expect(writeText).toHaveBeenCalledWith(code);
        expect(bus["Alert.Success"]).toHaveBeenCalledWith({ message: "Code copied to the clipboard" });
        expect(calls).toEqual(["copy", "alert"]);
    });

    it("copies the code as it is when the button is pressed, not as it was at start", async () => {
        const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
        await stubMessages({ "Alert.Success": vi.fn(async () => { }) });
        const { model } = await mount(CodeSample, { id: "sample", code: "old" });

        model.code = "new";
        await settle();
        fireEvent.click(screen.getByRole("button", { name: "Copy code" }));
        await settle();

        expect(writeText).toHaveBeenCalledWith("new");
    });
});
