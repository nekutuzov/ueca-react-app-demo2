import * as UECA from "ueca-react";
import { act, render, RenderOptions, RenderResult } from "@testing-library/react";
import type { AppMessage } from "@core";
import { takeUecaErrors } from "./uecaErrors";

// Helpers for driving UECA components from tests.
//
// A UECA component draws NOTHING on its first render: the model initialises asynchronously and the
// View appears afterwards. So a test never asserts straight after render() — it awaits mount(),
// which resolves once the component has run its lifecycle up to `mount` and hands back its model.

// Any functional component made by UECA.getFC.
type AnyComponent = (params: any) => UECA.ReactElement;

type ParamsOf<C extends AnyComponent> = NonNullable<Parameters<C>[0]>;

// The model type, recovered from the `init` hook every UECA params type carries.
type ModelOf<C extends AnyComponent> =
    NonNullable<ParamsOf<C>["init"]> extends (model: infer M) => unknown ? M : never;

type MountResult<C extends AnyComponent> = RenderResult & {
    model: ModelOf<C>;
    // Re-renders with new JSX params — the "standing declaration" path, re-applied on every
    // render — and waits for the update to settle.
    update: (params: ParamsOf<C>) => Promise<void>;
};

const MOUNT_TIMEOUT_MS = 3000;

async function mount<C extends AnyComponent>(
    Component: C,
    params?: ParamsOf<C>,
    options?: RenderOptions
): Promise<MountResult<C>> {
    let model: ModelOf<C>;
    let resolveMounted: () => void;
    const mounted = new Promise<void>((resolve) => { resolveMounted = resolve; });

    // The same hook functions on every render, chained in front of any the test passed.
    const init = async (m: ModelOf<C>) => {
        model = m;
        await current?.init?.(m);
    };
    const mountHook = async (m: ModelOf<C>) => {
        await current?.mount?.(m);
        resolveMounted();
    };
    let current = params;
    const element = () => <Component {...current} init={init} mount={mountHook} />;

    const result = render(element(), options);
    await _waitFor(mounted, `${Component.name || "component"} did not mount`);
    await settle();

    return {
        ...result,
        model,
        update: async (next) => {
            current = next;
            await act(async () => { result.rerender(element()); });
            await settle();
        }
    };
}

// Lets pending model changes, bus replies and re-renders run to completion.
async function settle(ms = 0) {
    await act(async () => { await UECA.sleep(ms); });
}

type MessageHandlers = Partial<UECA.BusMessageHandlers<AppMessage>>;

type MessageStubStruct = UECA.ComponentStruct<{ props: {} }, AppMessage>;

let stubCount = 0;

// Mounts a component that answers the given bus messages, in place of the real service. Returns
// the handlers so a test can assert on them when they are mocks:
//
//     const bus = await stubMessages({ "Dialog.Confirmation": vi.fn(async () => true) });
//     ...
//     expect(bus["Dialog.Confirmation"]).toHaveBeenCalledWith({ title: "Delete", message: "..." });
async function stubMessages<H extends MessageHandlers>(handlers: H): Promise<H> {
    function useMessageStub(params?: UECA.ComponentParams<MessageStubStruct, AppMessage>) {
        const struct: MessageStubStruct = {
            props: {
                id: useMessageStub.name
            },

            messages: handlers,

            View: () => null
        };

        const model = UECA.useComponent(struct, params);
        return model;
    }

    const MessageStub = UECA.getFC(useMessageStub);
    await mount(MessageStub, { id: `messageStub${++stubCount}` });
    return handlers;
}

async function _waitFor(promise: Promise<void>, failure: string) {
    let timer: ReturnType<typeof setTimeout>;
    const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
            const errors = takeUecaErrors().map((e) => e?.message).join("; ");
            reject(new Error(`${failure} within ${MOUNT_TIMEOUT_MS}ms${errors ? ` — UECA errors: ${errors}` : ""}`));
        }, MOUNT_TIMEOUT_MS);
    });
    try {
        await act(async () => { await Promise.race([promise, timeout]); });
    } finally {
        clearTimeout(timer);
    }
}

export { mount, settle, stubMessages };
export type { MountResult, ModelOf, ParamsOf };
