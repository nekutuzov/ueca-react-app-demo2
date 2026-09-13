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
                tooltipView: _tip("YouTube video", "youtu.be"),
                onClick: async () => await model.openNewTab({ path: "https://youtu.be/SQl8f-qGxwU?si=-YTWPpPB7ExBZ6L0" })
            }),
            githubIconButton: useIconButton({
                iconView: <GitHubIcon />,
                color: "inherit",
                title: "GitHub Repository",
                tooltipView: _tip("GitHub repository", "github.com"),
                onClick: async () => await model.openNewTab({ path: "https://github.com/nekutuzov/ueca-react-app-demo2" })
            }),
            npmIconButton: useIconButton({
                iconView: <NpmIcon />,
                color: "inherit",
                title: "NPM Package",
                tooltipView: _tip("npm package", "npmjs.com"),
                onClick: async () => await model.openNewTab({ path: "https://www.npmjs.com/package/ueca-react" })
            }),
            websiteIconButton: useIconButton({
                iconView: <WebsiteIcon />,
                color: "inherit",
                title: "UECA Website",
                tooltipView: _tip("UECA website", "cranesoft.net"),
                onClick: async () => await model.openNewTab({ path: "https://cranesoft.net" })
            }),
            emailIconButton: useIconButton({
                iconView: <EmailIcon />,
                color: "inherit",
                title: "Email",
                tooltipView: _tip("Email", "cranesoft@protonmail.com", false),
                onClick: async () => await model.openNewTab({ path: "mailto:cranesoft@protonmail.com" })
            })
        },

        View: () => {
            const Container = model.orientation === "horizontal" ? Row : Col;
            
            return (
                <Container id={model.htmlId()} className="ueca-contacts" spacing="small">
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

    // Private methods

    // Every one of these leaves the site, so the tooltip names the destination on its detail
    // line and says so - the icon alone gives no clue where you are about to land.
    function _tip(label: string, destination: string, newTab = true) {
        return (
            <>
                {label}
                <span className="ueca-tooltip-detail">
                    {destination}{newTab ? " · opens a new tab" : ""}
                </span>
            </>
        );
    }
}

const UECAContacts = UECA.getFC(useUECAContacts);

export { UECAContactsModel, UECAContactsParams, useUECAContacts, UECAContacts };
