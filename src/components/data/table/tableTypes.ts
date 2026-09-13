import * as UECA from "ueca-react";
import React from "react";
import { UIBaseModel, UIBaseParams, UIBaseStruct } from "@components";

type ColumnDataType = "string" | "number" | "boolean" | "date" | "time" | "dateTime";

type ColumnAlign = "left" | "center" | "right";

type ColumnWidth = number | string | { min?: number | string; max?: number | string };

type SortDirection = "asc" | "desc";

// What a cellView/actionView receives. `rowNumber` is 1-based and follows the DISPLAYED order, so it
// renumbers when the table is sorted or filtered.
type TableCell<T> = {
    column: TableColumn<T>;
    row: T;
    rowIndex: number;
    rowNumber: number;
};

type TableColumn<T> = {
    // Stable identity: React key, sort target, and what onSortChange reports. Required, rather than
    // keying columns by their position in an object literal.
    key: string;
    titleView: React.ReactNode;
    // The row property this column reads. Omit for a computed column (a row number, an actions
    // column) — such a column simply is not sortable or filterable by value.
    field?: keyof T;
    dataType?: ColumnDataType;
    decimals?: number;
    sortable?: boolean;
    // Adds a filter input for this column; the filter row appears when any column asks for one.
    // Default matching is a case-insensitive substring over the cell's FORMATTED text — what the
    // user sees is what their filter runs against. `onFilter` replaces that per column.
    filterable?: boolean;
    onFilter?: (row: T, filter: string) => boolean;
    // Opt out of resizing for one column when the table-wide `resizableColumns` is on.
    resizable?: boolean;
    width?: ColumnWidth;
    align?: ColumnAlign;
    // Render the cell body. Without one the raw field value is formatted by dataType.
    cellView?: (cell: TableCell<T>) => React.ReactNode;
    // Row actions, revealed on hover/selection and pinned to the right of the cell.
    actionView?: (cell: TableCell<T>) => React.ReactNode;
    onSortCompare?: (a: T, b: T) => number;
};

// Height of one header row (the title row, and the filter row when present). Must match
// --control-h-md, which the CSS pins both rows to; the virtualisation math subtracts it from the
// viewport, and a couple of pixels of drift is absorbed by the overscan.
const HEADER_ROW_HEIGHT = 40;

// Columns narrower than this stop responding to the resize drag — below it the padding alone
// swallows the content and the handle becomes impossible to grab again.
const MIN_RESIZE_WIDTH = 48;

// What _RowView receives. Selection state arrives as PROPS, not as model reads inside the row:
// MobX notifies on the selectedKeys reference change, not on the derived boolean, so a row reading
// model.isRowSelected(key) would re-render on EVERY selection click — flags compared by the
// observer's memo re-render only the rows that actually flipped.
type TableRowProps<T> = {
    row: T;
    rowKey: string;
    rowIndex: number;
    selected: boolean;
    current: boolean;
    selectable: boolean;
    // This row owns the revealed actions. The ONLY row whose actionView is rendered at all — see
    // activeRowKey below.
    active: boolean;
    sticky: boolean;
    columns: TableColumn<T>[];
};

