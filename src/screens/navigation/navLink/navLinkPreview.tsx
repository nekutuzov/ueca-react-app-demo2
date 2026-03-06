import * as UECA from "ueca-react";
import {
    UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase,
    Block,
    NavLinkModel, useNavLink, NavLinkUnderline
} from "@components";
import { Palette } from "@core";

type NavLinkPreviewStruct = UIBaseStruct<{
    props: {
        text: string;
        color: Palette;
        underline: NavLinkUnderline;
        disabled: boolean;
        newTab: boolean;
    };

    children: {
        demoNavLink: NavLinkModel;
    };
}>;

type NavLinkPreviewParams = UIBaseParams<NavLinkPreviewStruct>;
type NavLinkPreviewModel = UIBaseModel<NavLinkPreviewStruct>;

function useNavLinkPreview(params?: NavLinkPreviewParams): NavLinkPreviewModel {
    const struct: NavLinkPreviewStruct = {
        props: {
            id: useNavLinkPreview.name,
            text: "Navigation Link",
            color: "primary.main",
            underline: "hover",
            disabled: false,
            newTab: false
        },

        children: {
            demoNavLink: useNavLink({
                route: { path: "/home" },
                linkView: () => model.text,
                color: () => model.color,
                underline: () => model.underline,
                disabled: () => model.disabled,
                newTab: () => model.newTab
            })
        },

        View: () => (
            <Block id={model.htmlId()}
                sx={{
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
                    <model.demoNavLink.View />
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

const NavLinkPreview = UECA.getFC(useNavLinkPreview);

export { NavLinkPreviewParams, NavLinkPreviewModel, useNavLinkPreview, NavLinkPreview };
