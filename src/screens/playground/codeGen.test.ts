import { describe, expect, it } from "vitest";
import { CodeValue, expr, jsxElement, objectLiteral } from "./codeGen";

describe("jsxElement", () => {
    describe("which props are written", () => {
        it("omits every prop equal to its default, leaving a bare self-closing tag", () => {
            const defaults = { variant: "text", size: "medium", disabled: false, rows: 1 };

            expect(jsxElement("Button", { variant: "text", size: "medium", disabled: false, rows: 1 }, defaults)).toBe("<Button />");
        });

        it("omits undefined and null values even without a default", () => {
            expect(jsxElement("Button", { startIconView: undefined, endIconView: null as unknown as CodeValue })).toBe("<Button />");
        });

        it("writes a prop that differs from its default", () => {
            expect(jsxElement("Button", { variant: "outlined" }, { variant: "text" })).toBe(`<Button variant="outlined" />`);
        });

        it("writes a falsy value that is not the default: zero, false and the empty string", () => {
            expect(jsxElement("TextField", { rows: 0 }, { rows: 1 })).toBe("<TextField rows={0} />");
            expect(jsxElement("TextField", { required: false }, { required: true })).toBe("<TextField required={false} />");
            expect(jsxElement("TextField", { placeholder: "" }, { placeholder: "Search" })).toBe(`<TextField placeholder="" />`);
        });

        it("compares expressions by their source text", () => {
            expect(jsxElement("Button", { onClick: expr("model.save") }, { onClick: expr("model.save") })).toBe("<Button />");
            expect(jsxElement("Button", { onClick: expr("model.save") }, { onClick: expr("model.cancel") }))
                .toBe("<Button onClick={model.save} />");
        });

        it("never treats values of different types as equal", () => {
            expect(jsxElement("X", { a: "x" }, { a: expr("x") })).toBe(`<X a="x" />`);
            expect(jsxElement("X", { a: 1 }, { a: "1" })).toBe("<X a={1} />");
            expect(jsxElement("X", { a: true }, { a: "true" })).toBe("<X a />");
        });
    });

    describe("value formatting", () => {
        it("writes a true boolean as the bare attribute", () => {
            expect(jsxElement("Button", { fullWidth: true })).toBe("<Button fullWidth />");
        });

        it("writes a number in braces", () => {
            expect(jsxElement("TextField", { rows: 3 })).toBe("<TextField rows={3} />");
            expect(jsxElement("Total", { value: -12.5 })).toBe("<Total value={-12.5} />");
        });

        it("writes a string in double quotes", () => {
            expect(jsxElement("Button", { contentView: "Save changes" })).toBe(`<Button contentView="Save changes" />`);
        });

        it("writes an expression raw inside braces", () => {
            expect(jsxElement("Button", { startIconView: expr(`<Icon name="save" size="sm" />`) }))
                .toBe(`<Button startIconView={<Icon name="save" size="sm" />} />`);
        });

        // A raw quote would end the attribute early and leave invalid JSX.
        it("escapes double quotes in a string as &quot;", () => {
            expect(jsxElement("Button", { contentView: `Say "hi"` })).toBe(`<Button contentView="Say &quot;hi&quot;" />`);
        });

        // Inside a JSX attribute string, braces, apostrophes and backslashes are literal text.
        it("leaves braces, apostrophes and backslashes in a string untouched", () => {
            expect(jsxElement("Button", { contentView: `{count} it's C:\\temp` }))
                .toBe(`<Button contentView="{count} it's C:\\temp" />`);
        });
    });

    describe("layout", () => {
        it("keeps attributes in the order the props were given", () => {
            expect(jsxElement("X", { b: "2", a: "1" })).toBe(`<X b="2" a="1" />`);
        });

        it("stays on one line with two attributes", () => {
            expect(jsxElement("Button", { variant: "outlined", size: "large" })).toBe(`<Button variant="outlined" size="large" />`);
        });

        it("breaks one attribute per line past two attributes, closing on a line of its own", () => {
            expect(jsxElement("Button", { variant: "outlined", size: "large", disabled: true })).toBe([
                "<Button",
                `    variant="outlined"`,
                `    size="large"`,
                "    disabled",
                "/>"
            ].join("\n"));
        });

        it("counts only the attributes that survive the default filter", () => {
            const defaults = { size: "medium", disabled: false };

            expect(jsxElement("Button", { variant: "outlined", size: "medium", disabled: false, color: "error.main" }, defaults))
                .toBe(`<Button variant="outlined" color="error.main" />`);
        });

        // The width measured is the opening "<Name attrs" text, before the closing " />".
        it("breaks a short attribute list once the opening tag passes 72 characters", () => {
            const opening = (value: string) => `<Button contentView="${value}"`;
            const fits = "x".repeat(50);
            const tooWide = "x".repeat(51);
            expect(opening(fits)).toHaveLength(72);

            expect(jsxElement("Button", { contentView: fits })).toBe(`${opening(fits)} />`);
            expect(jsxElement("Button", { contentView: tooWide })).toBe(`<Button\n    contentView="${tooWide}"\n/>`);
        });

        it("measures a string's width after escaping its quotes", () => {
            // 44 x's and one quote: 45 characters raw, 50 once the quote becomes &quot; — 72 wide.
            const fits = "x".repeat(44) + `"`;
            const tooWide = "x".repeat(45) + `"`;

            expect(jsxElement("Button", { contentView: fits })).not.toContain("\n");
            expect(jsxElement("Button", { contentView: tooWide })).toContain("\n");
        });
    });

    describe("children", () => {
        it("wraps children between an inline opening tag and a closing tag, indenting every line", () => {
            expect(jsxElement("Row", { spacing: "small" }, {}, "<A />\n<B />")).toBe([
                `<Row spacing="small">`,
                "    <A />",
                "    <B />",
                "</Row>"
            ].join("\n"));
        });

        it("wraps children in a tag with no attributes", () => {
            expect(jsxElement("Col", {}, {}, "text")).toBe("<Col>\n    text\n</Col>");
        });

        it("puts the bracket of a broken opening tag on its own line before the children", () => {
            expect(jsxElement("Row", { a: "1", b: "2", c: "3" }, {}, "<A />")).toBe([
                "<Row",
                `    a="1"`,
                `    b="2"`,
                `    c="3"`,
                ">",
                "    <A />",
                "</Row>"
            ].join("\n"));
        });

        it("adds one indent step to children that are already indented", () => {
            expect(jsxElement("Col", {}, {}, "<Row>\n    <A />\n</Row>")).toBe("<Col>\n    <Row>\n        <A />\n    </Row>\n</Col>");
        });

        it.each([
            ["undefined", undefined],
            ["an empty string", ""]
        ])("treats %s children as no children", (_, childrenCode) => {
            expect(jsxElement("Row", { spacing: "small" }, {}, childrenCode)).toBe(`<Row spacing="small" />`);
            expect(jsxElement("Row", { a: "1", b: "2", c: "3" }, {}, childrenCode)).toMatch(/\n\/>$/);
        });
    });
});

