import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase, Row, Col } from "@components";
import { CRUDScreenModel, useCRUDScreen, Breadcrumb } from "@core";
import { MiscPropertiesEditorModel, useMiscPropertiesEditor } from "./miscPropertiesEditor";
import { MiscPreviewModel, useMiscPreview } from "./miscPreview";

type MiscScreenStruct = UIBaseStruct<{
    props: {
        busyDuration: number;
        fileMask: string;
        multiselect: boolean;
    };

    children: {
        crudScreen: CRUDScreenModel;
        properties: MiscPropertiesEditorModel;
        preview: MiscPreviewModel;
    };

    methods: {
        resetProperties: () => void;
    };
}>;

type MiscScreenParams = UIBaseParams<MiscScreenStruct>;
type MiscScreenModel = UIBaseModel<MiscScreenStruct>;

function useMiscScreen(params?: MiscScreenParams): MiscScreenModel {
    const struct: MiscScreenStruct = {
        props: {
            id: useMiscScreen.name,
            busyDuration: 2000,
            fileMask: ".pdf,.jpg,.png",
            multiselect: true
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
                busyDuration: UECA.bind(() => model, "busyDuration"),
                fileMask: UECA.bind(() => model, "fileMask"),
                multiselect: UECA.bind(() => model, "multiselect"),
                onReset: () => model.resetProperties()
            }),

            preview: useMiscPreview({
                busyDuration: UECA.bind(() => model, "busyDuration"),
                fileMask: UECA.bind(() => model, "fileMask"),
                multiselect: UECA.bind(() => model, "multiselect")
            })
        },

        methods: {
            resetProperties: () => {
                model.busyDuration = 2000;
                model.fileMask = ".pdf,.jpg,.png";
                model.multiselect = true;
            }
        },

        View: () => <model.crudScreen.View />
    };

    const model = useUIBase(struct, params);
    return model;
}

const MiscScreen = UECA.getFC(useMiscScreen);

export { MiscScreenParams, MiscScreenModel, useMiscScreen, MiscScreen };
