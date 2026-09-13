import * as UECA from "ueca-react";
import {
    Block, Col, Grid, GridCell, Icon, IconButtonModel, StatusLabel, TableColumn, TableModel,
    UIBaseModel, UIBaseParams, UIBaseStruct, useIconButton, useTable, useUIBase
} from "@components";
import { ShowcaseSection } from "../showcaseSection";

type Site = {
    id: string;
    name: string;
    status: "online" | "degraded" | "offline";
    instruments: number;
    drift: number;
    lastReading: string;
    licensed: boolean;
};

const STATUS_INTENT = { online: "success", degraded: "warning", offline: "error" } as const;

// Deterministic sample data — no Math.random, so the specimen looks the same every reload and a
// screenshot diff means something.
function _sites(count: number): Site[] {
    const names = ["Kellogg Dam", "North Shaft", "Ridge Cut", "Tailings Cell 2", "Bridge Pier 7", "Portal West"];
    const statuses: Site["status"][] = ["online", "degraded", "offline"];
    return Array.from({ length: count }, (_, i) => ({
        id: `site-${i + 1}`,
        name: `${names[i % names.length]} ${Math.floor(i / names.length) + 1}`,
        status: statuses[(i * 7) % 3],
        instruments: ((i * 13) % 47) + 3,
        drift: (((i * 37) % 200) - 100) / 10,
        lastReading: new Date(Date.UTC(2026, 7, 15, 6 + (i % 12), (i * 11) % 60)).toISOString(),
        licensed: i % 4 !== 0
    }));
}

const SITES = _sites(24);
const MANY_SITES = _sites(5000);

type DataTopicStruct = UIBaseStruct<{
    props: {
        _selected: Site;
    };

    children: {
        sitesTable: TableModel<Site>;
        featureTable: TableModel<Site>;
        cappedTable: TableModel<Site>;
        emptyTable: TableModel<Site>;
        rowEditButton: IconButtonModel;
    };

    methods: {
        _GridView: () => React.JSX.Element;
        _TableView: () => React.JSX.Element;
        _SitesReadoutView: () => React.JSX.Element;
        _FeatureTableView: () => React.JSX.Element;
        _SelectionReadoutView: () => React.JSX.Element;
        _EdgeView: () => React.JSX.Element;
        _columns: () => TableColumn<Site>[];
    };
}>;

type DataTopicParams = UIBaseParams<DataTopicStruct>;
type DataTopicModel = UIBaseModel<DataTopicStruct>;

