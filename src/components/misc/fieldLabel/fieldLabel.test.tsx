import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { FieldLabel, fieldLabelText } from "@components";
import { mount, settle } from "@test";

function labelRoot(): HTMLElement {
    return document.getElementById("label");
}

describe("FieldLabel", () => {
    it("renders the label, then the hint, then the dimmed qualifier", async () => {
        await mount(FieldLabel, {
            id: "label",
            labelView: "Database Path",
            hintView: <i data-testid="hint" />,
            secondaryView: "(local path on the database host)"
        });

        const root = labelRoot();
        expect(root.tagName).toBe("SPAN");
        expect(root).toHaveClass("ueca-field-label");
        expect(root).toHaveTextContent("Database Path(local path on the database host)");
        const secondary = root.querySelector(".ueca-field-label-secondary");
        expect(secondary).toHaveTextContent("(local path on the database host)");
        expect(Array.from(root.childNodes)).toEqual([root.firstChild, screen.getByTestId("hint"), secondary]);
        expect(root.firstChild.textContent).toBe("Database Path");
    });

    it.each([
        ["undefined", undefined],
        ["empty", ""]
    ])("renders no qualifier span when secondaryView is %s", async (_, secondaryView) => {
        await mount(FieldLabel, { id: "label", labelView: "Site Name", secondaryView });

        expect(labelRoot().querySelector(".ueca-field-label-secondary")).toBeNull();
        expect(labelRoot()).toHaveTextContent("Site Name");
    });

    it("accepts any node as the qualifier and follows changes to it", async () => {
        const { model } = await mount(FieldLabel, { id: "label", labelView: "Site Name", secondaryView: <b>(URL: /sites/a)</b> });
        expect(labelRoot().querySelector(".ueca-field-label-secondary b")).toHaveTextContent("(URL: /sites/a)");

        model.secondaryView = "(URL: /sites/b)";
        await settle();

        expect(labelRoot().querySelector(".ueca-field-label-secondary")).toHaveTextContent("(URL: /sites/b)");
    });
});

// A validation message has to name its field even once the label grows a hint or a qualifier.
describe("fieldLabelText", () => {
    function Wrapper(props: { labelView: React.ReactNode }) {
        return <span>{props.labelView}</span>;
    }

    it.each([
        ["a plain string label", "Email", "Email"],
        ["a FieldLabel with a string labelView", <FieldLabel labelView="Windows User Name" secondaryView="(domain\\user)" />, "Windows User Name"],
        ["any wrapper following the labelView convention", <Wrapper labelView="Port" />, "Port"]
    ])("reads the name from %s", (_, labelView, expected) => {
        expect(fieldLabelText(labelView)).toBe(expected);
    });

    it.each([
        ["undefined", undefined],
        ["null", null],
        ["a number", 42],
        ["an element without a labelView", <span>Name</span>],
        ["a labelView that is itself a node", <FieldLabel labelView={<b>Name</b>} />]
    ])("gives up (undefined) for %s", (_, labelView) => {
        expect(fieldLabelText(labelView)).toBeUndefined();
    });
});
