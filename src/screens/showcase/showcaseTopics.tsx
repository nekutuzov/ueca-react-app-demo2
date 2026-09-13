import type { IconName } from "@core";

// The showcase, described once. The route table, the navigation menu, each page's header and the
// previous/next links at the foot of a page all read this list, so a topic cannot appear in the
// menu without a page, or carry one title in the menu and another on its page.
//
// Order is meaningful: it is the order of the menu and of the previous/next chain, running from
// the foundation (tokens, layout) up through the controls built on it.

type ShowcaseTopicKey =
    | "overview"
    | "tokens"
    | "layout"
    | "controls"
    | "status"
    | "icons"
    | "overlays"
    | "data"
    | "lists"
    | "dynamic";

type ShowcaseTopic = {
    key: ShowcaseTopicKey;
    // The page heading and the menu label.
    title: string;
    path: string;
    icon: IconName;
    // The sentence or two under the heading: what the page is for, not a list of what is on it.
    lead: React.ReactNode;
};

const SHOWCASE_TOPICS: ShowcaseTopic[] = [
    {
        key: "overview",
        title: "Overview",
        path: "/showcase/overview",
        icon: "overview",
        lead: <>
            A live reference for the shared building blocks — every layout token, type step, colour role
            and control, rendered against whichever theme is active. Toggle the theme from the top bar and
            the whole page restyles; anything that does not is a bug worth fixing.
        </>
    },
    {
        key: "tokens",
        title: "Design tokens",
        path: "/showcase/tokens",
        icon: "tokens",
        lead: <>
            Everything that is not colour: type, spacing, control heights, icon sizes, radii, elevation,
            motion and the overlay ladder. These scales are theme-independent and defined once in
            tokens.css; the values shown are read from the live stylesheet, so this page cannot drift from it.
        </>
    },
    {
        key: "layout",
        title: "Layout",
        path: "/showcase/layout",
        icon: "layout",
        lead: <>
            Arrangement comes from Block, Row and Col props, never from CSS. Everything these components
            set is an inline style, so a CSS rule for flex, gap, padding or overflow on the same element
            silently loses.
        </>
    },
    {
        key: "controls",
        title: "Controls",
        path: "/showcase/controls",
        icon: "controls",
        lead: <>
            The shared inputs and buttons, rendered against the active theme. Every size, radius, duration
            and type step comes from a token — this page is where a change to one of them shows up, across
            every control at once.
        </>
    },
    {
        key: "status",
        title: "Status",
        path: "/showcase/status",
        icon: "status",
        lead: <>
            One ramp per intent, derived once from the theme's base status colours. Toggle the theme over
            this page — the text on every tinted surface has to stay readable in the light theme as well as
            the dark one, which is the thing a single status colour cannot do alone.
        </>
    },
    {
        key: "icons",
        title: "Icons",
        path: "/showcase/icons",
        icon: "icons",
        lead: <>
            One component over every source. A call site names a <i>role</i> — "delete", "refresh" — and
            the registry decides which glyph, or which server image, backs it. Swapping the source is a
            registry edit; no screen changes. The same reasoning keeps colour in themes.css.
        </>
    },
    {
        key: "overlays",
        title: "Overlays",
        path: "/showcase/overlays",
        icon: "overlays",
        lead: <>
            The app has exactly one tooltip, owned by AppUI: triggers describe what to show and send it over
            the message bus. Popovers, menus and drawers are ordinary components, because they own state.
            Spread <code>model.tooltipProps(…)</code> onto any element to make it a tooltip trigger.
        </>
    },
    {
        key: "data",
        title: "Data",
        path: "/showcase/data",
        icon: "table",
        lead: <>
            Grid is the two-dimensional layout primitive; Table is the data grid built on the same CSS grid
            mechanism — each row is <code>display: contents</code>, so its cells become direct grid children
            and every column stays aligned while the row still hovers and selects as one unit.
        </>
    },
    {
        key: "lists",
        title: "Lists",
        path: "/showcase/lists",
        icon: "list",
        lead: <>
            The virtualised list family: <code>SearchField</code> settles what the user typed,{" "}
            <code>VirtualList</code> renders only the visible slice of a uniform-height list, and{" "}
            <code>FilterableList</code> composes the two into type-to-filter, click-to-select.
        </>
    },
    {
        key: "dynamic",
        title: "Dynamic content",
        path: "/showcase/dynamic-content",
        icon: "dynamic",
        lead: <>
            A test bench for the parts of ueca-react that fail quietly: a model that survives unmount, a
            param that reaches an already-built child, a list that finds its models again by id. Each
            specimen states what it expects, so a broken claim reads as a wrong number.
        </>
    }
];

function showcaseTopic(key: ShowcaseTopicKey): ShowcaseTopic {
    return SHOWCASE_TOPICS.find((t) => t.key === key);
}

// The neighbours of a topic in menu order, for the previous/next links. Undefined at either end.
function showcaseNeighbours(key: ShowcaseTopicKey): { prev: ShowcaseTopic; next: ShowcaseTopic } {
    const i = SHOWCASE_TOPICS.findIndex((t) => t.key === key);
    return {
        prev: i > 0 ? SHOWCASE_TOPICS[i - 1] : undefined,
        next: i >= 0 && i < SHOWCASE_TOPICS.length - 1 ? SHOWCASE_TOPICS[i + 1] : undefined
    };
}

export { ShowcaseTopicKey, ShowcaseTopic, SHOWCASE_TOPICS, showcaseTopic, showcaseNeighbours };
