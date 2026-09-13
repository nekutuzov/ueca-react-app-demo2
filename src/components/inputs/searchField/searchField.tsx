import * as UECA from "ueca-react";
import { Icon, UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";
import "./searchField.css";

// SearchField — a search box, not a form field.
//
// Built on UIBase rather than EditBase deliberately: a search term is never "invalid", so the
// validation machinery the other inputs carry would be dead weight here. What a search box needs
// instead is timing — the legacy SearchInput's contract, kept: typing fires `onSearch` debounced,
// Enter fires it immediately, and Escape (or the clear button) resets both the text and the search.
//
// `onSearch` fires with the settled text; read `model.value` for the raw text at any moment.

type SearchFieldStruct = UIBaseStruct<{
    props: {
        value: string;
        placeholder: string;
        disabled: boolean;
        autoFocus: boolean;
        fullWidth: boolean;
        // Debounce for search-as-you-type, ms. 0 fires on every keystroke.
        searchDelay: number;

        // The timer id lives on the model (state lives on the model — a closure `let` would reset
        // on re-render). Not observable state anyone renders; underscored private.
        __debounceTimer: number;
    };

    events: {
        // The settled search text: debounced on typing, immediate on Enter/clear.
        onSearch: (value: string, source: SearchFieldModel) => UECA.MaybePromise;
    };

    methods: {
        clear: () => void;
    };
}>;

type SearchFieldParams = UIBaseParams<SearchFieldStruct>;
type SearchFieldModel = UIBaseModel<SearchFieldStruct>;

function useSearchField(params?: SearchFieldParams): SearchFieldModel {
    const struct: SearchFieldStruct = {
        props: {
            id: useSearchField.name,
            value: "",
            placeholder: "Search",
            disabled: false,
            autoFocus: false,
            fullWidth: false,
            searchDelay: 300,
            __debounceTimer: undefined
        },

        events: {
            onSearch: undefined
        },

        methods: {
            clear: () => {
                _cancelPending();
                model.value = "";
                model.onSearch?.("", model);
            }
        },

        unmount: () => {
            _cancelPending();
        },

        View: () => {
            const className = "ueca-searchfield"
                + (model.fullWidth ? " ueca-searchfield-fullwidth" : "")
                + (model.disabled ? " ueca-searchfield-disabled" : "");

            return (
                <div id={model.htmlId()} className={className}>
                    <Icon name="search" size="sm" className="ueca-searchfield-glyph" />
                    <input
                        type="text"
                        className="ueca-searchfield-input"
                        value={model.value ?? ""}
                        placeholder={model.placeholder}
                        disabled={model.disabled}
                        autoFocus={model.autoFocus}
                        onChange={(e) => _handleInput(e.target.value)}
                        onKeyDown={(e) => _handleKeyDown(e)}
                    />
                    {model.value ? (
                        <button
                            type="button"
                            className="ueca-searchfield-clear"
                            aria-label="Clear"
                            tabIndex={-1}
                            onClick={() => model.clear()}
                        >
                            <Icon name="close" size="xs" />
                        </button>
                    ) : null}
                </div>
            );
        }
    };

    const model = useUIBase(struct, params);
    return model;

    function _handleInput(value: string) {
        model.value = value;
        _cancelPending();
        if (model.searchDelay > 0) {
            model.__debounceTimer = window.setTimeout(() => {
                model.__debounceTimer = undefined;
                model.onSearch?.(model.value, model);
            }, model.searchDelay);
        } else {
            model.onSearch?.(model.value, model);
        }
    }

    function _handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter") {
            _cancelPending();
            model.onSearch?.(model.value, model);
        } else if (e.key === "Escape" && model.value) {
            // Only swallow Escape while there is text to clear; an empty box lets it bubble so a
            // host popover/dialog can close on the same key.
            e.stopPropagation();
            model.clear();
        }
    }

    function _cancelPending() {
        if (model.__debounceTimer !== undefined) {
            window.clearTimeout(model.__debounceTimer);
            model.__debounceTimer = undefined;
        }
    }
}

const SearchField = UECA.getFC(useSearchField);

export { SearchFieldModel, SearchFieldParams, useSearchField, SearchField };
