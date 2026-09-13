import * as UECA from "ueca-react";
import {
    Block, ButtonModel, Col, FilterableListModel, Icon, Row, SearchFieldModel, UIBaseModel,
    UIBaseParams, UIBaseStruct, useButton, useFilterableList, useSearchField, useUIBase,
    useVirtualList, VirtualListModel
} from "@components";
import { ShowcaseSection } from "../showcaseSection";

type Instrument = {
    id: string;
    name: string;
    kind: "piezometer" | "inclinometer" | "extensometer" | "tiltmeter";
    site: string;
};

// Deterministic sample data — no Math.random, so the specimen looks the same every reload.
function _instruments(count: number): Instrument[] {
    const kinds: Instrument["kind"][] = ["piezometer", "inclinometer", "extensometer", "tiltmeter"];
    const sites = ["Cedar Lake Dam", "North Shaft", "Ridge Cut", "Tailings Cell 2", "Bridge Pier 7", "Portal West"];
    return Array.from({ length: count }, (_, i) => ({
        id: `inst-${i + 1}`,
        name: `${kinds[i % kinds.length].toUpperCase().slice(0, 2)}-${String(i + 1).padStart(4, "0")}`,
        kind: kinds[i % kinds.length],
        site: sites[(i * 5) % sites.length]
    }));
}

const INSTRUMENTS = _instruments(5000);
const BIG_COUNT = 50000;

type ListsTopicStruct = UIBaseStruct<{
    props: {
        _lastSearch: string;
        _selected: Instrument;
    };

    children: {
        demoSearch: SearchFieldModel;
        bigList: VirtualListModel;
        jumpButton: ButtonModel;
        instrumentList: FilterableListModel<Instrument>;
    };

    methods: {
        _SearchFieldView: () => React.JSX.Element;
        _SearchReadoutView: () => React.JSX.Element;
        _VirtualListView: () => React.JSX.Element;
        _RangeReadoutView: () => React.JSX.Element;
        _FilterableListView: () => React.JSX.Element;
        _ListReadoutView: () => React.JSX.Element;
    };
}>;

type ListsTopicParams = UIBaseParams<ListsTopicStruct>;
type ListsTopicModel = UIBaseModel<ListsTopicStruct>;

function useListsTopic(params?: ListsTopicParams): ListsTopicModel {
    const struct: ListsTopicStruct = {
        props: {
            id: useListsTopic.name,
            _lastSearch: "",
            _selected: undefined
        },

        children: {
            demoSearch: useSearchField({
                placeholder: "Type, then pause — or press Enter",
                onSearch: (value) => {
                    model._lastSearch = value;
                }
            }),

            bigList: useVirtualList({
                itemCount: BIG_COUNT,
                itemSize: 28,
                onRenderItem: (index) => (
                    <Row className="showcase-vrow" spacing="small" verticalAlign="center">
                        <Block className="showcase-specimen-label" width={72}>#{index + 1}</Block>
                        <Block className="ueca-truncate">Reading batch {index + 1} — {(index * 37) % 997} samples</Block>
                    </Row>
                )
            }),

            jumpButton: useButton({
                variant: "outlined",
                contentView: "Scroll to row 25,000",
                onClick: () => {
                    model.bigList.scrollToIndex(24999, "center");
                }
            }),

            instrumentList: useFilterableList<Instrument>({
                items: () => INSTRUMENTS,
                itemKeyField: "id",
                itemSize: 36,
                searchPlaceholder: "Filter 5,000 instruments…",
                onItemSelect: (item) => {
                    model._selected = item;
                },
                // Row CONTENT only — the list itself owns the row shell (hover, active, click).
                onRenderItem: (item) => (
                    <>
                        <Icon name="chart" size="sm" />
                        <Block className="ueca-truncate">{item.name}</Block>
                        <Block className="showcase-specimen-label">{item.site}</Block>
                    </>
                )
            })
        },

        methods: {
            _SearchFieldView: () => (
                <ShowcaseSection
                    title="SearchField"
                    description="A search box, not a form field: typing fires onSearch debounced (300ms), Enter fires
                                 it immediately, Escape or the clear button resets both. The two readouts show the
                                 difference — the raw text tracks every keystroke, the settled search lags behind it."
                >
                    <Col spacing="small" maxWidth={420}>
                        <model.demoSearch.View />
                        <model._SearchReadoutView />
                    </Col>
                </ShowcaseSection>
            ),

            // Its OWN view boundary, deliberately: it reads per-keystroke state
            // (demoSearch.value), and a boundary that reads that while also rendering
            // <model.demoSearch.View /> re-renders on every character — remounting the input and
            // dropping its focus. The readout re-renders alone; the search field is untouched.
            _SearchReadoutView: () => (
                <Block className="showcase-specimen-label">
                    raw value: “{model.demoSearch.value}” · settled onSearch: “{model._lastSearch}”
                </Block>
            ),

            _VirtualListView: () => (
                <ShowcaseSection
                    title="VirtualList — 50,000 rows"
                    description="Only the visible slice is in the DOM: a spacer div carries the full height so the
                                 scrollbar is honest, and the rendered window is positioned at the scroll offset.
                                 The readout below is live — scroll the list and watch the window move."
                    framed={false}
                >
                    <Col spacing="small">
                        <Block className="showcase-list-frame" height={280}>
                            <model.bigList.View />
                        </Block>
                        <Row spacing="small" verticalAlign="center">
                            <model.jumpButton.View />
                            <model._RangeReadoutView />
                        </Row>
                    </Col>
                </ShowcaseSection>
            ),

            _RangeReadoutView: () => {
                const range = model.bigList.range();
                return (
                    <Block className="showcase-specimen-label">
                        rows {range.start + 1}–{range.end} of {BIG_COUNT.toLocaleString()} in the DOM
                        ({range.end - range.start} divs)
                    </Block>
                );
            },

            _FilterableListView: () => (
                <ShowcaseSection
                    title="FilterableList — 5,000 instruments"
                    description="SearchField over a VirtualList. Filtering is a derived read — the filtered set is
                                 computed from items + search on demand, never stored, so refreshing the data cannot
                                 lose the active search. Click a row to select it."
                    framed={false}
                >
                    <Col spacing="small" maxWidth={480}>
                        <Block className="showcase-list-frame" height={320} padding="tiny">
                            <model.instrumentList.View />
                        </Block>
                        <model._ListReadoutView />
                    </Col>
                </ShowcaseSection>
            ),

            // Own boundary for the same reason as _SearchReadoutView: it reads _selected and the
            // filtered count, which change on click and on every settled search — reading them
            // beside <model.instrumentList.View /> would remount the list (dropping the search
            // field's focus AND the scroll position) each time.
            _ListReadoutView: () => (
                <Block className="showcase-specimen-label">
                    selected: {model._selected ? `${model._selected.name} — ${model._selected.kind} at ${model._selected.site}` : "—"}
                    {"  ·  "}matches: {model.instrumentList.filteredItems().length.toLocaleString()}
                </Block>
            )
        },

        View: () => (
            <Col id={model.htmlId()} className="showcase-topic" spacing="large">
                <model._SearchFieldView />
                <model._VirtualListView />
                <model._FilterableListView />
            </Col>
        )
    };

    const model = useUIBase(struct, params);
    return model;
}

const ListsTopic = UECA.getFC(useListsTopic);

export { ListsTopicParams, ListsTopicModel, useListsTopic, ListsTopic };
