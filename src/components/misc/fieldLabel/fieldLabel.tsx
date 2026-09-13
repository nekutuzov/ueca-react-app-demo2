import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";
import "./fieldLabel.css";

// A field label carrying a dimmed qualifier after it — "Background Operations Limit (in hours)",
// "Database Path (local path on the database host)". Rather than a `secondaryLabel` prop on every
// input wrapper, it fills the `labelView` slot the inputs already expose, so no input grows a
// second label prop and the qualifier can be any node:
//
//     labelView: <FieldLabel labelView="Site Name" secondaryView={`(URL: /sites/${model.name})`} />
//     labelView: <FieldLabel labelView="Windows User Name"
//                            hintView={<FieldHint id="userNameHint" contentView={TIP} />} />
//
// The label's own type comes from the input's `.ueca-label`, which this sits inside; only the
// qualifier's colour and the gap are this component's business.
type FieldLabelStruct = UIBaseStruct<{
    props: {
        labelView: React.ReactNode;
        // The "i" chip, between the label and its qualifier. Fill it with a FieldHint.
        hintView: React.ReactNode;
        secondaryView: React.ReactNode;
    };
}>;

type FieldLabelParams = UIBaseParams<FieldLabelStruct>;
type FieldLabelModel = UIBaseModel<FieldLabelStruct>;

function useFieldLabel(params?: FieldLabelParams): FieldLabelModel {
    const struct: FieldLabelStruct = {
        props: {
            id: useFieldLabel.name,
            labelView: undefined,
            hintView: undefined,
            secondaryView: undefined
        },

        View: () => (
            <span id={model.htmlId()} className="ueca-field-label">
                {model.labelView}
                {model.hintView}
                {!!model.secondaryView && (
                    <span className="ueca-field-label-secondary">{model.secondaryView}</span>
                )}
            </span>
        )
    };

    const model = useUIBase(struct, params);
    return model;
}

const FieldLabel = UECA.getFC(useFieldLabel);

// The plain-text name of a field, for a validation message that has to say which field it means.
// A `labelView` is a node, and the moment a field grows a hint chip or a qualifier it stops being
// a bare string — so an input that only checked `isString` would fall back to "This field" for
// exactly the fields that most need naming. Reaching one level into the node's own `labelView`
// covers FieldLabel without naming it, and any other wrapper that follows the same convention.
function fieldLabelText(labelView: React.ReactNode): string | undefined {
    if (UECA.isString(labelView)) {
        return labelView as string;
    }
    const inner = (labelView as React.ReactElement<{ labelView?: React.ReactNode }>)?.props?.labelView;
    if (UECA.isString(inner)) {
        return inner as string;
    }
    return undefined;
}

export { FieldLabelParams, FieldLabelModel, useFieldLabel, FieldLabel, fieldLabelText };
