import * as UECA from "ueca-react";
import {
    Block, ButtonModel, Icon, ScreenBaseModel, ScreenBaseParams, ScreenBaseStruct, SelectModel, StatusLabel,
    SwitchModel, TableColumn, TableModel, useButton, useScreenBase, useSelect, useSwitch, useTable
} from "@components";
import { AppRoute, Breadcrumb, CodeSampleModel, CRUDScreenModel, ScreenRoute, useCodeSample, useCRUDScreen } from "@core";
import { ScreenPage, ScreenPager } from "../common/screenPage";
import { expr, objectLiteral } from "./codeGen";
import { PlaygroundGroup, PlaygroundWorkbench } from "./playgroundWorkbench";
import { playgroundNeighbours, playgroundTopic } from "./playgroundTopics";

type Order = {
    id: string;
    number: number;
    customer: string;
    status: "paid" | "pending" | "refunded";
    items: number;
    total: number;
    created: string;
};

const STATUS_INTENT = { paid: "success", pending: "warning", refunded: "error" } as const;

type RowCount = 10 | 100 | 1000 | 10000;

type TableState = {
    rowCount: RowCount;
    sortable: boolean;
    filterable: boolean;
    selectable: boolean;
    multiSelect: boolean;
    stickyFirstColumn: boolean;
    resizableColumns: boolean;
    virtualized: boolean;
};

const INITIAL: TableState = {
    rowCount: 100,
    sortable: true,
    filterable: true,
    selectable: true,
    multiSelect: false,
    stickyFirstColumn: false,
    resizableColumns: true,
    virtualized: false
};

// The component's own defaults — a prop equal to one of these is left out of the snippet.
const TABLE_DEFAULTS = {
    selectable: false,
    multiSelect: false,
    stickyFirstColumn: false,
    resizableColumns: false,
    virtualized: false
};

// A non-virtualised table renders every row into the DOM, so it stops at this many (Table's own
// maxRows default). Reported in the status line so a capped table never looks like missing data.
const RENDER_CAP = 2000;

type TablePlaygroundStruct = ScreenBaseStruct<{
    props: TableState;

    children: {
        crudScreen: CRUDScreenModel;
        preview: TableModel<Order>;
        code: CodeSampleModel;
        resetButton: ButtonModel;
        rowCountInput: SelectModel<RowCount>;
        sortableInput: SwitchModel;
        filterableInput: SwitchModel;
        selectableInput: SwitchModel;
        multiSelectInput: SwitchModel;
        stickyInput: SwitchModel;
        resizableInput: SwitchModel;
        virtualizedInput: SwitchModel;
    };

    methods: {
        go: (path: string) => Promise<void>;
        reset: () => void;
        _PageView: () => UECA.ReactElement;
        _PropertiesView: () => UECA.ReactElement;
    };
}>;

type TablePlaygroundParams = ScreenBaseParams<TablePlaygroundStruct>;
type TablePlaygroundModel = ScreenBaseModel<TablePlaygroundStruct>;

