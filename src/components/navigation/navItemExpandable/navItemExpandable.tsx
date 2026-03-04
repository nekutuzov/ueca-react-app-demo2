import * as UECA from "ueca-react";
import { Block, Col, Row, UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase, NavItemModel } from "@components";
import { resolvePaletteColor } from "@core";
import "./navItemExpandable.css";

type NavItemExpandableStruct = UIBaseStruct<{
    props: {
        active: boolean;
        expanded: boolean;
        icon: React.ReactNode;
        text: string;
        mode: "icon-only" | "text-only" | "icon-text";
        subItems: NavItemModel[];
    };

    methods: {
        _ParentItemView: () => React.JSX.Element;
        _SubMenuView: () => React.JSX.Element;
    };
}>;

type NavItemExpandableParams = UIBaseParams<NavItemExpandableStruct>;
type NavItemExpandableModel = UIBaseModel<NavItemExpandableStruct>;

function useNavItemExpandable(params?: NavItemExpandableParams): NavItemExpandableModel {
    const struct: NavItemExpandableStruct = {
        props: {
            id: useNavItemExpandable.name,
            active: false,
            expanded: false,
            icon: undefined,
            text: "",
            mode: "icon-text",
            subItems: []
        },

        methods: {
            _ParentItemView: () => (
                <Block
                    className={`ueca-nav-item-expandable ${model.active ? "active" : ""}`}
                    height={model.extent?.height}
                    width={model.extent?.width}
                    padding={{
                        topBottom: "small",
                        leftRight: model.mode === "icon-only" ? undefined : "small"
                    }}
                    cursor="pointer"
                    onClick={() => model.expanded = !model.expanded}
                    sx={{
                        "--nav-item-hover": resolvePaletteColor("menu.hover"),
                        "--nav-item-active": resolvePaletteColor("menu.active")
                    } as React.CSSProperties}
                >
                    <Row
                        horizontalAlign={model.mode === "icon-only" ? "center" : "spaceBetween"}
                        verticalAlign={"center"}
                        spacing={model.mode === "icon-only" ? undefined : "small"}
                        fill
                    >
                        <Row
                            horizontalAlign={model.mode === "icon-only" ? "center" : "left"}
                            verticalAlign="center"
                            spacing="small"
                        >
                            <UECA.IF condition={model.icon && model.mode !== "text-only"}>
                                {model.icon}
                            </UECA.IF>
                            <UECA.IF condition={model.mode !== "icon-only"}>
                                {model.text}
                            </UECA.IF>
                        </Row>
                        <UECA.IF condition={model.mode !== "icon-only"}>
                            <svg 
                                width="24" 
                                height="24" 
                                viewBox="0 0 24 24" 
                                fill="currentColor"
                                style={{ 
                                    transform: model.expanded ? "rotate(180deg)" : "rotate(0deg)",
                                    transition: "transform 0.2s ease"
                                }}
                            >
                                <path d="M7 10l5 5 5-5z"/>
                            </svg>
                        </UECA.IF>
                    </Row>
                </Block>
            ),

            _SubMenuView: () => (
                <UECA.IF condition={model.expanded && model.mode !== "icon-only"}>
                    <Col spacing="none" padding={{ left: "medium" }}>
                        {model.subItems.map((subItem, index) => (
                            <subItem.View key={index} />
                        ))}
                    </Col>
                </UECA.IF>
            )
        },

        View: () => (
            <Block id={model.htmlId()}>
                <model._ParentItemView />
                <model._SubMenuView />
            </Block>
        )
    };

    const model = useUIBase(struct, params);
    return model;
}

const NavItemExpandable = UECA.getFC(useNavItemExpandable);

export { NavItemExpandableParams, NavItemExpandableModel, useNavItemExpandable, NavItemExpandable };
