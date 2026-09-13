import * as UECA from "ueca-react";
import {
    Block, Button, ButtonModel, CheckboxModel, Col, EditDrawerModel, Icon, MenuItemModel, MenuList,
    PopoverModel, Row, TextFieldModel, UIBaseModel, UIBaseParams, UIBaseStruct, useButton,
    useCheckbox, useEditDrawer, useMenuItem, usePopover, useTextField, useUIBase
} from "@components";
import { Placement, positionOverlay } from "@core";
import { ShowcaseSection } from "../showcaseSection";

const PLACEMENTS: Placement[] = ["top", "bottom", "left", "right"];

type OverlaysTopicStruct = UIBaseStruct<{
    props: {
        // What the last menu resolved with — the point being that Open ANSWERS.
        _lastChoice: string;
        // What the last EditDrawer showModal() resolved with.
        _lastDrawerResult: string;
    };

    children: {
        menuButton: ButtonModel;
        menuPopover: PopoverModel;
        refreshItem: MenuItemModel;
        exportItem: MenuItemModel;
        printItem: MenuItemModel;
        archivedItem: MenuItemModel;
        deleteItem: MenuItemModel;
        popoverButton: ButtonModel;
        filterPopover: PopoverModel;
        popoverField: TextFieldModel;
        popoverCheck: CheckboxModel;
        editDrawerButton: ButtonModel;
        editDrawer: EditDrawerModel;
        editDrawerField: TextFieldModel;
    };

    methods: {
        _PlacementView: () => React.JSX.Element;
        _FlipView: () => React.JSX.Element;
        _SweepView: () => React.JSX.Element;
        _RichView: () => React.JSX.Element;
        _MenuView: () => React.JSX.Element;
        _PopoverView: () => React.JSX.Element;
        _EditDrawerView: () => React.JSX.Element;
    };
}>;

type OverlaysTopicParams = UIBaseParams<OverlaysTopicStruct>;
type OverlaysTopicModel = UIBaseModel<OverlaysTopicStruct>;

