type UserContext = {
    user?: string;
    apiToken?: string;
}

type AppStorageKey = "user-context" | "last-used-route";

type Intent = "success" | "info" | "warning" | "error";

export { UserContext, AppStorageKey, Intent }
