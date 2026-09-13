import * as UECA from "ueca-react";
import {
    AddNewButton, Block, Button, CancelButton, Checkbox, Col, DeleteButton, EditButton, Icon,
    IconButton, NumberField, RadioGroup, RefreshButton, Row, SaveButton, Select, Switch, TextField,
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

type ControlsTopicStruct = UIBaseStruct<{
    methods: {
        _ButtonsView: () => React.JSX.Element;
        _PairingView: () => React.JSX.Element;
        _InputsView: () => React.JSX.Element;
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
                                     --text-2xs/xs/sm — there is no step below 2xs, so xsmall shares the small
                                     rung's type and differs in height alone. A button is tracked one step
                                     tighter than .ueca-label, so it keeps its own tracking rather than sharing
                                     that class."
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
                    description="Labels use the shared .ueca-label; the inputs use --text-2xs/xs, --radius-md and
                                 --motion-base. Error and disabled states included — they are the ones that
                                 usually rot."
                >
                    {/* Sizing contract, same as Select: `fullWidth` (the default) fills the container;
                        `fullWidth={false}` + `extent={{ width }}` fixes the control's own size — no
                        wrapper Block needed. Leaving BOTH off shrink-wraps at the 200px CSS minimum. */}
                    <Row spacing="medium" flexWrap="wrap" verticalAlign="top">
                        <TextField id="tf-normal" labelView="Site name" value="Kellogg dam" required
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
                        <TextField id="tf-disabled" labelView="Serial" value="CS-40213" disabled
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
                <model._ChoiceView />
            </Col>
        )
    };

    const model = useUIBase(struct, params);
    return model;
}

const ControlsTopic = UECA.getFC(useControlsTopic);

export { ControlsTopicParams, ControlsTopicModel, useControlsTopic, ControlsTopic };
