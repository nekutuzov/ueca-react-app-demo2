import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";
import "./statusLabel.css";

// The five intents the status ramps in themes.css define, plus a neutral. "primary" rides the theme
// accent rather than a status colour.
type StatusIntent = "success" | "info" | "warning" | "error" | "primary" | "none";

type StatusVariant = "soft" | "outlined" | "solid" | "bare";

// A compact status chip — the row-level "what state is this in" marker. Colour comes entirely from
// the status ramps, so every chip in the app restyles with the theme and no caller mixes a tint.
type StatusLabelStruct = UIBaseStruct<{
    props: {
        intent: StatusIntent;
        variant: StatusVariant;
        labelView: React.ReactNode;
        // The dot is what stays identifiable when the label is truncated in a dense list, so it is
        // on by default. Turn it off for a chip that is already unambiguous.
        showDot: boolean;
        iconView: React.ReactNode;   // replaces the dot when supplied
        // Supplementary explanation, shown through the app's tooltip rather than the browser's own
        // hint popup — the visible label is already the chip's name, so this is extra, not a name.
        title: string;
    };
}>;

type StatusLabelParams = UIBaseParams<StatusLabelStruct>;
type StatusLabelModel = UIBaseModel<StatusLabelStruct>;

function useStatusLabel(params?: StatusLabelParams): StatusLabelModel {
    const struct: StatusLabelStruct = {
        props: {
            id: useStatusLabel.name,
            intent: "none",
            variant: "soft",
            labelView: undefined,
            showDot: true,
            iconView: undefined,
            title: undefined
        },

        View: () => {
            const classNames = [
                "ueca-status-label",
                `ueca-status-label-${model.variant}`,
                `ueca-status-label-${model.intent}`,
                "ueca-caption"
            ].join(" ");

            return (
                <span
                    id={model.htmlId()}
                    className={classNames}
                    {...(model.title ? model.tooltipProps(model.title) : {})}
                >
                    {model.iconView}
                    {!model.iconView && model.showDot && <span className="ueca-status-label-dot" />}
                    <span className="ueca-status-label-text">{model.labelView}</span>
                </span>
            );
        }
    };

    const model = useUIBase(struct, params);
    return model;
}

const StatusLabel = UECA.getFC(useStatusLabel);

export { StatusIntent, StatusVariant, StatusLabelParams, StatusLabelModel, useStatusLabel, StatusLabel };
