import { act, configure, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Application, AppStorageKeys } from "@core";
import { mount } from "@test";
import type { MountResult } from "@test";

// Drives the whole application, mounted the way main.tsx mounts it, for the tests in this folder.

// A full application renders far more than one component, and several test workers share the CPU.
configure({ asyncUtilTimeout: 3000 });

const APP_NAME = "UECA-React Showcase";
const APP_VERSION = "3.0";
// The base the dev server serves the app under (vite.config.ts), named by index.html's <base>.
const BASE_PATH = "/ueca-react-app-demo2";

// Home's headline, which is its page heading. Every other screen's heading is its page title.
const HOME_HEADING = /^Fifty components\./;

const STORED_USER = { user: "ada", apiToken: "DEMO-TOKEN" };

const SIDEBAR_ID = "app.ui.router.appLayout.sideBar";
const DIALOG_ID = "app.ui.dialogManager.activeDialog.dialog";
const SPINNER_ID = "app.ui.busyDisplay.spinner";
const ALERTS_ID = "app.ui.alertManager";

type RenderAppOptions = {
    // Where the browser is when the app starts, relative to the base: "/showcase/controls#buttons".
    url?: string;
    // Seeds the sign-in the login form stores, so the app starts signed in.
    signedIn?: boolean;
};

type RenderAppResult = MountResult<typeof Application> & {
    // history.length when the app started, before it touched the session history.
    historyLength: number;
};

type WaitOptions = { timeout?: number };

// Mounts the application at the given address and resolves once it shows either the sign-in form
// or a routed screen.
async function renderApp(options: RenderAppOptions = {}): Promise<RenderAppResult> {
    if (!document.head.querySelector("base")) {
        const base = document.createElement("base");
        base.setAttribute("href", `${BASE_PATH}/`);
        document.head.appendChild(base);
    }
    // Pushed, not replaced: the app then starts at the END of the session history, whatever earlier
    // tests in the file left in it, so history.length changes by exactly what the app does.
    window.history.pushState(null, "", appPath(options.url ?? "/"));
    if (options.signedIn) {
        localStorage.setItem(AppStorageKeys.userContext, JSON.stringify(STORED_USER));
    }
    const historyLength = window.history.length;

    const result = await mount(Application, { id: "app", applicationName: APP_NAME, appVersion: APP_VERSION });
    // Decided by the app, not by the options: a sign-in stored by an earlier mount counts too.
    if (result.model.security.isAuthorized()) {
        await waitForScreen();
    } else {
        await screen.findByRole("heading", { level: 1, name: "Sign in" });
    }
    return { ...result, historyLength };
}

// Resolves with the routed screen's page heading once the signed-in shell shows one — a given one,
// to wait out a navigation. Matched on textContent: a role query over a large page is slow.
async function waitForScreen(heading?: string | RegExp, options?: WaitOptions): Promise<HTMLElement> {
    return await waitFor(() => {
        const found = document.querySelector<HTMLElement>(".app-content h1");
        if (!found || !sideBar()) {
            throw new Error("The signed-in shell shows no screen");
        }
        if (!_matches(found.textContent, heading)) {
            throw new Error(`The screen on show is "${found.textContent}", not ${String(heading)}`);
        }
        return found;
    }, options);
}

// The sign-in form's inputs, by model path: the TextField does not give its <input> an accessible name.
function signInField(field: "user" | "password"): HTMLInputElement {
    return document.getElementById(`app.ui.loginForm.${field}Input`)?.querySelector("input");
}

function signInButton(): HTMLElement {
    return screen.getByRole("button", { name: "Sign in" });
}

async function typeCredentials(user: string, password: string) {
    if (user) {
        await userEvent.type(signInField("user"), user);
    }
    if (password) {
        await userEvent.type(signInField("password"), password);
    }
}

// Signs in through the form, with the button, and resolves with the heading of the screen it lands on.
async function signIn(user = "ada", password = "secret"): Promise<HTMLElement> {
    await typeCredentials(user, password);
    await userEvent.click(signInButton());
    return await waitForScreen();
}

