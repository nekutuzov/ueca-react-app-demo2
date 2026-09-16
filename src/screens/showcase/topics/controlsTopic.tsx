import * as UECA from "ueca-react";
import {
    AddNewButton, Block, Button, CancelButton, Checkbox, Col, DateTimePicker, DeleteButton, EditButton,
    Icon, IconButton, NumberField, RadioGroup, RefreshButton, Row, SaveButton, Select, Switch, TextField,
    UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase
} from "@components";
import { ShowcaseSection, ShowcaseSpecimen } from "../showcaseSection";

const BUTTON_VARIANTS = ["text", "outlined", "contained"] as const;
const BUTTON_SIZES = ["xsmall", "small", "medium", "large"] as const;
const ICON_SIZES = ["xsmall", "small", "medium", "large"] as const;

// Button size ↔ IconButton size, as they should now line up on the shared control ladder. Before
// the token pass Button was 30/36/44 and IconButton 32/40/48, so a "small" of each in the same
// toolbar differed by 2px.
const PAIRED_SIZES = [
    { button: "xsmall", icon: "xsmall", token: "--control-h-xs" },
    { button: "small", icon: "small", token: "--control-h-sm" },
    { button: "medium", icon: "medium", token: "--control-h-md" },
    { button: "large", icon: "large", token: "--control-h-lg" }
] as const;

// One value, six presentations. Every specimen below holds 2026-09-14 09:30 and stores it that
// way; only `format` differs. `[h]` in the last one is a LITERAL — without the brackets `h` is the
// 12-hour token, and "09h30" could not be written at all.
const FORMAT_SPECIMENS = [
    { id: "dtp-fmt-eu", label: "Delivery", mode: "date", format: "DD/MM/YYYY", value: "2026-09-14" },
    { id: "dtp-fmt-us", label: "Invoiced", mode: "date", format: "MM/DD/YYYY", value: "2026-09-14" },
    { id: "dtp-fmt-long", label: "Published", mode: "date", format: "MMMM D, YYYY", value: "2026-09-14" },
    { id: "dtp-fmt-12h", label: "Opens at", mode: "time", format: "h:mm A", value: "09:30" },
    { id: "dtp-fmt-full", label: "Embargo lifts", mode: "datetime", format: "MMM D, YYYY h:mm A", value: "2026-09-14 09:30" },
    { id: "dtp-fmt-escaped", label: "Shift starts", mode: "datetime", format: "DD.MM.YYYY HH[h]mm", value: "2026-09-14 09:30" }
] as const;

type ControlsTopicStruct = UIBaseStruct<{
    methods: {
        _ButtonsView: () => React.JSX.Element;
        _PairingView: () => React.JSX.Element;
        _InputsView: () => React.JSX.Element;
        _DateTimeView: () => React.JSX.Element;
        _ChoiceView: () => React.JSX.Element;
    };
}>;

type ControlsTopicParams = UIBaseParams<ControlsTopicStruct>;
type ControlsTopicModel = UIBaseModel<ControlsTopicStruct>;

