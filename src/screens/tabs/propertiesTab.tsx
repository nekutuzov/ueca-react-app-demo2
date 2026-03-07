import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase, Row, Col } from "@components";
import { TabPropertiesEditorModel, useTabPropertiesEditor } from "./tabPropertiesEditor";
import { TabPreviewModel, useTabPreview } from "./tabPreview";

type PropertiesTabStruct = UIBaseStruct<{
    children: {
        propertiesEditor: TabPropertiesEditorModel;
        preview: TabPreviewModel;
    };

    methods: {
        resetProperties: () => void;
    };
}>;

type PropertiesTabParams = UIBaseParams<PropertiesTabStruct>;
type PropertiesTabModel = UIBaseModel<PropertiesTabStruct>;

function usePropertiesTab(params?: PropertiesTabParams): PropertiesTabModel {
    const struct: PropertiesTabStruct = {
        props: {
            id: usePropertiesTab.name
        },

        children: {
            propertiesEditor: useTabPropertiesEditor({
                onReset: () => model.resetProperties()
            }),

            preview: useTabPreview({
                labelText: UECA.bind(() => model.propertiesEditor, "labelText"),
                iconPosition: UECA.bind(() => model.propertiesEditor, "iconPosition"),
                disabled: UECA.bind(() => model.propertiesEditor, "disabled"),
                wrapped: UECA.bind(() => model.propertiesEditor, "wrapped"),
                showIcon: UECA.bind(() => model.propertiesEditor, "showIcon"),
                orientation: UECA.bind(() => model.propertiesEditor, "orientation"),
                variant: UECA.bind(() => model.propertiesEditor, "variant"),
                scrollButtons: UECA.bind(() => model.propertiesEditor, "scrollButtons"),
                centered: UECA.bind(() => model.propertiesEditor, "centered")
            })
        },

        methods: {
            resetProperties: () => {
                model.propertiesEditor.labelText = "Home";
                model.propertiesEditor.iconPosition = "start";
                model.propertiesEditor.disabled = false;
                model.propertiesEditor.wrapped = false;
                model.propertiesEditor.showIcon = true;
                model.propertiesEditor.orientation = "horizontal";
                model.propertiesEditor.variant = "standard";
                model.propertiesEditor.scrollButtons = "auto";
                model.propertiesEditor.centered = false;
            }
        },

        constr: () => {
            model.resetProperties();
        },

        View: () => (
            <Col id={model.htmlId()} fill overflow="auto" padding="medium" spacing="large">                
                <Row spacing="large" fill flexWrap="wrap">
                    <model.propertiesEditor.View />
                    <model.preview.View />
                </Row>
            </Col>
        )
    };

    const model = useUIBase(struct, params);
    return model;
}

const PropertiesTab = UECA.getFC(usePropertiesTab);

export { PropertiesTabParams, PropertiesTabModel, usePropertiesTab, PropertiesTab };