type TableStruct<T> = UIBaseStruct<{
    props: {
        rows: T[];
        columns: TableColumn<T>[];
        // Field holding a stable per-row identity, used for React keys and selection. Falls back to
        // the row index, which is fine for a static list but wrong the moment rows are sorted or
        // filtered — name a field whenever the rows have an id.
        //
        // A FIELD NAME rather than a `(row) => string` extractor on purpose: UECA evaluates a
        // top-level prop whose value is a function as a reactive thunk, so an extractor would be
        // called with no arguments at bind time and the prop would end up holding its return value.
        // (Functions nested inside an object or array — `cellView` on a column — are untouched.)
        rowKeyField: keyof T;

        sortKey: string;
        sortDirection: SortDirection;

        // Single-row selection: click a row, `selectedKey` holds it.
        selectable: boolean;
        selectedKey: string;

        // Multi-row selection, desktop style — selection is shown by row highlight alone, no
        // checkbox column: plain click selects just that row, Ctrl/Cmd+click toggles, Shift+click
        // ranges from the last plain click, and with the table focused Ctrl+A selects everything
        // displayed while Escape clears. `selectedKeys` holds the set — reassigned whole on every
        // change (MobX is shallow), so the auto `onChangeSelectedKeys` event fires and is how a
        // parent observes it; `selectAllDisplayed()`/`clearSelection()` stay public for screens
        // that want their own button. `selectedKey` keeps tracking the CURRENT row (the one
        // keyboard navigation moves), which is a different thing from membership in the set.
        multiSelect: boolean;
        selectedKeys: string[];

        // Per-column filter text, keyed by column.key. Assignable — a screen can preseed or clear
        // filters; reassign the whole object, never mutate a field.
        filters: Record<string, string>;

        // Pins the first data column (and the checkbox column, when present) against horizontal
        // scrolling. The pinned cells get an opaque surface so content slides UNDER them.
        stickyFirstColumn: boolean;

        // Drag the right edge of a header cell to resize its column; double-click the edge to
        // reset. Overrides live in `_columnWidths` until reset and win over the authored width.
        resizableColumns: boolean;
        _columnWidths: Record<string, number>;

        // Windowed rendering: only the visible slice of rows goes into the DOM, positioned by two
        // spacer rows. Requires uniform row height (`rowHeight`); `maxRows` is ignored because
        // every row is reachable by scrolling. The table needs a bounded height to window against.
        virtualized: boolean;
        rowHeight: number;
        overscan: number;

        // Hard cap on rendered rows when NOT virtualized. Everything is rendered into the DOM, so
        // a very large array would otherwise lock the tab up. Past the cap the table renders a
        // footer saying what it withheld rather than silently truncating.
        maxRows: number;

        emptyView: React.ReactNode;

        _hoverKey: string;
        // The rendered window, QUANTIZED: recomputed from the live scrollTop but written only when
        // the snapped start actually moves (one write per `overscan` rows of travel). The body view
        // depends on these — never on the raw scroll offset — so the common scroll event re-renders
        // NOTHING. Depending on scrollTop directly would re-render every rendered row per event,
        // which is exactly the flicker this replaced.
        _winStart: number;
        _winEnd: number;
        __rootRef: React.RefObject<HTMLDivElement>;
        __resizeObserver: ResizeObserver;
        // Shift-click range anchor: the key of the last plain-clicked row.
        __anchorKey: string;
        // Live column-resize drag state; never rendered.
        __resize: { key: string; startX: number; startWidth: number };
        // Memo for the filter+sort derivation (and the row-view plumbing that must keep a stable
        // identity), MUTATED in place — deliberately. UECA props are
        // SHALLOW observables, so writing a FIELD of this object neither notifies nor subscribes
        // (the documented 'mutating a nested field won't re-render' footgun, used here as the
        // feature): the cache may be refreshed during a render read without causing a MobX cycle.
        // Without it, every scroll event and every selection click re-sorted the whole row set,
        // which is what made virtualized scrolling flicker and checkbox clicks sluggish.
        __derived: {
            rows: T[]; filters: Record<string, string>; sig: string; filtered: T[]; sorted: T[];
            // The column array handed to the memoized rows: refreshed only when the column KEYS
            // change, so its identity survives a caller thunk that rebuilds the array per read.
            columns: TableColumn<T>[];
            // Viewport height cached from the ResizeObserver — reading clientHeight per scroll
            // event forces synchronous layout.
            viewportH: number;
        };
    };

    events: {
        onSelectionChange: (row: T, key: string, source: TableModel<T>) => UECA.MaybePromise;
        onRowClick: (row: T, key: string, source: TableModel<T>) => UECA.MaybePromise;
        onSortChange: (key: string, direction: SortDirection, source: TableModel<T>) => UECA.MaybePromise;
        // Table-wide comparator, consulted before a column's own. An escape hatch for when ordering
        // depends on more than the sorted column.
        onSortCompare: (a: T, b: T, column: TableColumn<T>) => number;
    };

    methods: {
        // The derivation chain. Each is a pure read; nothing is cached, nothing to invalidate.
        filteredRows: () => T[];
        sortedRows: () => T[];
        // The rows the user can reach: filtered + sorted, capped only when not virtualized.
        displayRows: () => T[];

        toggleSort: (column: TableColumn<T>) => void;
        setFilter: (key: string, value: string) => void;

        selectRow: (row: T, key: string) => void;
        isRowSelected: (key: string) => boolean;
        toggleRowSelected: (row: T, key: string) => void;
        selectAllDisplayed: () => void;
        clearSelection: () => void;
        selectedRows: () => T[];
        // The row whose actionView is rendered: the row under the pointer, else the keyboard
        // cursor's row when the table is selectable. Exactly ONE row at a time, and no other row
        // renders its actions at all — the table owns that state rather than leaving the reveal to
        // CSS over N rendered copies. Two things follow: ONE shared action-button child can serve
        // every row without its DOM id (and so its tooltip/popover anchor) repeating down the
        // table, and that button can resolve its target at click time. The alternative — each row's
        // actionView capturing its row in a closure — goes stale, since a cached child never
        // re-adopts plain props.
        activeRowKey: () => string | undefined;
        activeRow: () => T | undefined;

        resetColumnWidths: () => void;
        scrollToRow: (index: number) => void;

        _RowView: (props: TableRowProps<T>) => React.JSX.Element;
        _HeaderView: () => React.JSX.Element;
        _FilterRowView: () => React.JSX.Element;
        _BodyView: () => React.JSX.Element;
        _FooterView: () => React.JSX.Element;
    };
}>;

type TableParams<T> = UIBaseParams<TableStruct<T>>;
type TableModel<T> = UIBaseModel<TableStruct<T>>;

export {
    ColumnAlign, ColumnDataType, ColumnWidth, SortDirection, TableCell, TableColumn,
    TableRowProps, TableStruct, TableParams, TableModel,
    HEADER_ROW_HEIGHT, MIN_RESIZE_WIDTH
};
