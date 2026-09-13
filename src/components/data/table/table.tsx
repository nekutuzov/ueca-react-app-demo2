import * as UECA from "ueca-react";
import React from "react";
import { Block, Grid, Icon, useUIBase } from "@components";
import { SortDirection, TableColumn, TableModel, TableParams, TableStruct } from "./tableTypes";
import { cellClass, cellContent, cellOf, stickyClassFor } from "./tableFormat";
import { derive, hasFilterRow, headerHeight, rowKeyOf, stableColumns, updateWindow } from "./tableDerive";
import {
    endResize, filterKeyDown, keyDown, moveResize, resetColumnWidth, rowClick, rowMouseDown, startResize
} from "./tableInteractions";
import "./table.css";

// Table — a data grid built on CSS grid.
//
// The layout mechanism: the table root owns `grid-template-columns`, and each header/body ROW is
// `display: contents` so its cells become direct grid children. That is what keeps every column
// aligned down the table while still letting a whole row hover and select as one unit. A table of
// nested flex rows cannot do both.
//
// The data is a plain array rather than a stateful cursor, which cannot tell MobX anything has
// changed and so needs a render-flag toggle to force a re-render on sort. The table derives the
// displayed set — rows → filteredRows() → sortedRows() → displayRows() → (window when virtualized) —
// so a change to any input simply re-renders.
//
// The module splits by concern: tableTypes (the type surface), tableFormat (pure cell helpers),
// tableDerive (filter/sort memo + window math), tableInteractions (selection/keyboard/resize).

