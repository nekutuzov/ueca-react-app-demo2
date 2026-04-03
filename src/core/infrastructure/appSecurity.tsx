import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";
import { UserContext } from "@core";

type AppSecurityStruct = UIBaseStruct<{
    props: {
        _userContext: UserContext;
    }

    methods: {
        isAuthorized: () => boolean;
        authorize: (user: string, password: string) => Promise<void>;
        unauthorize: () => Promise<void>;
        getUserContext: () => UserContext;
    }
}>;

type AppSecurityParams = UIBaseParams<AppSecurityStruct>;
type AppSecurityModel = UIBaseModel<AppSecurityStruct>;

function useAppSecurity(params?: AppSecurityParams): AppSecurityModel {
    const struct: AppSecurityStruct = {
        props: {
            id: useAppSecurity.name,
            _userContext: undefined
        },

        methods: {
            isAuthorized: () => !!model._userContext?.apiToken,

            authorize: async (user, _password) => {
                // Implement your authorization logic here, e.g. call an API to verify credentials and get user context
                // model._userContext = await model.bus.unicast("Api.Authorize", { user, password })
                model._userContext = { user, apiToken: "MOCK-TOKEN" }; // Mock authorization, replace with real API call
                model.bus.unicast("App.LocalStorage.Write", { key: "user-context", value: JSON.stringify(model._userContext) });
            },

            unauthorize: async () => {
                model._userContext = undefined;
                model.bus.unicast("App.LocalStorage.Clear", "user-context");
            },

            getUserContext: () => ({ ...model._userContext })
        },

        messages: {
            "App.Security.IsAuthorized": async () => model.isAuthorized(),

            "App.Security.AuthorizeNative": async (p) => await model.authorize(p.user, p.password),

            "App.Security.Unauthorize": async () => await model.unauthorize(),
        },

        init: async () => {
            const userContextStr = await model.bus.unicast("App.LocalStorage.Read", "user-context");
            if (userContextStr) {
                try {
                    model._userContext = JSON.parse(userContextStr);
                } catch {
                    model._userContext = undefined;
                }
            }
        }
    }

    const model = useUIBase(struct, params);
    return model;
}

const AppSecurity = UECA.getFC(useAppSecurity);

export { AppSecurityParams, AppSecurityModel, useAppSecurity, AppSecurity }
