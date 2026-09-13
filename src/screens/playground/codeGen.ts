// Source text for the Playground's "Code" listing — the snippet a reader would copy into a screen.
//
// The rule it follows is "write what someone would actually write": a prop left at its default is
// omitted, a true boolean is the bare attribute, a number or an expression goes in braces, and a
// long attribute list goes one per line with the closing bracket on its own line.

// A value as it should appear in source. `expr` is emitted raw — for JSX or a reference such as
// `<Icon name="add" />` or `model.onSave`.
type CodeValue = string | number | boolean | undefined | { expr: string };

type CodeProps = Record<string, CodeValue>;

const INDENT = "    ";

// Past this many attributes, or this many characters on one line, the element breaks one attribute
// per line.
const INLINE_MAX_ATTRS = 2;
const INLINE_MAX_WIDTH = 72;

function expr(code: string): { expr: string } {
    return { expr: code };
}

// <Name a="x" b={1} flag /> — props equal to their default are left out.
function jsxElement(name: string, props: CodeProps, defaults: CodeProps = {}, childrenCode?: string): string {
    const attrs = _changed(props, defaults)
        .map(([key, value]) => _attribute(key, value))
        .filter(Boolean);

    const inline = `<${name}${attrs.map((a) => " " + a).join("")}`;
    const fitsInline = attrs.length <= INLINE_MAX_ATTRS && inline.length <= INLINE_MAX_WIDTH;

    const open = fitsInline
        ? inline
        : `<${name}\n${attrs.map((a) => INDENT + a).join("\n")}\n`;

    if (childrenCode == null || childrenCode === "") {
        return fitsInline ? `${open} />` : `${open}/>`;
    }
    const body = childrenCode.split("\n").map((line) => INDENT + line).join("\n");
    return `${open}>\n${body}\n</${name}>`;
}

// { a: "x", b: 1 } as a multi-line object literal — props equal to their default are left out.
function objectLiteral(props: CodeProps, defaults: CodeProps = {}, indentLevel = 0): string {
    const pad = INDENT.repeat(indentLevel);
    const entries = _changed(props, defaults)
        .map(([key, value]) => `${pad}${INDENT}${key}: ${_literal(value)}`);
    if (!entries.length) {
        return "{}";
    }
    return `{\n${entries.join(",\n")}\n${pad}}`;
}

export { CodeValue, CodeProps, expr, jsxElement, objectLiteral };


// Private helpers
function _changed(props: CodeProps, defaults: CodeProps): [string, CodeValue][] {
    return Object.entries(props).filter(([key, value]) => {
        if (value === undefined || value === null) {
            return false;
        }
        return !_same(value, defaults[key]);
    });
}

function _same(a: CodeValue, b: CodeValue): boolean {
    if (typeof a === "object" && typeof b === "object") {
        return a?.expr === b?.expr;
    }
    return a === b;
}

function _attribute(key: string, value: CodeValue): string {
    if (value === true) {
        return key;
    }
    if (typeof value === "string") {
        return `${key}="${value.replace(/"/g, "&quot;")}"`;
    }
    return `${key}={${_literal(value)}}`;
}

function _literal(value: CodeValue): string {
    if (typeof value === "object") {
        return value.expr;
    }
    if (typeof value === "string") {
        return JSON.stringify(value);
    }
    return String(value);
}
