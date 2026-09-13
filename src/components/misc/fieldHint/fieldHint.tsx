import * as UECA from "ueca-react";
import { Block, Icon, UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";
import { Placement } from "@core";
import "./fieldHint.css";

// The small "i" chip beside a control that explains what the setting does — an info circle
// carrying a tooltip.
//
// A UECA component rather than a bare glyph, because the tooltip is the whole point: the app has ONE
// tooltip instance living on AppUI (see docs/raw/overlays.md), and reaching it means calling
// `model.tooltipProps(…)` on a model. Spreading those handlers onto `<Icon>` directly does NOT work
// — Icon is a plain function that accepts only its declared props and silently drops the rest.
//
//     <FieldHint id="emailEnabledHint" contentView={"…what this setting does…"} />
type FieldHintStruct = UIBaseStruct<{
    props: {
        contentView: React.ReactNode;
        placement: Placement;
        // Kept a prop so a hint next to a large control can match its glyph size.
        size: "xs" | "sm" | "md";
    };
}>;

type FieldHintParams = UIBaseParams<FieldHintStruct>;
type FieldHintModel = UIBaseModel<FieldHintStruct>;

function useFieldHint(params?: FieldHintParams): FieldHintModel {
    const struct: FieldHintStruct = {
        props: {
            id: useFieldHint.name,
            contentView: undefined,
            // Right, not the tooltip default of top: a hint sits on a form row with the next field
            // directly below it, and these explanations run to several lines — opening upward covers
            // the label it belongs to.
            placement: "right",
            // 16px, to sit beside a label.
            size: "md"
        },

        View: () => (
            <Block
                id={model.htmlId()}
                className="ueca-field-hint"
                render={!!model.contentView}
                // Focusable so the explanation is reachable without a mouse — tooltipProps wires
                // focus/blur alongside hover precisely so this costs nothing.
                tabIndex={0}
                {...model.tooltipProps(model.contentView, { placement: model.placement })}
            >
                <Icon name="infoHint" size={model.size} color="primary.main" />
            </Block>
        )
    };

    const model = useUIBase(struct, params);
    return model;
}

const FieldHint = UECA.getFC(useFieldHint);

export { FieldHintParams, FieldHintModel, useFieldHint, FieldHint };
