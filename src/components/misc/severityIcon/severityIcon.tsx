import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";
// Aliased to their SHAPES: which severity wears which glyph is this component's decision, and
// reading `WarningIcon` under `case "error"` would look like a mistake.
import {
    SuccessCircleIcon, InfoCircleIcon, WarningIcon as TriangleAlertIcon,
    ErrorCircleIcon as CircleAlertIcon
} from "@core";

type SeverityIconStruct = UIBaseStruct<{
    props: {
        severity: "success" | "info" | "warning" | "error" | "none";
        size: number;
        color?: string;
    };
}>;

type SeverityIconParams = UIBaseParams<SeverityIconStruct>;
type SeverityIconModel = UIBaseModel<SeverityIconStruct>;

function useSeverityIcon(params?: SeverityIconParams): SeverityIconModel {
    const struct: SeverityIconStruct = {
        props: {
            id: useSeverityIcon.name,
            severity: "none",
            size: 22,
            color: undefined,
        },

        // The triangle is the ERROR glyph and the circled "!" the warning one — the MLAdmin
        // mapping, which is the reverse of Material's. It is applied consistently across the
        // legacy app (its tabs flag a failing tab with the same triangle), so the whole severity
        // family follows it rather than only the dialog that revealed it.
        View: () => {
            const { size, severity, color } = model;

            switch (severity) {
                case "success":
                    return <span id={model.htmlId()}><SuccessCircleIcon size={size} color={color} /></span>;
                case "info":
                    return <span id={model.htmlId()}><InfoCircleIcon size={size} color={color} /></span>;
                case "warning":
                    return <span id={model.htmlId()}><CircleAlertIcon size={size} color={color} /></span>;
                case "error":
                    return <span id={model.htmlId()}><TriangleAlertIcon size={size} color={color} /></span>;
                default:
                    return null;
            }
        }
    };

    const model = useUIBase(struct, params);
    return model;
}

const SeverityIcon = UECA.getFC(useSeverityIcon);

export { SeverityIconModel, SeverityIconParams, useSeverityIcon, SeverityIcon };
