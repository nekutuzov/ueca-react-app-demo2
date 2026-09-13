import * as UECA from "ueca-react";
import { Block, Col, UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";
import "./appAuthForm.css";

// The shared shell of the pre-authentication forms: a centred card over the theme's --auth-backdrop
// wash, a title, the owner's form content, and a footer. The form fields and the footer both come in
// through View slots the owner fills with its own content.

type AppAuthFormStruct = UIBaseStruct<{
    props: {
        title: string;
        contentView: React.ReactNode;
        footerView: React.ReactNode;
    };
}>;

type AppAuthFormParams = UIBaseParams<AppAuthFormStruct>;
type AppAuthFormModel = UIBaseModel<AppAuthFormStruct>;

function useAppAuthForm(params?: AppAuthFormParams): AppAuthFormModel {
    const struct: AppAuthFormStruct = {
        props: {
            id: useAppAuthForm.name,
            title: "",
            contentView: undefined,
            footerView: undefined
        },

        View: () => (
            <Col id={model.htmlId()} fill verticalAlign={"center"} horizontalAlign={"center"}
                 className="auth-backdrop" spacing="default">
                <Col className="auth-card" spacing="small" backgroundColor="background.paper">
                    <h1 className="auth-title">{model.title}</h1>
                    <Col spacing="small" className="auth-content">
                        {model.contentView}
                    </Col>
                    <Block className="auth-footer" horizontalAlign="center" render={model.footerView != null}>
                        {model.footerView}
                    </Block>
                </Col>
            </Col>
        )
    }

    const model = useUIBase(struct, params);
    return model;
}

const AppAuthForm = UECA.getFC(useAppAuthForm);

export { AppAuthFormParams, AppAuthFormModel, useAppAuthForm, AppAuthForm }
