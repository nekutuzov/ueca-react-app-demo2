import * as UECA from "ueca-react";
import { Col, Row, Block, CloseIconButton, UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";
import { asyncSafe } from "@core";
import "./drawer.css";

type DrawerStruct = UIBaseStruct<{
    props: {
        open: boolean;
        titleView: React.ReactNode;
        contentView: React.ReactNode;
        actionView: React.ReactNode;
        anchor: "left" | "top" | "right" | "bottom";
        variant: "permanent" | "persistent" | "temporary";
        width?: number;
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
        },

        events: {
            onChangeOpen: (v) => {
                if (v) {
                    asyncSafe(() => model.onOpen?.(model));
                } else {
                    asyncSafe(() => model.onClose?.(model));
                }
            }
        },

        constr: () => {
            if (model.open) {
                asyncSafe(() => model.onOpen?.(model));
            }
        },

        View: () => {
            const showBackdrop = model.variant === "temporary";
            const isVertical = model.anchor === "top" || model.anchor === "bottom";
            const anchorClass = `drawer-anchor-${model.anchor}`;
            const openClass = model.open ? "drawer-open" : "drawer-closed";

            return (
                <>
                    {showBackdrop && model.open && (
                        <div className="ueca-drawer-backdrop" onClick={_close} />
                    )}
                    <div
                        id={model.htmlId()}
                        className={`ueca-drawer ${anchorClass} ${openClass}`}
                        style={{
                            ...(model.width && !isVertical ? { width: `${model.width}px` } : {})
                        }}
                    >
                        <Col fill>
                            <Row verticalAlign="center" horizontalAlign="spaceBetween" className="drawer-title">
                                <div>{model.titleView}</div>
                                <Block render={model.variant !== "permanent"}>
                                    <CloseIconButton onClick={_close} />
                                </Block>
                            </Row>
                            <div className="drawer-content">
                                {model.contentView}
                            </div>
                            {model.actionView && (
                                <div className="drawer-actions">
                                    {model.actionView}
                                </div>
                            )}
                        </Col>
                    </div>
                </>
            );
        },
    };

    const model = useUIBase(struct, params);
    return model;

    // Private methods
    function _close() {
        model.open = false;
    }
}

const Drawer = UECA.getFC(useDrawer);

export { DrawerModel, DrawerParams, useDrawer, Drawer };
