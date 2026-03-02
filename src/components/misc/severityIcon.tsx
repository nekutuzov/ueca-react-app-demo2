import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";

type SeverityIconStruct = UIBaseStruct<{
    props: {
        severity: "success" | "info" | "warning" | "error";
        size: number;
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
        },

        View: () => {
            const { size, severity } = model;
            
            switch (severity) {
                case "success":
                    return (
                        <svg id={model.htmlId()} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                    );
                case "info":
                    return (
                        <svg id={model.htmlId()} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                        </svg>
                    );
                case "warning":
                    return (
                        <svg id={model.htmlId()} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                        </svg>
                    );
                case "error":
                    return (
                        <svg id={model.htmlId()} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                        </svg>
                    );
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
