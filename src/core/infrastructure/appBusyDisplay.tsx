import * as UECA from "ueca-react";
import { Block, SpinnerModel, UIBaseModel, UIBaseParams, UIBaseStruct, useSpinner, useUIBase } from "@components";

type AppBusyDisplayStruct = UIBaseStruct<{
    props: {
        _busySetCount: number;
        _visible: boolean; // this flag allows temporarely hide the spinner during displaying a modal dialog
    }

    children: {
        spinner: SpinnerModel;
    }
}>;

type AppBusyDisplayParams = UIBaseParams<AppBusyDisplayStruct>;
type AppBusyDisplayModel = UIBaseModel<AppBusyDisplayStruct>;

function useAppBusyDisplay(params?: AppBusyDisplayParams): AppBusyDisplayModel {
    const struct: AppBusyDisplayStruct = {
        props: {
            id: useAppBusyDisplay.name,
            _busySetCount: 0,
            _visible: true
        },

        children: {
            spinner: useSpinner({
                delayTime: 250,
                visible: () => model._busySetCount > 0,
                size: 200,
                color: "info.main"
            })
        },

        messages: {
            "BusyDisplay.Set": async (v) => {
                model._visible = true;
                if (v) {
                    model._busySetCount++;
                } else {
                    if (model._busySetCount) {
                        model._busySetCount--;
                    }
                }
            },

            "BusyDisplay.Clear": async () => { model._busySetCount = 0 },

            "BusyDisplay.SetVisibility": async (v) => { model._visible = v }
        },

        View: () =>
            <Block id={model.htmlId()}>
                <model.spinner.View render={model._visible} />
            </Block>
    }

    const model = useUIBase(struct, params);
    return model;
}

const AppBusyDisplay = UECA.getFC(useAppBusyDisplay);

export { AppBusyDisplayParams, AppBusyDisplayModel, useAppBusyDisplay, AppBusyDisplay }
