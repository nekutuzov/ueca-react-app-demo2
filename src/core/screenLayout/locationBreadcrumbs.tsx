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

// The crumb label every screen builds: the section's glyph, then its name. Central because all nine
// screens were repeating the identical Row, and because the gap in it is a MEASURED value rather
// than a free choice.
//
// 6px, not the 4px those copies used. Legacy reads ~4.85px from glyph ink to text: its crumb gap is
// also 4px, but every FontAwesome glyph there sits in a 1.25em fixed-width box, so a wide one
// (gears, cogs) keeps its ink clear of the edge. Our icon box is 1em, so the glyph overflows it —
// centred rather than rightward since icon.css was fixed, but still ~0.9px into the gap. 6px less
// that ~0.9px lands at ~5.1px, within a quarter pixel of legacy.
//
// The honest fix is the 1.25em box, which would also close the top bar caret's own box difference;
// it is deferred because it moves every icon in the app and breaks the guarantee that an icon
// occupies the same box whatever source backs it.
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
