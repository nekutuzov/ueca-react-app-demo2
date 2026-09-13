import { DetailedError } from "@core";

// API client interface
interface IRestApiClient {
    get token(): string;
    set token(value: string);
    get<T>(url: string, params?: Record<string, unknown>, returnsStream?: boolean): Promise<T>;
    post<T, T2 = void>(url: string, params?: Record<string, unknown>, body?: T, returnsStream?: boolean): Promise<T2>;
    postFormData<T>(url: string, params?: Record<string, unknown>, body?: FormData, returnsStream?: boolean): Promise<T>;
    getUrl(url: string, params?: Record<string, unknown>): string;
}

// REST API client implementation
class RestApiClient implements IRestApiClient {
    private readonly _baseUrl: string;
    private readonly _onUnauthorizedResponse: () => void;
    private _token: string;

    constructor(baseUrl: string, onUnauthorizedResponse?: () => void) {
        this._baseUrl = baseUrl;
        this._onUnauthorizedResponse = onUnauthorizedResponse;
    }

    get token() {
        return this._token;
    }

    set token(value: string) {
        this._token = value;
    }

    public async get<T>(url: string, params: Record<string, unknown> = {}, returnsStream?: boolean): Promise<T> {
        const requestURL = this._createRequestURL(url, params);
        const accept = this._getAcceptHeaderValue(returnsStream);
        const requestInit: Partial<RequestInit> = {
            method: "GET",
            headers: { "Accept": accept }
        }
        const response = await this._fetch(requestURL, this._setHeaders(requestInit));
        return await this._processResponse(response);
    }

    getUrl(url: string, params?: Record<string, unknown>): string {
        return this._createRequestURL(url, params);
    }

