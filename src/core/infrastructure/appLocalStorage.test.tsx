import { describe, expect, it, vi } from "vitest";
import { AppLocalStorage, appMessageBus, AppStorageKeys } from "@core";
import { mount } from "@test";

// The production list is empty, so the sweep is exercised against a stand-in list.
vi.mock("./appTypes", async (importOriginal) => ({
    ...(await importOriginal<typeof import("./appTypes")>()),
    RETIRED_STORAGE_KEYS: ["retired-record", "another-retired-record"]
}));

describe("AppLocalStorage", () => {
    it("reads a stored value and yields an empty string for a missing key", async () => {
        localStorage.setItem(AppStorageKeys.userContext, "stored");
        const { model } = await mount(AppLocalStorage, { id: "storage" });

        expect(model.read(AppStorageKeys.userContext)).toBe("stored");
        // Never null: callers JSON.parse or compare the result without a null check.
        expect(model.read(AppStorageKeys.lastUsedRoute)).toBe("");
    });

    it("writes and clears a key without touching the others", async () => {
        const { model } = await mount(AppLocalStorage, { id: "storage" });

        model.write(AppStorageKeys.userContext, "a");
        model.write(AppStorageKeys.lastUsedRoute, "b");
        model.clear(AppStorageKeys.userContext);

        expect(localStorage.getItem(AppStorageKeys.userContext)).toBeNull();
        expect(localStorage.getItem(AppStorageKeys.lastUsedRoute)).toBe("b");
    });

    it("answers App.LocalStorage.Read/Write/Clear over the bus", async () => {
        await mount(AppLocalStorage, { id: "storage" });

        await appMessageBus.unicast("App.LocalStorage.Write", { key: AppStorageKeys.lastUsedRoute, value: "/home" });
        expect(localStorage.getItem(AppStorageKeys.lastUsedRoute)).toBe("/home");
        expect(await appMessageBus.unicast("App.LocalStorage.Read", AppStorageKeys.lastUsedRoute)).toBe("/home");

        await appMessageBus.unicast("App.LocalStorage.Clear", AppStorageKeys.lastUsedRoute);
        expect(await appMessageBus.unicast("App.LocalStorage.Read", AppStorageKeys.lastUsedRoute)).toBe("");
    });

    // A key the app stopped honouring must not sit in a browser indefinitely.
    it("sweeps retired keys on init and keeps the live ones", async () => {
        localStorage.setItem("retired-record", "old");
        localStorage.setItem("another-retired-record", "old");
        localStorage.setItem(AppStorageKeys.userContext, "live");

        await mount(AppLocalStorage, { id: "storage" });

        expect(localStorage.getItem("retired-record")).toBeNull();
        expect(localStorage.getItem("another-retired-record")).toBeNull();
        expect(localStorage.getItem(AppStorageKeys.userContext)).toBe("live");
    });

    it("stops answering the bus once unmounted", async () => {
        localStorage.setItem(AppStorageKeys.userContext, "stored");
        const { unmount } = await mount(AppLocalStorage, { id: "storage" });

        unmount();

        expect(await appMessageBus.unicast("App.LocalStorage.Read", AppStorageKeys.userContext)).toBeUndefined();
    });
});
