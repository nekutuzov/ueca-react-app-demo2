import * as UECA from "ueca-react";
import {
    Block, ButtonModel, Col, Row, SwitchModel, UIBaseModel, UIBaseParams, UIBaseStruct, useButton,
    useSwitch, useUIBase
} from "@components";
import { ShowcaseSection } from "../showcaseSection";
import {
    ShowcaseCounter, ShowcaseCounterModel, ShowcaseCounterPhase, useShowcaseCounter
} from "../showcaseCounter";

const LOG_LIMIT = 24;

// The revision the statically-created specimens are born with. A literal rather than a read of
// `model._revision`, because the children section is evaluated before `model` exists.
const START_REVISION = 0;

// The places the framework is easiest to break, each reduced to one specimen you can operate by
// hand: model caching across unmount, the difference between a value param and a bound one, and a
// list of components that come and go by id. Run this page after a ueca-react upgrade — everything
// here is a claim the library is supposed to keep, and each one fails visibly rather than subtly.
type DynamicContentTopicStruct = UIBaseStruct<{
    props: {
        _revision: number;
        _log: string[];
        _logSeq: number;
        _itemIds: string[];
    };

    children: {
        mountSwitch: SwitchModel;
        bumpRevisionButton: ButtonModel;
        addItemButton: ButtonModel;
        removeItemButton: ButtonModel;
        clearLogButton: ButtonModel;
        staticCounter: ShowcaseCounterModel;
        constantParamCounter: ShowcaseCounterModel;
        boundParamCounter: ShowcaseCounterModel;
    };

    methods: {
        _PlacementView: () => React.JSX.Element;
        _CachingView: () => React.JSX.Element;
        _ParamsView: () => React.JSX.Element;
        _ListView: () => React.JSX.Element;
        _LogView: () => React.JSX.Element;
    };
}>;

type DynamicContentTopicParams = UIBaseParams<DynamicContentTopicStruct>;
type DynamicContentTopicModel = UIBaseModel<DynamicContentTopicStruct>;

