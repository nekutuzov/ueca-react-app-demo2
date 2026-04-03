type UserContext = {
    user?: string;
    apiToken?: string;
}

type AppStorageKey = "sessionId" | "auto-login";

type Intent = "success" | "info" | "warning" | "error";

export { UserContext, AppStorageKey, Intent }
