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
            if (Object.prototype.hasOwnProperty.call(updatedParams, paramName)) {
                const parameter = updatedParams[paramName];
                delete updatedParams[paramName];
                return (typeof parameter === "string") ? parameter : JSON.stringify(parameter);
            } else {
                throw new Error(`Parameter "${paramName}" not found. URL: ${url}`);
            }
        });
        return { updatedUrl, updatedParams: updatedParams };
    }

    private _createRequestURL(url: string, params: Record<string, unknown>): string {
        const { updatedUrl, updatedParams } = this._replaceDynamicParams(url, params);
        const searchParams = new URLSearchParams();
        for (const param in updatedParams) {
            if (updatedParams[param]) {
                searchParams.append(param, JSON.stringify(updatedParams[param]));
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
        const fileName = this._getFileName(response);
        return new File([blob], fileName);
    }

    private async _processResponse<T>(response: Response): Promise<T> {
        if (response.ok && !response.bodyUsed) {
            if (!this._isContentLengthIsZero(response)) {
                return (this._isJson(response))
                    ? await response.json()
                    : (this._isStream(response))
                        ? await this._processBlob(response) as T
                        : JSON.parse(await response.text());
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
