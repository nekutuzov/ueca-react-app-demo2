import * as UECA from "ueca-react";
import { Col, Row, UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase, IconButtonModel, useIconButton } from "@components";
import { AppMenuModel, useAppMenu } from "@core";

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
                iconView: () => model.collapsed ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
                    </svg>
                ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 18h13v-2H3v2zm0-5h10v-2H3v2zm0-7v2h13V6H3zm18 9.59L17.42 12 21 8.41 19.59 7l-5 5 5 5L21 15.59z" />
                    </svg>
                ),
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
