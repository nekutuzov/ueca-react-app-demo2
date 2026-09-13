import { HEADER_ROW_HEIGHT, TableColumn, TableModel } from "./tableTypes";
import { compareValues, formatText } from "./tableFormat";

// The filter/sort derivation and the virtualisation window math. Model-bound but stateless —
// every function takes the table model explicitly.

function hasFilterRow<T>(model: TableModel<T>): boolean {
    return model.columns?.some((c) => c.filterable) ?? false;
}

function headerHeight<T>(model: TableModel<T>): number {
    return HEADER_ROW_HEIGHT * (1 + (hasFilterRow(model) ? 1 : 0));
}

function rowKeyOf<T>(model: TableModel<T>, row: T, index: number): string {
    const value = model.rowKeyField ? row[model.rowKeyField] : undefined;
    return value != null ? String(value) : String(index);
}

// Compute (or return the cached) filtered + sorted row set. Reading the dependencies happens
// on EVERY call, hit or miss, so the calling view still subscribes to them; only the filter
// scan and the sort are skipped. Cache identity: the rows/filters REFERENCES (both are
// reassigned whole on change, never mutated) plus a signature of the sort state and the column
// keys — column arrays can come from a thunk that rebuilds them per read, so their reference
// proves nothing. A changed comparator or filter callback on an existing column is NOT
// detected; columns are treated as configuration, not data.
function derive<T>(model: TableModel<T>): { filtered: T[]; sorted: T[] } {
    const rows = model.rows ?? [];
    const filters = model.filters ?? {};
    const sig = model.sortKey + "|" + model.sortDirection + "|" + (model.columns ?? []).map((c) => c.key).join(",");
    const cache = model.__derived;
    if (cache.sorted && cache.rows === rows && cache.filters === filters && cache.sig === sig) {
        return cache;
    }

    const active = Object.entries(filters).filter(([, text]) => !!text?.trim());
    let filtered = rows;
    if (active.length > 0) {
        filtered = rows.filter((row) => active.every(([key, text]) => {
            const column = model.columns?.find((c) => c.key === key);
            if (!column) {
                return true;
            }
            if (column.onFilter) {
                return column.onFilter(row, text);
            }
            return formatText(row, column).toLowerCase().includes(text.trim().toLowerCase());
        }));
    }

    const sortColumn = model.columns?.find((c) => c.key === model.sortKey);
    let sorted = filtered;
    if (sortColumn) {
        const sign = model.sortDirection === "desc" ? -1 : 1;
        // Copy before sorting: Array.sort mutates, and reordering the caller's array as a
        // side effect of displaying it would be a nasty surprise.
        sorted = [...filtered].sort((a, b) => sign * _compare(model, a, b, sortColumn));
    }

    cache.rows = rows;
    cache.filters = filters;
    cache.sig = sig;
    cache.filtered = filtered;
    cache.sorted = sorted;
    cache.columns = model.columns ?? [];
    return cache;
}

function _compare<T>(model: TableModel<T>, a: T, b: T, column: TableColumn<T>): number {
    if (model.onSortCompare) {
        return model.onSortCompare(a, b, column);
    }
    if (column.onSortCompare) {
        return column.onSortCompare(a, b);
    }
    if (!column.field) {
        return 0;
    }

    return compareValues(a[column.field], b[column.field], column);
}

// The column array handed to the memoized rows — identity refreshed only when the column KEYS
// change (via derive), so a caller thunk that rebuilds the array per read cannot break the
// row memo. Trade-off: editing a column's config in place without changing its key is not
// picked up; columns are configuration, not data.
function stableColumns<T>(model: TableModel<T>): TableColumn<T>[] {
    derive(model);
    return model.__derived.columns ?? [];
}

// Recompute the rendered window from the LIVE scroll offset — called from the scroll event,
// the ResizeObserver, and scrollToRow, never from a render. The start is snapped DOWN to a
// multiple of `overscan` and the end padded past the viewport by two quanta, so the window
// only moves — and the body only re-renders — once per `overscan` rows of travel, in small
// steady steps (the memo'd rows make each step pay only for the `overscan` rows entering).
//
// Tried and REVERTED: hysteresis + velocity-biased recentering, plus row-striped spacers. The
// bias turned the small steady shift renders into infrequent 2-4x lumps (felt jerky), and a
// repeating gradient on a spacer that can be 200,000px tall starves the compositor's tile
// rasterizer — the "not fully painted rows" it was supposed to prevent. At extreme fling
// velocity the compositor simply outruns anything JS can render; small steady updates lose
// that race more gracefully than big clever ones.
function updateWindow<T>(model: TableModel<T>) {
    const el = model.__rootRef.current;
    if (!el || !model.virtualized) {
        return;
    }
    const q = Math.max(1, model.overscan);
    // clientHeight forces layout when read mid-scroll; the ResizeObserver keeps a cached copy.
    const viewportH = model.__derived.viewportH || el.clientHeight;
    const visible = Math.ceil(Math.max(0, viewportH - headerHeight(model)) / model.rowHeight) + 1;
    const first = Math.floor(el.scrollTop / model.rowHeight);
    const start = Math.max(0, Math.floor(Math.max(0, first - q) / q) * q);
    const end = start + visible + 3 * q;
    if (start !== model._winStart || end !== model._winEnd) {
        model._winStart = start;
        model._winEnd = end;
    }
}

export { hasFilterRow, headerHeight, rowKeyOf, derive, stableColumns, updateWindow };
