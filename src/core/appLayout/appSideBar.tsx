import * as UECA from "ueca-react";
import { Col, Row, UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase, IconButtonModel, useIconButton } from "@components";
import { AppMenuModel, useAppMenu } from "@core";
import { MenuIcon, MenuCollapseIcon } from "../misc/icons";

type AppSideBarStruct = UIBaseStruct<{
    props: {
        collapsed: boolean;
    };

    children: {
        menu: AppMenuModel;
        toggleButton: IconButtonModel;
    };

    methods: {
        toggleCollapse: () => void;
    };
}>;

type AppSideBarParams = UIBaseParams<AppSideBarStruct>;
type AppSideBarModel = UIBaseModel<AppSideBarStruct>;

function useAppSideBar(params?: AppSideBarParams): AppSideBarModel {
    const struct: AppSideBarStruct = {
        props: {
            id: useAppSideBar.name,
            collapsed: false
        },

        events: {
            onChangeCollapsed: async (collapsed: boolean) => {
                // Post a broadcast message to notify side bar state change
                await model.bus.broadcast("", "App.SideBarStateChanged", { collapsed });
            }
        },

        children: {
            menu: useAppMenu({
                iconsOnly: () => model.collapsed
            }),

            toggleButton: useIconButton({
                iconView: () => model.collapsed ? <MenuIcon /> : <MenuCollapseIcon />,
                size: "small",
                onClick: () => model.toggleCollapse()
            }),
        },

        methods: {
            toggleCollapse: () => {
                model.collapsed = !model.collapsed;
            }
        },

        View: () =>
            <Col id={model.htmlId()}
                width={model.collapsed ? 60 : 200}
                minWidth={model.collapsed ? 60 : 200}
                maxWidth={model.collapsed ? 60 : 200}
                fill
                sx={{
                    transition: "width 0.3s ease-in-out",
                }}
            >
                {/* Header Section */}
                <Col>
                    <Row render={!model.collapsed} verticalAlign={"center"} spacing={"small"} padding={{ leftRight: "small", topBottom: "tiny" }}>
                        <model.toggleButton.View />
                        <span style={{ fontSize: "16px", fontWeight: "bold", color: "#1976d2" }}>
                            UECA App
                        </span>
                    </Row>
                    <Row render={model.collapsed} horizontalAlign={"center"} verticalAlign={"center"} padding={{ topBottom: "tiny" }}>
                        <model.toggleButton.View />
                    </Row>
                    {/* Divider */}
                    <div style={{ height: "1px", backgroundColor: "#e0e0e0", margin: "0 8px" }} />
                </Col>

                {/* Menu Section - fills remaining space */}
                <Col fill overflow="hidden">
                    <model.menu.View />
                </Col>
            </Col>
    }

    const model = useUIBase(struct, params);
    return model;
}

const AppSideBar = UECA.getFC(useAppSideBar);

export { AppSideBarParams, AppSideBarModel, useAppSideBar, AppSideBar }
