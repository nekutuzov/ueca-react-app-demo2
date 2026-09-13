import * as UECA from "ueca-react";
import {
    Block, ButtonModel, Col, Row, UIBaseModel, UIBaseParams, UIBaseStruct, useButton, useUIBase
} from "@components";

// What the model did when it last came up: a model built from scratch reports "created", one taken
// from the cache reports "restored". That distinction is the whole point of the Dynamic Content
// topic, and it is the thing no amount of looking at the rendered output will tell you.
type ShowcaseCounterPhase = "created" | "restored" | "deactivated";

// The specimen the Dynamic Content topic mounts, unmounts and re-mounts. Deliberately minimal:
// `count` is state, so a cache hit shows up as a number that survived; `note` is a plain param, so
// a re-supplied value shows up as text that changed (or didn't).
type ShowcaseCounterStruct = UIBaseStruct<{
    props: {
        label: string;
        note: string;
        count: number;
        // Survives a cache round-trip along with the rest of the model, which is what makes it able
        // to tell a first activation from a later one.
        _activations: number;
    };

    events: {
        onLifecycle: (phase: ShowcaseCounterPhase, source: ShowcaseCounterModel) => UECA.MaybePromise;
    };

    children: {
        bumpButton: ButtonModel;
    };
}>;

type ShowcaseCounterParams = UIBaseParams<ShowcaseCounterStruct>;
type ShowcaseCounterModel = UIBaseModel<ShowcaseCounterStruct>;

function useShowcaseCounter(params?: ShowcaseCounterParams): ShowcaseCounterModel {
    const struct: ShowcaseCounterStruct = {
        props: {
            id: useShowcaseCounter.name,
            label: "Counter",
            note: "",
            count: 0,
            _activations: 0
        },

        children: {
            bumpButton: useButton({
                contentView: "+1",
                size: "xsmall",
                variant: "outlined",
                onClick: () => {
                    model.count++;
                }
            })
        },

        init: async () => {
            model._activations++;
            await model.onLifecycle?.(model._activations === 1 ? "created" : "restored", model);
        },

        deinit: async () => {
            await model.onLifecycle?.("deactivated", model);
        },

        View: () => (
            <Col id={model.htmlId()} className="showcase-counter" spacing="tiny" padding="small">
                <Block className="showcase-specimen-label">{model.label}</Block>
                <Row spacing="small" verticalAlign="center">
                    <Block className="showcase-counter-value">{model.count}</Block>
                    <model.bumpButton.View />
                </Row>
                <Block className="showcase-counter-note" render={!!model.note}>{model.note}</Block>
            </Col>
        )
    };

    const model = useUIBase(struct, params);
    return model;
}

const ShowcaseCounter = UECA.getFC(useShowcaseCounter);

export {
    ShowcaseCounterPhase, ShowcaseCounterParams, ShowcaseCounterModel, useShowcaseCounter,
    ShowcaseCounter
};
