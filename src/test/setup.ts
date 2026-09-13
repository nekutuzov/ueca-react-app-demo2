import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { installBrowserStubs } from "./browserStubs";
import { assertNoUecaErrors, installUecaErrorCollector } from "./uecaErrors";

installBrowserStubs();

// The address the dev server serves the app from (vitest.config.ts sets the same URL).
const APP_START_URL = "/ueca-react-app-demo2/";

beforeEach(() => {
    installUecaErrorCollector();
});

afterEach(() => {
    // Unmount first: unmounting releases bus subscriptions, and its hooks can report errors too.
    cleanup();
    vi.useRealTimers();

    localStorage.clear();
    sessionStorage.clear();
    document.title = "";
    document.head.querySelectorAll("base").forEach((base) => base.remove());
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-color-mode");
    window.history.replaceState(null, "", APP_START_URL);

    assertNoUecaErrors();
});
