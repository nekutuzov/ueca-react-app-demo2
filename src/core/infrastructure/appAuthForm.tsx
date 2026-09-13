import * as UECA from "ueca-react";
import { Block, Col, UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";
import "./appAuthForm.css";

// The shared shell of the pre-authentication forms: a centred card over the theme's --auth-backdrop
// wash, with the app's mark, an eyebrow, a title and a lead, then the owner's form content and a
// footer. The form fields and the footer both come in through View slots the owner fills with its
// own content.

type AppAuthFormStruct = UIBaseStruct<{
    props: {
        eyebrow: string;
        title: string;
        leadView: React.ReactNode;
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
            eyebrow: undefined,
            title: "",
            leadView: undefined,
            contentView: undefined,
            footerView: undefined
        },

        View: () => (
            <Col
                id={model.htmlId()}
                className="auth-backdrop"
                fill
                verticalAlign={"center"}
                horizontalAlign={"center"}
                spacing={"default"}
            >
                <Col className="auth-card" spacing={"medium"}>
                    <Col className="auth-header" spacing={"default"}>
                        {/* Decorative: the title beside it already names the app. */}
                        <img className="auth-logo" src="logo.png" alt="" />
                        <Block className="auth-eyebrow ueca-eyebrow" render={!!model.eyebrow}>{model.eyebrow}</Block>
                        <h1 className="auth-title">{model.title}</h1>
                        <Block className="auth-lead" render={model.leadView != null}>{model.leadView}</Block>
                    </Col>
                    <Col className="auth-content" spacing={"small"}>
                        {model.contentView}
                    </Col>
                    <Block className="auth-footer" render={model.footerView != null}>
                        {model.footerView}
                    </Block>
                </Col>
            </Col>
        )
    };

    const model = useUIBase(struct, params);
    return model;
}

const AppAuthForm = UECA.getFC(useAppAuthForm);

export { AppAuthFormParams, AppAuthFormModel, useAppAuthForm, AppAuthForm };
