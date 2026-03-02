import * as UECA from "ueca-react";
import { AlertDrawerModel, BlockProps, Col, Row, UIBaseModel, UIBaseParams, UIBaseStruct, useAlertDrawer, useUIBase } from "@components";
import { Breadcrumb, LocationBreadcrumbsModel, useLocationBreadcrumbs } from "@screens";

type ScreenLayoutStruct = UIBaseStruct<{
    props: {
        breadcrumbs: Breadcrumb[];
        toolsView: React.ReactNode;
        hiddenToolsView: React.ReactNode;
        contentView: React.ReactNode;
        contentPaddings: "none" | "default" | BlockProps["padding"],
    };

    children: {
        breadcrumbsControl: LocationBreadcrumbsModel;
        drawerPanel: AlertDrawerModel;
    };
}>;

type ScreenParams = UIBaseParams<ScreenLayoutStruct>;
type ScreenLayoutModel = UIBaseModel<ScreenLayoutStruct>;

function useScreenLayout(params?: ScreenParams): ScreenLayoutModel {
    const struct: ScreenLayoutStruct = {
        props: {
            id: useScreenLayout.name,
            breadcrumbs: [],
            toolsView: undefined,
            hiddenToolsView: undefined,
            contentView: undefined,
            contentPaddings: "default",
        },

        children: {
            breadcrumbsControl: useLocationBreadcrumbs({
                items: () => model.breadcrumbs
            }),

            drawerPanel: useAlertDrawer({
                titleView: "Alert",
                contentView: "This is an alert drawer.",
                width: 1000,
            })
        },

        View: () => {
            const contentPaddings: BlockProps["padding"] =
                model.contentPaddings === "none" ?
                    undefined :
                    (model.contentPaddings === "default" || !model.contentPaddings) ?
                        {
                            top: "small",
                            left: "small",
                        } :
                        model.contentPaddings;

            return (
                <Col id={model.htmlId()} fill divider>
                    <Row verticalAlign={"center"} horizontalAlign={"spaceBetween"} padding={{ leftRight: "medium" }} height={"52px"}>
                        <model.breadcrumbsControl.View />
                        <Row>
                            {model.toolsView}
                            {/* <HiddenToolsButton items={model.hiddenToolsView} /> */}
                        </Row>
                    </Row>
                    <Col fill padding={contentPaddings}>
                        {model.contentView}
                    </Col>
                    <model.drawerPanel.View />
                </Col>
            )
        }
    }

    const model = useUIBase(struct, params);
    return model;
}

const ScreenLayout = UECA.getFC(useScreenLayout);

export { ScreenParams, ScreenLayoutModel, useScreenLayout, ScreenLayout };
