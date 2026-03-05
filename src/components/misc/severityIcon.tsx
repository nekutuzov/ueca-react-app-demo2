import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";
import { SuccessCircleIcon, InfoCircleIcon, WarningIcon, ErrorCircleIcon } from "@core";

type SeverityIconStruct = UIBaseStruct<{
    props: {
        severity: "success" | "info" | "warning" | "error";
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
            severity: "info",
            size: 22,
            color: undefined,
        },

        View: () => {
            const { size, severity, color } = model;
            
            switch (severity) {
                case "success":
                    return <span id={model.htmlId()}><SuccessCircleIcon size={size} color={color} /></span>;
                case "info":
                    return <span id={model.htmlId()}><InfoCircleIcon size={size} color={color} /></span>;
                case "warning":
                    return <span id={model.htmlId()}><WarningIcon size={size} color={color} /></span>;
                case "error":
                    return <span id={model.htmlId()}><ErrorCircleIcon size={size} color={color} /></span>;
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
