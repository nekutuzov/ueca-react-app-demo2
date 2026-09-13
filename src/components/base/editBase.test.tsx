import { describe, expect, it, vi } from "vitest";
import * as UECA from "ueca-react";
import { EditBaseModel, EditBaseParams, EditBaseStruct, isEmptyValue, useEditBase } from "@components";
import { mount, settle } from "@test";

async function mountField(id: string, params?: FieldProbeParams): Promise<FieldProbeModel> {
    const { model } = await mount(FieldProbe, { id, ...params });
    return model;
}

describe("useEditBase validation", () => {
    it("is valid with no validators, reporting undefined rather than an empty string", async () => {
        const field = await mountField("field");

        await field.validate();

        expect(field.isValid()).toBe(true);
        expect(field.getValidationError()).toBeUndefined();
    });

    it("records the errorText passed to validate when no validator objects", async () => {
        const field = await mountField("field", { onInternalValidate: async () => undefined, onValidate: async () => undefined });

        await field.validate("Name is taken");

        expect(field.isValid()).toBe(false);
        expect(field.getValidationError()).toBe("Name is taken");
    });

    // The component's own rules (required, type) come first; the caller's rule only runs on a
    // value those already accept.
    it("lets onInternalValidate win: its error is kept and onValidate is not consulted", async () => {
        const onValidate = vi.fn(async () => "Caller rule failed");
        const field = await mountField("field", { onInternalValidate: async () => "Email is required", onValidate });

        await field.validate("External error");

        expect(field.getValidationError()).toBe("Email is required");
        expect(onValidate).not.toHaveBeenCalled();
    });

    it("consults onValidate once onInternalValidate passes, and its error beats errorText", async () => {
        const onValidate = vi.fn(async () => "Must be a company address");
        const field = await mountField("field", { onInternalValidate: async () => undefined, onValidate });

        await field.validate("External error");

        expect(onValidate).toHaveBeenCalledOnce();
        expect(field.getValidationError()).toBe("Must be a company address");
    });

    it("clears a previous error when a later validate passes", async () => {
        let value = "";
        const field = await mountField("field", { onInternalValidate: async () => (value ? undefined : "Required") });
        await field.validate();
        expect(field.isValid()).toBe(false);

        value = "filled";
        await field.validate();

        expect(field.isValid()).toBe(true);
        expect(field.getValidationError()).toBeUndefined();
    });

    it("resetValidationErrors clears the error without validating again", async () => {
        const onInternalValidate = vi.fn(async () => "Required");
        const field = await mountField("field", { onInternalValidate });
        await field.validate();

        field.resetValidationErrors();

        expect(field.isValid()).toBe(true);
        expect(onInternalValidate).toHaveBeenCalledOnce();
    });

    it("re-renders a view that shows the error as validation changes", async () => {
        const field = await mountField("field", { onInternalValidate: async () => "Required" });
        expect(document.getElementById("field")).toHaveTextContent("");

        await field.validate();
        await settle();
        expect(document.getElementById("field")).toHaveTextContent("Required");

        field.resetValidationErrors();
        await settle();
        expect(document.getElementById("field")).toHaveTextContent("");
    });

    describe("modelsToValidate", () => {
        it("validates every listed model before running its own validators", async () => {
            const steps: string[] = [];
            const slowChild = await mountField("slow", {
                onInternalValidate: async () => {
                    await UECA.sleep(5);
                    steps.push("slow field");
                    return undefined;
                }
            });
            const quickChild = await mountField("quick", {
                onInternalValidate: async () => {
                    steps.push("quick field");
                    return undefined;
                }
            });
            const form = await mountField("form", {
                modelsToValidate: [slowChild, quickChild],
                onInternalValidate: async () => {
                    steps.push("form");
                    return undefined;
                }
            });

            await form.validate();

            expect(steps).toHaveLength(3);
            expect(steps[2]).toBe("form");
        });

        it("joins the listed models' errors, in order, then its own, with CRLF", async () => {
            const name = await mountField("name", { onInternalValidate: async () => "Name is required" });
            const email = await mountField("email");
            const age = await mountField("age", { onInternalValidate: async () => "Age must be a number" });
            const form = await mountField("form", {
                modelsToValidate: [name, email, age],
                onValidate: async () => "Fix the highlighted fields"
            });

            await form.validate();

            expect(form.getValidationError()).toBe("Name is required\r\nAge must be a number\r\nFix the highlighted fields");
        });

        it("is invalid while any listed model is, even when its own validators pass", async () => {
            const name = await mountField("name", { onInternalValidate: async () => "Name is required" });
            const form = await mountField("form", { modelsToValidate: [name], onInternalValidate: async () => undefined });

            await form.validate();

            expect(form.isValid()).toBe(false);
            expect(form.getValidationError()).toBe("Name is required");
        });

        // A form can itself sit in a parent's list (a login form inside a screen, a tab inside tabs).
        it("recurses through nested composites", async () => {
            const street = await mountField("street", { onInternalValidate: async () => "Street is required" });
            const address = await mountField("address", {
                modelsToValidate: [street],
                onInternalValidate: async () => "Address is incomplete"
            });
            const order = await mountField("order", { modelsToValidate: [address] });

            await order.validate();

            expect(street.getValidationError()).toBe("Street is required");
            expect(order.isValid()).toBe(false);
            expect(order.getValidationError()).toBe("Street is required\r\nAddress is incomplete");
        });

        it("resetValidationErrors resets the listed models at once, along with its own error", async () => {
            const name = await mountField("name", { onInternalValidate: async () => "Name is required" });
            const form = await mountField("form", { modelsToValidate: [name], onValidate: async () => "Form is invalid" });
            await form.validate();

            form.resetValidationErrors();

            expect(name.isValid()).toBe(true);
            expect(form.isValid()).toBe(true);
            expect(form.getValidationError()).toBeUndefined();
        });

        // Regression: getValidationError and resetValidationErrors read modelsToValidate optionally
        // (?.), but validate() handed `modelsToValidate?.map(...)` straight to Promise.all, which
        // rejects on undefined. A composite whose list was unset — TabsContainer copies its `tabs`
        // into it — could not validate at all.
        it("validates with modelsToValidate unset, as its other methods already allow", async () => {
            const field = await mountField("field", { onInternalValidate: async () => "Required" });
            field.modelsToValidate = undefined;

            await field.validate();

            expect(field.getValidationError()).toBe("Required");
        });
    });
});

