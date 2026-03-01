type UserContext = {
    user?: string;
    apiToken?: string;
}

type Intent = "success" | "info" | "warning" | "error";

export { UserContext, Intent }