function sideBar(): HTMLElement | null {
    return document.getElementById(SIDEBAR_ID);
}

// A page's entry in the side menu, by its label.
function menuLink(label: string): HTMLElement {
    return within(document.getElementById(`${SIDEBAR_ID}.menu`)).getByRole("link", { name: label });
}

// An action rather than a route, so an <a> without an href — not a link to the accessibility tree.
function signOutItem(): HTMLElement {
    return within(sideBar()).getByText("Sign out");
}

// The labels of the menu entries drawn as the current page.
function activeMenuItems(): string[] {
    return [...sideBar().querySelectorAll(".ueca-nav-item.active")].map((item) => item.textContent);
}

// The labels of the menu groups drawn as holding the current page.
function activeMenuGroups(): string[] {
    return [...sideBar().querySelectorAll(".ueca-nav-item-expandable.active")].map((item) => item.textContent);
}

function topBar(): HTMLElement | null {
    return document.querySelector<HTMLElement>(".app-topbar");
}

// The previous/next link at the foot of a Showcase or Playground page; null at that end of the list.
function pagerLink(direction: "Previous" | "Next"): HTMLElement | null {
    const pager = document.querySelector<HTMLElement>("nav.screen-pager");
    if (!pager) {
        return null;
    }
    return within(pager).queryByRole("button", { name: new RegExp(`^${direction}`) });
}

function openDialog(): HTMLElement | null {
    return document.getElementById(DIALOG_ID);
}

async function findDialog(): Promise<HTMLElement> {
    return await waitFor(() => {
        const dialog = openDialog();
        if (!dialog) {
            throw new Error("No dialog is open");
        }
        return dialog;
    });
}

function busySpinner(): HTMLElement | null {
    return document.getElementById(SPINNER_ID);
}

function alertsHost(): HTMLElement {
    return document.getElementById(ALERTS_ID);
}

// Dispatches over the app's bus from outside any component and lets the app render what followed.
async function send<T>(dispatch: () => Promise<T>): Promise<T> {
    let result: T;
    await act(async () => {
        result = await dispatch();
    });
    return result;
}

function goBack(): Promise<void> {
    return _traverseHistory(-1);
}

function goForward(): Promise<void> {
    return _traverseHistory(1);
}

// The address of an in-app path, as window.location.pathname shows it.
function appPath(path: string): string {
    return `${BASE_PATH}${path}`;
}

// The document title of a screen that names itself; the app name alone for one that does not.
function documentTitle(page?: string): string {
    return page ? `${page} — ${APP_NAME}` : APP_NAME;
}

export {
    APP_NAME, APP_VERSION, HOME_HEADING, STORED_USER,
    renderApp, waitForScreen, signInField, signInButton, typeCredentials, signIn,
    sideBar, menuLink, signOutItem, activeMenuItems, activeMenuGroups, topBar, pagerLink,
    openDialog, findDialog, busySpinner, alertsHost, send, goBack, goForward, appPath, documentTitle
};
export type { RenderAppOptions, RenderAppResult };

// Private helpers

function _matches(text: string, expected?: string | RegExp): boolean {
    if (expected === undefined) {
        return true;
    }
    return typeof expected === "string" ? text === expected : expected.test(text);
}

// jsdom moves through the session history asynchronously, as a browser does. Resolves once the
// popstate has been dispatched — the app's own listener, attached earlier, has run by then.
async function _traverseHistory(delta: number) {
    await act(async () => {
        await new Promise<void>((resolve, reject) => {
            const onPopState = () => {
                clearTimeout(timer);
                resolve();
            };
            const timer = setTimeout(() => {
                window.removeEventListener("popstate", onPopState);
                reject(new Error(`history.go(${delta}) dispatched no popstate`));
            }, 2000);
            window.addEventListener("popstate", onPopState, { once: true });
            window.history.go(delta);
        });
    });
}
