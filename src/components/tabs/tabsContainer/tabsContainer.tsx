import * as UECA from "ueca-react";
import { Col, EditBaseModel, EditBaseParams, EditBaseStruct, Tab, TabModel, TabParams, useEditBase } from "@components";
import { asyncSafe, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, ChevronDownIcon } from "@core";
import React from "react";
import "./tabsContainer.css";

type TabOrientation = "horizontal" | "vertical";
type TabVariant = "standard" | "scrollable" | "fullWidth";
type TabScrollButtons = "auto" | true | false;

type TabsContainerStruct = EditBaseStruct<{
    props: {
        tabs: TabModel[];
        tabsConfig: TabParams[]; // For direct configuration of tabs without expecting Tab models, if needed
        selectedTab: TabModel;
        selectedTabId: string;
        selectedTabIndex: number;
        orientation: TabOrientation;
        variant: TabVariant;
        scrollButtons: TabScrollButtons;
        centered: boolean;
        _hasOverflow: boolean;
        __defaultTabId: string;
        __scrollerRef: React.RefObject<HTMLDivElement>;
    };

    methods: {
        getTab: (tabId: string) => TabModel;
        getTabIndex: (tabId: string) => number;
        scrollLeft: () => void;
        scrollRight: () => void;
        _checkOverflow: () => void;
        _tabsView: () => React.JSX.Element;
        _scrollBackwardView: () => React.JSX.Element;
        _scrollForwardView: () => React.JSX.Element;
    };

    events: {
        onChange: (source: TabsContainerModel) => UECA.MaybePromise;
    };
}>;

type TabsContainerParams = EditBaseParams<TabsContainerStruct>;
type TabsContainerModel = EditBaseModel<TabsContainerStruct>;