    public async post<T, T2>(url: string, params: Record<string, unknown> = {}, body?: T, returnsStream?: boolean): Promise<T2> {
        const requestUrl = this._createRequestURL(url, params);
        const accept = this._getAcceptHeaderValue(returnsStream);
        const requestInit: Partial<RequestInit> = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": accept
            },
            body: JSON.stringify(body)
        }
        const response = await this._fetch(requestUrl, this._setHeaders(requestInit));
        return await this._processResponse(response);
    }

    public async postFormData<T>(url: string, params: Record<string, unknown> = {}, formData?: FormData, returnsStream?: boolean): Promise<T> {
        const requestUrl = this._createRequestURL(url, params);
        const accept = this._getAcceptHeaderValue(returnsStream);
        const requestInit: Partial<RequestInit> = {
            method: "POST",
            headers: {
                "Accept": accept
            },
            body: formData
        };
        const response = await this._fetch(requestUrl, this._setHeaders(requestInit));
        return await this._processResponse(response);
    }

    private async _fetch(url: string, requestInit: RequestInit): Promise<Response> {
        try {
            return await window.fetch(url, requestInit);
        } catch (error) {
            throw new DetailedError("Connection Error",
                "Unable to communicate with the server. Please check your network connection.",
                `Requested URL: ${url}\nInternal Error: ${(error as Error).message}`,
                (error as Error).stack
            );
        }
    }

    private _setHeaders(requestInit: RequestInit) {
        requestInit.credentials = "same-origin";
        if (this._token?.length) {
            requestInit.headers["Authorization"] = `Bearer ${this._token}`;
        }
        return requestInit;
    }

    private _replaceDynamicParams(url: string, params: Record<string, unknown>) {
        const updatedParams: Record<string, unknown> = params;
        const dynamicParamExpression: RegExp = new RegExp(/:([^:/]*)/, "g");
        const updatedUrl = url?.replace(dynamicParamExpression, param => {
            const paramName = param.slice(1);
            // A value, not merely a key: undefined and null are as missing as an absent key. Checked
            // for the key alone, they went into the path as the text "undefined" or "null", and the
            // request went to /users/undefined instead of failing.
            if (updatedParams[paramName] != null) {
                const parameter = updatedParams[paramName];
                delete updatedParams[paramName];
                // Encoded, so the value stays one path segment. Spliced in as it was, a "?" started the
                // query (which the search assignment then overwrote) and a "/" or "#" moved the
                // request somewhere else: "what?.txt" requested /files/what.
                return encodeURIComponent((typeof parameter === "string") ? parameter : JSON.stringify(parameter));
            } else {
                throw new Error(`Parameter "${paramName}" not found. URL: ${url}`);
            }
        });
        return { updatedUrl, updatedParams: updatedParams };
    }

    private _createRequestURL(url: string, params: Record<string, unknown>): string {
        // A copy: substitution deletes each path param it consumes. Handed the caller's object, it
        // emptied it, and the same params used again — a retry, a refresh — failed with
        // 'Parameter "id" not found'.
        const { updatedUrl, updatedParams } = this._replaceDynamicParams(url, { ...params });
        const searchParams = new URLSearchParams();
        for (const param in updatedParams) {
            // Only null and undefined mean "no value". The loop tested truthiness, so 0, false and ""
            // were dropped too — { page: 0 } or { active: false } never reached the server.
            const value = updatedParams[param];
            if (value != null) {
                searchParams.append(param, JSON.stringify(value));
            }
        }
        const fullUrl = new URL(this._baseUrl + updatedUrl);
        fullUrl.search = searchParams.toString();
        return fullUrl.href;
    }

    private _isContentLengthIsZero(response: Response): boolean {
        if (!response.headers?.has("content-length")) return false;
        return Number.parseInt(response.headers.get("content-length")) === 0;
    }

    private _isJson(response: Response): boolean {
        if (!response.headers?.has("content-type")) return false;
        return response.headers.get("content-type").includes("application/json");
    }

    private _isStream(response: Response): boolean {
        if (!response.headers?.has("content-type")) return false;
        return response.headers.get("content-type").includes("application/octet-stream");
    }

    private _getFileName(response: Response): string {
        if (!response.headers?.has("content-disposition")) {
            return undefined;
        }

        const contentDisposition = response.headers.get("content-disposition");
        let fileNameMatch = contentDisposition
            ? /filename\*=(?:(\\?['"])(.*?)\1|(?:\S+'.*?')?([^;\n]*))/g.exec(contentDisposition)
            : undefined;
        let fileName = fileNameMatch && fileNameMatch.length > 1
            ? fileNameMatch[3] || fileNameMatch[2]
            : undefined;
        if (fileName) {
            fileName = decodeURIComponent(fileName);
        } else {
            fileNameMatch = contentDisposition
                ? /filename="?([^"]*?)"?(;|$)/g.exec(contentDisposition)
                : undefined;
            fileName = fileNameMatch && fileNameMatch.length > 1
                ? fileNameMatch[1]
                : undefined;
        }
        return fileName;
    }

    private async _processBlob(response: Response): Promise<File> {
        const blob = await response.blob();
        // Unnamed by the server, the file gets an empty name, which a caller can tell apart and a
        // browser saves under its own default. new File([blob], undefined) named it "undefined".
        const fileName = this._getFileName(response) ?? "";
        return new File([blob], fileName);
    }

    private async _processResponse<T>(response: Response): Promise<T> {
        if (response.ok && !response.bodyUsed) {
            if (!this._isContentLengthIsZero(response)) {
                if (this._isStream(response)) {
                    return await this._processBlob(response) as T;
                }
                // Read as text so an empty body resolves undefined. A success need not declare
                // content-length 0 to have no body — a 204 No Content must not send the header at
                // all — and parsing its "" as JSON rejected the request.
                const text = await response.text();
                return text ? JSON.parse(text) : undefined;
            }
        } 
        
        if (response.status === HTTP_STATUS.Unauthorized) {
            this._onUnauthorizedResponse?.();
        }
        
        if (!response.bodyUsed) {
            if (!this._isContentLengthIsZero(response)) {
                if (this._isJson(response)) {
                    const errorObject = await response.json();
                    throw new DetailedError(response.statusText, errorObject.errorText, errorObject.errorDetails, errorObject.errorCallStack);
                } else {
                    const errorText = await response.text();
                    throw new DetailedError(response.statusText, errorText);
                }
            }
        } else {
            if (response.statusText) {
                throw new Error(`${response.statusText}`);
            }
        }

        // An error with nothing to read is still an error: a body declared empty (a server's bare
        // 500), or one already read with no status text (HTTP/2 sends none). Falling out of the
        // checks above resolved it as undefined, and the caller carried on as if it had succeeded.
        if (!response.ok) {
            const status = `${response.status}${response.statusText ? ` ${response.statusText}` : ""}`;
            throw new DetailedError(response.statusText || `HTTP ${response.status}`, `The server responded with ${status}.`);
        }
    }

    private _getAcceptHeaderValue(returnsStream?: boolean): string {
        return (returnsStream) ? "application/octet-stream" : "application/json";
    }
}

const HTTP_STATUS = {
    Unauthorized: 401
};

function createRestAPIClient(baseUrl: string, onUnauthorizedResponse?: () => void): IRestApiClient {
    return new RestApiClient(baseUrl, onUnauthorizedResponse);
}

export { IRestApiClient, createRestAPIClient };
