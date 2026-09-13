
import * as UECA from "ueca-react";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { Col, UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";

type MarkdownPreviewStruct = UIBaseStruct<{
    props: {
        source: string;
        skipHtml: boolean;
    };
}>;

type MarkdownPreviewParams = UIBaseParams<MarkdownPreviewStruct>;
type MarkdownPreviewModel = UIBaseModel<MarkdownPreviewStruct>;

function useMarkdownPreview(params?: MarkdownPreviewParams): MarkdownPreviewModel {
    const struct: MarkdownPreviewStruct = {
        props: {
            id: useMarkdownPreview.name,
            source: "",
            skipHtml: false,
        },

        // index.html sets <base href="/mladmin/">, and a bare "#id" resolves against THAT, not
        // against the page being read - so every in-page link, including the anchor
        // rehype-autolink-headings puts on each heading, means "/mladmin/#id" and lands on Home.
        // Rewriting the href to the current path makes it honest to the status bar, middle-click
        // and copy-link-address; data-section is what the click handler below routes on.
        // Synchronous, as draw requires.
        draw: () => {
            const root = document.getElementById(model.htmlId());
            if (!root) {
                return;
            }
            root.querySelectorAll("a[href]").forEach((el) => {
                const anchor = el as HTMLAnchorElement;
                const rawHref = anchor.getAttribute("href");
                if (!rawHref?.startsWith("#")) {
                    return;
                }
                anchor.setAttribute("href", window.location.pathname + window.location.search + rawHref);
                anchor.dataset.section = decodeURIComponent(rawHref.slice(1));
            });
        },

        View: () => (
            <Col
                id={model.htmlId()}
                fill
                spacing="default"
                onClick={async (e: React.MouseEvent) => {
                    const target = e.target as HTMLElement;
                    const anchor = target.closest('a');

                    if (anchor) {
                        // A link to a section of this page: an address patch, not a route change.
                        // GoToRoute would hand the router a new route object and rebuild the whole
                        // screen to move within the page it is already showing.
                        const section = anchor.dataset.section;
                        if (section) {
                            e.preventDefault();
                            await model.setRouteSection(section);
                            return;
                        }

                        const href = anchor.getAttribute('href');
                        if (href && href.startsWith('/')) {
                            // Internal route - use UECA router
                            e.preventDefault();
                            await model.bus.unicast("App.Router.GoToRoute", { path: href as any });
                        }
                        // External links will use default behavior
                    }
                }}
            >
                <MarkdownPreview
                    source={model.source}
                    skipHtml={model.skipHtml}
                />
            </Col>
        )
    };

    const model = useUIBase(struct, params);
    return model;
}

const MarkdownPreviewComponent = UECA.getFC(useMarkdownPreview);

export {
    MarkdownPreviewModel,
    MarkdownPreviewParams,
    useMarkdownPreview,
    MarkdownPreviewComponent as MarkdownPreview
};
