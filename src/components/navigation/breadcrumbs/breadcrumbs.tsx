import React from "react";
import * as UECA from "ueca-react";
import { UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";
import { asyncSafe } from "@core";
import "./breadcrumbs.css";

// Breadcrumbs component
type BreadcrumbsStruct = UIBaseStruct<{
    props: {
        childrenView: React.ReactNode;
        separator: React.ReactNode;
    };

    events: {
        onClick: (target: BreadcrumbsModel) => UECA.MaybePromise;
    };
}>;

type BreadcrumbsParams = UIBaseParams<BreadcrumbsStruct>;
type BreadcrumbsModel = UIBaseModel<BreadcrumbsStruct>;

function useBreadcrumbs(params?: BreadcrumbsParams): BreadcrumbsModel {
    const struct: BreadcrumbsStruct = {
        props: {
            id: useBreadcrumbs.name,
            childrenView: undefined,
            separator: (
                <span className="breadcrumbs-separator">
                    <svg viewBox="0 0 24 24">
                        <path d="M9.29 6.71a.996.996 0 000 1.41L13.17 12l-3.88 3.88a.996.996 0 101.41 1.41l4.59-4.59a.996.996 0 000-1.41L10.7 6.7c-.38-.38-1.02-.38-1.41.01z"/>
                    </svg>
                </span>
            )
        },

        View: () => {
            // Extract children from Fragment if needed
            let childrenToRender = model.childrenView;
            if (React.isValidElement(model.childrenView) && model.childrenView.type === React.Fragment) {
                childrenToRender = (model.childrenView as React.ReactElement<{ children: React.ReactNode }>).props.children;
            }
            
            const children = React.Children.toArray(childrenToRender);
            
            return (
                <nav
                    id={model.htmlId()}
                    aria-label="breadcrumb"
                    onClick={() => model.onClick && asyncSafe(() => model.onClick(model))}
                >
                    <ol className="breadcrumbs">
                        {children.map((child, index) => (
                            <React.Fragment key={index}>
                                <li>{child}</li>
                                {index < children.length - 1 && model.separator}
                            </React.Fragment>
                        ))}
                    </ol>
                </nav>
            );
        },
    };

    const model = useUIBase(struct, params);
    return model;
}

const Breadcrumbs = UECA.getFC(useBreadcrumbs);

export { BreadcrumbsModel, BreadcrumbsParams, useBreadcrumbs, Breadcrumbs };
