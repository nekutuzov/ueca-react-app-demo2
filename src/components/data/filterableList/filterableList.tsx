import * as UECA from "ueca-react";
import {
    SearchFieldModel, UIBaseModel, UIBaseParams, UIBaseStruct, useSearchField, useUIBase,
    useVirtualList, VirtualListModel
} from "@components";
import "./filterableList.css";

// FilterableList — a SearchField over a VirtualList: type to filter, click to select.
//
// The legacy version held the filtered array as separate state and re-seeded it from `items` in an
// effect — which silently discarded the active search whenever the data refreshed (its own TODO
// admitted it). Here filtering is a DERIVED read: `filteredItems()` computes from `items` + `search`
// every time, so there is no second copy of the data to fall out of sync.
//
// Rows: the list always renders the row shell itself — the div that carries hover/active styling,
// the click handler, and the fixed height. `onRenderItem` customises the row's CONTENT only. That
// is what keeps selection working identically whether or not the caller customises rendering.
//
// Like Table's rowKeyField, `itemKeyField` is a field NAME, not an extractor — a top-level
// function-valued prop is evaluated as a reactive thunk by UECA. Falls back to the item's string
// form, then to the index.
//
// TODO (deferred): a "create new item from the search text" row. In the legacy app that affordance
// existed solely for SelectEx (the searchable dropdown); it belongs to that component's increment.
// Keyboard row navigation is likewise deferred, same reasoning as Table's.

type FilterableListStruct<T> = UIBaseStruct<{
    props: {
        items: T[];
        // Field holding a stable per-item identity, used for selection and React keys.
        itemKeyField: keyof T;
        // Key of the selected item. Assign it to preselect; the list scrolls it into view.
        activeKey: string;
        // Uniform row height, px — the windowing math needs it fixed.
        itemSize: number;
        // Hide the search box for a plain virtualised pick-list.
        filterable: boolean;
        searchPlaceholder: string;
        emptyView: React.ReactNode;

        // The active search text, owned here (the SearchField reports into it). Assignable — a
        // caller can clear or preseed the filter.
        search: string;
    };

    children: {
        searchField: SearchFieldModel;
        virtualList: VirtualListModel;
    };

    events: {
        onItemSelect: (item: T, key: string, source: FilterableListModel<T>) => UECA.MaybePromise;
        // Custom match. Default: case-insensitive substring over the item's text (a string item
        // directly; otherwise its `name`/`label`/`value` field, else its JSON).
        onMatchItem: (item: T, search: string, source: FilterableListModel<T>) => boolean;
        // Custom row content. The row shell (height, hover, active, click) stays the list's.
        onRenderItem: (item: T, row: { index: number; active: boolean }, source: FilterableListModel<T>) => React.ReactNode;
    };

    methods: {
        filteredItems: () => T[];
        selectItem: (item: T) => void;
        scrollToActive: (align?: "start" | "center" | "nearest") => void;
    };
}>;

type FilterableListParams<T> = UIBaseParams<FilterableListStruct<T>>;
type FilterableListModel<T> = UIBaseModel<FilterableListStruct<T>>;

function useFilterableList<T>(params?: FilterableListParams<T>): FilterableListModel<T> {
    const struct: FilterableListStruct<T> = {
        props: {
            id: useFilterableList.name,
            items: [],
            itemKeyField: undefined,
            activeKey: undefined,
            itemSize: 32,
            filterable: true,
            searchPlaceholder: "Search",
            emptyView: undefined,
            search: ""
        },

        children: {
            searchField: useSearchField({
                fullWidth: true,
                placeholder: () => model.searchPlaceholder,
                onSearch: (value) => {
                    model.search = value;
                }
            }),

            virtualList: useVirtualList({
                itemSize: () => model.itemSize,
                itemCount: () => model.filteredItems().length,
                emptyView: () => model.emptyView ?? "No matches",
                onRenderItem: (index) => _renderRow(index)
            })
        },

        events: {
            onItemSelect: undefined,
            onMatchItem: undefined,
            onRenderItem: undefined,

            // Fires on click selection too, where the row is already visible and "nearest" is a
            // no-op — the case it exists for is a caller assigning activeKey.
            onChangeActiveKey: () => {
                model.scrollToActive();
            }
        },

        methods: {
            filteredItems: () => {
                const items = model.items ?? [];
                const search = model.search?.trim();
                if (!model.filterable || !search) {
                    return items;
                }
                if (model.onMatchItem) {
                    return items.filter((item) => model.onMatchItem(item, search, model));
                }
                return items.filter((item) => _matchesDefault(item, search));
            },

            selectItem: (item) => {
                const items = model.filteredItems();
                model.activeKey = _itemKey(item, items.indexOf(item));
                model.onItemSelect?.(item, model.activeKey, model);
            },

            // "nearest" by default so selecting an already-visible row does not shove the list
            // around; the mount call centres, because there the row starts off-screen.
            scrollToActive: (align = "nearest") => {
                if (model.activeKey == null) {
                    return;
                }
                const items = model.filteredItems();
                const index = items.findIndex((item, i) => _itemKey(item, i) === model.activeKey);
                if (index >= 0) {
                    model.virtualList.scrollToIndex(index, align);
                }
            }
        },

        mount: () => {
            model.scrollToActive("center");
        },

        View: () => (
            <div id={model.htmlId()} className="ueca-filterablelist" role="listbox">
                {model.filterable ? <model.searchField.View /> : null}
                <model.virtualList.View />
            </div>
        )
    };

    const model = useUIBase(struct, params);
    return model;

    function _renderRow(index: number): React.ReactNode {
        const items = model.filteredItems();
        const item = items[index];
        if (item === undefined) {
            return null;
        }
        const key = _itemKey(item, index);
        const active = model.activeKey != null && key === model.activeKey;
        const className = "ueca-filterablelist-row" + (active ? " active" : "");

        return (
            <div
                className={className}
                role="option"
                aria-selected={active}
                onClick={() => model.selectItem(item)}
            >
                {model.onRenderItem
                    ? model.onRenderItem(item, { index, active }, model)
                    : <span className="ueca-truncate">{_itemText(item)}</span>}
            </div>
        );
    }

    function _itemKey(item: T, index: number): string {
        if (model.itemKeyField != null) {
            const value = item?.[model.itemKeyField];
            if (value != null) {
                return String(value);
            }
        }
        if (typeof item === "string") {
            return item;
        }
        return String(index);
    }

    function _itemText(item: T): string {
        if (typeof item === "string") {
            return item;
        }
        if (item != null && typeof item === "object") {
            const record = item as Record<string, unknown>;
            for (const field of ["name", "label", "value"]) {
                if (typeof record[field] === "string") {
                    return record[field] as string;
                }
            }
            return JSON.stringify(item);
        }
        return String(item);
    }

    function _matchesDefault(item: T, search: string): boolean {
        return _itemText(item).toLowerCase().includes(search.toLowerCase());
    }
}

const FilterableList = UECA.getFC(useFilterableList);

export { FilterableListModel, FilterableListParams, useFilterableList, FilterableList };
