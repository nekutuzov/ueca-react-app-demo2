import { describe, expect, it, vi } from "vitest";
import * as UECA from "ueca-react";
import { ScreenBaseModel, ScreenBaseParams, ScreenBaseStruct, useScreenBase } from "@components";
import { AppRoute } from "@core";
import { mount, settle, stubMessages } from "@test";

// A stand-in router holding one address: SetRouteParams patches or replaces its params (after a
// beat, as the real one awaits history), GetRoute reads it back.
async function stubRouter(initialParams: Record<string, unknown>) {
    let current = { path: "/showcase/overview", params: initialParams };
    return await stubMessages({
        "App.Router.SetRouteParams": vi.fn(async ({ params, patch }) => {
            await UECA.sleep(5);
            current = { ...current, params: patch ? { ...current.params, ...params } : params };
        }),
        "App.Router.GetRoute": vi.fn(async () => current as unknown as AppRoute)
    });
}

function screenText(): string {
    return document.getElementById("screen").textContent;
}

describe("useScreenBase", () => {
    it("starts with empty route params", async () => {
        const { model } = await mount(ScreenProbe, { id: "screen" });

        expect(model.routeParams).toEqual({});
        expect(screenText()).toBe("{}");
    });

    it("updateRouteParams patches the address, then reads the route back into routeParams", async () => {
        const bus = await stubRouter({ tab: "api", page: 2 });
        const { model } = await mount(ScreenProbe, { id: "screen" });

        await model.updateRouteParams({ tab: "props" }, true);

        const setParams = bus["App.Router.SetRouteParams"];
        const getRoute = bus["App.Router.GetRoute"];
        expect(setParams).toHaveBeenCalledWith({ params: { tab: "props" }, patch: true });
        expect(getRoute).toHaveBeenCalledOnce();
        expect(setParams.mock.invocationCallOrder[0]).toBeLessThan(getRoute.mock.invocationCallOrder[0]);
        // The router's view of the address, not merely the patch that was sent.
        expect(model.routeParams).toEqual({ tab: "props", page: 2 });
    });

    it("replaces the params, sending an explicit patch: false, when patch is left out", async () => {
        const bus = await stubRouter({ tab: "api", page: 2 });
        const { model } = await mount(ScreenProbe, { id: "screen" });

        await model.updateRouteParams({ tab: "props" });

        expect(bus["App.Router.SetRouteParams"].mock.calls[0][0]).toStrictEqual({ params: { tab: "props" }, patch: false });
        expect(model.routeParams).toEqual({ tab: "props" });
    });

    it("re-renders a view that reads routeParams", async () => {
        await stubRouter({});
        const { model } = await mount(ScreenProbe, { id: "screen" });

        await model.updateRouteParams({ id: "42" }, true);
        await settle();

        expect(screenText()).toBe('{"id":"42"}');
    });
});

// A screen that prints the route params it holds.
type ScreenProbeStruct = ScreenBaseStruct<{}>;

type ScreenProbeParams = ScreenBaseParams<ScreenProbeStruct>;
type ScreenProbeModel = ScreenBaseModel<ScreenProbeStruct>;

function useScreenProbe(params?: ScreenProbeParams): ScreenProbeModel {
    const struct: ScreenProbeStruct = {
        props: {
            id: useScreenProbe.name
        },

        View: () => <div id={model.htmlId()}>{JSON.stringify(model.routeParams)}</div>
    };

    const model = useScreenBase(struct, params);
    return model;
}

const ScreenProbe = UECA.getFC(useScreenProbe);
