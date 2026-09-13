import * as UECA from "ueca-react";
import {
    BreadcrumbsModel, Icon, NavLink, Row, UIBaseModel, UIBaseParams, UIBaseStruct, useBreadcrumbs,
    useUIBase
} from "@components";
import { IconName, ScreenRoute } from "@core";

type LocationBreadcrumbsStruct = UIBaseStruct<{
    props: {
        items: Breadcrumb[];
    };

    children: {
        breadcrumbs: BreadcrumbsModel;
    };
}>;

type Breadcrumb = {
    route: ScreenRoute,
    label: React.ReactNode
};

// The crumb label every screen builds: the section's glyph, then its name. Central so every screen
// draws the trail the same way. 6px rather than the 4px tiny step: the outline glyphs carry about a
// pixel of their own padding inside the 24px grid, and at 4px the label read as crowding the icon.
function breadcrumbLabel(iconName: IconName, text: React.ReactNode): React.ReactNode {
    return (
        <Row spacing="px6" verticalAlign="center">
            <Icon name={iconName} size="sm" />{text}
        </Row>
    );
}

type LocationBreadcrumbsParams = UIBaseParams<LocationBreadcrumbsStruct>;
type LocationBreadcrumbsModel = UIBaseModel<LocationBreadcrumbsStruct>;

function useLocationBreadcrumbs(params?: LocationBreadcrumbsParams): LocationBreadcrumbsModel {
    const struct: LocationBreadcrumbsStruct = {
        props: {
            id: useLocationBreadcrumbs.name,
            items: []
        },

        children: {
            breadcrumbs: useBreadcrumbs({
                childrenView: () => _breadcrumbs() // Don't pass JSX, MUI Breadcrumbs component doesn't recognize the links.                
            })
        },

        View: () => <model.breadcrumbs.View />
    }

    const model = useUIBase(struct, params);
    return model;

    // Private methods    
    function _breadcrumbs() {
        return model.items?.map((bc, i) => (
            <NavLink
                id={`bc${i}`}
                key={bc.route.path}
                route={bc.route}
                linkView={bc.label}
                disabled={i === model.items.length - 1}
            />
        ));
    }
}

const LocationBreadcrumbs = UECA.getFC(useLocationBreadcrumbs);

export {
    Breadcrumb, breadcrumbLabel, LocationBreadcrumbsParams, LocationBreadcrumbsModel,
    useLocationBreadcrumbs, LocationBreadcrumbs
};
