import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppLoginForm } from "@core";
import { mount, settle } from "@test";

// TextField inputs carry no accessible name, so they are reached through their UECA ids.
function userInput() {
    return document.getElementById("login.userInput").querySelector("input");
}

function passwordInput() {
    return document.getElementById("login.passwordInput").querySelector("input");
}

function helperText(field: "userInput" | "passwordInput") {
    return document.getElementById(`login.${field}`).querySelector(".textfield-helper-text");
}

function signInButton() {
    return screen.getByRole("button", { name: "Sign in" });
}

describe("AppLoginForm", () => {
    it("renders the sign-in card with both fields and the demo notice", async () => {
        await mount(AppLoginForm, { id: "login" });

        expect(screen.getByRole("heading", { level: 1, name: "Sign in" })).toBeInTheDocument();
        expect(screen.getByText("UECA-React Showcase")).toHaveClass("auth-eyebrow");
        expect(screen.getByText(/any username and password will do/)).toHaveClass("auth-footer");
        expect(userInput()).toHaveAttribute("type", "text");
        expect(userInput()).toHaveAttribute("autocomplete", "username");
        expect(passwordInput()).toHaveAttribute("type", "password");
        expect(passwordInput()).toHaveAttribute("autocomplete", "current-password");
        expect(document.querySelector(".auth-content")).toContainElement(signInButton());
    });

    it("binds the fields to user and password in both directions", async () => {
        const { model } = await mount(AppLoginForm, { id: "login" });

        await userEvent.type(userInput(), "ada");
        await userEvent.type(passwordInput(), "secret");
        expect(model.user).toBe("ada");
        expect(model.password).toBe("secret");

        model.user = "grace";
        await settle();
        expect(userInput()).toHaveValue("grace");
    });

    describe("Sign in button", () => {
        it("raises onLogin with the credentials when both fields are filled", async () => {
            const onLogin = vi.fn();
            await mount(AppLoginForm, { id: "login", onLogin });

            await userEvent.type(userInput(), "ada");
            await userEvent.type(passwordInput(), "secret");
            await userEvent.click(signInButton());
            await settle();

            expect(onLogin).toHaveBeenCalledExactlyOnceWith("ada", "secret");
            expect(helperText("userInput")).toBeNull();
            expect(helperText("passwordInput")).toBeNull();
        });

        it("marks both empty fields as required and does not sign in", async () => {
            const onLogin = vi.fn();
            const { model } = await mount(AppLoginForm, { id: "login", onLogin });

            await userEvent.click(signInButton());
            await settle();

            expect(helperText("userInput")).toHaveTextContent("Username cannot be empty");
            expect(helperText("passwordInput")).toHaveTextContent("Password cannot be empty");
            expect(model.isValid()).toBe(false);
            expect(onLogin).not.toHaveBeenCalled();
        });

        it("reports only the missing field", async () => {
            const onLogin = vi.fn();
            await mount(AppLoginForm, { id: "login", onLogin });

            await userEvent.type(userInput(), "ada");
            await userEvent.click(signInButton());
            await settle();

            expect(helperText("userInput")).toBeNull();
            expect(helperText("passwordInput")).toHaveTextContent("Password cannot be empty");
            expect(onLogin).not.toHaveBeenCalled();
        });

        it("treats blank-only text as empty", async () => {
            const onLogin = vi.fn();
            await mount(AppLoginForm, { id: "login", onLogin });

            await userEvent.type(userInput(), "   ");
            await userEvent.type(passwordInput(), "secret");
            await userEvent.click(signInButton());
            await settle();

            expect(helperText("userInput")).toHaveTextContent("Username cannot be empty");
            expect(onLogin).not.toHaveBeenCalled();
        });

        it("clears a field's error as soon as it is edited", async () => {
            await mount(AppLoginForm, { id: "login" });
            await userEvent.click(signInButton());
            await settle();

            await userEvent.type(userInput(), "a");

            expect(helperText("userInput")).toBeNull();
            expect(helperText("passwordInput")).toHaveTextContent("Password cannot be empty");
        });
    });

    // Enter signs in only once BOTH fields are filled; half-filled it does nothing, rather than
    // marking the field the user has not reached yet red while they are still typing.
    describe("Enter", () => {
        it("signs in from either field once both are filled", async () => {
            const onLogin = vi.fn();
            await mount(AppLoginForm, { id: "login", onLogin });
            await userEvent.type(userInput(), "ada");
            await userEvent.type(passwordInput(), "secret");

            await userEvent.type(passwordInput(), "{Enter}");
            await settle();
            expect(onLogin).toHaveBeenCalledExactlyOnceWith("ada", "secret");

            await userEvent.type(userInput(), "{Enter}");
            await settle();
            expect(onLogin).toHaveBeenCalledTimes(2);
        });

        it.each([
            ["the password is still empty", "ada", ""],
            ["the username is still empty", "", "secret"],
            ["the password is blank", "ada", "   "]
        ])("does nothing, and shows no error, while %s", async (_case, user, password) => {
            const onLogin = vi.fn();
            const { model } = await mount(AppLoginForm, { id: "login", onLogin });
            model.user = user;
            model.password = password;
            await settle();

            await userEvent.type(user ? userInput() : passwordInput(), "{Enter}");
            await settle();

            expect(onLogin).not.toHaveBeenCalled();
            expect(helperText("userInput")).toBeNull();
            expect(helperText("passwordInput")).toBeNull();
        });
    });

    it("validates its own fields as one composite entity", async () => {
        const { model } = await mount(AppLoginForm, { id: "login" });

        expect(model.modelsToValidate).toEqual([model.userInput, model.passwordInput]);

        await model.validate();
        expect(model.getValidationError()).toBe("Username cannot be empty\r\nPassword cannot be empty");

        model.user = "ada";
        model.password = "secret";
        await model.validate();
        expect(model.isValid()).toBe(true);
    });
});
