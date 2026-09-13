import { describe, expect, it } from "vitest";
import { Notebook, NotebookPage } from "@components";
import { mount, ModelOf, settle } from "@test";

type NotebookModel = ModelOf<typeof Notebook>;

const PAGES: NotebookPage<string>[] = [
    { id: "list", view: <span>List page</span> },
    { id: "details", view: <span>Details page</span> },
    { id: "edit", view: <span>Edit page</span> },
    { id: "summary", view: <span>Summary page</span> }
];

function notebookText(): string {
    return document.getElementById("notebook").textContent;
}

// Walks closeLastPage() until no page is active, returning the pages it stepped back through.
function closeAll(notebook: NotebookModel): string[] {
    const visited: string[] = [];
    for (let i = 0; i < PAGES.length + 2 && notebook.activePage !== undefined; i++) {
        notebook.closeLastPage();
        visited.push(notebook.activePage);
    }
    return visited;
}

describe("Notebook", () => {
    it("renders only the active page", async () => {
        await mount(Notebook, { id: "notebook", pages: PAGES, activePage: "details" });

        expect(notebookText()).toBe("Details page");
    });

    it("renders an empty container when no page, or an unknown page, is active", async () => {
        const { model } = await mount(Notebook, { id: "notebook", pages: PAGES });
        expect(notebookText()).toBe("");

        model.activePage = "missing";
        await settle();

        expect(document.getElementById("notebook")).toBeEmptyDOMElement();
    });

    it("switches the view when activePage changes", async () => {
        const { model } = await mount(Notebook, { id: "notebook", pages: PAGES, activePage: "list" });

        model.activePage = "summary";
        await settle();
        expect(notebookText()).toBe("Summary page");

        model.activePage = "edit";
        await settle();
        expect(notebookText()).toBe("Edit page");
    });

    it("keeps no history until a page is opened", async () => {
        const { model } = await mount(Notebook, { id: "notebook", pages: PAGES, activePage: "list" });
        model.activePage = "details";

        model.closeLastPage();
        await settle();

        expect(model.activePage).toBeUndefined();
        expect(notebookText()).toBe("");
    });

    describe("open", () => {
        it("activates the last page and puts the others in the history, in order", async () => {
            const { model } = await mount(Notebook, { id: "notebook", pages: PAGES });

            model.open("list", "details", "edit");
            await settle();

            expect(model.history).toBe(true);
            expect(notebookText()).toBe("Edit page");
            expect(closeAll(model)).toEqual(["details", "list", undefined]);
        });

        it("skips empty page ids", async () => {
            const { model } = await mount(Notebook, { id: "notebook", pages: PAGES });

            model.open("list", undefined, "", "edit");

            expect(model.activePage).toBe("edit");
            expect(closeAll(model)).toEqual(["list", undefined]);
        });

        it("with no pages, only resets the history", async () => {
            const { model } = await mount(Notebook, { id: "notebook", pages: PAGES });
            model.open("list", "details");

            model.open();

            expect(model.activePage).toBe("details");
            expect(closeAll(model)).toEqual([undefined]);
        });

        // Regression: open() documents a history reset, but it cleared the stack BEFORE assigning the
        // new active page, and onChangingActivePage then pushed the page that was showing — so the page
        // active before open() stayed reachable through closeLastPage().
        it("resets the history, so the page showing before open() is not stepped back to", async () => {
            const { model } = await mount(Notebook, { id: "notebook", pages: PAGES, activePage: "summary" });

            model.open("list", "edit");

            expect(closeAll(model)).toEqual(["list", undefined]);
        });
    });

    describe("history", () => {
        it("records each page left behind and closeLastPage() steps back through them", async () => {
            const { model } = await mount(Notebook, { id: "notebook", pages: PAGES });
            model.open("list");

            model.activePage = "details";
            model.activePage = "edit";
            await settle();
            expect(notebookText()).toBe("Edit page");

            model.closeLastPage();
            await settle();
            expect(notebookText()).toBe("Details page");

            expect(closeAll(model)).toEqual(["list", undefined]);
        });

        // Going to the page on top of the history is a step back, not another step forward.
        it("pops rather than grows the history when switching to the previous page", async () => {
            const { model } = await mount(Notebook, { id: "notebook", pages: PAGES });
            model.open("list", "details", "edit");

            model.activePage = "details";

            expect(closeAll(model)).toEqual(["list", undefined]);
        });

        it("never steps back onto the page already showing", async () => {
            const { model } = await mount(Notebook, { id: "notebook", pages: PAGES });
            model.open("list", "edit", "edit");

            model.closeLastPage();

            expect(model.activePage).toBe("list");
        });

        it("close() hides every page and forgets the history", async () => {
            const { model } = await mount(Notebook, { id: "notebook", pages: PAGES });
            model.open("list", "details", "edit");

            model.close();
            await settle();

            expect(model.activePage).toBeUndefined();
            expect(notebookText()).toBe("");
            model.activePage = "summary";
            expect(closeAll(model)).toEqual([undefined]);
        });

        it("switching history off forgets what was recorded", async () => {
            const { model } = await mount(Notebook, { id: "notebook", pages: PAGES });
            model.open("list", "details", "edit");

            model.history = false;

            expect(closeAll(model)).toEqual([undefined]);
        });
    });
});