function useTablePlayground(params?: TablePlaygroundParams): TablePlaygroundModel {
    const struct: TablePlaygroundStruct = {
        props: {
            id: useTablePlayground.name,
            ...INITIAL
        },

        children: {
            crudScreen: useCRUDScreen({
                intent: "none",
                contentPaddings: "none",
                breadcrumbs: () => _breadcrumbs(),
                contentView: () => <model._PageView />
            }),

            preview: useTable<Order>({
                rows: () => _orders(model.rowCount),
                columns: () => _columns(),
                rowKeyField: "id",
                selectable: () => model.selectable,
                multiSelect: () => model.selectable && model.multiSelect,
                stickyFirstColumn: () => model.stickyFirstColumn,
                resizableColumns: () => model.resizableColumns,
                virtualized: () => model.virtualized,
                maxRows: RENDER_CAP
            }),

            code: useCodeSample({
                title: "TSX",
                code: () => _source()
            }),

            resetButton: useButton({
                contentView: "Reset",
                variant: "text",
                size: "small",
                startIconView: <Icon name="refresh" size="sm" />,
                onClick: () => model.reset()
            }),

            rowCountInput: useSelect<RowCount>({
                labelView: "Rows",
                value: UECA.bind(() => model, "rowCount"),
                fullWidth: true,
                options: [
                    { value: 10, label: "10 rows" },
                    { value: 100, label: "100 rows" },
                    { value: 1000, label: "1,000 rows" },
                    { value: 10000, label: "10,000 rows" }
                ],
                // A fresh data set has none of the old keys, so a stale selection would linger.
                onChange: () => {
                    model.preview.clearSelection();
                }
            }),

            sortableInput: useSwitch({
                labelView: "Sortable columns",
                checked: UECA.bind(() => model, "sortable"),
                onChange: (checked) => {
                    if (!checked) {
                        _clearSort();
                    }
                }
            }),

            filterableInput: useSwitch({
                labelView: "Filter row",
                checked: UECA.bind(() => model, "filterable"),
                onChange: (checked) => {
                    if (!checked) {
                        _clearFilters();
                    }
                }
            }),

            selectableInput: useSwitch({
                labelView: "Selectable rows",
                checked: UECA.bind(() => model, "selectable"),
                onChange: (checked) => {
                    if (!checked) {
                        model.preview.clearSelection();
                    }
                }
            }),

            multiSelectInput: useSwitch({
                labelView: "Multi-select",
                checked: UECA.bind(() => model, "multiSelect"),
                disabled: () => !model.selectable
            }),

            stickyInput: useSwitch({
                labelView: "Sticky first column",
                checked: UECA.bind(() => model, "stickyFirstColumn")
            }),

            resizableInput: useSwitch({
                labelView: "Resizable columns",
                checked: UECA.bind(() => model, "resizableColumns")
            }),

            virtualizedInput: useSwitch({
                labelView: "Virtualized",
                checked: UECA.bind(() => model, "virtualized"),
                helperTextView: "Renders only the rows in view."
            })
        },

        methods: {
            go: async (path) => {
                await model.goToRoute({ path } as AppRoute);
            },

            reset: () => {
                Object.assign(model, INITIAL);
                _clearSort();
                _clearFilters();
                model.preview.clearSelection();
                model.preview.resetColumnWidths();
            },

            _PageView: () => {
                const topic = playgroundTopic("table");
                return (
                    <ScreenPage
                        eyebrow={"Playground"}
                        icon={topic.icon}
                        title={topic.title}
                        lead={topic.lead}
                        footerView={
                            <ScreenPager
                                label={"Playground pages"}
                                prev={playgroundNeighbours("table").prev}
                                next={playgroundNeighbours("table").next}
                                onGo={(path) => model.go(path)}
                            />
                        }
                    >
                        <PlaygroundWorkbench
                            stageFill
                            stageView={<div className="playground-table-frame"><model.preview.View /></div>}
                            stageStatusView={_status()}
                            codeView={<model.code.View />}
                            panelActionsView={<model.resetButton.View />}
                            propertiesView={<model._PropertiesView />}
                        />
                    </ScreenPage>
                );
            },

            _PropertiesView: () => (
                <>
                    <PlaygroundGroup title={"Data"}>
                        <model.rowCountInput.View />
                        <model.virtualizedInput.View />
                    </PlaygroundGroup>
                    <PlaygroundGroup title={"Columns"}>
                        <model.sortableInput.View />
                        <model.filterableInput.View />
                        <model.resizableInput.View />
                        <model.stickyInput.View />
                    </PlaygroundGroup>
                    <PlaygroundGroup title={"Selection"}>
                        <model.selectableInput.View />
                        <model.multiSelectInput.View />
                    </PlaygroundGroup>
                </>
            )
        },

        View: () => <model.crudScreen.View />
    };

    const model = useScreenBase(struct, params);
    return model;

    // Private methods
    function _breadcrumbs(): Breadcrumb[] {
        const topic = playgroundTopic("table");
        return [
            { route: { path: "/" }, label: "Home" },
            { route: { path: topic.path } as ScreenRoute, label: `Playground · ${topic.title}` }
        ];
    }

    // The table applies its sort and filters whatever the columns' flags say, so switching a
    // feature off has to clear its state too — or the rows would stay sorted, or narrowed, with no
    // header arrow or filter box left to explain it or undo it.
    function _clearSort() {
        model.preview.sortKey = undefined;
        model.preview.sortDirection = "asc";
    }

    function _clearFilters() {
        model.preview.filters = {};
    }

    function _columns(): TableColumn<Order>[] {
        const sortable = model.sortable;
        const filterable = model.filterable;
        return [
            {
                key: "rowNumber",
                titleView: "#",
                width: 64,
                align: "right",
                // Computed, so it numbers the DISPLAYED order and renumbers on sort.
                cellView: (cell) => <Block className="ueca-caption">{cell.rowNumber}</Block>
            },
            { key: "number", titleView: "Order", field: "number", dataType: "number", sortable, filterable, width: 110 },
            { key: "customer", titleView: "Customer", field: "customer", sortable, filterable, width: { min: 180, max: 280 } },
            {
                key: "status",
                titleView: "Status",
                field: "status",
                sortable,
                filterable,
                width: 130,
                cellView: (cell) => (
                    <StatusLabel
                        id={`status-${cell.row.id}`}
                        intent={STATUS_INTENT[cell.row.status]}
                        variant="soft"
                        labelView={cell.row.status}
                    />
                )
            },
            { key: "items", titleView: "Items", field: "items", dataType: "number", sortable, width: 90 },
            { key: "total", titleView: "Total", field: "total", dataType: "number", decimals: 2, sortable, width: 120 },
            { key: "created", titleView: "Created", field: "created", dataType: "dateTime", sortable, width: 180 }
        ];
    }

    function _status(): string {
        const total = model.rowCount;
        const shown = model.preview.filteredRows().length;
        const parts = [shown === total ? `${total.toLocaleString()} rows` : `${shown.toLocaleString()} of ${total.toLocaleString()} rows`];
        if (!model.virtualized && shown > RENDER_CAP) {
            parts.push(`first ${RENDER_CAP.toLocaleString()} rendered — turn on Virtualized`);
        }
        if (model.selectable) {
            const selected = model.preview.selectedRows().length;
            parts.push(selected === 1 ? "1 selected" : `${selected} selected`);
        }
        return parts.join(" · ");
    }

    function _source(): string {
        const call = objectLiteral({
            rows: expr("() => model.orders"),
            columns: expr("() => model.orderColumns()"),
            rowKeyField: "id",
            selectable: model.selectable,
            multiSelect: model.selectable ? model.multiSelect : undefined,
            stickyFirstColumn: model.stickyFirstColumn,
            resizableColumns: model.resizableColumns,
            virtualized: model.virtualized,
            onSelectionChange: model.selectable ? expr("(row) => model.openOrder(row)") : undefined
        }, TABLE_DEFAULTS, 1);
        const columnFlags = [model.sortable ? "sortable: true" : "", model.filterable ? "filterable: true" : ""]
            .filter(Boolean)
            .join(", ");
        const columnHint = columnFlags
            ? `// Sorting and filtering are switched on per column:\n// { key: "customer", field: "customer",\n//   ${columnFlags} }\n`
            : "";
        return `${columnHint}children: {\n    orders: useTable<Order>(${call})\n}`;
    }
}