function useTable<T extends Record<string, unknown>>(params?: TableParams<T>): TableModel<T> {
    const struct: TableStruct<T> = {
        props: {
            id: useTable.name,
            rows: [],
            columns: [],
            rowKeyField: undefined,
            sortKey: undefined,
            sortDirection: "asc",
            selectable: false,
            selectedKey: undefined,
            multiSelect: false,
            selectedKeys: [],
            filters: {},
            stickyFirstColumn: false,
            resizableColumns: false,
            _columnWidths: {},
            virtualized: false,
            rowHeight: 40,
            overscan: 6,
            maxRows: 2000,
            emptyView: "No rows to show",
            _hoverKey: undefined,
            _winStart: 0,
            _winEnd: 0,
            __rootRef: { current: null },
            __resizeObserver: undefined,
            __anchorKey: undefined,
            __resize: undefined,
            __derived: { rows: undefined, filters: undefined, sig: undefined, filtered: undefined, sorted: undefined, columns: undefined, viewportH: 0 }
        },

        methods: {
            filteredRows: () => {
                return derive(model).filtered;
            },

            sortedRows: () => {
                return derive(model).sorted;
            },

            displayRows: () => {
                const sorted = model.sortedRows();
                if (model.virtualized) {
                    return sorted;
                }
                return sorted.length > model.maxRows ? sorted.slice(0, model.maxRows) : sorted;
            },

            toggleSort: (column) => {
                if (!column.sortable) {
                    return;
                }

                const direction: SortDirection =
                    model.sortKey === column.key && model.sortDirection === "asc" ? "desc" : "asc";

                model.sortKey = column.key;
                model.sortDirection = direction;

                if (model.onSortChange) {
                    model.onSortChange(column.key, direction, model);
                }
            },

            setFilter: (key, value) => {
                // Reassign the whole object — MobX is shallow, a field mutation would not render.
                model.filters = { ...model.filters, [key]: value };
            },

            selectRow: (row, key) => {
                if (!_isSelectable()) {
                    return;
                }

                model.selectedKey = key;
                if (model.multiSelect) {
                    model.__anchorKey = key;
                    model.selectedKeys = [key];
                }
                if (model.onSelectionChange) {
                    model.onSelectionChange(row, key, model);
                }
            },

            isRowSelected: (key) => {
                if (model.multiSelect) {
                    return model.selectedKeys?.includes(key) ?? false;
                }
                return key === model.selectedKey;
            },

            toggleRowSelected: (row, key) => {
                const current = model.selectedKeys ?? [];
                if (current.includes(key)) {
                    model.selectedKeys = current.filter((k) => k !== key);
                } else {
                    model.selectedKeys = [...current, key];
                }
                model.selectedKey = key;
                model.__anchorKey = key;
                if (model.onSelectionChange) {
                    model.onSelectionChange(row, key, model);
                }
            },

            selectAllDisplayed: () => {
                model.selectedKeys = model.displayRows().map((row, i) => rowKeyOf(model, row, i));
            },

            clearSelection: () => {
                model.selectedKeys = [];
                model.selectedKey = undefined;
            },

            selectedRows: () => {
                const keys = new Set(model.multiSelect ? model.selectedKeys : [model.selectedKey]);
                // Resolved against the DISPLAYED rows for the same reason as activeRow: with no
                // rowKeyField the key is an index, and it was minted in the filtered + sorted
                // order. Scanning model.rows would return different records.
                return model.displayRows().filter((row, i) => keys.has(rowKeyOf(model, row, i)));
            },

            activeRowKey: () => {
                if (model._hoverKey !== undefined) {
                    return model._hoverKey;
                }
                // No pointer: fall back to the keyboard cursor, so a row reached by arrow keys
                // shows its actions and they can be tabbed into. A non-selectable table has no
                // cursor and so no actions without a pointer.
                return _isSelectable() ? model.selectedKey : undefined;
            },

            activeRow: () => {
                const key = model.activeRowKey();
                if (key === undefined) {
                    return undefined;
                }
                // Resolve against the DISPLAYED rows: with no rowKeyField the key is an index, and
                // that index counts the filtered + sorted order the key was minted in. Scanning
                // model.rows would return a different record entirely.
                return model.displayRows().find((row, i) => rowKeyOf(model, row, i) === key);
            },

            resetColumnWidths: () => {
                model._columnWidths = {};
            },

            scrollToRow: (index) => {
                const el = model.__rootRef.current;
                if (!el) {
                    return;
                }

                // The sticky header covers the top of the viewport and the sticky footer (when
                // shown) covers the bottom — the usable band lies between them. scrollIntoView
                // knows about neither (it happily parks the row UNDER the header), so both paths
                // position the scroll offset themselves.
                const headerH = headerHeight(model);
                const footerH = (el.querySelector(".ueca-table-footer") as HTMLElement | null)?.offsetHeight ?? 0;

                if (model.virtualized) {
                    const rowTop = headerH + index * model.rowHeight;
                    const rowBottom = rowTop + model.rowHeight;
                    if (rowTop < el.scrollTop + headerH) {
                        el.scrollTop = index * model.rowHeight;
                    } else if (rowBottom > el.scrollTop + el.clientHeight - footerH) {
                        el.scrollTop = rowBottom - el.clientHeight + footerH;
                    }
                    updateWindow(model);
                    return;
                }

                const rows = model.displayRows();
                const row = rows[index];
                if (!row) {
                    return;
                }
                // A row is display:contents (no box), so measure its first CELL instead. offsetTop
                // is relative to the table root, which is position:relative — content coordinates.
                const key = rowKeyOf(model, row, index);
                const cell = el.querySelector(`[data-rowkey="${CSS.escape(key)}"] > *`) as HTMLElement | null;
                if (!cell) {
                    return;
                }
                const cellTop = cell.offsetTop;
                const cellBottom = cellTop + cell.offsetHeight;
                if (cellTop < el.scrollTop + headerH) {
                    el.scrollTop = cellTop - headerH;
                } else if (cellBottom > el.scrollTop + el.clientHeight - footerH) {
                    el.scrollTop = cellBottom - el.clientHeight + footerH;
                }
            },

            // One body row. A *View METHOD: UECA wraps it in mobx-react observer(), which since
            // mobx-react 6 also applies memo — so when _BodyView re-renders (a window shift, a
            // selection click), rows whose props are shallow-equal BAIL OUT of rendering entirely.
            // A shift pays only for the rows entering the window; a selection click only for the
            // rows whose flags flipped. That bailout is what keeps virtualized scrolling smooth,
            // so everything variable must arrive through props (see TableRowProps) and `columns`
            // must keep a stable identity (stableColumns).
            _RowView: (props) => {
                const { row, rowKey, rowIndex } = props;

                return (
                    <div
                        data-rowkey={rowKey}
                        role="row"
                        aria-selected={props.selectable ? props.selected : undefined}
                        className={
                            "ueca-table-row ueca-table-body-row" +
                            (props.selected ? " selected" : "") +
                            (props.current ? " current" : "") +
                            (props.selectable ? " selectable" : "")
                        }
                        onMouseEnter={() => { model._hoverKey = rowKey; }}
                        // Guarded: leaving row A and entering row B fires A's leave AFTER B's
                        // enter, which would otherwise blank the key B just claimed.
                        onMouseLeave={() => {
                            if (model._hoverKey === rowKey) {
                                model._hoverKey = undefined;
                            }
                        }}
                        onMouseDown={(e) => { rowMouseDown(model, e); }}
                        onClick={(e) => { rowClick(model, e, row, rowKey, rowIndex); }}
                    >
                        {props.columns.map((column, colIndex) => (
                            <div
                                key={column.key}
                                role="gridcell"
                                className={cellClass(column, "ueca-table-cell" + stickyClassFor(colIndex, props.sticky))}
                            >
                                <span className="ueca-table-cell-content">
                                    {cellContent(column, row, rowIndex)}
                                </span>
                                {column.actionView && props.active && (
                                    <span className="ueca-table-cell-actions ueca-chromed-icon-buttons">
                                        {column.actionView(cellOf(column, row, rowIndex))}
                                    </span>
                                )}
                            </div>
                        ))}
                        <div className="ueca-table-cell ueca-table-filler" role="presentation" />
                    </div>
                );
            },

            _HeaderView: () => (
                <div className="ueca-table-row ueca-table-header" role="row">
                    {model.columns.map((column, colIndex) => (
                        <div
                            key={column.key}
                            role="columnheader"
                            aria-sort={_ariaSort(column)}
                            className={cellClass(column, "ueca-table-header-cell" + (column.sortable ? " sortable" : "") + _stickyClass(colIndex))}
                            onClick={() => model.toggleSort(column)}
                        >
                            <span className="ueca-table-header-label">{column.titleView}</span>
                            {column.sortable && (
                                <Icon
                                    name={_sortIconName(column)}
                                    size="xs"
                                    color={model.sortKey === column.key ? "primary.main" : "text.disabled"}
                                />
                            )}
                            {model.resizableColumns && column.resizable !== false && (
                                <span
                                    className="ueca-table-resize-handle"
                                    {...model.tooltipProps("Drag to resize · double-click to reset")}
                                    onClick={(e) => { e.stopPropagation(); }}
                                    onDoubleClick={(e) => { resetColumnWidth(model, e, column); }}
                                    onPointerDown={(e) => { startResize(model, e, column); }}
                                    onPointerMove={(e) => { moveResize(model, e); }}
                                    onPointerUp={(e) => { endResize(model, e); }}
                                />
                            )}
                        </div>
                    ))}
                    {/* Filler: absorbs leftover width so real columns keep the width they asked for
                        instead of the last one stretching. */}
                    <div className="ueca-table-header-cell ueca-table-filler" role="presentation" />
                </div>
            ),

            _FilterRowView: () => {
                if (!hasFilterRow(model)) {
                    return null;
                }

                return (
                    <div className="ueca-table-row ueca-table-filter-row" role="row">
                        {model.columns.map((column, colIndex) => (
                            <div key={column.key} className={"ueca-table-filter-cell" + _stickyClass(colIndex)} role="gridcell">
                                {column.filterable && (
                                    <input
                                        type="text"
                                        className="ueca-table-filter-input"
                                        placeholder="Filter"
                                        value={model.filters?.[column.key] ?? ""}
                                        onChange={(e) => { model.setFilter(column.key, e.target.value); }}
                                        // The table root owns arrow/space/enter for row navigation;
                                        // keys typed INTO a filter belong to the input alone.
                                        onKeyDown={(e) => { filterKeyDown(model, e, column); }}
                                    />
                                )}
                            </div>
                        ))}
                        <div className="ueca-table-filter-cell ueca-table-filler" role="presentation" />
                    </div>
                );
            },

            _BodyView: () => {
                const rows = model.displayRows();

                if (rows.length === 0) {
                    return (
                        <div className="ueca-table-empty" role="row">
                            <Block className="ueca-caption">{model.emptyView}</Block>
                        </div>
                    );
                }

                // Windowing: render [start, end) between two full-width spacers whose heights keep
                // the scrollbar honest. Without virtualisation the window is simply everything.
                // The bounds come from the QUANTIZED window props — clamped, because a filter can
                // shrink the data under a deep scroll position before the clamp-scroll event lands.
                const columns = stableColumns(model);
                const selectable = _isSelectable();
                const activeKey = model.activeRowKey();

                let start = 0;
                let end = rows.length;
                if (model.virtualized) {
                    start = Math.min(model._winStart, Math.max(0, rows.length - 1));
                    end = model._winEnd > start ? Math.min(model._winEnd, rows.length) : Math.min(start + 30, rows.length);
                }

                return (
                    <>
                        {model.virtualized && start > 0 && (
                            <div className="ueca-table-spacer" style={{ height: start * model.rowHeight }} />
                        )}
                        {rows.slice(start, end).map((row, i) => {
                            const rowIndex = start + i;
                            const key = rowKeyOf(model, row, rowIndex);

                            return (
                                <model._RowView
                                    key={key}
                                    row={row}
                                    rowKey={key}
                                    rowIndex={rowIndex}
                                    selected={selectable && model.isRowSelected(key)}
                                    current={selectable && key === model.selectedKey}
                                    selectable={selectable}
                                    active={key === activeKey}
                                    sticky={model.stickyFirstColumn}
                                    columns={columns}
                                />
                            );
                        })}
                        {model.virtualized && end < rows.length && (
                            <div className="ueca-table-spacer" style={{ height: (rows.length - end) * model.rowHeight }} />
                        )}
                    </>
                );
            },

            _FooterView: () => {
                const total = model.rows?.length ?? 0;
                const filtered = model.filteredRows().length;
                const capped = !model.virtualized && filtered > model.maxRows;

                if (!capped && filtered === total) {
                    return null;
                }

                // Say what was withheld. Silently showing the first N of a large set is how someone
                // concludes a record is missing — an active filter deserves the same honesty.
                const shown = capped ? model.maxRows : filtered;
                return (
                    <div className={"ueca-table-footer" + (capped ? " capped" : "")} role="row">
                        <Block className="ueca-caption">
                            Showing {shown.toLocaleString()} of {total.toLocaleString()} rows
                            {filtered !== total ? " (filtered)" : ""}
                            {capped ? " — narrow the selection to see the rest." : ""}
                        </Block>
                    </div>
                );
            }
        },

        mount: () => {
            const el = model.__rootRef.current;
            if (el && model.virtualized) {
                model.__resizeObserver = new ResizeObserver(() => {
                    model.__derived.viewportH = el.clientHeight;
                    updateWindow(model);
                });
                model.__resizeObserver.observe(el);
                model.__derived.viewportH = el.clientHeight;
                updateWindow(model);
            }
        },

        unmount: () => {
            model.__resizeObserver?.disconnect();
            model.__resizeObserver = undefined;
            // A row action that navigates away unmounts the row before its mouseleave fires. The
            // model is cached, so without this the table comes back showing a stray action button
            // on a row the pointer is nowhere near.
            model._hoverKey = undefined;
        },

        View: () => {
            const className = "ueca-table"
                + (model.virtualized ? " virtualized" : "")
                + (model.stickyFirstColumn ? " sticky-first" : "");

            // The row height feeds the fixed cell height in virtualized mode.
            const vars = {
                "--table-row-h": `${model.rowHeight}px`
            } as React.CSSProperties;

            return (
            <Grid
                id={model.htmlId()}
                ref={model.__rootRef}
                className={className}
                role="grid"
                columns={_columnTemplate()}
                spacing="none"
                overflow="auto"
                tabIndex={_isSelectable() ? 0 : undefined}
                onKeyDown={(e) => { keyDown(model, e); }}
                onScroll={() => { updateWindow(model); }}
                sx={vars}
            >
                <model._HeaderView />
                <model._FilterRowView />
                <model._BodyView />
                <model._FooterView />
            </Grid>
            );
        }
    };

    const model = useUIBase(struct, params);
    return model;


    // Private methods
    function _isSelectable(): boolean {
        return model.selectable || model.multiSelect;
    }

    function _stickyClass(colIndex: number): string {
        return stickyClassFor(colIndex, model.stickyFirstColumn);
    }

    function _sortIconName(column: TableColumn<T>) {
        if (model.sortKey !== column.key) {
            return "sort" as const;
        }
        return model.sortDirection === "asc" ? ("chevronUp" as const) : ("chevronDown" as const);
    }

    function _ariaSort(column: TableColumn<T>): "ascending" | "descending" | "none" | undefined {
        if (!column.sortable) {
            return undefined;
        }
        if (model.sortKey !== column.key) {
            return "none";
        }
        return model.sortDirection === "asc" ? "ascending" : "descending";
    }

    function _columnTemplate(): string {
        const tracks = (model.columns ?? []).map((c) => _track(c));
        // The trailing filler column rendered in every row. A theme can collapse it to 0, which
        // hands the free space to the auto-width columns instead — they stretch to fill the grid
        // rather than shrink-wrapping their content.
        return [...tracks, "var(--table-filler-track, 1fr)"].join(" ");
    }

    function _track(column: TableColumn<T>): string {
        // A drag-resize override wins over the authored width until reset.
        const override = model._columnWidths?.[column.key];
        if (override != null) {
            return `${override}px`;
        }

        const width = column.width;
        if (width == null) {
            return "auto";
        }
        if (typeof width === "number") {
            return `${width}px`;
        }
        if (typeof width === "string") {
            return width;
        }

        const min = width.min != null ? _size(width.min) : "auto";
        const max = width.max != null ? _size(width.max) : "auto";
        return `minmax(${min}, ${max})`;
    }

    function _size(value: number | string): string {
        return typeof value === "number" ? `${value}px` : value;
    }
}

const Table = UECA.getFC(useTable);

export type { ColumnAlign, ColumnDataType, ColumnWidth, SortDirection, TableCell, TableColumn, TableParams, TableModel } from "./tableTypes";
export { useTable, Table };
