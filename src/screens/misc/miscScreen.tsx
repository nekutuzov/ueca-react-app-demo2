import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase, Col, Block } from "@components";
import { CRUDScreenModel, useCRUDScreen, Breadcrumb } from "@core";

type MiscScreenStruct = UIBaseStruct<{
    props: {};
    children: {
        crudScreen: CRUDScreenModel;
    };
}>;

type MiscScreenParams = UIBaseParams<MiscScreenStruct>;
type MiscScreenModel = UIBaseModel<MiscScreenStruct>;

function useMiscScreen(params?: MiscScreenParams): MiscScreenModel {
    const struct: MiscScreenStruct = {
        props: {
            id: useMiscScreen.name,
        },

        children: {
            crudScreen: useCRUDScreen({
                intent: "none",
                breadcrumbs: [
                    { route: { path: "/" }, label: "Home" },
                    { route: { path: "/misc" }, label: "Miscellaneous Components" }
                ] as Breadcrumb[],
                contentView: () => (
                    <Col fill overflow={"auto"} padding={"medium"}>
                        <Block>
                            <h1>Miscellaneous Components</h1>
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

const MiscScreen = UECA.getFC(useMiscScreen);

export { MiscScreenParams, MiscScreenModel, useMiscScreen, MiscScreen };
