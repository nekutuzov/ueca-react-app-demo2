
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

        View: () => (
            <Col 
                id={model.htmlId()} 
                fill
                onClick={async (e: React.MouseEvent) => {
                    const target = e.target as HTMLElement;
                    const anchor = target.closest('a');
                    
                    if (anchor) {
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
