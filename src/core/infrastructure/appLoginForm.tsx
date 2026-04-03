import * as UECA from "ueca-react";
import {
    Col, ButtonModel, CheckboxModel, TextFieldModel, UIBaseModel, UIBaseParams, UIBaseStruct, useButton, useCheckbox,
    useTextField, useUIBase
} from "@components";
import "./appLoginForm.css";

type AppLoginFormStruct = UIBaseStruct<{
    props: {
        user: string;
        password: string;
    },

    children: {
        userInput: TextFieldModel;
        passwordInput: TextFieldModel;
        keepMeSignInChekbox: CheckboxModel;
        signInButton: ButtonModel;
    },

    events: {
        onLogin: (user: string, password: string) => UECA.MaybePromise;
    }
}>;

type AppLoginFormParams = UIBaseParams<AppLoginFormStruct>;
type AppLoginFormModel = UIBaseModel<AppLoginFormStruct>;

function useAppLoginForm(params?: AppLoginFormParams): AppLoginFormModel {
    const struct: AppLoginFormStruct = {
        props: {
            id: useAppLoginForm.name,
            user: "",
            password: ""
        },

        children: {
            userInput: useTextField({
                labelView: "Email",
                value: UECA.bind(() => model, "user"),
                type: "email",
                placeholder: "your@email.com",
                required: true,
                autoComplete: "email"
            }),

            passwordInput: useTextField({
                labelView: "Password",
                value: UECA.bind(() => model, "password"),
                type: "password",
                required: true,
                autoComplete: "current-password"
            }),

            keepMeSignInChekbox: useCheckbox({
                labelView: "Keep me signed in"
            }),

            signInButton: useButton({
                contentView: "Sign in",
                variant: "contained",
                fullWidth: true,
                onClick: async () => await _nativeLogin(model.user, model.password),
            })
        },

        View: () => (
            <Col id={model.htmlId()} fill verticalAlign={"center"}>
                <div className="login-card">
                    <h1 className="login-heading">Sign in</h1>
                    <model.userInput.View />
                    <model.passwordInput.View />
                    <model.keepMeSignInChekbox.View />
                    <model.signInButton.View />
                </div>
            </Col>
        )
    }

    const model = useUIBase(struct, params);
    return model;

    // Private methods
    async function _nativeLogin(user: string, password: string) {
        try {
            await model.runWithBusyDisplay(async () => await model.bus.unicast("App.Security.AuthorizeNative", { user, password }));
            // Erase fields for security reason
            model.userInput.value = "";
            model.passwordInput.value = "";
        } catch (e) {
            await model.dialogError("Login Error", (e as Error).message);
        }
    }
}

const AppLoginForm = UECA.getFC(useAppLoginForm);

export { AppLoginFormParams, AppLoginFormModel, useAppLoginForm, AppLoginForm }
