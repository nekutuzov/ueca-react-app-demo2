import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase, Col, Block } from "@components";
import { CRUDScreenModel, useCRUDScreen, Breadcrumb } from "@core";

type PopupsScreenStruct = UIBaseStruct<{
    props: {};
    children: {
        crudScreen: CRUDScreenModel;
    };
}>;

type PopupsScreenParams = UIBaseParams<PopupsScreenStruct>;
type PopupsScreenModel = UIBaseModel<PopupsScreenStruct>;

function usePopupsScreen(params?: PopupsScreenParams): PopupsScreenModel {
    const struct: PopupsScreenStruct = {
        props: {
            id: usePopupsScreen.name,
        },

        children: {
            crudScreen: useCRUDScreen({
                intent: "none",
                breadcrumbs: [
                    { route: { path: "/" }, label: "Home" },
                    { route: { path: "/popups" }, label: "Popup Components" }
                ] as Breadcrumb[],
                contentView: () => (
                    <Col fill overflow={"auto"} padding={"medium"}>
                        <Block>
                            <h1>Popup Components</h1>
                            <p>Demonstration screens coming soon...</p>
                        </Block>
                    </Col>
                )
            })
        },

        View: () => <model.crudScreen.View />
    }

    const model = useUIBase(struct, params);
    return model;
}

const PopupsScreen = UECA.getFC(usePopupsScreen);

export { PopupsScreenParams, PopupsScreenModel, usePopupsScreen, PopupsScreen };