function useOverlaysTopic(params?: OverlaysTopicParams): OverlaysTopicModel {
    const struct: OverlaysTopicStruct = {
        props: {
            id: useOverlaysTopic.name,
            _lastChoice: undefined,
            _lastDrawerResult: undefined
        },

        children: {
            menuButton: useButton({
                variant: "outlined",
                contentView: "Open menu",
                startIconView: <Icon name="more" size="sm" />,
                onClick: (source) => {
                    if (model.menuPopover.open) {
                        model.menuPopover.close();
                        return;
                    }
                    const el = document.getElementById(source.htmlId());
                    const r = el.getBoundingClientRect();
                    model.menuPopover.anchor = { top: r.top, left: r.left, width: r.width, height: r.height };
                    model.menuPopover.open = true;
                }
            }),

            // Composition over configuration: the menu's rows are THIS model's children — each a
            // full component with its own reactive props and handler — and the popover merely
            // hosts their Views in a MenuList. A realistic overflow menu: icons from the registry,
            // a shortcut hint, a disabled row, a separator, a destructive action last.
            refreshItem: useMenuItem({
                labelView: "Refresh", iconName: "refresh", shortcut: "F5",
                onClick: () => { _chose("refresh"); }
            }),
            exportItem: useMenuItem({
                labelView: "Export as CSV", iconName: "exportFile",
                onClick: () => { _chose("export"); }
            }),
            printItem: useMenuItem({
                labelView: "Print", iconName: "print", shortcut: "Ctrl+P",
                onClick: () => { _chose("print"); }
            }),
            archivedItem: useMenuItem({
                labelView: "Restore archived", iconName: "folder", disabled: true
            }),
            deleteItem: useMenuItem({
                labelView: "Delete site", iconName: "delete", danger: true, separatorBefore: true,
                onClick: () => { _chose("delete"); }
            }),

            menuPopover: usePopover({
                placement: "bottom",
                className: "ueca-popover-menu",
                // Marks the button as this popover's trigger so its toggle isn't raced shut by
                // the outside-click close (which fires on mousedown, before the button's click).
                onGetTrigger: () => document.getElementById(model.menuButton.htmlId()),
                contentView: () => (
                    <MenuList>
                        <model.refreshItem.View />
                        <model.exportItem.View />
                        <model.printItem.View />
                        <model.archivedItem.View />
                        <model.deleteItem.View />
                    </MenuList>
                )
            }),

            popoverButton: useButton({
                variant: "outlined",
                contentView: "Filter…",
                startIconView: <Icon name="filter" size="sm" />,
                onClick: (source) => {
                    const el = document.getElementById(source.htmlId());
                    const r = el.getBoundingClientRect();
                    // The anchor is captured when it opens, not at render — by then it is correct.
                    model.filterPopover.anchor = { top: r.top, left: r.left, width: r.width, height: r.height };
                    model.filterPopover.open = true;
                }
            }),

            // The popover's BODY is stateful — two live controls. That state belongs to the models
            // below, which is exactly why a popover is an ordinary component and not a singleton.
            popoverField: useTextField({ labelView: "Site name contains", value: "cedar" }),
            editDrawerButton: useButton({
                variant: "outlined",
                contentView: "Open edit drawer",
                onClick: async () => {
                    // showModal() answers: true when the user saved, false when they cancelled or
                    // closed it — so a caller awaits one call instead of wiring both events.
                    const saved = await model.editDrawer.showModal();
                    model._lastDrawerResult = saved ? "saved" : "cancelled";
                }
            }),

            editDrawer: useEditDrawer({
                mode: "edit",
                titleView: "Edit specimen",
                showDeleteButton: true,
                // The drawer validates what its owner lists here before it will save.
                modelsToValidate: () => [model.editDrawerField],
                contentView: () => <model.editDrawerField.View />,
                onDelete: async () => await model.dialogYesNo("Confirmation", "Delete the specimen?")
            }),

            editDrawerField: useTextField({
                labelView: "Name",
                required: true,
                placeholder: "Try saving this empty"
            }),

            popoverCheck: useCheckbox({ labelView: "Include archived", checked: true }),

            filterPopover: usePopover({
                placement: "bottom",
                contentView: () => (
                    <Col spacing="small" width={260}>
                        <Block className="ueca-label">Filter</Block>
                        <model.popoverField.View />
                        <model.popoverCheck.View />
                        <Row horizontalAlign="right" spacing="default">
                            <Button
                                id="popover-apply"
                                variant="contained"
                                size="small"
                                contentView="Apply"
                                onClick={() => { model.filterPopover.open = false; }}
                            />
                        </Row>
                    </Col>
                )
            })
        },

        methods: {
            _PlacementView: () => (
                <ShowcaseSection
                    title="Placement"
                    description="Hover or tab to a target. There is only ONE tooltip in the app — these are not
                                 four tooltips taking turns, they are four triggers driving the same instance
                                 over the message bus."
                >
                    <Row spacing="medium" flexWrap="wrap" verticalAlign="center">
                        {PLACEMENTS.map((placement) => (
                            <Block
                                key={placement}
                                className="showcase-tooltip-target" tabIndex={0}
                                {...model.tooltipProps(`Placement: ${placement}`, { placement, delay: 120 })}
                            >
                                {placement}
                            </Block>
                        ))}
                    </Row>
                </ShowcaseSection>
            ),

            _FlipView: () => (
                <ShowcaseSection
                    title="Collision handling"
                    description="Placement is decided against the VIEWPORT, not the containing box — so a target
                                 halfway down a page has room above it no matter how close to its container's top
                                 edge it sits. Rather than fake that, the table below calls positionOverlay
                                 directly with fabricated rects: it is a pure function, so its decisions can just
                                 be shown. Scroll a target in the row above to the very top of the window and
                                 hover it to watch the same flip happen for real."
                >
                    <Col spacing="tiny">
                        <Row spacing="small" className="showcase-pos-row">
                            <Block className="showcase-specimen-label" width={230}>scenario</Block>
                            <Block className="showcase-specimen-label" width={80}>asked</Block>
                            <Block className="showcase-specimen-label" width={80}>result</Block>
                        </Row>
                        {_positionScenarios().map((s) => (
                            <Row key={s.name} spacing="small" className="showcase-pos-row">
                                <Block className="ueca-caption" width={230}>{s.name}</Block>
                                <Block className="showcase-specimen-label" width={80}>{s.asked}</Block>
                                <Block
                                    className="showcase-specimen-label"
                                    width={80}
                                    color={s.asked === s.result ? "text.secondary" : "primary.main"}
                                >
                                    {s.result}
                                </Block>
                            </Row>
                        ))}
                    </Col>
                </ShowcaseSection>
            ),

            _SweepView: () => (
                <ShowcaseSection
                    title="Sweeping across a row"
                    description="Drag the pointer quickly along these. Each leave races the next enter, and a
                                 singleton is exactly where that race bites — so Hide carries the trigger's token
                                 and is ignored unless it names the trigger currently showing. Without that, a
                                 late leave would close the tooltip its neighbour has just opened."
                >
                    <Row spacing="tiny" flexWrap="wrap">
                        {Array.from({ length: 12 }, (_, i) => (
                            <Block
                                key={i}
                                className="showcase-tooltip-target" tabIndex={0}
                                {...model.tooltipProps(`Channel ${String(i + 1).padStart(2, "0")} — last reading 14:0${i % 10}`, { delay: 80 })}
                            >
                                {String(i + 1).padStart(2, "0")}
                            </Block>
                        ))}
                    </Row>
                </ShowcaseSection>
            ),

            _RichView: () => (
                <ShowcaseSection
                    title="Content is JSX"
                    description="The message carries a React node, not a string, so a tooltip can hold whatever the
                                 caller wants. It stays pointer-events:none — a tooltip you can hover is a popover,
                                 and that is a different component."
                >
                    <Row spacing="medium" verticalAlign="center" flexWrap="wrap">
                        <Button
                            id="tooltip-rich-button"
                            variant="outlined"
                            contentView="Rich content"
                            tooltipView={
                                <Col spacing="px4">
                                    <Block className="ueca-label">Borehole 04</Block>
                                    <Block className="ueca-value">-12.4071 mm</Block>
                                    <Block className="ueca-caption">Sampled 14:02, averaged over 60 s</Block>
                                </Col>
                            }
                        />

                        <Block
                            className="showcase-tooltip-target" tabIndex={0}
                            {...model.tooltipProps(
                                <Row spacing="tiny" verticalAlign="center">
                                    <Icon name="warning" size="sm" intent="warning" />
                                    <Block>Battery below 20%</Block>
                                </Row>,
                                { delay: 120 }
                            )}
                        >
                            with an icon
                        </Block>

                        <Block
                            className="showcase-tooltip-target" tabIndex={0}
                            {...model.tooltipProps(
                                "A deliberately long tooltip, to show that the bubble wraps at its max width rather than running off the edge of the screen, and that long unbroken tokens like /var/log/showcase/instrument-04-diagnostics.log break instead of overflowing.",
                                { delay: 120 }
                            )}
                        >
                            long text
                        </Block>
                    </Row>
                </ShowcaseSection>
            ),

            _MenuView: () => (
                <ShowcaseSection
                    title="Menu — MenuItem components in a Popover"
                    description="Composition over configuration: the rows are MenuItem CHILDREN on this screen's
                                 model — each one a full component with reactive props and its own onClick — and
                                 the popover just hosts their Views in a MenuList. No config array, no singleton:
                                 a data schema caps what an item can be, a child component does not. Esc or
                                 clicking outside dismisses; the disabled row ignores clicks."
                >
                    <Row spacing="medium" verticalAlign="center" flexWrap="wrap">
                        <model.menuButton.View />
                        <model.menuPopover.View />
                        <Block className="showcase-specimen-label">
                            last action: {model._lastChoice ?? "—"}
                        </Block>
                    </Row>
                </ShowcaseSection>
            ),

            _EditDrawerView: () => (
                <ShowcaseSection
                    title="EditDrawer — a Drawer with a record editor’s footer"
                    description="A record editor in a drawer: right-anchored, with a footer of Delete /
                                 Cancel / Save. It is an EditBase, so Save validates whatever the owner listed
                                 in modelsToValidate and refuses to close while a field is invalid. showModal()
                                 resolves true on save and false on cancel or close."
                >
                    <Row spacing="medium" verticalAlign="center" flexWrap="wrap">
                        <model.editDrawerButton.View />
                        <Block className="showcase-specimen-label">
                            last result: {model._lastDrawerResult ?? "—"}
                        </Block>
                    </Row>
                    <model.editDrawer.View />
                </ShowcaseSection>
            ),

            _PopoverView: () => (
                <ShowcaseSection
                    title="Popover — deliberately NOT a singleton"
                    description="A popover hosts interactive content that owns state — here a bound text field and
                                 a checkbox. Hoisting that into an AppUI singleton would move the state away from
                                 the model that owns it, which is the opposite of how the rest of this codebase
                                 works. So Popover is an ordinary component that happens to float, sharing only
                                 the positioning. Click outside or press Esc to dismiss."
                >
                    <Row spacing="medium" verticalAlign="center" flexWrap="wrap">
                        <model.popoverButton.View />
                        <Block className="showcase-specimen-label">
                            the field keeps its value between openings — its model owns it
                        </Block>
                    </Row>
                    <model.filterPopover.View />
                </ShowcaseSection>
            )
        },

        View: () => (
            <Col id={model.htmlId()} className="showcase-topic" spacing="large">
                <model._PlacementView />
                <model._FlipView />
                <model._SweepView />
                <model._RichView />
                <model._MenuView />
                <model._PopoverView />
                <model._EditDrawerView />
            </Col>
        )
    };

    const model = useUIBase(struct, params);
    return model;

    function _chose(action: string) {
        model._lastChoice = action;
        model.menuPopover.close();
    }


    // Private methods
    // Representative anchor positions run through the real positioning function. Fabricated rather
    // than measured, because the interesting cases are at the viewport edges and a specimen sitting
    // in the middle of a scrolling page can never reach them.
    function _positionScenarios(): { name: string; asked: Placement; result: Placement }[] {
        const viewport = { width: 1000, height: 800 };
        const overlay = { width: 200, height: 60 };
        const run = (name: string, anchor: { top: number; left: number; width: number; height: number }, asked: Placement) => ({
            name,
            asked,
            result: positionOverlay({ anchor, overlay, viewport, placement: asked }).placement
        });

        return [
            run("mid-viewport, room everywhere", { top: 400, left: 400, width: 100, height: 40 }, "top"),
            run("hard against the viewport top", { top: 10, left: 400, width: 100, height: 40 }, "top"),
            run("hard against the viewport bottom", { top: 760, left: 400, width: 100, height: 40 }, "bottom"),
            run("hard against the right edge", { top: 400, left: 950, width: 40, height: 40 }, "right"),
            run("hard against the left edge", { top: 400, left: 5, width: 40, height: 40 }, "left")
        ];
    }
}

const OverlaysTopic = UECA.getFC(useOverlaysTopic);

export { OverlaysTopicParams, OverlaysTopicModel, useOverlaysTopic, OverlaysTopic };
