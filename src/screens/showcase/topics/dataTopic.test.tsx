import { describe, expect, it } from "vitest";
import { fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mount } from "@test";
import { DataTopic } from "./dataTopic";

const TOPIC = "data";

function table(name: "sitesTable" | "featureTable" | "cappedTable" | "emptyTable"): HTMLElement {
    return document.getElementById(`${TOPIC}.${name}`);
}

function bodyRows(tableEl: HTMLElement): HTMLElement[] {
    return [...tableEl.querySelectorAll<HTMLElement>(".ueca-table-body-row")];
}

function cells(row: HTMLElement): string[] {
    return [...row.querySelectorAll("[role=gridcell]:not(.ueca-table-filler)")].map((cell) => cell.textContent);
}

// The narrowest a table's columns can be laid out: each track's fixed width, or the minimum of a
// minmax(). The trailing filler track has none.
function minimumWidth(tableEl: HTMLElement): number {
    return [...tableEl.style.gridTemplateColumns.matchAll(/minmax\((\d+)px,[^)]*\)|(\d+)px/g)]
        .reduce((sum, [, min, fixed]) => sum + Number(min ?? fixed), 0);
}

function readout(marker: "sorted by:" | "current:"): string {
    return [...document.querySelectorAll(".showcase-specimen-label")]
        .map((el) => el.textContent)
        .find((text) => text.startsWith("selected:") && text.includes(marker));
}