describe("objectLiteral", () => {
    it("returns {} when nothing differs from its default", () => {
        expect(objectLiteral({})).toBe("{}");
        expect(objectLiteral({ selectable: false, multiSelect: undefined }, { selectable: false })).toBe("{}");
    });

    it("writes one entry per line, comma-separated, with no trailing comma", () => {
        expect(objectLiteral({ rows: expr("() => model.orders"), rowKeyField: "id", maxRows: 50 })).toBe([
            "{",
            "    rows: () => model.orders,",
            `    rowKeyField: "id",`,
            "    maxRows: 50",
            "}"
        ].join("\n"));
    });

    it("writes booleans as literals rather than bare names", () => {
        expect(objectLiteral({ selectable: true, virtualized: false })).toBe("{\n    selectable: true,\n    virtualized: false\n}");
    });

    it("quotes strings as JavaScript literals, escaping quotes and backslashes", () => {
        expect(objectLiteral({ label: `a "b" \\ c` })).toBe(`{\n    label: "a \\"b\\" \\\\ c"\n}`);
    });

    it("omits undefined values and props equal to their default, expressions included", () => {
        const defaults = { selectable: false, onSelectionChange: expr("(row) => model.open(row)") };

        expect(objectLiteral({
            selectable: false,
            multiSelect: undefined,
            onSelectionChange: expr("(row) => model.open(row)"),
            virtualized: true
        }, defaults)).toBe("{\n    virtualized: true\n}");
    });

    // The opening brace follows a call such as `useTable<Order>(`, so only the body is indented.
    it.each([
        [1, "{\n        a: 1,\n        b: \"x\"\n    }"],
        [2, "{\n            a: 1,\n            b: \"x\"\n        }"]
    ])("indents the entries and the closing brace for nesting level %i", (level, expected) => {
        expect(objectLiteral({ a: 1, b: "x" }, {}, level)).toBe(expected);
    });
});
