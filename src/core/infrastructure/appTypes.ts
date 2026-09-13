// The signed-in user. This demo has no server, so the context is issued locally on sign-in; a real
// application would receive it from its authentication API.
type UserContext = {
    user?: string;
    apiToken?: string;
}

// Storage keys. Declared once so a typo is a compile error rather than a silently separate record.
const AppStorageKeys = {
    userContext: "user-context",
    lastUsedRoute: "last-used-route"
} as const;

type AppStorageKey = typeof AppStorageKeys[keyof typeof AppStorageKeys];

// Keys this app used to write and no longer understands. Cleared once at startup so a stale record
// cannot outlive the code that read it. Typed as the key union so an entry still in use cannot be
// listed here by mistake — which would sign the user out on every reload.
const RETIRED_STORAGE_KEYS: readonly string[] = [];

type Intent = "success" | "info" | "warning" | "error";

export { UserContext, AppStorageKeys, AppStorageKey, RETIRED_STORAGE_KEYS, Intent }
