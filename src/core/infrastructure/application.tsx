import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";
import {
    AppBrowsingHistoryModel,
    useAppBrowsingHistory,
    AppUIModel,
    useAppUI,
    AppSecurityModel,
    useAppSecurity,
    AppLocalStorageModel,
    useAppLocalStorage,
    AppThemeManagerModel,
    useAppThemeManager
} from "@core";

type ApplicationStruct = UIBaseStruct<{
    props: {
        applicationName: string;
        appVersion: string;
    },

    children: {
        browsingHistory: AppBrowsingHistoryModel;
        security: AppSecurityModel;
        localStorage: AppLocalStorageModel;
        themeManager: AppThemeManagerModel;
        ui: AppUIModel;
    }
}>;

type ApplicationParams = UIBaseParams<ApplicationStruct>;
type ApplicationModel = UIBaseModel<ApplicationStruct>;

function useApplication(params?: ApplicationParams): ApplicationModel {
    const struct: ApplicationStruct = {
        props: {
            id: useApplication.name,
            applicationName: undefined,
            appVersion: undefined
        },

        children: {
            browsingHistory: useAppBrowsingHistory(),

            security: useAppSecurity(),

            localStorage: useAppLocalStorage(),

            themeManager: useAppThemeManager(),

            ui: useAppUI({
                authorizedMode: () => model.security.isAuthorized()
            })
        },

        messages: {
            "App.GetInfo": async () => {
                return {
                    appName: model.applicationName,
                    appVersion: model.appVersion
                }
            }
        },

        View: () => <model.ui.View />
    };

    const model = useUIBase(struct, params);
    return model;
}

const Application = UECA.getFC(useApplication);

export { ApplicationModel, ApplicationParams, useApplication, Application };
