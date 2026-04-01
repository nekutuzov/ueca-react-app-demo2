import * as UECA from "ueca-react";
import { ScreenBaseModel, ScreenBaseParams, ScreenBaseStruct, useScreenBase, Col } from "@components";
import { CRUDScreenModel, useCRUDScreen } from "@core";
import diagramSvg from "./ueca_app_diagram.svg";

type ArchitectureDiagramScreenStruct = ScreenBaseStruct<{
    children: {
        crudScreen: CRUDScreenModel;
    };
}>;

type ArchitectureDiagramScreenParams = ScreenBaseParams<ArchitectureDiagramScreenStruct>;
type ArchitectureDiagramScreenModel = ScreenBaseModel<ArchitectureDiagramScreenStruct>;

function useArchitectureDiagramScreen(params?: ArchitectureDiagramScreenParams): ArchitectureDiagramScreenModel {
    const struct: ArchitectureDiagramScreenStruct = {
        props: {
            id: useArchitectureDiagramScreen.name
        },

        children: {
            crudScreen: useCRUDScreen({
                intent: "none",
                breadcrumbs: [
                    { route: { path: "/home" }, label: "Home" },
                    { route: { path: "/home/diagram" }, label: "Architecture Diagram" }
                ],
                contentView: () => (
                    <Col fill horizontalAlign={"center"} overflow={"auto"}>
                        <img
                            src={diagramSvg}
                            alt="UECA Application Architecture Diagram"
                            style={{
                                maxWidth: "100%",
                                height: "auto",
                                display: "block"
                            }}
                        />
                    </Col>
                )
            })
        },
      
        View: () => <model.crudScreen.View />
    };

    const model = useScreenBase(struct, params);
    return model;
}

const ArchitectureDiagramScreen = UECA.getFC(useArchitectureDiagramScreen);

export { ArchitectureDiagramScreenModel, useArchitectureDiagramScreen, ArchitectureDiagramScreen };
