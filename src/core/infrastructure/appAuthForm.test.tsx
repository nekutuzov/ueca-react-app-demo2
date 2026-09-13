import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { AppAuthForm } from "@core";
import { mount, settle } from "@test";

function root() {
    return document.getElementById("auth");
}

describe("AppAuthForm", () => {
    it("renders the card with its mark, eyebrow, title, lead, content and footer", async () => {
        await mount(AppAuthForm, {
            id: "auth",
            eyebrow: "Showcase",
            title: "Sign in",
            leadView: "Welcome back.",
            contentView: <input aria-label="Name" />,
            footerView: <a href="#help">Need help?</a>
        });

        expect(root()).toHaveClass("auth-backdrop");
        expect(root().querySelector(".auth-card")).toBeInTheDocument();
        // Decorative: the title beside it already names the app.
        expect(root().querySelector("img.auth-logo")).toHaveAttribute("alt", "");
        expect(screen.getByText("Showcase")).toHaveClass("auth-eyebrow", "ueca-eyebrow");
        expect(screen.getByRole("heading", { level: 1, name: "Sign in" })).toHaveClass("auth-title");
        expect(screen.getByText("Welcome back.")).toHaveClass("auth-lead");
        expect(root().querySelector(".auth-content")).toContainElement(screen.getByRole("textbox", { name: "Name" }));
        expect(root().querySelector(".auth-footer")).toContainElement(screen.getByRole("link", { name: "Need help?" }));
    });

    it("leaves out the eyebrow, lead and footer blocks when they are not given", async () => {
        await mount(AppAuthForm, { id: "auth", title: "Sign in" });

        expect(root().querySelector(".auth-eyebrow")).toBeNull();
        expect(root().querySelector(".auth-lead")).toBeNull();
        expect(root().querySelector(".auth-footer")).toBeNull();
        // The content column is always there for the owner's fields.
        expect(root().querySelector(".auth-content")).toBeEmptyDOMElement();
        expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Sign in");
    });

    it("treats an empty eyebrow as none", async () => {
        await mount(AppAuthForm, { id: "auth", eyebrow: "" });

        expect(root().querySelector(".auth-eyebrow")).toBeNull();
    });

    it("follows runtime changes to its slots", async () => {
        const { model } = await mount(AppAuthForm, { id: "auth", title: "Sign in" });

        model.title = "Reset password";
        model.eyebrow = "Account";
        model.footerView = "Back to sign in";
        await settle();

        expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Reset password");
        expect(screen.getByText("Account")).toHaveClass("auth-eyebrow");
        expect(screen.getByText("Back to sign in")).toHaveClass("auth-footer");

        model.footerView = undefined;
        await settle();
        expect(root().querySelector(".auth-footer")).toBeNull();
    });
});
