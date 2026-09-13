import * as UECA from "ueca-react";
import { Col, Row, Block, CloseIconButton, UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";
import { acquireOverlayZ, asyncSafe, releaseOverlayZ } from "@core";
import "./drawer.css";

type DrawerStruct = UIBaseStruct<{
    props: {
        open: boolean;
        titleView: React.ReactNode;
        contentView: React.ReactNode;
        actionView: React.ReactNode;
        anchor: "left" | "top" | "right" | "bottom";
        variant: "permanent" | "persistent" | "temporary";
        // A bare number is pixels; a string is any CSS length, which is how a panel asks for a
        // share of the viewport (e.g. 35% / 65% / 100%) rather than pixels.
        width?: number | string;
        // Stacking band held while open, so this drawer covers whatever was already up.
        // 0 = none held, and the CSS falls back to the static tokens.
        _z: number;
        // Where focus was when a modal drawer opened — the trigger, as a rule — to give back on close.
        __returnFocus: HTMLElement;
        // Set on opening a modal drawer, cleared by the first draw that puts focus into the panel.
        __focusPending: boolean;
    };

    events: {
        onOpen: (source: DrawerModel) => UECA.MaybePromise;
        onClose: (source: DrawerModel) => UECA.MaybePromise;
    };
}>;

type DrawerParams = UIBaseParams<DrawerStruct>;
type DrawerModel = UIBaseModel<DrawerStruct>;

function useDrawer(params?: DrawerParams): DrawerModel {
    const struct: DrawerStruct = {
        props: {
            id: useDrawer.name,
            open: false,
            titleView: undefined,
            contentView: undefined,
            actionView: undefined,
            anchor: "left",
            variant: "temporary",
            width: undefined,
            _z: 0,
            __returnFocus: undefined,
            __focusPending: false
        },

        events: {
            onChangeOpen: (v) => {
                if (v) {
                    _takeStackBand();
                    _focusOnDraw();
                    asyncSafe(() => model.onOpen?.(model));
                } else {
                    _releaseStackBand();
                    _returnFocus();
                    asyncSafe(() => model.onClose?.(model));
                }
            }
        },

        constr: () => {
            if (model.open) {
                _takeStackBand();
                _focusOnDraw();
                asyncSafe(() => model.onOpen?.(model));
            }
        },

        // A drawer torn down while still open would otherwise hold its band for the session, and
        // leave focus on the page it no longer covers.
        unmount: () => {
            _releaseStackBand();
            if (model.open) {
                _returnFocus();
            }
        },

        // A modal drawer takes focus once its panel is on screen, as Dialog does: aria-modal tells a
        // screen reader to stay inside it, so focus must not be left on the page behind the backdrop.
        draw: () => {
            if (!model.__focusPending || !model.open || !_isModal()) {
                return;
            }
            const panel = document.getElementById(model.htmlId());
            if (panel) {
                model.__focusPending = false;
                if (!panel.contains(document.activeElement)) {
                    panel.focus();
                }
            }
        },

        View: () => {
            const showBackdrop = model.variant === "temporary";
            const isVertical = model.anchor === "top" || model.anchor === "bottom";
            const anchorClass = `drawer-anchor-${model.anchor}`;
            const openClass = model.open ? "drawer-open" : "drawer-closed";

            return (
                <UECA.IF condition={model.open || model.variant === "permanent"}>
                    {showBackdrop && model.open && (
                        <div
                            className="ueca-drawer-backdrop"
                            onClick={_close}
                            style={model._z ? { "--overlay-z": model._z } as React.CSSProperties : undefined}
                        />
                    )}
                    <div
                        id={model.htmlId()}
                        className={`ueca-drawer ${anchorClass} ${openClass}`}
                        // Only the temporary variant is modal — it alone has a backdrop. Permanent and
                        // persistent drawers sit beside the page and claim nothing.
                        role={_isModal() ? "dialog" : undefined}
                        aria-modal={_isModal() ? "true" : undefined}
                        aria-labelledby={_isModal() && model.titleView ? _titleId() : undefined}
                        tabIndex={_isModal() ? -1 : undefined}
                        style={{
                            ...(model.width && !isVertical ? { width: _cssLength(model.width) } : {}),
                            ...(isVertical ? { height: _cssLength(model.width || 600), maxHeight: "60vh" } : {}),
                            // The panel sits one step above its own backdrop, inside the band.
                            ...(model._z ? { "--overlay-z": model._z + 1 } as React.CSSProperties : {})
                        }}
                    >
                        {/* spacing="none": header, body and footer each carry their own padding,
                            so a gap between them only doubles up on it. */}
                        <Col fill overflow="hidden" spacing="none">
                            <Row verticalAlign="center" horizontalAlign="spaceBetween" className="drawer-title" spacing="default">
                                <div id={_titleId()}>{model.titleView}</div>
                                <Block render={model.variant !== "permanent"}>
                                    <CloseIconButton onClick={_close} />
                                </Block>
                            </Row>
                            <Col fill overflow="auto" spacing="default">
                                <div className="drawer-content">
                                    {model.contentView}
                                </div>
                            </Col>
                            {model.actionView && (
                                <div className="drawer-actions">
                                    {model.actionView}
                                </div>
                            )}
                        </Col>
                    </div>
                </UECA.IF>
            );
        },
    };

    const model = useUIBase(struct, params);
    return model;

    // Private methods
    function _close() {
        model.open = false;
    }

    function _isModal(): boolean {
        return model.variant === "temporary";
    }

    function _titleId(): string {
        return `${model.htmlId()}-title`;
    }

    function _focusOnDraw() {
        if (!_isModal()) {
            return;
        }
        model.__returnFocus = document.activeElement as HTMLElement;
        model.__focusPending = true;
    }

    // Only while focus is still the drawer's to give back: inside the panel, or dropped to the page
    // because the panel went away. Focus the user has moved elsewhere stays where they put it.
    function _returnFocus() {
        const target = model.__returnFocus;
        model.__returnFocus = undefined;
        model.__focusPending = false;
        const active = document.activeElement;
        const panel = document.getElementById(model.htmlId());
        const focusIsOurs = !active || active === document.body || !!panel?.contains(active);
        if (focusIsOurs && target?.isConnected && target !== document.body) {
            target.focus();
        }
    }

    function _cssLength(value: number | string): string {
        if (typeof value === "number") {
            return `${value}px`;
        }
        return value;
    }

    function _takeStackBand() {
        if (!model._z) {
            model._z = acquireOverlayZ();
        }
    }

    function _releaseStackBand() {
        if (model._z) {
            releaseOverlayZ(model._z);
            model._z = 0;
        }
    }
}

const Drawer = UECA.getFC(useDrawer);

export { DrawerModel, DrawerParams, useDrawer, Drawer };