// The one rule TextField, Select and RadioGroup share for `required`.
describe("isEmptyValue", () => {
    it.each([
        ["undefined", undefined],
        ["null", null],
        ["an empty string", ""],
        ["whitespace", "  \t"]
    ])("counts %s as empty", (_case, value) => {
        expect(isEmptyValue(value)).toBe(true);
    });

    // Regression: the inputs tested `!model.value`, so a chosen 0 was "empty".
    it.each([
        ["the number 0", 0],
        ["false", false],
        ["the text \"0\"", "0"],
        ["text", "ada"]
    ])("counts %s as a value", (_case, value) => {
        expect(isEmptyValue(value)).toBe(false);
    });
});

// A field that shows its own validation error — the smallest EditBase extension.
type FieldProbeStruct = EditBaseStruct<{}>;

type FieldProbeParams = EditBaseParams<FieldProbeStruct>;
type FieldProbeModel = EditBaseModel<FieldProbeStruct>;

function useFieldProbe(params?: FieldProbeParams): FieldProbeModel {
    const struct: FieldProbeStruct = {
        props: {
            id: useFieldProbe.name
        },

        View: () => <output id={model.htmlId()}>{model.getValidationError()}</output>
    };

    const model = useEditBase(struct, params);
    return model;
}

const FieldProbe = UECA.getFC(useFieldProbe);
