import { describe, expect, it, vi } from "vitest";
import { createRestAPIClient } from "@api";
import { DetailedError } from "@core";

const BASE = "http://localhost:8080/api";

function jsonResponse(body: unknown, init: ResponseInit = {}) {
    return new Response(JSON.stringify(body), {
        ...init,
        headers: { "content-type": "application/json", ...(init.headers as Record<string, string>) }
    });
}

// window.fetch answers with a fresh response per call: a body can be read only once.
function serve(respond: () => Response | Promise<Response> = () => jsonResponse({ ok: true })) {
    return vi.spyOn(window, "fetch").mockImplementation(async () => await respond());
}

function requestOf(fetch: ReturnType<typeof serve>, call = 0) {
    const [url, init] = fetch.mock.calls[call];
    return { url: url as string, init: init as RequestInit };
}

async function rejectionOf(promise: Promise<unknown>): Promise<DetailedError> {
    try {
        await promise;
    } catch (error) {
        return error as DetailedError;
    }
    throw new Error("expected the request to reject");
}

describe("RestApiClient", () => {
    describe("requests", () => {
        it("GETs JSON from the base URL with same-origin credentials and no token", async () => {
            const fetch = serve();
            const client = createRestAPIClient(BASE);

            await client.get("/users");

            expect(client.token).toBeUndefined();
            expect(fetch).toHaveBeenCalledExactlyOnceWith(`${BASE}/users`, {
                method: "GET",
                headers: { Accept: "application/json" },
                credentials: "same-origin"
            });
        });

        it("POSTs a JSON body", async () => {
            const fetch = serve();

            await createRestAPIClient(BASE).post("/users", {}, { name: "Ada", roles: ["admin"] });

            expect(fetch).toHaveBeenCalledExactlyOnceWith(`${BASE}/users`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({ name: "Ada", roles: ["admin"] }),
                credentials: "same-origin"
            });
        });

        // No Content-Type: the browser has to write the multipart boundary itself.
        it("posts FormData as the body and leaves its content type to the browser", async () => {
            const fetch = serve();
            const form = new FormData();
            form.append("file", "content");

            await createRestAPIClient(BASE).postFormData("/upload", {}, form);

            const { init } = requestOf(fetch);
            expect(init.method).toBe("POST");
            expect(init.body).toBe(form);
            expect(init.headers).toEqual({ Accept: "application/json" });
        });

        it.each([
            ["get", (c: ReturnType<typeof createRestAPIClient>) => c.get("/file", {}, true)],
            ["post", (c: ReturnType<typeof createRestAPIClient>) => c.post("/file", {}, {}, true)],
            ["postFormData", (c: ReturnType<typeof createRestAPIClient>) => c.postFormData("/file", {}, new FormData(), true)]
        ])("%s asks for an octet-stream when a stream is expected", async (_method, send) => {
            const fetch = serve();

            await send(createRestAPIClient(BASE));

            expect(requestOf(fetch).init.headers).toMatchObject({ Accept: "application/octet-stream" });
        });

        it("sends the token as a bearer Authorization header once one is set", async () => {
            const fetch = serve();
            const client = createRestAPIClient(BASE);

            client.token = "T-123";
            await client.get("/me");
            await client.post("/me", {}, {});

            expect(client.token).toBe("T-123");
            expect(requestOf(fetch, 0).init.headers).toMatchObject({ Authorization: "Bearer T-123" });
            expect(requestOf(fetch, 1).init.headers).toMatchObject({ Authorization: "Bearer T-123" });
        });

        it("sends no Authorization header for an empty token", async () => {
            const fetch = serve();
            const client = createRestAPIClient(BASE);

            client.token = "";
            await client.get("/me");

            expect(requestOf(fetch).init.headers).not.toHaveProperty("Authorization");
        });
    });

    describe("URLs", () => {
        it("substitutes :params into the path, a string verbatim and anything else as JSON", async () => {
            const fetch = serve();

            await createRestAPIClient(BASE).get("/users/:userId/orders/:orderId", { userId: 7, orderId: "A-1" });

            expect(requestOf(fetch).url).toBe(`${BASE}/users/7/orders/A-1`);
        });

        it("rejects without fetching when a path param is missing", async () => {
            const fetch = serve();

            await expect(createRestAPIClient(BASE).get("/users/:id", { page: 1 })).rejects.toThrow('Parameter "id" not found. URL: /users/:id');
            expect(fetch).not.toHaveBeenCalled();
        });

        // Deliberate: path values special-case strings, query values never do. Every query value is
        // JSON, so a string arrives quoted and the server can tell "7" from 7.
        it("sends the remaining params as JSON-encoded query values", async () => {
            const fetch = serve();

            await createRestAPIClient(BASE).get("/users/:id", { id: 7, page: 2, sort: "name", filter: { active: true } });

            const url = new URL(requestOf(fetch).url);
            expect(url.pathname).toBe("/api/users/7");
            expect([...url.searchParams]).toEqual([["page", "2"], ["sort", '"name"'], ["filter", '{"active":true}']]);
            expect(url.search).toContain("sort=%22name%22");
        });

        it("omits null and undefined query values", async () => {
            const fetch = serve();

            await createRestAPIClient(BASE).get("/users", { page: null, sort: undefined });

            expect(requestOf(fetch).url).toBe(`${BASE}/users`);
        });

        // Regression: the query loop tested values for truthiness, so 0, false and "" were dropped as if
        // they were absent — { page: 0 } or { active: false } never reached the server.
        it.each([0, false, ""])("sends the query value %j", async (value) => {
            const fetch = serve();

            await createRestAPIClient(BASE).get("/items", { value });

            expect(new URL(requestOf(fetch).url).searchParams.get("value")).toBe(JSON.stringify(value));
        });

        it("getUrl keeps 0 and false among the query values while still omitting null", () => {
            const client = createRestAPIClient(BASE);

            expect(client.getUrl("/users", { page: 0, sort: null, archived: false })).toBe(`${BASE}/users?page=0&archived=false`);
        });

        // Regression: _replaceDynamicParams deleted each consumed key from the params object it was
        // handed (the caller's object, not a copy), so reusing params for a second request — a retry,
        // a refresh — failed with 'Parameter "id" not found'.
        it("leaves the caller's params untouched, so they can be reused", async () => {
            const fetch = serve();
            const client = createRestAPIClient(BASE);
            const params = { id: 7, page: 2 };

            await client.get("/users/:id", params);
            await client.get("/users/:id", params);

            expect(params).toEqual({ id: 7, page: 2 });
            expect(requestOf(fetch, 1).url).toBe(requestOf(fetch, 0).url);
        });

        // Regression: a path param was checked for key presence only, and JSON.stringify(undefined) was
        // then spliced in by String.replace as the text "undefined": the request went to /users/undefined
        // (or /users/null) instead of failing like a missing key does.
        it.each([undefined, null])("treats an explicit %s path value as missing", async (id) => {
            serve();

            await expect(createRestAPIClient(BASE).get("/users/:id", { id })).rejects.toThrow('Parameter "id" not found');
        });

        // BUG: path values are spliced in unencoded (restApiClient.ts:104), so a "?" in one starts the
        // query, which the search assignment then overwrites: the request silently goes to /files/what.
        it.fails("keeps a '?' inside a path value in the path", async () => {
            const fetch = serve();

            await createRestAPIClient(BASE).get("/files/:name", { name: "what?.txt" });

            expect(new URL(requestOf(fetch).url).pathname).toBe("/api/files/what%3F.txt");
        });

        it("getUrl builds the same URL without fetching", () => {
            const fetch = serve();
            const client = createRestAPIClient(BASE);

            expect(client.getUrl("/users/:id", { id: 7, tab: "orders" })).toBe(`${BASE}/users/7?tab=%22orders%22`);
            expect(client.getUrl("/users")).toBe(`${BASE}/users`);
            expect(fetch).not.toHaveBeenCalled();
        });
    });

    describe("responses", () => {
        it("resolves a JSON body", async () => {
            serve(() => jsonResponse({ id: 7, name: "Ada" }));

            await expect(createRestAPIClient(BASE).get("/users/7")).resolves.toEqual({ id: 7, name: "Ada" });
        });

        it("parses a body that is not declared as JSON as JSON all the same", async () => {
            serve(() => new Response('{"id":7}', { headers: { "content-type": "text/plain" } }));
            await expect(createRestAPIClient(BASE).get("/users/7")).resolves.toEqual({ id: 7 });

            serve(() => new Response("42"));
            await expect(createRestAPIClient(BASE).get("/count")).resolves.toBe(42);
        });

        // Deliberate: nothing to parse, and post<T, void> is the default.
        it("resolves undefined for a body declared empty, whatever its content type", async () => {
            serve(() => new Response(null, { status: 200, headers: { "content-length": "0", "content-type": "application/json" } }));

            await expect(createRestAPIClient(BASE).post("/users/7/touch", {}, {})).resolves.toBeUndefined();
        });

        // Regression: a success without a content-length header was parsed as JSON even when it had no
        // body, and a 204 No Content must not send that header — so JSON.parse("") rejected a request
        // that had succeeded, with a SyntaxError.
        it("resolves undefined for 204 No Content", async () => {
            serve(() => new Response(null, { status: 204 }));

            await expect(createRestAPIClient(BASE).post("/users/7/touch", {}, {})).resolves.toBeUndefined();
        });

        it.each([
            ["a 204 that still declares JSON", () => new Response(null, { status: 204, headers: { "content-type": "application/json" } })],
            ["a 200 with an empty body and no content-length", () => new Response("", { status: 200 })]
        ])("resolves undefined for %s", async (_case, respond) => {
            serve(respond);

            await expect(createRestAPIClient(BASE).get("/users/7")).resolves.toBeUndefined();
        });

        it("resolves an octet-stream as a File named by content-disposition", async () => {
            serve(() => new Response("%PDF-1.7", {
                headers: { "content-type": "application/octet-stream", "content-disposition": 'attachment; filename="report.pdf"' }
            }));

            const file = await createRestAPIClient(BASE).get<File>("/reports/7", {}, true);

            expect(file).toBeInstanceOf(File);
            expect(file.name).toBe("report.pdf");
            expect(await file.text()).toBe("%PDF-1.7");
        });

        it.each([
            ["a quoted filename", 'attachment; filename="report.pdf"', "report.pdf"],
            ["an unquoted filename", "attachment; filename=report.pdf", "report.pdf"],
            ["a filename followed by more parameters", 'attachment; filename="report.pdf"; size=120', "report.pdf"],
            ["an RFC 5987 filename*", "attachment; filename*=UTF-8''na%C3%AFve%20report.pdf", "naïve report.pdf"],
            ["a quoted filename*", 'attachment; filename*="annual%20report.pdf"', "annual report.pdf"],
            ["filename* beside a plain fallback", "attachment; filename=\"fallback.pdf\"; filename*=UTF-8''r%C3%A9sum%C3%A9.pdf", "résumé.pdf"]
        ])("reads %s from content-disposition", async (_case, disposition, name) => {
            serve(() => new Response("data", {
                headers: { "content-type": "application/octet-stream", "content-disposition": disposition }
            }));

            const file = await createRestAPIClient(BASE).get<File>("/download", {}, true);

            expect(file.name).toBe(name);
        });

        // BUG: _getFileName returns undefined when nothing names the file, and `new File([blob],
        // undefined)` stringifies it (restApiClient.ts:171): the download is literally named "undefined".
        it.fails.each([
            ["no content-disposition", {}],
            ["a disposition without a filename", { "content-disposition": "inline" }],
            ["an empty disposition", { "content-disposition": "" }]
        ])("does not name a file \"undefined\" when the response has %s", async (_case, disposition) => {
            serve(() => new Response("data", { headers: { "content-type": "application/octet-stream", ...disposition } }));

            const file = await createRestAPIClient(BASE).get<File>("/download", {}, true);

            expect(file.name).not.toBe("undefined");
        });
    });

    describe("errors", () => {
        it("rejects with the server's error object as a DetailedError", async () => {
            serve(() => jsonResponse(
                { errorText: "Order is locked", errorDetails: "Order 7 is open in another session", errorCallStack: "at OrderService.save" },
                { status: 409, statusText: "Conflict" }
            ));

            const error = await rejectionOf(createRestAPIClient(BASE).post("/orders/7", {}, {}));

            expect(error).toBeInstanceOf(DetailedError);
            expect(error).toMatchObject({
                name: "Conflict",
                message: "Order is locked",
                details: "Order 7 is open in another session",
                stack: "at OrderService.save"
            });
        });

        // DetailedError keeps its own stack when the API sends a null errorCallStack.
        it("keeps the client-side stack when the server sends none", async () => {
            serve(() => jsonResponse({ errorText: "Boom", errorCallStack: null }, { status: 500, statusText: "Internal Server Error" }));

            const error = await rejectionOf(createRestAPIClient(BASE).get("/boom"));

            expect(error.stack).toContain("restApiClient");
        });

        it("rejects with a text error body as the message", async () => {
            serve(() => new Response("Invalid order number", { status: 400, statusText: "Bad Request" }));

            const error = await rejectionOf(createRestAPIClient(BASE).get("/orders/x"));

            expect(error).toBeInstanceOf(DetailedError);
            expect(error).toMatchObject({ name: "Bad Request", message: "Invalid order number", details: undefined });
        });

        it("reports a 401 to onUnauthorizedResponse and still rejects", async () => {
            serve(() => new Response("Token expired", { status: 401, statusText: "Unauthorized" }));
            const onUnauthorized = vi.fn();

            await expect(createRestAPIClient(BASE, onUnauthorized).get("/me")).rejects.toMatchObject({ name: "Unauthorized" });
            expect(onUnauthorized).toHaveBeenCalledOnce();
        });

        it("rejects a 401 without an onUnauthorizedResponse callback", async () => {
            serve(() => new Response("Token expired", { status: 401, statusText: "Unauthorized" }));

            await expect(createRestAPIClient(BASE).get("/me")).rejects.toBeInstanceOf(DetailedError);
        });

        it("does not report other errors as unauthorized", async () => {
            serve(() => new Response("Forbidden", { status: 403, statusText: "Forbidden" }));
            const onUnauthorized = vi.fn();

            await expect(createRestAPIClient(BASE, onUnauthorized).get("/admin")).rejects.toBeInstanceOf(DetailedError);
            expect(onUnauthorized).not.toHaveBeenCalled();
        });

        // Regression: the error path threw only when there was a body to read, and nothing followed
        // it, so an error with an empty body — a 500 declared content-length 0, which is what a server
        // sends for an unhandled exception it has no error page for — RESOLVED undefined, and the
        // caller carried on as if the request had succeeded.
        it.each([
            [500, "Internal Server Error"],
            [404, "Not Found"]
        ])("rejects a %i whose body is declared empty", async (status, statusText) => {
            serve(() => new Response(null, { status, statusText, headers: { "content-length": "0" } }));

            const error = await rejectionOf(createRestAPIClient(BASE).post("/orders/7", {}, {}));

            expect(error).toBeInstanceOf(DetailedError);
            expect(error).toMatchObject({ name: statusText, message: `The server responded with ${status} ${statusText}.` });
        });

        it("reports an empty 401 to onUnauthorizedResponse and still rejects", async () => {
            serve(() => new Response(null, { status: 401, statusText: "Unauthorized", headers: { "content-length": "0" } }));
            const onUnauthorized = vi.fn();

            await expect(createRestAPIClient(BASE, onUnauthorized).get("/me")).rejects.toMatchObject({ name: "Unauthorized" });
            expect(onUnauthorized).toHaveBeenCalledOnce();
        });

        it("reports the status text when the error body has already been read", async () => {
            serve(async () => {
                const response = new Response("down for maintenance", { status: 503, statusText: "Service Unavailable" });
                await response.text();
                return response;
            });

            await expect(createRestAPIClient(BASE).get("/status")).rejects.toThrow("Service Unavailable");
        });

        // Regression: the same fall-through resolved an error whose body had been read when it had no
        // status text to report, and HTTP/2 responses never carry one.
        it("rejects an error whose body has been read and that has no status text, naming the status", async () => {
            serve(async () => {
                const response = new Response("down for maintenance", { status: 503 });
                await response.text();
                return response;
            });

            await expect(createRestAPIClient(BASE).get("/status")).rejects.toMatchObject({
                name: "HTTP 503",
                message: "The server responded with 503."
            });
        });

        // BUG: the error path reads a body unless it is declared empty, but an empty body need not
        // declare content-length 0 — the gap the success path had for 204 (restApiClient.ts:193-199).
        // Declared JSON, it rejects with SyntaxError "Unexpected end of JSON input"; otherwise with a
        // blank message, and on HTTP/2, which sends no status text, a blank name as well.
        it.fails.each([
            ["declared JSON", { "content-type": "application/json" }],
            ["of no declared type", {}]
        ])("names the status for an error whose empty body is %s but not declared empty", async (_case, headers) => {
            serve(() => new Response(null, { status: 500, statusText: "Internal Server Error", headers }));

            const error = await rejectionOf(createRestAPIClient(BASE).get("/boom"));

            expect(error).toBeInstanceOf(DetailedError);
            expect(error).toMatchObject({ name: "Internal Server Error", message: "The server responded with 500 Internal Server Error." });
        });

        it("wraps a network failure in a Connection Error that names the URL", async () => {
            const failure = new TypeError("Failed to fetch");
            vi.spyOn(window, "fetch").mockRejectedValue(failure);

            const error = await rejectionOf(createRestAPIClient(BASE).get("/users", { page: 1 }));

            expect(error).toBeInstanceOf(DetailedError);
            expect(error).toMatchObject({
                name: "Connection Error",
                message: "Unable to communicate with the server. Please check your network connection.",
                details: `Requested URL: ${BASE}/users?page=1\nInternal Error: Failed to fetch`,
                stack: failure.stack
            });
        });
    });
});
