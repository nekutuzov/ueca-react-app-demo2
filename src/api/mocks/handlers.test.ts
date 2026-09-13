import { beforeEach, describe, expect, it, vi } from "vitest";
import { getResponse, RequestHandler } from "msw";
import { setupWorker } from "msw/browser";
import { apiBaseUrl, initMocks } from "@api";

// No service worker can run under jsdom: the browser half of msw is replaced, and the handlers the
// app registers are exercised through msw's own request matching instead.
const worker = vi.hoisted(() => ({ start: vi.fn(async () => undefined) }));

vi.mock("msw/browser", () => ({ setupWorker: vi.fn(() => worker) }));

// public/mockServiceWorker.js is read from disk; the test tsconfig carries no Node typings, so the
// one Node API used is typed here.
declare const process: { getBuiltinModule(id: "node:fs"): { readFileSync(path: string, encoding: "utf8"): string } };

function workerScript(): string {
    const dir = (import.meta as ImportMeta & { dirname: string }).dirname;
    return process.getBuiltinModule("node:fs").readFileSync(`${dir}/../../../public/mockServiceWorker.js`, "utf8");
}

function startMocks(): RequestHandler[] {
    vi.useFakeTimers();
    initMocks();
    vi.advanceTimersByTime(10);
    vi.useRealTimers();
    return vi.mocked(setupWorker).mock.calls[0] as RequestHandler[];
}

beforeEach(() => {
    vi.mocked(setupWorker).mockClear();
    worker.start.mockClear();
});

describe("initMocks", () => {
    // Deferred so the worker's setup stays off the main thread while the app starts.
    it("starts the mock service worker 10ms after startup, not during it", () => {
        vi.useFakeTimers();

        initMocks();
        vi.advanceTimersByTime(9);
        expect(setupWorker).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        expect(setupWorker).toHaveBeenCalledOnce();
        expect(worker.start).toHaveBeenCalledExactlyOnceWith({
            serviceWorker: { url: "/ueca-react-app-demo2/mockServiceWorker.js" },
            onUnhandledRequest: "bypass"
        });
    });

    // The app is served under its base path, so the worker script has to be requested from there —
    // and it is the file msw generated into public/.
    it("points the worker at the generated script under the app's base path", () => {
        startMocks();
        const [{ serviceWorker }] = worker.start.mock.calls[0] as unknown as [{ serviceWorker: { url: string } }];

        expect(new URL(serviceWorker.url, window.location.href).href).toBe(new URL("mockServiceWorker.js", window.location.href).href);
        expect(workerScript()).toContain("Mock Service Worker");
    });

    it("answers GET /hello with a greeting", async () => {
        const handlers = startMocks();

        const response = await getResponse(handlers, new Request(`${apiBaseUrl}/hello`));

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ message: "Hello from MSW!" });
    });

    // Anything else passes through to the network (onUnhandledRequest: "bypass").
    it("mocks no other request", async () => {
        const handlers = startMocks();

        expect(await getResponse(handlers, new Request(`${apiBaseUrl}/users`))).toBeUndefined();
        expect(await getResponse(handlers, new Request(`${apiBaseUrl}/hello`, { method: "POST" }))).toBeUndefined();
    });
});
