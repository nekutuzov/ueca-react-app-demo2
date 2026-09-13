import { afterEach, describe, expect, it } from "vitest";
import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";
import { mount, settle } from "@test";

const created: LayerProbeModel[] = [];

async function mountLayer(id: string): Promise<LayerProbeModel> {
    const { model } = await mount(LayerProbe, { id });
    created.push(model);
    return model;
}

describe("useUIBase modal stacking", () => {
    afterEach(() => {
        // The stack is module state shared by every overlay, so each test must leave it empty.
        const probe = created[0];
        for (let i = 0; i < 20 && probe?.activeModalDialog(); i++) {
            probe.activeModalDialog().leaveModalMode();
        }
        created.length = 0;
    });

    it("has no active modal dialog while nothing is modal", async () => {
        const layer = await mountLayer("layer");

        expect(layer.activeModalDialog()).toBeUndefined();
        expect(layer.zIndex).toBeUndefined();
    });

    it("places the first modal at z-index 1000 and makes it the active dialog for every component", async () => {
        const dialog = await mountLayer("dialog");
        const bystander = await mountLayer("bystander");

        dialog.enterModalMode();

        expect(dialog.zIndex).toBe(1000);
        expect(dialog.activeModalDialog()).toBe(dialog);
        expect(bystander.activeModalDialog()).toBe(dialog);
    });

    it("stacks each further modal 100 above the active one", async () => {
        const drawer = await mountLayer("drawer");
        const dialog = await mountLayer("dialog");
        const confirm = await mountLayer("confirm");

        drawer.enterModalMode();
        dialog.enterModalMode();
        confirm.enterModalMode();

        expect([drawer.zIndex, dialog.zIndex, confirm.zIndex]).toEqual([1000, 1100, 1200]);
        expect(drawer.activeModalDialog()).toBe(confirm);
    });

    it("stacks above the active modal's actual z-index, not above a count of modals", async () => {
        const drawer = await mountLayer("drawer");
        const dialog = await mountLayer("dialog");
        drawer.enterModalMode();
        drawer.zIndex = 4000;

        dialog.enterModalMode();

        expect(dialog.zIndex).toBe(4100);
    });

    // Removal is by identity, so an overlay closing out of order does not pop someone else.
    it("removes a leaving modal from wherever it sits in the stack", async () => {
        const drawer = await mountLayer("drawer");
        const dialog = await mountLayer("dialog");
        const confirm = await mountLayer("confirm");
        drawer.enterModalMode();
        dialog.enterModalMode();
        confirm.enterModalMode();

        dialog.leaveModalMode();
        expect(drawer.activeModalDialog()).toBe(confirm);

        confirm.leaveModalMode();
        expect(drawer.activeModalDialog()).toBe(drawer);
    });

    it("ignores leaveModalMode from a component that is not modal", async () => {
        const dialog = await mountLayer("dialog");
        const bystander = await mountLayer("bystander");
        dialog.enterModalMode();

        bystander.leaveModalMode();

        expect(bystander.activeModalDialog()).toBe(dialog);
    });

    it("hands a closed modal's level to the next one", async () => {
        const first = await mountLayer("first");
        const second = await mountLayer("second");
        first.enterModalMode();
        first.leaveModalMode();

        second.enterModalMode();

        expect(second.zIndex).toBe(1000);
        expect(second.activeModalDialog()).toBe(second);
    });

    it("renders the z-index it is given, since zIndex is a reactive prop", async () => {
        const dialog = await mountLayer("dialog");

        dialog.enterModalMode();
        await settle();

        expect(document.getElementById("dialog").style.zIndex).toBe("1000");
    });
});

// An overlay that paints the z-index the stack gives it.
type LayerProbeStruct = UIBaseStruct<{}>;

type LayerProbeParams = UIBaseParams<LayerProbeStruct>;
type LayerProbeModel = UIBaseModel<LayerProbeStruct>;

function useLayerProbe(params?: LayerProbeParams): LayerProbeModel {
    const struct: LayerProbeStruct = {
        props: {
            id: useLayerProbe.name
        },

        View: () => <div id={model.htmlId()} style={{ zIndex: model.zIndex }} />
    };

    const model = useUIBase(struct, params);
    return model;
}

const LayerProbe = UECA.getFC(useLayerProbe);
