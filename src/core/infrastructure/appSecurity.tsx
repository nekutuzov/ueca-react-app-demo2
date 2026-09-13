import * as UECA from "ueca-react";
import { BaseModel, BaseParams, BaseStruct, useBase } from "@components";
import { AppStorageKeys, UserContext } from "./appTypes";

// Owns who is signed in. This demo has no server: authorize accepts any credentials and issues a
// local token. Replace _issueUserContext with a call to your authentication API — everything that
// asks "is anyone signed in?" goes through the messages below, so nothing else changes.
type AppSecurityStruct = BaseStruct<{
    props: {
        // Reactive on purpose — a single underscore, NOT the "__" private prefix. AppUI switches
        // between the login form and the router by reading isAuthorized(), and a "__" prop is a
        // plain value that re-renders nothing: signing in would leave the login form on screen.
        _userContext: UserContext;
    },

    methods: {
        isAuthorized: () => boolean;
        authorize: (user: string, password: string, keepMeSignedIn: boolean) => Promise<void>;
        unauthorize: () => Promise<void>;
        getUserContext: () => UserContext;
    }
}>;

type AppSecurityParams = BaseParams<AppSecurityStruct>;
type AppSecurityModel = BaseModel<AppSecurityStruct>;

function useAppSecurity(params?: AppSecurityParams): AppSecurityModel {
    const struct: AppSecurityStruct = {
        props: {
            id: useAppSecurity.name,
            _userContext: undefined
        },

        methods: {
            isAuthorized: () => !!model.getUserContext()?.apiToken,

            authorize: async (user, _password, keepMeSignedIn) => {
                const context = _issueUserContext(user);
                _setUserContext(context);
                if (keepMeSignedIn) {
                    await model.bus.unicast("App.LocalStorage.Write", { key: AppStorageKeys.userContext, value: JSON.stringify(context) });
                } else {
                    await model.bus.unicast("App.LocalStorage.Clear", AppStorageKeys.userContext);
                }
            },

            unauthorize: async () => {
                _setUserContext(undefined);
                await model.bus.unicast("App.LocalStorage.Clear", AppStorageKeys.userContext);
            },

            getUserContext: () => model._userContext
        },

        messages: {
            "App.Security.IsAuthorized": async () => model.isAuthorized(),

            "App.Security.Authorize": async (p) => await model.authorize(p.user, p.password, p.keepMeSignedIn),

            "App.Security.Unauthorize": async () => await model.unauthorize(),

            "App.Security.GetSecurityInfo": async () => ({ user: model.getUserContext()?.user, securityRules: [] })
        },

        // Restored in constr, not init: AppUI decides between the login form and the router from
        // isAuthorized() on its first render, and init hooks are not ordered between models. Read
        // straight from localStorage — synchronous, so there is nothing to wait for.
        constr: () => {
            _setUserContext(_readStoredUserContext());
        }
    }

    const model = useBase(struct, params);
    return model;

    // Private methods
    function _issueUserContext(user: string): UserContext {
        return { user, apiToken: "DEMO-TOKEN" };
    }

    function _setUserContext(context: UserContext) {
        model._userContext = context;
    }

    function _readStoredUserContext(): UserContext {
        // Private browsing and blocked site data both throw here rather than returning null.
        try {
            const stored = window.localStorage.getItem(AppStorageKeys.userContext);
            return stored ? JSON.parse(stored) : undefined;
        } catch {
            return undefined;
        }
    }
}

const AppSecurity = UECA.getFC(useAppSecurity);

export { AppSecurityParams, AppSecurityModel, useAppSecurity, AppSecurity };
