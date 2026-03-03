import * as UECA from "ueca-react";
import { BreadcrumbsModel, NavLink, UIBaseModel, UIBaseParams, UIBaseStruct, useBreadcrumbs, useUIBase } from "@components";
import { ScreenRoute } from "@core";

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
    label: React.ReactNode,
    // icon?: IconKind
};

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

export { Breadcrumb, LocationBreadcrumbsParams, LocationBreadcrumbsModel, useLocationBreadcrumbs, LocationBreadcrumbs };
