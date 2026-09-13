import * as UECA from "ueca-react";
import React from "react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";
import { AnchorRect, Placement, positionOverlay } from "@core";
import "./popover.css";

// Popover — anchored, dismissible, and holding whatever the caller puts in it.
//
// Deliberately NOT a singleton, unlike Tooltip and Menu. A popover hosts interactive content — a
// form, a filter builder, a picker — and that content owns state. Hoisting it into an AppUI
// singleton would move that state away from the model that owns the concern, which is the opposite
// of how everything else here is built. The singleton treatment suits overlays whose content is
// pure display; this one is a normal component that happens to float.
//
// Positioning still comes from the shared positionOverlay, so it flips and clamps identically.
type PopoverStruct = UIBaseStruct<{
    props: {
        open: boolean;
        // Viewport-relative rect to anchor to — normally from getBoundingClientRect() on the
        // trigger, captured when the popover is opened.
        anchor: AnchorRect;
        contentView: React.ReactNode;
        placement: Placement;
        // Close when the user clicks outside. Off for a popover that must stay put while the user
        // works in something behind it.
        closeOnOutsideClick: boolean;
        closeOnEscape: boolean;
        // Close on any scroll OUTSIDE the popover (and on window resize): the anchor rect was
        // captured at open, so scrolling moves the anchor away while the popover hangs fixed in
        // space, pointing at nothing. Scrolling the popover's OWN content never closes it.
        closeOnScroll: boolean;
        className: string;
        _pos: { top: number; left: number; placement: Placement };
        _measured: boolean;
        __ref: React.RefObject<HTMLDivElement>;
    };

    events: {
        onClose: (source: PopoverModel) => UECA.MaybePromise;
        // The element that toggles this popover, if any. A mousedown there is NOT an outside
        // click: the capture-phase close would otherwise run before the trigger's own click
        // handler, which then sees the popover closed and re-opens it — the trigger could never
        // toggle it shut. An EVENT rather than a prop because a function-valued prop is thunked
        // into a binding (the onRenderItem lesson — see docs/raw/lists.md).
        onGetTrigger: () => HTMLElement;
    };

    methods: {
        close: () => void;
        _measureAndPlace: () => void;
    };
}>;

type PopoverParams = UIBaseParams<PopoverStruct>;
type PopoverModel = UIBaseModel<PopoverStruct>;

function usePopover(params?: PopoverParams): PopoverModel {
    const struct: PopoverStruct = {
        props: {
            id: usePopover.name,
            open: false,
            anchor: undefined,
            contentView: undefined,
            placement: "bottom",
            closeOnOutsideClick: true,
            closeOnEscape: true,
            closeOnScroll: true,
            className: undefined,
            _pos: undefined,
            _measured: false,
            __ref: { current: null }
        },

        events: {
            // Re-measure from scratch each time it opens: the anchor will have moved.
            onChangeOpen: () => {
                model._measured = false;
                model._pos = undefined;
            }
        },

        methods: {
            close: () => {
                if (!model.open) {
                    return;
                }
                // The popover owns its own visibility, and fires onClose so the parent can sync
                // whatever it keeps alongside.
                model.open = false;
                if (model.onClose) {
                    model.onClose(model);
                }
            },

            _measureAndPlace: () => {
                const el = model.__ref.current;
                if (!model.open || !el || !model.anchor) {
                    return;
                }

                const rect = el.getBoundingClientRect();
                const pos = positionOverlay({
                    anchor: model.anchor,
                    overlay: { width: rect.width, height: rect.height },
                    viewport: { width: window.innerWidth, height: window.innerHeight },
                    placement: model.placement,
                    gap: 6
                });

                if (!model._measured || model._pos?.top !== pos.top || model._pos?.left !== pos.left) {
                    model._pos = pos;
                    model._measured = true;
                }
            }
        },

        mount: () => {
            window.addEventListener("mousedown", _onOutsideMouseDown, true);
            window.addEventListener("keydown", _onKeyDown, true);
            // Capture phase: scrolls of inner containers do not bubble, but they do capture.
            window.addEventListener("scroll", _onAnyScroll, true);
            window.addEventListener("resize", _onWindowResize);
        },

        unmount: () => {
            window.removeEventListener("mousedown", _onOutsideMouseDown, true);
            window.removeEventListener("keydown", _onKeyDown, true);
            window.removeEventListener("scroll", _onAnyScroll, true);
            window.removeEventListener("resize", _onWindowResize);
        },

        draw: () => {
            model._measureAndPlace();
        },

        View: () => {
            if (!model.open) {
                return null;
            }

            return (
                <div
                    id={model.htmlId()}
                    ref={model.__ref}
                    className={"ueca-popover" + (model.className ? " " + model.className : "")}
                    role="dialog"
                    style={{
                        top: model._pos?.top ?? 0,
                        left: model._pos?.left ?? 0,
                        visibility: model._measured ? "visible" : "hidden"
                    }}
                >
                    {model.contentView}
                </div>
            );
        }
    };

    const model = useUIBase(struct, params);
    return model;


    // Private methods
    function _onOutsideMouseDown(e: MouseEvent) {
        if (!model.open || !model.closeOnOutsideClick) {
            return;
        }
        if (model.__ref.current?.contains(e.target as Node)) {
            return;
        }
        // The trigger's own click toggles the popover — let it, rather than racing it shut here.
        const trigger = model.onGetTrigger?.();
        if (trigger && e.target instanceof Node && trigger.contains(e.target)) {
            return;
        }
        model.close();
    }

    function _onKeyDown(e: KeyboardEvent) {
        if (model.open && model.closeOnEscape && e.key === "Escape") {
            e.preventDefault();
            model.close();
        }
    }

    function _onAnyScroll(e: Event) {
        if (!model.open || !model.closeOnScroll) {
            return;
        }
        // A scroll INSIDE the popover is its own content working (a list, a long form) — ignore.
        if (e.target instanceof Node && model.__ref.current?.contains(e.target)) {
            return;
        }
        model.close();
    }

    function _onWindowResize() {
        if (model.open && model.closeOnScroll) {
            model.close();
        }
    }
}

const Popover = UECA.getFC(usePopover);

export { PopoverParams, PopoverModel, usePopover, Popover };
