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
        // share of the viewport (the legacy slider ladder is 35% / 65% / 100%, not pixels).
        width?: number | string;
        // Stacking band held while open, so this drawer covers whatever was already up.
        // 0 = none held, and the CSS falls back to the static tokens.
        _z: number;
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
        },

        events: {
            onChangeOpen: (v) => {
                if (v) {
                    _takeStackBand();
                    asyncSafe(() => model.onOpen?.(model));
                } else {
                    _releaseStackBand();
                    asyncSafe(() => model.onClose?.(model));
                }
            }
        },

        constr: () => {
            if (model.open) {
                _takeStackBand();
                asyncSafe(() => model.onOpen?.(model));
            }
        },

        // A drawer torn down while still open would otherwise hold its band for the session.
        unmount: () => {
            _releaseStackBand();
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
                                <div>{model.titleView}</div>
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
