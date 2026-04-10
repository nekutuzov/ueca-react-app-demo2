import * as UECA from "ueca-react";
import { Row, Col, UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase, IconButtonModel, useIconButton } from "@components";
import { YouTubeIcon, GitHubIcon, NpmIcon, WebsiteIcon, EmailIcon } from "@core";

type Orientation = "horizontal" | "vertical";

type UECAContactsStruct = UIBaseStruct<{
    props: {
        orientation: Orientation;
    };

    children: {
        youtubeIconButton: IconButtonModel;
        githubIconButton: IconButtonModel;
        npmIconButton: IconButtonModel;
        websiteIconButton: IconButtonModel;
        emailIconButton: IconButtonModel;
    };
}>;

type UECAContactsParams = UIBaseParams<UECAContactsStruct>;
type UECAContactsModel = UIBaseModel<UECAContactsStruct>;

function useUECAContacts(params?: UECAContactsParams): UECAContactsModel {
    const struct: UECAContactsStruct = {
        props: {
            id: useUECAContacts.name,
            orientation: "horizontal"
        },

        children: {
            youtubeIconButton: useIconButton({
                iconView: <YouTubeIcon />,
                color: "inherit",
                title: "YouTube Video",
                onClick: async () => await model.openNewTab({ path: "https://youtu.be/SQl8f-qGxwU?si=-YTWPpPB7ExBZ6L0" })
            }),
            githubIconButton: useIconButton({
                iconView: <GitHubIcon />,
                color: "inherit",
                title: "GitHub Repository",
                onClick: async () => await model.openNewTab({ path: "https://github.com/nekutuzov/ueca-react-app-demo2" })
            }),
            npmIconButton: useIconButton({
                iconView: <NpmIcon />,
                color: "inherit",
                title: "NPM Package",
                onClick: async () => await model.openNewTab({ path: "https://www.npmjs.com/package/ueca-react" })
            }),
            websiteIconButton: useIconButton({
                iconView: <WebsiteIcon />,
                color: "inherit",
                title: "UECA Website",
                onClick: async () => await model.openNewTab({ path: "https://cranesoft.net" })
            }),
            emailIconButton: useIconButton({
                iconView: <EmailIcon />,
                color: "inherit",
                title: "Email",
                onClick: async () => await model.openNewTab({ path: "mailto:cranesoft@protonmail.com" })
            })
        },

        View: () => {
            const Container = model.orientation === "horizontal" ? Row : Col;
            
            return (
                <Container id={model.htmlId()} spacing="small">
                    <model.websiteIconButton.View />
                    <model.emailIconButton.View />
                    <model.githubIconButton.View />
                    <model.npmIconButton.View />
                    <model.youtubeIconButton.View />
                </Container>
            );
        }
    };

    const model = useUIBase(struct, params);
    return model;
}

const UECAContacts = UECA.getFC(useUECAContacts);

export { UECAContactsModel, UECAContactsParams, useUECAContacts, UECAContacts };
