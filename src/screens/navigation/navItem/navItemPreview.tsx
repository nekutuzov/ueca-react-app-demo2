import * as UECA from "ueca-react";
import {
    UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase,
    Block,
    NavItemModel, useNavItem, NavItemMode
} from "@components";
import { HomeIcon } from "@core";

type NavItemPreviewStruct = UIBaseStruct<{
    props: {
        text: string;
        mode: NavItemMode;
        disabled: boolean;
        newTab: boolean;
        active: boolean;
    };

    children: {
        demoNavItem: NavItemModel;
    };
}>;

type NavItemPreviewParams = UIBaseParams<NavItemPreviewStruct>;
type NavItemPreviewModel = UIBaseModel<NavItemPreviewStruct>;

function useNavItemPreview(params?: NavItemPreviewParams): NavItemPreviewModel {
    const struct: NavItemPreviewStruct = {
        props: {
            id: useNavItemPreview.name,
            text: "Navigation Item",
            mode: "icon-text",
            disabled: false,
            newTab: false,
            active: false
        },

        children: {
            demoNavItem: useNavItem({
                route: { path: "/home" },
                text: () => model.text,
                icon: <HomeIcon />,
                mode: () => model.mode,
                disabled: () => model.disabled,
                newTab: () => model.newTab,
                active: () => model.active
            })
        },

        View: () => (
            <Block sx={{
                flex: "1 1 500px",
                minWidth: "300px",
                padding: "24px",
                border: "2px solid #e0e0e0",
                borderRadius: "8px",
                backgroundColor: "white"
            }}>
                <h2 style={{ margin: "0 0 20px 0" }}>👁️ Preview</h2>
                <Block sx={{
                    padding: "24px",
                    backgroundColor: "#f5f5f5",
                    borderRadius: "4px",
                    border: "1px solid #e0e0e0",
                    minHeight: "100px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                }}>
                    <model.demoNavItem.View />
                </Block>
                <Block sx={{
                    marginTop: "12px",
                    fontSize: "13px",
                    color: "#666",
                    textAlign: "center"
                }}>
                    Modify properties on the left to see real-time changes
                </Block>
            </Block>
        )
    };

    const model = useUIBase(struct, params);
    return model;
}

const NavItemPreview = UECA.getFC(useNavItemPreview);

export { NavItemPreviewParams, NavItemPreviewModel, useNavItemPreview, NavItemPreview };
