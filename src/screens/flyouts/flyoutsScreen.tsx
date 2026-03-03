import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase, Col, Block } from "@components";
import { CRUDScreenModel, useCRUDScreen, Breadcrumb } from "@screens";

type FlyoutsScreenStruct = UIBaseStruct<{
    props: {};
    children: {
        crudScreen: CRUDScreenModel;
    };
}>;

type FlyoutsScreenParams = UIBaseParams<FlyoutsScreenStruct>;
type FlyoutsScreenModel = UIBaseModel<FlyoutsScreenStruct>;

function useFlyoutsScreen(params?: FlyoutsScreenParams): FlyoutsScreenModel {
    const struct: FlyoutsScreenStruct = {
        props: {
            id: useFlyoutsScreen.name,
        },

        children: {
            crudScreen: useCRUDScreen({
                intent: "none",
                breadcrumbs: [
                    { route: { path: "/" }, label: "Home" },
                    { route: { path: "/flyouts" }, label: "Flyout Components" }
                ] as Breadcrumb[],
                contentView: () => (
                    <Col fill overflow={"auto"} padding={"medium"}>
                        <Block>
                            <h1>Flyout Components</h1>
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

const FlyoutsScreen = UECA.getFC(useFlyoutsScreen);

export { FlyoutsScreenParams, FlyoutsScreenModel, useFlyoutsScreen, FlyoutsScreen };
