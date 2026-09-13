import * as UECA from "ueca-react";
import React from "react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";
import { AnchorRect, Placement, positionOverlay } from "../misc/overlayPosition";
import "./appTooltipManager.css";

// AppTooltipManager - the app's ONE tooltip.
//
// Why a singleton rather than a tooltip per trigger: a tooltip's lifetime is not its trigger's
// lifetime. When a trigger disappears while its tooltip is open - a screen switches, the sidebar
// collapses, a route changes - a per-trigger tooltip either strands an overlay on screen or needs
// teardown that is easy to get wrong. With one instance owned by AppUI there is nothing to orphan:
// the manager is told to hide, or told to show something else. Same shape as AppDialogManager.
//
// Triggers talk to it over the bus (App.Tooltip.Show / Hide) and hold no tooltip state.

// How long the pointer must rest before a tooltip appears. Short, because on this site the tooltip
// is often the ONLY label an icon button has - but long enough not to fire while sweeping across
// the top bar.
const DEFAULT_DELAY_MS = 250;

// Keeps the arrow from sliding into the bubble's rounded corner when the bubble is clamped against
// a viewport edge.
const ARROW_INSET = 12;

type AppTooltipManagerStruct = UIBaseStruct<{
    props: {
        _open: boolean;
        _contentView: React.ReactNode;
        _anchor: AnchorRect;
        _placement: Placement;
        // Identifies the trigger currently showing. A Hide naming anyone else is stale and ignored.
        _token: string;
        // Resolved viewport coordinates. Undefined until measured, which is what `_measured` gates.
        _pos: { top: number; left: number; placement: Placement };
        // Where the arrow sits along the bubble's edge, so it still points at the trigger after
        // the bubble has been slid back inside the viewport.
        _arrowOffset: number;
        _measured: boolean;
        __ref: React.RefObject<HTMLDivElement>;
        __timers: { open: ReturnType<typeof setTimeout> };
    };

    methods: {
        show: (p: { token: string; anchor: AnchorRect; contentView: React.ReactNode; placement?: Placement; delay?: number }) => void;
        hide: (token?: string) => void;
        _measureAndPlace: () => void;
    };
}>;

type AppTooltipManagerParams = UIBaseParams<AppTooltipManagerStruct>;
type AppTooltipManagerModel = UIBaseModel<AppTooltipManagerStruct>;

