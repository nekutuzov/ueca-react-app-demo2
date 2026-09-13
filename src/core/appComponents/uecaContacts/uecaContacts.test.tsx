import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { UECAContacts } from "@core";
import { mount, settle, stubMessages } from "@test";

const CONTACTS = [
    { name: "UECA Website", path: "https://cranesoft.net", label: "UECA website", detail: "cranesoft.net · opens a new tab" },
    { name: "Email", path: "mailto:cranesoft@protonmail.com", label: "Email", detail: "cranesoft@protonmail.com" },
    { name: "GitHub Repository", path: "https://github.com/nekutuzov/ueca-react-app-demo2", label: "GitHub repository", detail: "github.com · opens a new tab" },
    { name: "NPM Package", path: "https://www.npmjs.com/package/ueca-react", label: "npm package", detail: "npmjs.com · opens a new tab" },
    { name: "YouTube Video", path: "https://youtu.be/SQl8f-qGxwU?si=-YTWPpPB7ExBZ6L0", label: "YouTube video", detail: "youtu.be · opens a new tab" }
];

describe("UECAContacts", () => {
    it("offers the website, email, GitHub, npm and YouTube contacts, in that order", async () => {
        await mount(UECAContacts, { id: "contacts" });

        expect(screen.getAllByRole("button").map((b) => b.getAttribute("aria-label"))).toEqual(CONTACTS.map((c) => c.name));
    });

    it.each(CONTACTS)("opens $name through App.Router.OpenNewTab", async ({ name, path }) => {
        const bus = await stubMessages({ "App.Router.OpenNewTab": vi.fn(async () => { }) });
        await mount(UECAContacts, { id: "contacts" });

        fireEvent.click(screen.getByRole("button", { name }));
        await settle();

        expect(bus["App.Router.OpenNewTab"]).toHaveBeenCalledOnce();
        expect(bus["App.Router.OpenNewTab"]).toHaveBeenCalledWith({ path });
    });

    // Every contact leaves the site, so the tooltip's detail line names the destination and says
    // whether it opens a new tab — the icon alone gives no clue where you are about to land.
    it.each(CONTACTS)("names the destination of $name in its tooltip", async ({ name, label, detail }) => {
        const bus = await stubMessages({ "App.Tooltip.Show": vi.fn(async (_tooltip: { contentView: React.ReactNode }) => { }) });
        await mount(UECAContacts, { id: "contacts" });

        fireEvent.mouseEnter(screen.getByRole("button", { name }));
        await settle();

        expect(bus["App.Tooltip.Show"]).toHaveBeenCalledOnce();
        const { contentView } = bus["App.Tooltip.Show"].mock.calls[0][0];
        const { container } = render(<div data-testid="tip">{contentView}</div>);
        const detailLine = container.querySelector(".ueca-tooltip-detail");
        expect(detailLine).toHaveTextContent(new RegExp(`^${escapeRegExp(detail)}$`));
        expect(screen.getByTestId("tip").textContent).toBe(`${label}${detailLine.textContent}`);
    });

    it("lays the buttons out in a row, or in a column when vertical", async () => {
        const { model } = await mount(UECAContacts, { id: "contacts" });
        const root = document.getElementById("contacts");
        expect(root).toHaveClass("ueca-contacts");
        expect(root).toHaveStyle({ flexDirection: "row", gap: "16px" });

        model.orientation = "vertical";
        await settle();

        expect(document.getElementById("contacts")).toHaveStyle({ flexDirection: "column", gap: "16px" });
        expect(screen.getAllByRole("button")).toHaveLength(CONTACTS.length);
    });
});

function escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
