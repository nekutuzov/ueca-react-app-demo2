import * as UECA from "ueca-react";
import { Col, EditBaseModel, EditBaseParams, EditBaseStruct, TabModel, useEditBase } from "@components";
import { asyncSafe, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, ChevronDownIcon } from "@core";
import React from "react";
import "./tabsContainer.css";

type TabsContainerStruct = EditBaseStruct<{
    props: {
        tabs: TabModel[];
        selectedTab: TabModel;
        selectedTabId: string;
        selectedTabIndex: number;
        orientation: "horizontal" | "vertical";
        variant: "standard" | "scrollable" | "fullWidth";
        scrollButtons: "auto" | true | false;
        centered: boolean;
        __defaultTabId: string;
        __scrollerRef: React.RefObject<HTMLDivElement>;
    };

    methods: {
        getTab: (tabId: string) => TabModel;
        getTabIndex: (tabId: string) => number;
        scrollLeft: () => void;
        scrollRight: () => void;
    };

    events: {
        onChange: (source: TabsContainerModel) => UECA.MaybePromise;
    };
}>;

type TabsContainerParams = EditBaseParams<TabsContainerStruct>;
type TabsContainerModel = EditBaseModel<TabsContainerStruct>;

function useTabsContainer(params?: TabsContainerParams): TabsContainerModel {
    const scrollerRef = React.useRef<HTMLDivElement>(null);
    
    const struct: TabsContainerStruct = {
        props: {
            id: useTabsContainer.name,
            tabs: [],
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
            __scrollerRef: scrollerRef
        },

        events: {
            onChangeTabs: () => _initTabs(),

            onChangeSelectedTab: () => {
                model.tabs?.map(x => x.selected = false);
                if (model.selectedTab) {
                    model.selectedTab.selected = true;
                }
                if (model.onChange) {
                    asyncSafe(() => model.onChange(model));
                }
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
            }
        },

        init: () => _initTabs(),

        View: () => {
            const containerClasses = [
                "ueca-tabs-container",
                model.orientation
            ].filter(Boolean).join(" ");

            const scrollerClasses = [
                "ueca-tabs-scroller",
                model.variant === "scrollable" ? "scrollable" : ""
            ].filter(Boolean).join(" ");

            const listClasses = [
                "ueca-tabs-list",
                model.variant === "fullWidth" ? "fullWidth" : "",
                model.centered ? "centered" : "",
                model.orientation === "vertical" ? "ueca-tabs-vertical" : ""
            ].filter(Boolean).join(" ");

            const showScrollButtons = model.variant === "scrollable" && 
                (model.scrollButtons === true || model.scrollButtons === "auto");

            return (
                <div id={model.htmlId()} className={containerClasses}>
                    <div className={`ueca-tabs-header ${model.orientation === "vertical" ? "ueca-tabs-vertical" : ""}`}>
                        <div className="ueca-tabs-wrapper">
                            {showScrollButtons && (
                                <button 
                                    type="button"
                                    className="ueca-tabs-scroll-button ueca-tabs-scroll-start"
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
                            )}
                            <div ref={model.__scrollerRef} className={scrollerClasses}>
                                <div className={listClasses}>
                                    {model.tabs?.map(t => <t.View key={t.getTabId()} />)}
                                </div>
                            </div>
                            {showScrollButtons && (
                                <button 
                                    type="button"
                                    className="ueca-tabs-scroll-button ueca-tabs-scroll-end"
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
                            )}
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

        if (model.selectedTabIndex === -1) {
            model.selectedTab = model.tabs?.length ? model.tabs[0] : undefined;
        }

        // Set the selected property on tabs
        model.tabs?.forEach(t => t.selected = false);
        if (model.selectedTab) {
            model.selectedTab.selected = true;
        }
    }
}

const TabsContainer = UECA.getFC(useTabsContainer);

export { TabsContainerModel, TabsContainerParams, useTabsContainer, TabsContainer };
