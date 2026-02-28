import * as UECA from "ueca-react";
import { Block, Col, Row, UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";
import {
    AppBrowsingHistoryModel,
    useAppBrowsingHistory
} from "@core";

type ApplicationStruct = UIBaseStruct<{
    props: {
        applicationName: string;
        appVersion: string;
    },

    children: {
        browsingHistory: AppBrowsingHistoryModel;
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
        },

        messages: {
            "App.GetInfo": async () => {
                return {
                    appName: model.applicationName,
                    appVersion: model.appVersion
                }
            }
        },

        init: () => {
            console.log(`UECA application "${model.applicationName}" initialized`);
        },

        deinit: () => {
            console.log(`UECA application "${model.applicationName}" deinitialized`);
        },

        View: () => (
            <Col id={model.htmlId()}
                backgroundColor="info.light"
                verticalAlign="center"
                horizontalAlign="center"
            >
                <Block backgroundColor="secondary.light">
                    <h1>Welcome to {model.applicationName}</h1>
                    <p>Version: {model.appVersion}</p>
                    <p>Your UECA-React application is ready!</p>
                </Block>
            </Col>
        )
    }

    const model = useUIBase(struct, params);
    return model;
}

const Application = UECA.getFC(useApplication);

export { ApplicationModel, useApplication, Application }