const TablePlayground = UECA.getFC(useTablePlayground);

export { TablePlaygroundParams, TablePlaygroundModel, useTablePlayground, TablePlayground };


// Private helpers
// Deterministic sample orders — no Math.random, so the table reads the same on every reload.
// Cached per size: the data is fixed for a given count, and rebuilding 10,000 rows on every
// render would be wasted work.
const ORDER_CACHE = new Map<number, Order[]>();

function _orders(count: number): Order[] {
    const cached = ORDER_CACHE.get(count);
    if (cached) {
        return cached;
    }
    const customers = ["Northwind Traders", "Contoso Ltd", "Fabrikam", "Adventure Works", "Tailspin Toys", "Wide World Importers", "Proseware", "Litware"];
    const statuses: Order["status"][] = ["paid", "paid", "pending", "paid", "refunded"];
    const orders = Array.from({ length: count }, (_, i) => ({
        id: `order-${i + 1}`,
        number: 10001 + i,
        customer: customers[(i * 5) % customers.length],
        status: statuses[(i * 3) % statuses.length],
        items: ((i * 7) % 12) + 1,
        total: Math.round((((i * 97) % 90000) + 1500)) / 100,
        created: new Date(Date.UTC(2026, 7, 1 + (i % 28), 8 + (i % 10), (i * 13) % 60)).toISOString()
    }));
    ORDER_CACHE.set(count, orders);
    return orders;
}