function useControlsTopic(params?: ControlsTopicParams): ControlsTopicModel {
    const struct: ControlsTopicStruct = {
        props: {
            id: useControlsTopic.name
        },

        methods: {
            _ButtonsView: () => (
                <Col spacing="medium">
                    <ShowcaseSection
                        title="Button — variant × size"
                        description="Heights come from --control-h-xs/sm/md/lg (24/32/40/48) and label type from
                                     --text-xs/sm/md/base, in sentence case at the medium weight — the control
                                     voice set once in themes.css, and the same type as the docs site's calls
                                     to action."
                    >
                        <Col spacing="small">
                            {BUTTON_VARIANTS.map((variant) => (
                                <Row key={variant} spacing="small" verticalAlign="center" flexWrap="wrap">
                                    <Block className="showcase-specimen-label" width={90}>{variant}</Block>
                                    {BUTTON_SIZES.map((size) => (
                                        <Button
                                            key={size}
                                            id={`btn-${variant}-${size}`}
                                            variant={variant}
                                            size={size}
                                            contentView={size}
                                        />
                                    ))}
                                    <Button
                                        id={`btn-${variant}-disabled`}
                                        variant={variant}
                                        size="medium"
                                        disabled
                                        contentView="disabled"
                                    />
                                </Row>
                            ))}
                        </Col>
                    </ShowcaseSection>

                    <ShowcaseSection
                        title="IconButton — size"
                        description="The square comes from the control ladder, the glyph from the icon ladder."
                    >
                        <Row spacing="small" verticalAlign="center" flexWrap="wrap">
                            {ICON_SIZES.map((size) => (
                                <ShowcaseSpecimen key={size} label={size}>
                                    <IconButton id={`icon-${size}`} kind="refresh" size={size} title={size} />
                                </ShowcaseSpecimen>
                            ))}
                        </Row>
                    </ShowcaseSection>

                    <ShowcaseSection
                        title="Toolbar shorthands"
                        description="use*-factory presets over Button/IconButton for the screen toolbars — content,
                                     icon, and (for Cancel/Delete) the confirmation dialog are defaults, not new
                                     components. Cancel and Delete here open the real dialogs."
                    >
                        <Row spacing="small" verticalAlign="center" flexWrap="wrap">
                            <AddNewButton id="tool-add" />
                            <SaveButton id="tool-save" />
                            <EditButton id="tool-edit" />
                            <CancelButton id="tool-cancel" />
                            <DeleteButton id="tool-delete" />
                            <RefreshButton id="tool-refresh" />
                        </Row>
                    </ShowcaseSection>
                </Col>
            ),

            // The point of the shared ladder, and the one thing worth measuring rather than eyeballing.
            _PairingView: () => (
                <ShowcaseSection
                    title="Button and IconButton, paired"
                    description="The reason control heights became one scale: each pair below must be exactly
                                 the same height, as they would be sitting together in a screen toolbar."
                >
                    <Col spacing="small">
                        {PAIRED_SIZES.map((pair) => (
                            <Row key={pair.button} spacing="small" verticalAlign="center">
                                <Block className="showcase-specimen-label" width={150}>{pair.token}</Block>
                                <Row className="showcase-pair" spacing="default" verticalAlign="center">
                                    <Button
                                        id={`pair-btn-${pair.button}`}
                                        variant="outlined"
                                        size={pair.button}
                                        contentView="Refresh"
                                    />
                                    <IconButton id={`pair-icon-${pair.icon}`} kind="refresh" size={pair.icon} />
                                </Row>
                            </Row>
                        ))}
                    </Col>
                </ShowcaseSection>
            ),

            _InputsView: () => (
                <Col spacing="medium">
                <ShowcaseSection
                    title="TextField and Select"
                    description="Labels use the shared .ueca-label; values use --text-md in the UI face on the
                                 40px rung, with --radius-md and --motion-base. Error and disabled states
                                 included — they are the ones that usually rot."
                >
                    {/* Sizing contract, same as Select: `fullWidth` (the default) fills the container;
                        `fullWidth={false}` + `extent={{ width }}` fixes the control's own size — no
                        wrapper Block needed. Leaving BOTH off shrink-wraps at the 200px CSS minimum. */}
                    <Row spacing="medium" flexWrap="wrap" verticalAlign="top">
                        <TextField id="tf-normal" labelView="Site name" value="Cedar Lake dam" required
                                   fullWidth={false} extent={{ width: 240 }} />
                        <TextField id="tf-placeholder" labelView="Operator" placeholder="not assigned"
                                   fullWidth={false} extent={{ width: 240 }} />
                        <TextField
                            id="tf-error"
                            labelView="Email"
                            type="email"
                            value="not-an-email"
                            helperTextView="Enter a valid address"
                            error
                            fullWidth={false}
                            extent={{ width: 240 }}
                        />
                        <TextField id="tf-disabled" labelView="Serial" value="SN-40213" disabled
                                   fullWidth={false} extent={{ width: 240 }} />
                        <Block width={240}>
                            <Select
                                id="sel-normal"
                                labelView="Interval"
                                value="hourly"
                                options={[
                                    { value: "hourly", label: "Hourly" },
                                    { value: "daily", label: "Daily" },
                                    { value: "weekly", label: "Weekly" }
                                ]}
                            />
                        </Block>
                    </Row>
                </ShowcaseSection>

                <ShowcaseSection
                    title="TextField — adornments"
                    description="startView/endView are View slots inside the field frame; `revealable` adds the
                                 password eye. The frame carries the border, so adornments sit inside the field —
                                 the login screen's icon fields are these."
                >
                    <Row spacing="medium" flexWrap="wrap" verticalAlign="top">
                        <TextField id="tf-adorn-start" placeholder="Username"
                                   startView={<Icon name="user" size="sm" />}
                                   fullWidth={false} extent={{ width: 240 }} />
                        <TextField id="tf-adorn-end" labelView="Reading" value="128"
                                   endView={<span className="showcase-specimen-label">mm</span>}
                                   fullWidth={false} extent={{ width: 240 }} />
                        <TextField id="tf-adorn-password" placeholder="Password" type="password"
                                   value="hunter2" revealable
                                   startView={<Icon name="lock" size="sm" />}
                                   fullWidth={false} extent={{ width: 240 }} />
                    </Row>
                </ShowcaseSection>

                <ShowcaseSection
                    title="NumberField"
                    description="A TextField composite that owns the number: typing accepts only the style's
                                 characters, and the value is parsed, clamped to min/max, and reformatted on
                                 blur or a spin click."
                >
                    <Row spacing="medium" flexWrap="wrap" verticalAlign="top">
                        <NumberField id="nf-int" labelView="Sensors" numberStyle="int" value={12}
                                     min={0} max={100} spinButtons
                                     fullWidth={false} extent={{ width: 240 }} />
                        <NumberField id="nf-float" labelView="Drift (mm)" numberStyle="float" digits={2}
                                     value={4.8} fullWidth={false} extent={{ width: 240 }} />
                        <NumberField id="nf-hex" labelView="Register" numberStyle="hex" value={64222}
                                     fullWidth={false} extent={{ width: 240 }} />
                    </Row>
                </ShowcaseSection>
                </Col>
            ),

            _DateTimeView: () => (
                <Col spacing="medium">
                    <ShowcaseSection
                        title="DateTimePicker — mode"
                        description="One control, three jobs. `mode` decides the format of the text, what the
                                     panel holds, and whether clicking a day is the end of the interaction —
                                     in datetime mode the panel stays up, because there is still a clock to
                                     set. Type into the box or pick from the panel: both write the same value."
                    >
                        <Row spacing="medium" flexWrap="wrap" verticalAlign="top">
                            <DateTimePicker id="dtp-date" labelView="Inspection date" mode="date"
                                            value="2026-09-14" fullWidth={false} extent={{ width: 240 }} />
                            <DateTimePicker id="dtp-time" labelView="Reading taken" mode="time"
                                            value="09:30" fullWidth={false} extent={{ width: 240 }} />
                            <DateTimePicker id="dtp-datetime" labelView="Next service" mode="datetime"
                                            value="2026-09-14 09:30" fullWidth={false} extent={{ width: 240 }} />
                        </Row>
                    </ShowcaseSection>

                    <ShowcaseSection
                        title="DateTimePicker — format"
                        description="Every field below holds the SAME value, 2026-09-14 09:30, and stores it
                                     the same way. `format` changes only what the box shows and what it reads
                                     back, in the day.js vocabulary — so a European field can present
                                     14/09/2026 while what is sorted and sent to a server stays 2026-09-14.
                                     Reading back is looser than writing: 4/9/2026 is accepted, separators are
                                     interchangeable, and the canonical form always works whatever the format."
                    >
                    {/* Each field is NAMED for its job and states its pattern underneath, rather than
                        being labelled with the pattern itself — which also lets the validation
                        message read "Delivery must look like DD/MM/YYYY" instead of repeating the
                        pattern twice. Type something that is not a date into one and see it. */}
                        <Row spacing="medium" flexWrap="wrap" verticalAlign="top">
                            {FORMAT_SPECIMENS.map((specimen) => (
                                <DateTimePicker
                                    key={specimen.id}
                                    id={specimen.id}
                                    labelView={specimen.label}
                                    mode={specimen.mode}
                                    format={specimen.format}
                                    value={specimen.value}
                                    helperTextView={specimen.format}
                                    fullWidth={false}
                                    extent={{ width: 240 }}
                                />
                            ))}
                        </Row>
                    </ShowcaseSection>

                    <ShowcaseSection
                        title="DateTimePicker — bounds, seconds and states"
                        description="min and max grey out the days outside the window and clamp a typed value
                                     into it, and say so in the field's own format. A format naming seconds
                                     turns them on by itself, so the box and the stored value can never
                                     disagree about how far down this field counts. Type something that is
                                     not a date and leave the field — the text stays, and the field says so
                                     rather than guessing."
                    >
                        <Row spacing="medium" flexWrap="wrap" verticalAlign="top">
                            <DateTimePicker id="dtp-bounded" labelView="Within the window" mode="date"
                                            value="2026-09-14" min="2026-09-10" max="2026-09-20"
                                            helperTextView="10–20 September only"
                                            fullWidth={false} extent={{ width: 240 }} />
                            <DateTimePicker id="dtp-seconds" labelView="Timestamp" mode="datetime" secondsShown
                                            value="2026-09-14 09:30:05"
                                            fullWidth={false} extent={{ width: 240 }} />
                            <DateTimePicker id="dtp-required" labelView="Due" mode="date" required
                                            helperTextView="Empty, and required"
                                            fullWidth={false} extent={{ width: 240 }} />
                            <DateTimePicker id="dtp-readonly" labelView="Created" mode="datetime" readOnly
                                            value="2026-08-31 14:02"
                                            fullWidth={false} extent={{ width: 240 }} />
                            <DateTimePicker id="dtp-disabled" labelView="Archived" mode="date" disabled
                                            value="2026-01-04" fullWidth={false} extent={{ width: 240 }} />
                        </Row>
                    </ShowcaseSection>
                </Col>
            ),

            _ChoiceView: () => (
                <ShowcaseSection
                    title="Checkbox, Switch and RadioGroup"
                    description="Box, track and dot sizes are local to each control; type and radii come from tokens."
                >
                    <Row spacing="huge" flexWrap="wrap" verticalAlign="top">
                        <Col spacing="tiny">
                            <Checkbox id="cb-on" labelView="Include archived" checked={true} />
                            <Checkbox id="cb-off" labelView="Notify on alarm" checked={false} />
                            <Checkbox id="cb-disabled" labelView="Locked setting" checked={true} disabled />
                        </Col>

                        <Col spacing="tiny">
                            <Switch id="sw-on" labelView="Auto-refresh" checked={true} />
                            <Switch id="sw-off" labelView="Maintenance mode" checked={false} />
                            <Switch id="sw-disabled" labelView="Licensed feature" checked={true} disabled />
                        </Col>

                        <RadioGroup
                            id="rg-demo"
                            labelView="Units"
                            value="mm"
                            options={[
                                { value: "mm", label: "Millimetres" },
                                { value: "in", label: "Inches" }
                            ]}
                        />
                    </Row>
                </ShowcaseSection>
            )
        },

        View: () => (
            <Col id={model.htmlId()} className="showcase-topic" spacing="large">
                <model._ButtonsView />
                <model._PairingView />
                <model._InputsView />
                <model._DateTimeView />
                <model._ChoiceView />
            </Col>
        )
    };

    const model = useUIBase(struct, params);
    return model;
}

const ControlsTopic = UECA.getFC(useControlsTopic);

export { ControlsTopicParams, ControlsTopicModel, useControlsTopic, ControlsTopic };
