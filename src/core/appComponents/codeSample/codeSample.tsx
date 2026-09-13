import * as UECA from "ueca-react";
import {
    Icon, IconButtonModel, MarkdownPreviewModel, UIBaseModel, UIBaseParams, UIBaseStruct,
    useIconButton, useMarkdownPreview, useUIBase
} from "@components";
import "./codeSample.css";

// A read-only code listing with a copy button. The code is handed to the markdown preview as a
// fenced block, so it is syntax-highlighted by the same Prism theme as every other code block in
// the app — and follows a theme switch with it, because that theme is built on the theme tokens.
type CodeSampleStruct = UIBaseStruct<{
    props: {
        title: string;
        code: string;
        // The fence's language tag: "tsx", "ts", "css"…
        language: string;
    };

    children: {
        listing: MarkdownPreviewModel;
        copyButton: IconButtonModel;
    };
}>;

type CodeSampleParams = UIBaseParams<CodeSampleStruct>;
type CodeSampleModel = UIBaseModel<CodeSampleStruct>;

function useCodeSample(params?: CodeSampleParams): CodeSampleModel {
    const struct: CodeSampleStruct = {
        props: {
            id: useCodeSample.name,
            title: "Code",
            code: "",
            language: "tsx"
        },

        children: {
            listing: useMarkdownPreview({
                source: () => _fenced(model.code, model.language)
            }),

            copyButton: useIconButton({
                iconView: <Icon name="copy" size="md" />,
                title: "Copy code",
                size: "small",
                onClick: async () => {
                    await model.copyToClipboard(model.code);
                    await model.alertSuccess("Code copied to the clipboard");
                }
            })
        },

        View: () => (
            <div id={model.htmlId()} className="code-sample">
                <div className="code-sample-header">
                    <span className="code-sample-title ueca-eyebrow">{model.title}</span>
                    <model.copyButton.View />
                </div>
                <div className="code-sample-body">
                    <model.listing.View />
                </div>
            </div>
        )
    };

    const model = useUIBase(struct, params);
    return model;
}

const CodeSample = UECA.getFC(useCodeSample);

export { CodeSampleParams, CodeSampleModel, useCodeSample, CodeSample };


// Private helpers
// A fence one backtick longer than the longest backtick run in the code, so a snippet that itself
// contains a fence cannot close the block early.
function _fenced(code: string, language: string): string {
    const longest = Math.max(2, ...(code.match(/`+/g) ?? []).map((run) => run.length));
    const fence = "`".repeat(longest + 1);
    return `${fence}${language}\n${code}\n${fence}`;
}