function useAppTooltipManager(params?: AppTooltipManagerParams): AppTooltipManagerModel {
    const struct: AppTooltipManagerStruct = {
        props: {
            id: useAppTooltipManager.name,
            _open: false,
            _contentView: undefined,
            _anchor: undefined,
            _placement: "top",
            _token: undefined,
            _pos: undefined,
            _arrowOffset: 0,
            _measured: false,
            __ref: { current: null },
            __timers: { open: undefined }
        },

        messages: {
            "App.Tooltip.Show": async (p) => model.show(p),
            "App.Tooltip.Hide": async (p) => model.hide(p?.token),

            // Any navigation drops the tooltip: its anchor is about to stop existing. This is a
            // navigation GUARD, so it must return true - the tooltip never blocks a route change.
            "App.Router.BeforeRouteChange": async () => {
                model.hide();
                return true;
            }
        },

        methods: {
            show: (p) => {
                clearTimeout(model.__timers.open);

                const delay = p.delay ?? DEFAULT_DELAY_MS;
                const open = () => {
                    model._token = p.token;
                    model._anchor = p.anchor;
                    model._contentView = p.contentView;
                    model._placement = p.placement ?? "top";
                    // Render hidden first: placement needs the bubble's own measured size, which
                    // does not exist until it is in the document. `draw` measures and reveals.
                    model._measured = false;
                    model._pos = undefined;
                    model._open = true;
                };

                if (delay > 0) {
                    model.__timers.open = setTimeout(open, delay);
                } else {
                    open();
                }
            },

            hide: (token) => {
                // A hide from a trigger that is no longer the one showing is stale - it belongs to
                // a pointer that has already left an element the user has moved on from. Ignoring
                // it is what keeps a fast sweep across the top bar from closing the tooltip the
                // element now under the pointer has just opened.
                if (token && model._token && token !== model._token) {
                    return;
                }

                clearTimeout(model.__timers.open);
                model._open = false;
                model._token = undefined;
                model._measured = false;
                model._pos = undefined;
            },

            _measureAndPlace: () => {
                const el = model.__ref.current;
                if (!model._open || !el || !model._anchor) {
                    return;
                }

                const rect = el.getBoundingClientRect();
                const pos = positionOverlay({
                    anchor: model._anchor,
                    overlay: { width: rect.width, height: rect.height },
                    viewport: { width: window.innerWidth, height: window.innerHeight },
                    placement: model._placement
                });

                const arrow = _arrowOffsetFor(pos, rect);

                // Only reassign when it actually moved, or `draw` would loop re-rendering forever.
                if (!model._measured
                    || model._pos?.top !== pos.top
                    || model._pos?.left !== pos.left
                    || model._arrowOffset !== arrow) {
                    model._pos = pos;
                    model._arrowOffset = arrow;
                    model._measured = true;
                }
            }
        },

        mount: () => {
            // Scrolling or resizing moves the anchor out from under the tooltip. Recomputing is
            // possible, but the anchor rect we were handed is already stale, so hiding is both
            // simpler and what people expect. `capture` catches scrolls in nested containers too.
            window.addEventListener("scroll", _hideNow, true);
            window.addEventListener("resize", _hideNow);
            window.addEventListener("keydown", _hideOnEscape);
            // Leaving the page is the same category: switching tab or application does NOT fire a
            // mouseleave on the trigger, so an open tooltip would still be sitting there on
            // return, with the pointer nowhere near it.
            window.addEventListener("blur", _hideNow);
            document.addEventListener("visibilitychange", _hideOnHidden);
        },

        unmount: () => {
            clearTimeout(model.__timers.open);
            window.removeEventListener("scroll", _hideNow, true);
            window.removeEventListener("resize", _hideNow);
            window.removeEventListener("keydown", _hideOnEscape);
            window.removeEventListener("blur", _hideNow);
            document.removeEventListener("visibilitychange", _hideOnHidden);
        },

        draw: () => {
            model._measureAndPlace();
        },

        View: () => {
            if (!model._open) {
                return null;
            }

            const placement = model._pos?.placement ?? model._placement;
            const horizontal = placement === "top" || placement === "bottom";

            return (
                <div
                    id={model.htmlId()}
                    ref={model.__ref}
                    className={`ueca-tooltip ueca-tooltip-${placement}`}
                    role="tooltip"
                    style={{
                        top: model._pos?.top ?? 0,
                        left: model._pos?.left ?? 0,
                        // Hidden until measured, so it never flashes at the wrong place first.
                        visibility: model._measured ? "visible" : "hidden",
                        [horizontal ? "--tooltip-arrow-left" : "--tooltip-arrow-top"]:
                            `${model._arrowOffset}px`
                    } as React.CSSProperties}
                >
                    <span className="ueca-tooltip-body">{model._contentView}</span>
                    <span className="ueca-tooltip-arrow" aria-hidden="true" />
                </div>
            );
        }
    };

    const model = useUIBase(struct, params);
    return model;


    // Private methods

    // Distance from the bubble's leading edge to the anchor's centre, clamped so the arrow stays
    // on the flat part of the edge rather than riding up into a corner.
    function _arrowOffsetFor(pos: { top: number; left: number; placement: Placement }, rect: DOMRect): number {
        const anchor = model._anchor;
        if (pos.placement === "top" || pos.placement === "bottom") {
            const centre = anchor.left + anchor.width / 2 - pos.left;
            return Math.round(_clamp(centre, ARROW_INSET, Math.max(ARROW_INSET, rect.width - ARROW_INSET)));
        }
        const centre = anchor.top + anchor.height / 2 - pos.top;
        return Math.round(_clamp(centre, ARROW_INSET, Math.max(ARROW_INSET, rect.height - ARROW_INSET)));
    }

    function _clamp(value: number, min: number, max: number): number {
        return Math.min(Math.max(value, min), max);
    }

    function _hideNow() {
        model.hide();
    }

    // Only the hide direction: becoming visible again must not cancel anything, and hiding on the
    // way back in would read as a bug to anyone tracing this.
    function _hideOnHidden() {
        if (document.hidden) {
            model.hide();
        }
    }

    function _hideOnEscape(e: KeyboardEvent) {
        if (e.key === "Escape") {
            model.hide();
        }
    }
}

const AppTooltipManager = UECA.getFC(useAppTooltipManager);

export { AppTooltipManagerParams, AppTooltipManagerModel, useAppTooltipManager, AppTooltipManager };