function useDynamicContentTopic(params?: DynamicContentTopicParams): DynamicContentTopicModel {
    const struct: DynamicContentTopicStruct = {
        props: {
            id: useDynamicContentTopic.name,
            _revision: START_REVISION,
            _log: [],
            _logSeq: 0,
            _itemIds: ["item-1", "item-2"]
        },

        children: {
            mountSwitch: useSwitch({
                labelView: "Mounted",
                checked: true
            }),

            bumpRevisionButton: useButton({
                contentView: "Bump revision",
                size: "small",
                variant: "outlined",
                onClick: () => {
                    model._revision++;
                }
            }),

            addItemButton: useButton({
                contentView: "Add item",
                size: "small",
                variant: "outlined",
                onClick: () => {
                    model._itemIds = [...model._itemIds, `item-${model._itemIds.length + 1}`];
                }
            }),

            removeItemButton: useButton({
                contentView: "Remove last",
                size: "small",
                variant: "outlined",
                disabled: () => !model._itemIds.length,
                onClick: () => {
                    model._itemIds = model._itemIds.slice(0, -1);
                }
            }),

            clearLogButton: useButton({
                contentView: "Clear log",
                size: "xsmall",
                variant: "text",
                onClick: () => {
                    model._log = [];
                }
            }),

            staticCounter: useShowcaseCounter({
                label: "static child",
                note: "declared in children:",
                onLifecycle: _note
            }),

            constantParamCounter: useShowcaseCounter({
                label: "static child — value param",
                note: `rev ${START_REVISION}`,
                onLifecycle: _note
            }),

            boundParamCounter: useShowcaseCounter({
                label: "static child — function param",
                note: () => `rev ${model._revision}`,
                onLifecycle: _note
            })
        },

        methods: {
            _PlacementView: () => (
                <ShowcaseSection
                    title="Two ways to place a component"
                    description="Both are real models with their own state and lifecycle. The static child is
                                 declared in the parent's children section and rendered through its model; the
                                 JSX child is the component from UECA.getFC(), and the id you give it is what the
                                 cache keys on. Give two JSX siblings the same id and they are one model."
                >
                    <Row spacing="medium" flexWrap="wrap">
                        <model.staticCounter.View />
                        <ShowcaseCounter
                            id="jsxCounter"
                            label="JSX child"
                            note="<ShowcaseCounter id=… />"
                            onLifecycle={_note}
                        />
                    </Row>
                </ShowcaseSection>
            ),

            _CachingView: () => (
                <ShowcaseSection
                    title="Caching across unmount"
                    description="Give both counters a different count, then switch Mounted off and on. The cached
                                 model comes back with its number; the uncached one is built again from zero. The
                                 log is where the difference is named — restored versus created."
                >
                    <Col spacing="small">
                        <model.mountSwitch.View />
                        <Row spacing="medium" flexWrap="wrap" render={model.mountSwitch.checked}>
                            <ShowcaseCounter
                                id="cachedCounter"
                                label="cached (the default)"
                                note="auto-cache"
                                onLifecycle={_note}
                            />
                            <ShowcaseCounter
                                id="uncachedCounter"
                                cacheable={false}
                                label="cacheable={false}"
                                note="rebuilt every mount"
                                onLifecycle={_note}
                            />
                        </Row>
                        <Block className="showcase-note" render={!model.mountSwitch.checked}>
                            Unmounted. The cached model is still alive and holding its state; the uncached one no
                            longer exists.
                        </Block>
                    </Col>
                </ShowcaseSection>
            ),

            _ParamsView: () => (
                <ShowcaseSection
                    title="Params on re-render"
                    description="Bump the revision and watch which specimens follow. A JSX child is handed its
                                 params again on every render of its parent, so a plain value reaches it. A child
                                 created by a hook call in children: is not — a value param there is an INITIAL
                                 value. Pass a function (or a UECA.bind) when a static child has to follow
                                 something that changes."
                >
                    <Col spacing="small">
                        <Row spacing="small" verticalAlign="center">
                            <model.bumpRevisionButton.View />
                            <Block className="showcase-specimen-label">_revision = {model._revision}</Block>
                        </Row>
                        <Row spacing="medium" flexWrap="wrap">
                            <ShowcaseCounter
                                id="jsxParamCounter"
                                label="JSX child — value param"
                                note={`rev ${model._revision}`}
                                onLifecycle={_note}
                            />
                            <model.constantParamCounter.View />
                            <model.boundParamCounter.View />
                        </Row>
                        <Block className="showcase-note">
                            Expected: the JSX child and the function-param child track the revision; the
                            value-param static child stays at its birth value. The middle one is not a bug — it is
                            the contract, and it is the one that surprises people.
                        </Block>
                    </Col>
                </ShowcaseSection>
            ),

            _ListView: () => (
                <ShowcaseSection
                    title="A list that comes and goes"
                    description="Components created in a map, keyed by id. Count one of them up, remove it, then
                                 add it back: the ids are reused in order, so the model returns from the cache
                                 with its state. This is the shape a data-driven list of controls takes."
                >
                    <Col spacing="small">
                        <Row spacing="small">
                            <model.addItemButton.View />
                            <model.removeItemButton.View />
                        </Row>
                        <Row spacing="medium" flexWrap="wrap">
                            {model._itemIds.map((itemId) => (
                                <ShowcaseCounter
                                    key={itemId}
                                    id={itemId}
                                    label={itemId}
                                    onLifecycle={_note}
                                />
                            ))}
                        </Row>
                        <Block className="showcase-note" render={!model._itemIds.length}>
                            Empty. Add one back and it returns with the count it had.
                        </Block>
                    </Col>
                </ShowcaseSection>
            ),

            // Sticks to the top of the scroll area so it stays beside whichever specimen you are
            // operating — the readout is useless if you have to scroll away from the control to see it.
            _LogView: () => (
                <Col className="showcase-log-panel" spacing="tiny" width={320} maxWidth={"100%"}>
                    <Block className="showcase-section-title">Activity log</Block>
                    <Block className="showcase-section-description">
                        Newest first. created means a model was built from scratch; restored means one came back
                        from the cache still holding its state; deactivated is the cache hook firing on the way
                        out — not a destructor.
                    </Block>
                    <Col className="showcase-log" spacing="none" padding="small" overflow="auto">
                        {model._log.map((line) => (
                            <Block key={line} className="showcase-log-line">{line}</Block>
                        ))}
                        <Block className="showcase-log-line" render={!model._log.length}>
                            nothing yet — operate the specimens
                        </Block>
                    </Col>
                    <Row horizontalAlign="right">
                        <model.clearLogButton.View />
                    </Row>
                </Col>
            )
        },

        View: () => (
            <Col id={model.htmlId()} className="showcase-topic showcase-topic-wide" spacing="large">
                <Row spacing="medium" verticalAlign="top" flexWrap="wrap">
                    <Col spacing="medium" fill minWidth={0}>
                        <model._PlacementView />
                        <model._CachingView />
                        <model._ParamsView />
                        <model._ListView />
                    </Col>
                    <model._LogView />
                </Row>
            </Col>
        )
    };

    const model = useUIBase(struct, params);
    return model;


    // Private methods
    function _note(phase: ShowcaseCounterPhase, source: ShowcaseCounterModel): void {
        model._logSeq++;
        const entry = `${String(model._logSeq).padStart(3, "0")}  ${phase.padEnd(11)}  ${source.id}`;
        model._log = [entry, ...model._log].slice(0, LOG_LIMIT);
    }
}

const DynamicContentTopic = UECA.getFC(useDynamicContentTopic);

export {
    DynamicContentTopicParams, DynamicContentTopicModel, useDynamicContentTopic, DynamicContentTopic
};
