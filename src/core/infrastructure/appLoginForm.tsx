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
        keepMeSignedIn: boolean;
    },

    children: {
        userInput: TextFieldModel;
        passwordInput: TextFieldModel;
        keepMeSignedInCheckbox: CheckboxModel;
        signInButton: ButtonModel;
    },

    events: {
        onLogin: (user: string, password: string, keepMeSignedIn: boolean) => UECA.MaybePromise;
    }
}>;

type AppLoginFormParams = UIBaseParams<AppLoginFormStruct>;
type AppLoginFormModel = UIBaseModel<AppLoginFormStruct>;

function useAppLoginForm(params?: AppLoginFormParams): AppLoginFormModel {
    const struct: AppLoginFormStruct = {
        props: {
            id: useAppLoginForm.name,
            user: "",
            password: "",
            keepMeSignedIn: true
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

            keepMeSignedInCheckbox: useCheckbox({
                labelView: "Keep me signed in",
                checked: UECA.bind(() => model, "keepMeSignedIn")
            }),

            signInButton: useButton({
                contentView: "Sign in",
                variant: "contained",
                fullWidth: true,
                onClick: async () => await _basicLogin(),
            })
        },

        View: () => (
            <Col id={model.htmlId()} fill verticalAlign={"center"}>
                <div className="login-card">
                    <h1 className="login-heading">Sign in</h1>
                    <model.userInput.View />
                    <model.passwordInput.View />
                    <model.keepMeSignedInCheckbox.View />
                    <model.signInButton.View />
                </div>
            </Col>
        )
    }

    const model = useUIBase(struct, params);
    return model;

    // Private methods
    async function _basicLogin() {
        try {
            await model.runWithBusyDisplay(
                async () => await model.bus.unicast(
                    "App.Security.Authorize",
                    { user: model.user, password: model.password, keepMeSignedIn: model.keepMeSignedIn }
                )
            );
            // Erase fields for security reason
            model.userInput.value = "";
            model.passwordInput.value = "";
        } catch (e) {
            await model.dialogError("Login Error", (e as Error).message);
        }
    }


    // Placeholder for future login methods
    // async function _azureLogin() {
    // }

    // async function _googleLogin() {
    // }    
}

const AppLoginForm = UECA.getFC(useAppLoginForm);

export { AppLoginFormParams, AppLoginFormModel, useAppLoginForm, AppLoginForm }
