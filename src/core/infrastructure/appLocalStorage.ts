import * as UECA from "ueca-react";
import { BaseModel, BaseParams, BaseStruct, useBase } from "@components";
import { AppStorageKey, RETIRED_STORAGE_KEYS } from "./appTypes";

type Struct = BaseStruct<{
    methods: {
        read: (key: AppStorageKey) => string;
        write: (key: AppStorageKey, value: string) => void;
        clear: (key: AppStorageKey) => void;
    }
}>;

type AppLocalStorageModel = BaseModel<Struct>;

function useAppLocalStorage(params?: BaseParams<Struct>): AppLocalStorageModel {
    const struct: Struct = {
        props: {
            id: useAppLocalStorage.name,
        },

        messages: {
            "App.LocalStorage.Read": async (key: AppStorageKey) => model.read(key),
            "App.LocalStorage.Write": async (p: { key: AppStorageKey; value: string }) => model.write(p.key, p.value),
            "App.LocalStorage.Clear": async (key: AppStorageKey) => model.clear(key),
        },

        methods: {
            read: (key) => {
                const value = window.localStorage.getItem(key);
                return value ?? "";
            },

            write: (key, value) => {
                window.localStorage.setItem(key, value);
            },

            clear: (key) => {
                window.localStorage.removeItem(key);
            },
        },

        init: () => {
            // Sweep records this app no longer understands, so a key it stopped honouring cannot
            // sit in a browser indefinitely.
            for (const key of RETIRED_STORAGE_KEYS) {
                window.localStorage.removeItem(key);
            }
        }
    };

    const model = useBase(struct, params);
    return model;
}

const AppLocalStorage = UECA.getFC(useAppLocalStorage);

export { AppLocalStorageModel, useAppLocalStorage, AppLocalStorage }