describe("DataTopic", () => {
    describe("sites table", () => {
        it("starts sorted by site name, and says so", async () => {
            await mount(DataTopic, { id: TOPIC });

            expect(readout("sorted by:")).toBe("selected: —  ·  sorted by: name asc  ·  showing: 24 of 24");
            const rows = bodyRows(table("sitesTable"));
            expect(rows).toHaveLength(24);
            expect(cells(rows[0]).slice(0, 6)).toEqual(["1", "Bridge Pier 7 1", "degraded", "8", "4.80", "No"]);
            expect(cells(rows[1]).slice(0, 6)).toEqual(["2", "Bridge Pier 7 2", "degraded", "39", "7.00", "Yes"]);
        });

        it("reports the site a click selects", async () => {
            await mount(DataTopic, { id: TOPIC });

            await userEvent.click(bodyRows(table("sitesTable"))[0]);

            expect(readout("sorted by:")).toBe("selected: Bridge Pier 7 1 (site-5)  ·  sorted by: name asc  ·  showing: 24 of 24");
        });

        it("reports a reversed or changed sort, renumbering the rows", async () => {
            await mount(DataTopic, { id: TOPIC });
            const sites = table("sitesTable");

            await userEvent.click(within(sites).getByRole("columnheader", { name: "Site" }));
            expect(readout("sorted by:")).toBe("selected: —  ·  sorted by: name desc  ·  showing: 24 of 24");
            expect(cells(bodyRows(sites)[0]).slice(0, 2)).toEqual(["1", "Tailings Cell 2 4"]);

            await userEvent.click(within(sites).getByRole("columnheader", { name: "Status" }));
            expect(readout("sorted by:")).toBe("selected: —  ·  sorted by: status asc  ·  showing: 24 of 24");
        });

        it("reports how many sites a filter leaves", async () => {
            await mount(DataTopic, { id: TOPIC });
            const siteFilter = table("sitesTable").querySelector<HTMLInputElement>(".ueca-table-filter-input");

            await userEvent.type(siteFilter, "Ridge Cut");

            expect(readout("sorted by:")).toBe("selected: —  ·  sorted by: name asc  ·  showing: 4 of 24");
            expect(bodyRows(table("sitesTable")).map((row) => cells(row)[1])).toEqual(["Ridge Cut 1", "Ridge Cut 2", "Ridge Cut 3", "Ridge Cut 4"]);
        });

        it("colours each status by its intent", async () => {
            await mount(DataTopic, { id: TOPIC });

            const chip = (siteId: string) => document.getElementById(`${TOPIC}.sitesTable.status-${siteId}`);
            expect(chip("site-1")).toHaveClass("ueca-status-label-success", "ueca-status-label-bare");
            expect(chip("site-2")).toHaveClass("ueca-status-label-warning");
            expect(chip("site-3")).toHaveClass("ueca-status-label-error");
        });

        // One child model rendered from two tables at once would duplicate its DOM id, so only the
        // sites table carries the row action.
        it("renders the row action for the active sites row, and never in the feature table", async () => {
            await mount(DataTopic, { id: TOPIC });
            const actionButtons = () => document.querySelectorAll(`[id="${TOPIC}.rowEditButton"]`);
            expect(actionButtons()).toHaveLength(0);
            // One pointer, so moving between tables really leaves the row it was over.
            const user = userEvent.setup();

            await user.hover(bodyRows(table("sitesTable"))[2]);
            expect(actionButtons()).toHaveLength(1);

            // A selected row keeps its action once the pointer has gone to the other table.
            await user.click(bodyRows(table("sitesTable"))[2]);
            await user.click(bodyRows(table("featureTable"))[0]);

            expect(table("featureTable").querySelector(".ueca-table-cell-actions")).toBeNull();
            expect(actionButtons()).toHaveLength(1);
            expect(bodyRows(table("sitesTable"))[2]).toContainElement(actionButtons()[0] as HTMLElement);
        });
    });

    describe("feature table", () => {
        it("pins its first column and renders only a window of its 5,000 rows", async () => {
            await mount(DataTopic, { id: TOPIC });
            const features = table("featureTable");

            expect(features).toHaveClass("virtualized", "sticky-first");
            expect(bodyRows(features).length).toBeGreaterThan(0);
            expect(bodyRows(features).length).toBeLessThan(100);
            expect(features.querySelector(".ueca-table-spacer")).not.toBeNull();
        });

        // Regression: its frame was capped at 640px so its columns would scroll, which left it
        // visibly narrower than the tables above and below. Its columns now outgrow the widest
        // frame the page can give it: the 1180px band (--band-w).
        it("spans the page like its neighbours, with columns to scroll under the pinned one", async () => {
            await mount(DataTopic, { id: TOPIC });
            const features = table("featureTable");

            expect(features.parentElement.style.maxWidth).toBe("");
            expect(within(features).getAllByRole("columnheader").map((h) => h.textContent)).toEqual([
                "#", "Site", "Status", "Instruments", "Drift (mm)", "Licensed", "Last reading",
                "Battery (V)", "Signal (dBm)", "Alarms", "Firmware"
            ]);
            expect(cells(bodyRows(features)[0]).slice(7)).toEqual(["12.2", "-80", "3", "5.0.2"]);
            expect(minimumWidth(features)).toBeGreaterThan(1180);
        });

        // jsdom lays nothing out, so the room is worked out from the type: the table's 13px digits
        // are 7.8px wide, and a cell keeps 16px of padding on each side. At 56px rows 1,292–1,298
        // all read "129".
        it("leaves the row-number column room for its last row number", async () => {
            await mount(DataTopic, { id: TOPIC });

            expect(parseFloat(table("featureTable").style.gridTemplateColumns)).toBeGreaterThanOrEqual(2 * 16 + String(5000).length * 7.8);
        });

        it("reports a desktop-style multi-selection and clears it on Escape", async () => {
            await mount(DataTopic, { id: TOPIC });
            const features = table("featureTable");
            const total = (5000).toLocaleString();
            expect(readout("current:")).toBe(`selected: 0 of ${total}  ·  current: —`);
            const user = userEvent.setup();

            await user.click(bodyRows(features)[0]);
            expect(readout("current:")).toBe(`selected: 1 of ${total}  ·  current: site-5`);

            await user.keyboard("{Control>}");
            await user.click(bodyRows(features)[1]);
            await user.keyboard("{/Control}");
            expect(readout("current:")).toBe(`selected: 2 of ${total}  ·  current: site-11`);

            fireEvent.keyDown(features, { key: "Escape" });
            expect(readout("current:")).toBe(`selected: 0 of ${total}  ·  current: —`);
        });
    });

    it("caps the non-virtualised table at 50 rows and says what it withheld", async () => {
        await mount(DataTopic, { id: TOPIC });
        const capped = table("cappedTable");

        expect(bodyRows(capped)).toHaveLength(50);
        expect(within(capped).getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["#", "Site", "Status", "Instruments"]);
        expect(capped.querySelector(".ueca-table-footer")).toHaveTextContent(
            `Showing 50 of ${(5000).toLocaleString()} rows — narrow the selection to see the rest.`
        );
    });

    it("keeps the headers of an empty table and says why it is empty", async () => {
        await mount(DataTopic, { id: TOPIC });
        const empty = table("emptyTable");

        expect(within(empty).getAllByRole("columnheader")).toHaveLength(4);
        expect(bodyRows(empty)).toHaveLength(0);
        expect(empty).toHaveTextContent("No sites match the current filter");
    });
});