function useDataTopic(params?: DataTopicParams): DataTopicModel {
    const struct: DataTopicStruct = {
        props: {
            id: useDataTopic.name,
            _selected: undefined
        },

        children: {
            rowEditButton: useIconButton({
                kind: "refresh",
                size: "xsmall",
                tooltipView: "Re-poll this site"
            }),

            sitesTable: useTable<Site>({
                rows: () => SITES,
                columns: () => model._columns(),
                rowKeyField: "id",
                sortKey: "name",
                sortDirection: "asc",
                selectable: true,
                resizableColumns: true,
                onSelectionChange: (row) => { model._selected = row; }
            }),

            // Everything at once: windowed rendering over 5,000 rows, desktop-style multi-select
            // (highlight only — no checkbox column), the first column pinned against horizontal
            // scroll, resizable headers, and keyboard navigation once the table has focus. The
            // shared rowEditButton is stripped because it already serves sitesTable above, and one
            // child model rendered from two tables at once would duplicate its DOM id (and so its
            // tooltip anchor). Within ONE table, multiSelect is fine: actions render for the
            // active row alone, not for every selected row.
            featureTable: useTable<Site>({
                rows: () => MANY_SITES,
                columns: () => model._columns().map((c: TableColumn<Site>) => ({ ...c, actionView: undefined as typeof c.actionView })),
                rowKeyField: "id",
                sortKey: "name",
                virtualized: true,
                multiSelect: true,
                stickyFirstColumn: true,
                resizableColumns: true
            }),

            cappedTable: useTable<Site>({
                rows: () => MANY_SITES,
                columns: () => model._columns().slice(0, 4),
                rowKeyField: "id",
                maxRows: 50
            }),

            emptyTable: useTable<Site>({
                rows: () => [],
                columns: () => model._columns().slice(0, 4),
                emptyView: "No sites match the current filter"
            })
        },

        methods: {
            _columns: () => [
                {
                    key: "rowNumber",
                    titleView: "#",
                    width: 56,
                    align: "right",
                    // A computed column: no field, so nothing to sort by — it numbers the DISPLAYED
                    // order and renumbers when the table is sorted.
                    cellView: (cell) => <Block className="ueca-caption">{cell.rowNumber}</Block>
                },
                {
                    key: "name",
                    titleView: "Site",
                    field: "name",
                    sortable: true,
                    filterable: true,
                    width: { min: 180, max: 280 },
                    actionView: () => <model.rowEditButton.View />
                },
                {
                    key: "status",
                    titleView: "Status",
                    field: "status",
                    sortable: true,
                    filterable: true,
                    width: 140,
                    cellView: (cell) => (
                        <StatusLabel
                            id={`status-${cell.row.id}`}
                            intent={STATUS_INTENT[cell.row.status]}
                            variant="bare"
                            labelView={cell.row.status}
                        />
                    )
                },
                { key: "instruments", titleView: "Instruments", field: "instruments", dataType: "number", sortable: true, filterable: true, width: 120 },
                { key: "drift", titleView: "Drift (mm)", field: "drift", dataType: "number", decimals: 2, sortable: true, width: 120 },
                { key: "licensed", titleView: "Licensed", field: "licensed", dataType: "boolean", sortable: true, width: 100 },
                { key: "lastReading", titleView: "Last reading", field: "lastReading", dataType: "dateTime", sortable: true, width: 170 }
            ],

            _GridView: () => (
                <ShowcaseSection
                    title="Grid — two-dimensional layout"
                    description="Row and Col each handle one axis, so a stack of Rows never lines up column-to-column.
                                 Grid does both. A number gives equal columns; a string is a raw template for the
                                 cases equal columns cannot express."
                >
                    <Col spacing="medium">
                        <Col spacing="px4">
                            <Block className="showcase-specimen-label">columns={"{4}"} · spacing="small"</Block>
                            <Grid columns={4} spacing="small">
                                {Array.from({ length: 8 }, (_, i) => (
                                    <Block key={i} className="showcase-swatch" height={32} />
                                ))}
                            </Grid>
                        </Col>

                        <Col spacing="px4">
                            <Block className="showcase-specimen-label">
                                columns="200px 1fr auto" — a label/field/action form row that aligns down the page
                            </Block>
                            <Grid columns="200px 1fr auto" spacing="small" verticalAlign="center">
                                <Block className="ueca-label">Site name</Block>
                                <Block className="showcase-swatch" height={28} />
                                <Icon name="edit" size="sm" />
                                <Block className="ueca-label">Database path</Block>
                                <Block className="showcase-swatch" height={28} />
                                <Icon name="folder" size="sm" />
                                <Block className="ueca-label">Reporting interval</Block>
                                <Block className="showcase-swatch" height={28} />
                                <Icon name="calendar" size="sm" />
                            </Grid>
                        </Col>

                        <Col spacing="px4">
                            <Block className="showcase-specimen-label">GridCell colSpan / rowSpan</Block>
                            <Grid columns={4} spacing="tiny">
                                <GridCell colSpan={2}><Block className="showcase-swatch" height={32} /></GridCell>
                                <GridCell rowSpan={2}><Block className="showcase-swatch" height="100%" minHeight={72} /></GridCell>
                                <Block className="showcase-swatch" height={32} />
                                <Block className="showcase-swatch" height={32} />
                                <GridCell colSpan={2}><Block className="showcase-swatch" height={32} /></GridCell>
                            </Grid>
                        </Col>
                    </Col>
                </ShowcaseSection>
            ),

            _TableView: () => (
                <ShowcaseSection
                    title="Table"
                    description="Click a header to sort (again to reverse), type in the filter row to narrow, drag a
                                 header's right edge to resize it (double-click the edge resets). Click a row to
                                 select it, hover for its actions. The row number column renumbers as you sort or
                                 filter — it follows the displayed order, not the source array."
                    framed={false}
                >
                    <Col spacing="small">
                        <Block className="showcase-table-frame">
                            <model.sitesTable.View />
                        </Block>
                        <model._SitesReadoutView />
                    </Col>
                </ShowcaseSection>
            ),

            // Its OWN boundary: it reads _selected and the sort, which change on click — reading
            // them beside <model.sitesTable.View /> would remount the table on every selection
            // (dropping scroll position and filter-input focus).
            _SitesReadoutView: () => (
                <Block className="showcase-specimen-label">
                    selected: {model._selected ? `${model._selected.name} (${model._selected.id})` : "—"}
                    {"  ·  "}sorted by: {model.sitesTable.sortKey} {model.sitesTable.sortDirection}
                    {"  ·  "}showing: {model.sitesTable.displayRows().length} of {SITES.length}
                </Block>
            ),

            _FeatureTableView: () => (
                <ShowcaseSection
                    title="Virtualized + multi-select + pinned column — 5,000 rows"
                    description="Only the visible slice is in the DOM; the spacers keep the scrollbar honest.
                                 Desktop-style selection — plain click for one row, Ctrl/Cmd+click to toggle,
                                 Shift+click for a range, Ctrl+A for everything, Escape to clear. Click the table,
                                 then drive it from the keyboard: arrows move the current row, Shift+arrow extends,
                                 Space toggles, Enter opens. The Site column stays pinned while the columns scroll
                                 under it."
                    framed={false}
                >
                    <Col spacing="small">
                        <Block className="showcase-table-frame" maxWidth={640} sx={{ height: 360 }}>
                            <model.featureTable.View />
                        </Block>
                        <model._SelectionReadoutView />
                    </Col>
                </ShowcaseSection>
            ),

            // Own boundary, same reason as _SitesReadoutView — selection changes on every click,
            // keystroke and checkbox, and must not remount the table it describes.
            _SelectionReadoutView: () => (
                <Block className="showcase-specimen-label">
                    selected: {model.featureTable.selectedKeys.length.toLocaleString()} of {MANY_SITES.length.toLocaleString()}
                    {"  ·  "}current: {model.featureTable.selectedKey ?? "—"}
                </Block>
            ),

            _EdgeView: () => (
                <Col spacing="medium">
                    <ShowcaseSection
                        title="Over the cap"
                        description="Without `virtualized`, everything is rendered into the DOM, so the table caps what
                                     it draws and says what it withheld. Silently showing the first N is how someone
                                     concludes a record is missing. 5,000 rows, capped at 50."
                        framed={false}
                    >
                        <Block className="showcase-table-frame" sx={{ maxHeight: 260 }}>
                            <model.cappedTable.View />
                        </Block>
                    </ShowcaseSection>

                    <ShowcaseSection
                        title="Empty"
                        description="An empty table still shows its headers, so the columns stay legible and sorting
                                     controls do not vanish."
                        framed={false}
                    >
                        <Block className="showcase-table-frame">
                            <model.emptyTable.View />
                        </Block>
                    </ShowcaseSection>
                </Col>
            )
        },

        View: () => (
            <Col id={model.htmlId()} className="showcase-topic" spacing="large">
                <model._GridView />
                <model._TableView />
                <model._FeatureTableView />
                <model._EdgeView />
            </Col>
        )
    };

    const model = useUIBase(struct, params);
    return model;
}

const DataTopic = UECA.getFC(useDataTopic);

export { DataTopicParams, DataTopicModel, useDataTopic, DataTopic };
