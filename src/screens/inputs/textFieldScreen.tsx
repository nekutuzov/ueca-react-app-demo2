import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase, Col, Block } from "@components";
import { CRUDScreenModel, useCRUDScreen, Breadcrumb } from "@core";

type TextFieldScreenStruct = UIBaseStruct<{
    props: {};
    children: {
        crudScreen: CRUDScreenModel;
    };
}>;

type TextFieldScreenParams = UIBaseParams<TextFieldScreenStruct>;
type TextFieldScreenModel = UIBaseModel<TextFieldScreenStruct>;

function useTextFieldScreen(params?: TextFieldScreenParams): TextFieldScreenModel {
    const struct: TextFieldScreenStruct = {
        props: {
            id: useTextFieldScreen.name,
        },

        children: {
            crudScreen: useCRUDScreen({
                intent: "none",
                breadcrumbs: [
                    { route: { path: "/" }, label: "Home" },
                    { route: { path: "/text-field" }, label: "TextField Component" }
                ] as Breadcrumb[],
                contentView: () => (
                    <Col fill overflow={"auto"} padding={"medium"}>
                        <Block>
                            <h1>TextField Component</h1>
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

const TextFieldScreen = UECA.getFC(useTextFieldScreen);

export { TextFieldScreenParams, TextFieldScreenModel, useTextFieldScreen, TextFieldScreen };
