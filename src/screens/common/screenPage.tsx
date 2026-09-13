import { Icon } from "@components";
import { ArrowLeftIcon, ArrowRightIcon, IconName } from "@core";
import "./screenPage.css";

// The frame every content screen shares: the eyebrow, the headline and the lead on the content
// band, then the screen's own body, then an optional footer. The Showcase and the Playground both
// sit in it, which is what keeps a gallery page and an editor page reading as one site.
//
// PLAIN FUNCTIONS, like Block/Row/Col: the frame holds no state, so a UECA component here would be
// ceremony. Anything interactive belongs on the screen's model and arrives through the slots.

type ScreenPageProps = {
    // The section the page belongs to ("Showcase", "Playground") — structure, drawn in the marker.
    eyebrow: string;
    icon?: IconName;
    title: React.ReactNode;
    lead?: React.ReactNode;
    footerView?: React.ReactNode;
    children?: React.ReactNode;
};

function ScreenPage(props: ScreenPageProps): React.ReactElement {
    return (
        <div className="screen-page">
            <header className="screen-page-header">
                <div className="screen-page-eyebrow ueca-eyebrow">
                    {props.icon ? <Icon name={props.icon} size="sm" /> : null}
                    <span>{props.eyebrow}</span>
                </div>
                <h1 className="screen-page-title">{props.title}</h1>
                {props.lead ? <p className="screen-page-lead">{props.lead}</p> : null}
            </header>
            {props.children}
            {props.footerView}
        </div>
    );
}

// A neighbouring page, for the previous/next links.
type ScreenPageLink = {
    title: string;
    path: string;
};

type ScreenPagerProps = {
    prev?: ScreenPageLink;
    next?: ScreenPageLink;
    // Navigation is the screen's business — it owns the model that can route.
    onGo: (path: string) => void;
    label: string;
};

function ScreenPager(props: ScreenPagerProps): React.ReactElement {
    if (!props.prev && !props.next) {
        return null;
    }
    return (
        <nav className="screen-pager" aria-label={props.label}>
            {props.prev ? _pagerLink(props.prev, "prev", props.onGo) : <span />}
            {props.next ? _pagerLink(props.next, "next", props.onGo) : <span />}
        </nav>
    );
}

export { ScreenPageProps, ScreenPage, ScreenPageLink, ScreenPagerProps, ScreenPager };


// Private helpers
function _pagerLink(link: ScreenPageLink, direction: "prev" | "next", onGo: (path: string) => void): React.ReactNode {
    return (
        <button
            type="button"
            className={`screen-pager-link${direction === "next" ? " screen-pager-next" : ""}`}
            onClick={() => onGo(link.path)}
        >
            <span className="screen-pager-dir ueca-eyebrow">
                {direction === "prev" ? <><ArrowLeftIcon size={13} /> Previous</> : <>Next <ArrowRightIcon size={13} /></>}
            </span>
            <span className="screen-pager-title">{link.title}</span>
        </button>
    );
}
