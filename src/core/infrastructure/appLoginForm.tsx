import * as UECA from "ueca-react";
import {
    ButtonModel, EditBaseModel, EditBaseParams, EditBaseStruct, Icon,
    TextFieldModel, useButton, useEditBase, usePasswordField, useTextField
} from "@components";
import { AppAuthFormModel, useAppAuthForm } from "./appAuthForm";

// The sign-in form. Pure presentation: it validates its own fields and raises onLogin — signing
// in, the busy display, and error dialogs are the OWNER's (AppUI's) concern, which also lets the
// owner clear the fields only on success.
//
// An EditBase, not a UIBase-plus-validator: EditBase models an editable ENTITY, and an entity can
// be a group of controls just as well as a single one (Tab and TabsContainer are the library
// precedents). The form IS the composite — modelsToValidate points at its own fields, validate()
// recurses into them, and the whole form can itself sit in a parent's modelsToValidate.

type AppLoginFormStruct = EditBaseStruct<{
    props: {
        user: string;
        password: string;
    },

    children: {
        authForm: AppAuthFormModel;
        userInput: TextFieldModel;
        passwordInput: TextFieldModel;
        signInButton: ButtonModel;
    },

    events: {
        onLogin: (user: string, password: string) => UECA.MaybePromise;
    }

    methods: {
        _FormView: () => UECA.ReactElement;
    }
}>;

type AppLoginFormParams = EditBaseParams<AppLoginFormStruct>;
type AppLoginFormModel = EditBaseModel<AppLoginFormStruct>;

function useAppLoginForm(params?: AppLoginFormParams): AppLoginFormModel {
    const struct: AppLoginFormStruct = {
        props: {
            id: useAppLoginForm.name,
            user: "",
            password: ""
        },

        children: {
            authForm: useAppAuthForm({
                eyebrow: "UECA-React Showcase",
                title: "Sign in",
                leadView: "Fifty components on plain HTML and CSS, in light and dark.",
                contentView: () => <model._FormView />,
                // This demo has no server, so any credentials sign in — say so, or a visitor is
                // left guessing at a password that does not exist.
                footerView: "Demo sign-in — any username and password will do."
            }),

            userInput: useTextField({
                value: UECA.bind(() => model, "user"),
                labelView: "Username",
                startView: <Icon name="user" size="md" />,
                required: true,
                autoComplete: "username",
                onEnter: async () => await _loginOnEnter()
            }),

            passwordInput: usePasswordField({
                value: UECA.bind(() => model, "password"),
                labelView: "Password",
                startView: <Icon name="lock" size="md" />,
                required: true,
                autoComplete: "current-password",
                onEnter: async () => await _loginOnEnter()
            }),

            signInButton: useButton({
                contentView: "Sign in",
                variant: "contained",
                fullWidth: true,
                onClick: async () => await _login()
            })
        },

        methods: {
            // AppAuthForm already wraps contentView in a spaced Col — no wrapper of our own.
            _FormView: () => (
                <>
                    <model.userInput.View />
                    <model.passwordInput.View />
                    <model.signInButton.View />
                </>
            )
        },

        constr: () => {
            model.modelsToValidate = [model.userInput, model.passwordInput];
        },

        View: () => <model.authForm.View />
    }

    const model = useEditBase(struct, params);
    return model;

    // Private methods
    // Enter signs in only once BOTH fields are filled. Half-filled, it does nothing rather than
    // failing validation on the field the user has not reached yet — they are still typing, and
    // marking the empty one red mid-entry is noise. "Filled" matches the required validator, which
    // treats blank-only text as empty.
    async function _loginOnEnter() {
        if (!model.user?.trim() || !model.password?.trim()) {
            return;
        }
        await _login();
    }

    async function _login() {
        await model.validate();
        if (!model.isValid()) {
            return;
        }
        await model.onLogin?.(model.user, model.password);
    }
}

const AppLoginForm = UECA.getFC(useAppLoginForm);

export { AppLoginFormParams, AppLoginFormModel, useAppLoginForm, AppLoginForm }
