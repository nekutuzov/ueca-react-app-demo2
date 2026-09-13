import * as UECA from "ueca-react";
import React from "react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";
import "./virtualList.css";

// VirtualList — renders only the visible slice of a uniform-height list.
//
// The mechanism, carried over from the legacy app because it is the simplest one that works: a
// spacer div is given the full height (`itemSize × itemCount`) so the scrollbar is honest, and the
// rendered window is absolutely positioned at `startIndex × itemSize` inside it. Scrolling just
// moves which slice is rendered.
//
// What is deliberately NOT carried over:
// - The 100ms scroll throttle. It was what made fast scrolling flash blank; a scroll event only
//   re-renders the window view, which is cheap, so the throttle solved nothing worth having.
// - `activeIndex` positioning the window without moving the element's real scrollTop — the legacy
//   scroll-to-active was broken by that (it left you staring at blank spacer). Here it is an
//   imperative `scrollToIndex()`, which sets the element's actual scrollTop and lets the scroll
//   event drive the window as usual.
//
// `onRenderItem` is an EVENT, not a prop: UECA evaluates a top-level function-valued prop as a
// reactive thunk (see Table's rowKeyField note), so a render callback passed as a prop would be
// called argument-less at bind time. Events are invoked, never evaluated.
//
// The element carries the height bound: give the LIST the size (`fill` context, or a sized parent
// with the usual minHeight={0} chain) — an unbounded VirtualList degenerates to rendering
// everything, exactly like any other overflow box that was never given a bound.

type VirtualListStruct = UIBaseStruct<{
    props: {
        itemCount: number;
        // Uniform row height, px. The windowing math depends on it; each item is wrapped in a div
        // locked to exactly this height so one oversized row cannot silently skew every offset
        // below it.
        itemSize: number;
        // Extra rows rendered beyond each edge of the viewport, so keyboard scrolling and fast
        // wheel flicks hit already-rendered rows.
        overscan: number;
        emptyView: React.ReactNode;

        className: string;

        _scrollTop: number;
        _viewportHeight: number;
        __viewportRef: React.RefObject<HTMLDivElement>;
        __resizeObserver: ResizeObserver;
    };

    events: {
        onRenderItem: (index: number, source: VirtualListModel) => React.ReactNode;
    };

    methods: {
        // First/last rendered index — exposed for tests and for callers that prefetch.
        range: () => { start: number; end: number };
        scrollToIndex: (index: number, align?: "start" | "center" | "nearest") => void;
        _ItemsView: () => React.JSX.Element;
    };
}>;

type VirtualListParams = UIBaseParams<VirtualListStruct>;
type VirtualListModel = UIBaseModel<VirtualListStruct>;

function useVirtualList(params?: VirtualListParams): VirtualListModel {
    const struct: VirtualListStruct = {
        props: {
            id: useVirtualList.name,
            itemCount: 0,
            itemSize: 32,
            overscan: 6,
            emptyView: undefined,
            className: undefined,
            _scrollTop: 0,
            _viewportHeight: 0,
            __viewportRef: { current: null },
            __resizeObserver: undefined
        },

        events: {
            onRenderItem: undefined
        },

        methods: {
            range: () => {
                return _range();
            },

            scrollToIndex: (index, align = "nearest") => {
                const el = model.__viewportRef.current;
                if (!el || model.itemCount === 0) {
                    return;
                }
                const clamped = Math.max(0, Math.min(index, model.itemCount - 1));
                const itemTop = clamped * model.itemSize;
                const itemBottom = itemTop + model.itemSize;
                const viewTop = el.scrollTop;
                const viewBottom = viewTop + el.clientHeight;

                let target: number;
                if (align === "start") {
                    target = itemTop;
                } else if (align === "center") {
                    target = itemTop - (el.clientHeight - model.itemSize) / 2;
                } else if (itemTop < viewTop) {
                    target = itemTop;
                } else if (itemBottom > viewBottom) {
                    target = itemBottom - el.clientHeight;
                } else {
                    return; // nearest, and already fully visible
                }
                el.scrollTop = Math.max(0, target);
                // The scroll event will fire and update _scrollTop; set it eagerly too so a caller
                // that reads range() right after scrollToIndex() sees the new window.
                model._scrollTop = el.scrollTop;
            },

            _ItemsView: () => {
                const { start, end } = _range();
                const items: React.JSX.Element[] = [];
                for (let i = start; i < end; i++) {
                    items.push(
                        <div key={i} className="ueca-virtuallist-item" style={{ height: model.itemSize }}>
                            {model.onRenderItem?.(i, model)}
                        </div>
                    );
                }
                return (
                    <div className="ueca-virtuallist-spacer" style={{ height: model.itemCount * model.itemSize }}>
                        <div className="ueca-virtuallist-window" style={{ top: start * model.itemSize }}>
                            {items}
                        </div>
                    </div>
                );
            }
        },

        mount: () => {
            const el = model.__viewportRef.current;
            if (el) {
                model.__resizeObserver = new ResizeObserver(() => {
                    model._viewportHeight = el.clientHeight;
                });
                model.__resizeObserver.observe(el);
                model._viewportHeight = el.clientHeight;
                model._scrollTop = el.scrollTop;
            }
        },

        unmount: () => {
            model.__resizeObserver?.disconnect();
            model.__resizeObserver = undefined;
        },

        View: () => {
            const className = "ueca-virtuallist" + (model.className ? " " + model.className : "");
            return (
                <div
                    id={model.htmlId()}
                    ref={model.__viewportRef}
                    className={className}
                    onScroll={() => _handleScroll()}
                >
                    {model.itemCount === 0 && model.emptyView !== undefined
                        ? <div className="ueca-virtuallist-empty">{model.emptyView}</div>
                        : <model._ItemsView />}
                </div>
            );
        }
    };

    const model = useUIBase(struct, params);
    return model;

    function _handleScroll() {
        const el = model.__viewportRef.current;
        if (el) {
            model._scrollTop = el.scrollTop;
        }
    }

    function _range(): { start: number; end: number } {
        const visible = Math.ceil(model._viewportHeight / model.itemSize) + 1;
        const first = Math.floor(model._scrollTop / model.itemSize);
        const start = Math.max(0, first - model.overscan);
        const end = Math.min(model.itemCount, first + visible + model.overscan);
        return { start, end };
    }
}

const VirtualList = UECA.getFC(useVirtualList);

export { VirtualListModel, VirtualListParams, useVirtualList, VirtualList };
