import * as UECA from "ueca-react";
import { ScreenBaseModel, ScreenBaseParams, ScreenBaseStruct, useScreenBase, Row, Col } from "@components";
import { CRUDScreenModel, useCRUDScreen, Breadcrumb } from "@core";
import { MiscPropertiesEditorModel, useMiscPropertiesEditor } from "./miscPropertiesEditor";
import { MiscPreviewModel, useMiscPreview } from "./miscPreview";

type MiscScreenStruct = ScreenBaseStruct<{
    children: {
        crudScreen: CRUDScreenModel;
        properties: MiscPropertiesEditorModel;
        preview: MiscPreviewModel;
    };

    methods: {
        resetProperties: () => void;
    };
}>;

type MiscScreenParams = ScreenBaseParams<MiscScreenStruct>;
type MiscScreenModel = ScreenBaseModel<MiscScreenStruct>;

function useMiscScreen(params?: MiscScreenParams): MiscScreenModel {
    const struct: MiscScreenStruct = {
        props: {
            id: useMiscScreen.name
        },

        children: {
            crudScreen: useCRUDScreen({
                intent: "none",
                breadcrumbs: [
                    { route: { path: "/" }, label: "Home" },
                    { route: { path: "/misc" }, label: "Miscellaneous Components" }
                ] as Breadcrumb[],
                contentView: () => (
                    <Col fill overflow="auto" padding="medium" spacing="large">
                        <Col spacing="medium">
                            <h1>Miscellaneous Components</h1>
                            <p>Infrastructure components for busy display and file selection.</p>
                        </Col>
                        <Row spacing="large" fill flexWrap="wrap">
                            <model.properties.View />
                            <model.preview.View />
                        </Row>
                    </Col>
                )
            }),

            properties: useMiscPropertiesEditor({
                onReset: () => model.resetProperties()
            }),

            preview: useMiscPreview({
                busyDuration: UECA.bind(() => model.properties, "busyDuration"),
                fileMask: UECA.bind(() => model.properties, "fileMask"),
                multiselect: UECA.bind(() => model.properties, "multiselect")
            })
        },

        methods: {
            resetProperties: () => {
                model.properties.busyDuration = 2000;
                model.properties.fileMask = ".pdf,.jpg,.png";
                model.properties.multiselect = true;
            }
        },

        constr: () => {
            model.resetProperties();
        },

        View: () => <model.crudScreen.View />
    };

    const model = useScreenBase(struct, params);
    return model;
}

const MiscScreen = UECA.getFC(useMiscScreen);

export { MiscScreenParams, MiscScreenModel, useMiscScreen, MiscScreen };
