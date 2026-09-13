import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as UECA from "ueca-react";
import { mount, settle, takeUecaErrors } from "@test";
import { ShowcaseCounter, ShowcaseCounterModel, ShowcaseCounterPhase } from "./showcaseCounter";

describe("ShowcaseCounter", () => {
    it("shows its label and a count that starts at zero, with no note", async () => {
        const { container } = await mount(ShowcaseCounter, { id: "counter", label: "cached (the default)" });

        expect(container.querySelector(".showcase-specimen-label")).toHaveTextContent("cached (the default)");
        expect(container.querySelector(".showcase-counter-value")).toHaveTextContent("0");
        expect(container.querySelector(".showcase-counter-note")).toBeNull();
    });

    it("shows a note when it has one, and follows a note assigned later", async () => {
        const { model, container } = await mount(ShowcaseCounter, { id: "counter", note: "rev 0" });
        expect(container.querySelector(".showcase-counter-note")).toHaveTextContent("rev 0");

        model.note = "rev 1";
        await settle();

        expect(container.querySelector(".showcase-counter-note")).toHaveTextContent("rev 1");
    });

    it("counts up with its +1 button", async () => {
        const { model, container } = await mount(ShowcaseCounter, { id: "counter" });

        await userEvent.click(screen.getByRole("button", { name: "+1" }));
        await userEvent.click(screen.getByRole("button", { name: "+1" }));

        expect(model.count).toBe(2);
        expect(container.querySelector(".showcase-counter-value")).toHaveTextContent("2");
    });

    it("reports created with its own model on its first activation", async () => {
        const onLifecycle = vi.fn();

        const { model } = await mount(ShowcaseCounter, { id: "counter", onLifecycle });

        expect(onLifecycle).toHaveBeenCalledOnce();
        expect(onLifecycle).toHaveBeenCalledWith("created", model);
    });

    it("reports deactivated when it goes away", async () => {
        const onLifecycle = vi.fn();
        const { model, unmount } = await mount(ShowcaseCounter, { id: "counter", onLifecycle });

        unmount();
        await settle();

        expect(onLifecycle).toHaveBeenLastCalledWith("deactivated", model);
    });

    it("runs its lifecycle without an onLifecycle handler", async () => {
        const { unmount } = await mount(ShowcaseCounter, { id: "counter" });

        unmount();
        await settle();

        // An unguarded call to the missing handler would surface here as a failed init/deinit.
        expect(takeUecaErrors()).toEqual([]);
    });

    describe("inside an owner that mounts and unmounts it", () => {
        it("reports restored, still holding its count, when its cached model comes back", async () => {
            const phases: ShowcaseCounterPhase[] = [];
            const { model: host } = await mount(CounterHost, { id: "host", onLifecycle: (phase) => { phases.push(phase); } });
            await userEvent.click(screen.getByRole("button", { name: "+1" }));
            await userEvent.click(screen.getByRole("button", { name: "+1" }));

            host.shown = false;
            await settle();
            expect(screen.queryByRole("button", { name: "+1" })).toBeNull();
            host.shown = true;
            await settle();

            expect(phases).toEqual(["created", "deactivated", "restored"]);
            expect(document.querySelector(".showcase-counter-value")).toHaveTextContent("2");
        });

        it("reports created again, from zero, when it is not cacheable", async () => {
            const phases: ShowcaseCounterPhase[] = [];
            const { model: host } = await mount(CounterHost, {
                id: "host",
                cacheable: false,
                onLifecycle: (phase) => { phases.push(phase); }
            });
            await userEvent.click(screen.getByRole("button", { name: "+1" }));

            host.shown = false;
            await settle();
            host.shown = true;
            await settle();

            expect(phases).toEqual(["created", "deactivated", "created"]);
            expect(document.querySelector(".showcase-counter-value")).toHaveTextContent("0");
        });
    });
});

// Owns one counter and renders it only while `shown`, the way the Dynamic Content topic does.
type CounterHostStruct = UECA.ComponentStruct<{
    props: {
        shown: boolean;
        cacheable: boolean;
    };

    events: {
        onLifecycle: (phase: ShowcaseCounterPhase, source: ShowcaseCounterModel) => void;
    };
}>;

function useCounterHost(params?: UECA.ComponentParams<CounterHostStruct>) {
    const struct: CounterHostStruct = {
        props: {
            id: useCounterHost.name,
            shown: true,
            cacheable: true
        },

        events: {
            onLifecycle: undefined
        },

        View: () => (
            <div id={model.htmlId()}>
                {model.shown
                    ? <ShowcaseCounter
                        id="counter"
                        cacheable={model.cacheable}
                        onLifecycle={(phase, source) => model.onLifecycle?.(phase, source)}
                    />
                    : null}
            </div>
        )
    };

    const model = UECA.useComponent(struct, params);
    return model;
}

const CounterHost = UECA.getFC(useCounterHost);