function useTabsContainer(params?: TabsContainerParams): TabsContainerModel {
    const struct: TabsContainerStruct = {
        props: {
            id: useTabsContainer.name,
            tabs: [],
            tabsConfig: [],
            selectedTab: undefined,
            selectedTabId: UECA.bind(
                () => model.__defaultTabId ?? model.selectedTab?.getTabId(),
                (v) => {
                    if (model.tabs?.length) {
                        model.selectedTab = v ? model.getTab(v) : model.tabs[0];
                    } else {
                        model.__defaultTabId = v;
                    }
                }
            ),
            selectedTabIndex: UECA.bind(
                () => model.tabs.findIndex(t => t === model.selectedTab),
                (v) => model.selectedTab = model.tabs[v]
            ),
            orientation: "horizontal",
            variant: undefined,
            scrollButtons: undefined,
            centered: false,
            _hasOverflow: false,
            __scrollerRef: React.useRef<HTMLDivElement>(null),
        },

        events: {
            onChangeTabs: () => {
                _initTabs();
            },

            onChangeTabsConfig: () => {
                // Tab models announce themselves through their constr hook, which runs only for a
                // model that is actually created. Cached tabs are reused and never re-announce, so
                // emptying the list here would leave it holding just the newly created tab, and the
                // "clear every tab, then select one" logic below would stop clearing the rest.
                // Reconcile instead: drop the models whose config is gone and keep the others,
                // letting constr append the ones that are genuinely new.
                const configIds = model.tabsConfig?.map(c => _configTabId(c)) ?? [];
                model.tabs = model.tabs?.filter(t => configIds.includes(t.getTabId())) ?? [];
            },

            onChangeSelectedTab: () => {
                model.tabs?.map(x => x.selected = false);
                if (model.selectedTab) {
                    model.selectedTab.selected = true;
                }
                if (model.onChange) {
                    asyncSafe(() => model.onChange(model));
                }
            },

            onChangeOrientation: () => {
                setTimeout(() => model._checkOverflow(), 0);
            },

            onChangeVariant: () => {
                setTimeout(() => model._checkOverflow(), 0);
            }
        },

        methods: {
            getTab: (tabId) => model.tabs?.find(t => t.getTabId() === tabId),

            getTabIndex: (tabId) => model.tabs?.findIndex(t => t.getTabId() === tabId),

            scrollLeft: () => {
                const scroller = model.__scrollerRef.current;
                if (scroller) {
                    const scrollAmount = 200;
                    if (model.orientation === "horizontal") {
                        scroller.scrollLeft = Math.max(0, scroller.scrollLeft - scrollAmount);
                    } else {
                        scroller.scrollTop = Math.max(0, scroller.scrollTop - scrollAmount);
                    }
                }
            },

            scrollRight: () => {
                const scroller = model.__scrollerRef.current;
                if (scroller) {
                    const scrollAmount = 200;
                    if (model.orientation === "horizontal") {
                        scroller.scrollLeft += scrollAmount;
                    } else {
                        scroller.scrollTop += scrollAmount;
                    }
                }
            },

            _checkOverflow: () => {
                const scroller = model.__scrollerRef.current;
                if (scroller) {
                    if (model.orientation === "horizontal") {
                        model._hasOverflow = scroller.scrollWidth > scroller.clientWidth;
                    } else {
                        model._hasOverflow = scroller.scrollHeight > scroller.clientHeight;
                    }
                }
            },

            _tabsView: () => {
                let tabs: React.JSX.Element[] = [];
                if (model.tabsConfig?.length) {
                    tabs = model.tabsConfig.map(p => {
                        const params = { ...p };
                        params.constr = (tabModel) => { model.tabs.push(tabModel) };
                        return <Tab key={p.id as string} {...params} />;
                    });
                } else if (model.tabs?.length) {
                    tabs = model.tabs?.map(t => <t.View key={t.getTabId()} />);
                }

                const listClasses = [
                    "ueca-tabs-list",
                    model.variant === "fullWidth" ? "fullWidth" : "",
                    model.centered ? "centered" : "",
                    model.orientation === "vertical" ? "ueca-tabs-vertical" : ""
                ].filter(Boolean).join(" ");

                const scrollerClasses = [
                    "ueca-tabs-scroller",
                    model.variant === "scrollable" ? "scrollable" : ""
                ].filter(Boolean).join(" ");

                return (
                    <div ref={model.__scrollerRef} className={scrollerClasses}>
                        <div className={listClasses}>
                            {tabs}
                        </div>
                    </div>
                );
            },

            _scrollBackwardView: () => {
                const showScrollButtons = model.variant === "scrollable" &&
                    (model.scrollButtons === true || (model.scrollButtons === "auto" && model._hasOverflow));
                if (!showScrollButtons) return null;

                return (
                    <button
                        type="button"
                        className="ueca-tabs-scroll-button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            model.scrollLeft();
                        }}
                    >
                        {model.orientation === "horizontal" ? (
                            <ChevronLeftIcon />
                        ) : (
                            <ChevronUpIcon />
                        )}
                    </button>
                );
            },

            _scrollForwardView: () => {
                const showScrollButtons = model.variant === "scrollable" &&
                    (model.scrollButtons === true || (model.scrollButtons === "auto" && model._hasOverflow));
                if (!showScrollButtons) return null;

                return (
                    <button
                        type="button"
                        className="ueca-tabs-scroll-button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            model.scrollRight();
                        }}
                    >
                        {model.orientation === "horizontal" ? (
                            <ChevronRightIcon />
                        ) : (
                            <ChevronDownIcon />
                        )}
                    </button>
                );
            }
        },

        init: () => {
            _initTabs();
        },

        mount: () => {
            // Check overflow on window resize            
            window.addEventListener('resize', model._checkOverflow);
        },

        unmount: () => {
            // Cleanup resize listener
            window.removeEventListener('resize', model._checkOverflow);
        },

        draw: () => {
            setTimeout(() => {
                // Check overflow after render
                model._checkOverflow();
            }, 0);
        },

        View: () => {
            const containerClasses = [
                "ueca-tabs-container",
                model.orientation
            ].filter(Boolean).join(" ");

            return (
                <div id={model.htmlId()} className={containerClasses}>
                    <div className={`ueca-tabs-header ${model.orientation === "vertical" ? "ueca-tabs-vertical" : ""}`}>
                        <div className="ueca-tabs-wrapper">
                            <model._scrollBackwardView />
                            <model._tabsView />
                            <model._scrollForwardView />
                        </div>
                    </div>
                    <Col fill overflow="auto">
                        {model.selectedTab?.contentView}
                    </Col>
                </div>
            );
        }
    };

    const model = useEditBase(struct, params);
    return model;

    // Private methods
    function _initTabs() {
        model.modelsToValidate = model.tabs;

        model.tabs?.map(t => { t.container = model; });

        if (model.__defaultTabId) {
            const defaultTabId = model.__defaultTabId;
            model.__defaultTabId = undefined; // Clear after use, so it used only once
            model.selectedTab = model.getTab(defaultTabId);
        }

        // Fall back to the first tab when nothing is selected, or when the selected tab is no longer
        // among the tabs because its config was removed. Tested against the list directly: going
        // through selectedTabIndex reads a binding that has not necessarily settled at this point,
        // which left a removed tab selected and its content on screen.
        if (!model.selectedTab || !model.tabs?.includes(model.selectedTab)) {
            model.selectedTab = model.tabs?.length ? model.tabs[0] : undefined;
        }

        // Set the selected property on tabs
        model.tabs?.forEach(t => t.selected = false);
        if (model.selectedTab) {
            model.selectedTab.selected = true;
        }

        // Check overflow after tabs initialization
        setTimeout(() => model._checkOverflow(), 0);
    }

    // The id a config entry will produce, matching Tab.getTabId(). A param may be given as a plain
    // value or as a getter, so resolve it before comparing.
    function _configTabId(config: TabParams): string {
        const id = config?.tabId ?? config?.id;
        return (typeof id === "function" ? id() : id) as string;
    }
}

const TabsContainer = UECA.getFC(useTabsContainer);

export { TabsContainerModel, TabsContainerParams, TabOrientation, TabVariant, TabScrollButtons, useTabsContainer, TabsContainer };
